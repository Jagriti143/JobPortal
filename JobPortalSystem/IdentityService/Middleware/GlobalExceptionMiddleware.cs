using IdentityService.Common;

namespace IdentityService.Middleware;

public class GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext ctx)
    {
        try
        {
            await next(ctx);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Unhandled exception on {Method} {Path}", ctx.Request.Method, ctx.Request.Path);
            ctx.Response.StatusCode = 500;
            ctx.Response.ContentType = "application/json";
            var envelope = ResponseEnvelope<object>.Fail("An unexpected error occurred.", ctx.TraceIdentifier);
            await ctx.Response.WriteAsJsonAsync(envelope);
        }
    }
}
