using System.Security.Cryptography;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Ocelot.DependencyInjection;
using Ocelot.Middleware;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Load ocelot.json
builder.Configuration.AddJsonFile("ocelot.json", optional: false, reloadOnChange: true);

// Serilog
builder.Host.UseSerilog((ctx, cfg) =>
{
    cfg.ReadFrom.Configuration(ctx.Configuration)
       .Enrich.FromLogContext()
       .WriteTo.Console(new Serilog.Formatting.Compact.CompactJsonFormatter())
       .WriteTo.File(new Serilog.Formatting.Compact.CompactJsonFormatter(),
           path: "logs/gateway-.log",
           rollingInterval: RollingInterval.Day);
});

// Fetch RSA public key from IdentityService — refreshed on every startup + on demand
RsaSecurityKey? rsaPublicKey = null;
DateTime rsaKeyFetchedAt = DateTime.MinValue;
var publicKeyUrl = builder.Configuration["IdentityService:PublicKeyUrl"]
    ?? "http://localhost:5001/auth/public-key";

async Task<RsaSecurityKey?> FetchPublicKeyAsync()
{
    try
    {
        using var httpClient = new HttpClient { Timeout = TimeSpan.FromSeconds(5) };
        var response = await httpClient.GetFromJsonAsync<PublicKeyEnvelope>(publicKeyUrl);
        if (response?.Data?.PublicKey != null)
        {
            var rsa = RSA.Create();
            rsa.ImportFromPem(response.Data.PublicKey);
            rsaKeyFetchedAt = DateTime.UtcNow;
            Log.Information("RSA public key loaded from IdentityService at {Time}", rsaKeyFetchedAt);
            return new RsaSecurityKey(rsa);
        }
    }
    catch (Exception ex)
    {
        Log.Warning(ex, "Could not fetch RSA public key from IdentityService");
    }
    return null;
}

// When Visual Studio starts all services in parallel, IdentityService needs a few seconds.
// Wait up to 30s with retries instead of failing immediately.
Log.Information("ApiGateway: waiting for IdentityService to be ready...");
for (int attempt = 1; attempt <= 6; attempt++)
{
    rsaPublicKey = await FetchPublicKeyAsync();
    if (rsaPublicKey != null) break;
    Log.Warning("RSA key fetch attempt {Attempt}/6 failed — retrying in 5s...", attempt);
    await Task.Delay(5000);
}

if (rsaPublicKey == null)
    Log.Error("Could not load RSA public key after 30s — JWT validation will use on-demand refresh");

// JWT Bearer Auth with RS256
// Key is re-fetched if it's older than 5 minutes (handles IdentityService restarts)
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer("Bearer", options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "JobPortal",
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "JobPortalClients",
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKeyResolver = (token, securityToken, kid, parameters) =>
            {
                // Re-fetch if null or stale (> 30s old) — handles IdentityService restarts
                if (rsaPublicKey == null || (DateTime.UtcNow - rsaKeyFetchedAt).TotalSeconds > 30)
                    rsaPublicKey = FetchPublicKeyAsync().GetAwaiter().GetResult();
                return rsaPublicKey != null
                    ? new[] { rsaPublicKey }
                    : Array.Empty<RsaSecurityKey>();
            },
            ClockSkew = TimeSpan.FromSeconds(30)
        };
    });

builder.Services.AddAuthorization();

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Job Portal API Gateway", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header. Enter 'Bearer {token}'",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }
    });
});

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("Angular", policy =>
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials());
});

// Ocelot
builder.Services.AddOcelot();

var app = builder.Build();

app.UseSerilogRequestLogging();
app.UseMiddleware<ApiGateway.Middleware.CorrelationIdMiddleware>();
app.UseCors("Angular");
app.UseSwagger();
app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Job Portal API Gateway v1"));
app.UseAuthentication();
app.UseAuthorization();

await app.UseOcelot();

app.Run();

record PublicKeyData(string PublicKey);
record PublicKeyEnvelope(bool Success, PublicKeyData Data);

public partial class Program { }
