using FluentValidation;
using FluentValidation.AspNetCore;
using IdentityService.Common;
using IdentityService.Data;
using IdentityService.Middleware;
using IdentityService.Repositories;
using IdentityService.Repositories.Interfaces;
using IdentityService.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Serilog;
using StackExchange.Redis;

var builder = WebApplication.CreateBuilder(args);

// Serilog
builder.Host.UseSerilog((ctx, cfg) =>
{
    cfg.ReadFrom.Configuration(ctx.Configuration)
       .Enrich.FromLogContext()
       .WriteTo.Console(new Serilog.Formatting.Compact.CompactJsonFormatter())
       .WriteTo.File(new Serilog.Formatting.Compact.CompactJsonFormatter(),
           path: "logs/identity-.log",
           rollingInterval: RollingInterval.Day);
});

builder.Services.AddControllers()
    .AddJsonOptions(opts =>
    {
        opts.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        opts.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
    });
builder.Services.AddEndpointsApiExplorer();

// EF Core
builder.Services.AddDbContext<IdentityDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("IdentityDb"),
        sql => sql.EnableRetryOnFailure(3)));

// Repositories
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();

// Redis
builder.Services.AddSingleton<IConnectionMultiplexer>(sp =>
{
    var connStr = builder.Configuration["Redis:ConnectionString"] ?? "localhost:6379";
    try { return ConnectionMultiplexer.Connect(connStr); }
    catch (Exception ex)
    {
        var logger = sp.GetRequiredService<ILogger<Program>>();
        logger.LogWarning(ex, "Redis unavailable at {ConnStr} — blocklist will fail-open", connStr);
        return ConnectionMultiplexer.Connect("localhost:6379,abortConnect=false");
    }
});

// Services
builder.Services.AddSingleton<TokenService>();
builder.Services.AddSingleton<ITokenService>(sp => sp.GetRequiredService<TokenService>());
builder.Services.AddScoped<IRedisBlocklistService, RedisBlocklistService>();
builder.Services.AddScoped<IEmailService, EmailService>();

// Named HttpClient for internal service-to-service calls (e.g., JobCatalogService)
builder.Services.AddHttpClient("JobCatalog", client =>
{
    var url = builder.Configuration["InternalServices:JobCatalogUrl"] ?? "http://localhost:5002";
    client.BaseAddress = new Uri(url);
    client.Timeout = TimeSpan.FromSeconds(10);
});

// FluentValidation
builder.Services.AddValidatorsFromAssemblyContaining<Program>();
builder.Services.AddFluentValidationAutoValidation();
builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = context =>
    {
        var firstError = context.ModelState.Values
            .SelectMany(v => v.Errors)
            .Select(e => e.ErrorMessage)
            .FirstOrDefault() ?? "Validation failed";
        var traceId = context.HttpContext.TraceIdentifier;
        var envelope = ResponseEnvelope<object>.Fail(firstError, traceId);
        return new BadRequestObjectResult(envelope);
    };
});

// JWT Bearer Auth (RS256) — key injected via PostConfigure after app is built
RsaSecurityKey? identityPublicKey = null;
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"],
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            // Resolved once on first request — avoids BuildServiceProvider anti-pattern
            IssuerSigningKeyResolver = (token, securityToken, kid, parameters) =>
            {
                identityPublicKey ??= identityPublicKey;
                return identityPublicKey != null ? new[] { identityPublicKey } : Array.Empty<RsaSecurityKey>();
            }
        };
    });

// Swagger
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "IdentityService API", Version = "v1" });
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
    var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath)) c.IncludeXmlComments(xmlPath);
});

var app = builder.Build();

// Initialize RSA keys on startup and wire into JWT validation
var tokenService = app.Services.GetRequiredService<TokenService>();
tokenService.Initialize();
identityPublicKey = tokenService.GetPublicKey();

app.UseSerilogRequestLogging();
app.UseMiddleware<IdentityService.Middleware.CorrelationIdMiddleware>();
app.UseSwagger();
app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "IdentityService API v1"));
app.UseMiddleware<GlobalExceptionMiddleware>();
app.UseAuthentication();
app.UseMiddleware<JtiBlocklistMiddleware>();
app.UseAuthorization();
app.MapControllers();

app.Run();

public partial class Program { }

