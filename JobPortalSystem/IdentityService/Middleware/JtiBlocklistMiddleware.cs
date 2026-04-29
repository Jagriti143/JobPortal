using System.IdentityModel.Tokens.Jwt;
using IdentityService.Common;
using IdentityService.Services;

namespace IdentityService.Middleware;

public class JtiBlocklistMiddleware(RequestDelegate next)
{
    public async Task InvokeAsync(HttpContext ctx, IRedisBlocklistService blocklist)
    {
        var authHeader = ctx.Request.Headers.Authorization.ToString();
        if (authHeader.StartsWith("Bearer "))
        {
            var token = authHeader["Bearer ".Length..].Trim();
            try
            {
                var handler = new JwtSecurityTokenHandler();
                if (handler.CanReadToken(token))
                {
                    var jwt = handler.ReadJwtToken(token);
                    var jti = jwt.Id;
                    if (!string.IsNullOrEmpty(jti) && await blocklist.IsBlockedAsync(jti))
                    {
                        ctx.Response.StatusCode = 401;
                        ctx.Response.ContentType = "application/json";
                        await ctx.Response.WriteAsJsonAsync(
                            ResponseEnvelope<object>.Fail("Token has been revoked.", ctx.TraceIdentifier));
                        return;
                    }
                }
            }
            catch { /* ignore parse errors — let auth middleware handle */ }
        }
        await next(ctx);
    }
}
