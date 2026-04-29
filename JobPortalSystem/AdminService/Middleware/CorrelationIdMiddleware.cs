namespace AdminService.Middleware;

public class CorrelationIdMiddleware(RequestDelegate next)
{
    private const string Header = "X-Correlation-ID";

    public async Task InvokeAsync(HttpContext ctx)
    {
        var correlationId = ctx.Request.Headers[Header].FirstOrDefault()
                            ?? Guid.NewGuid().ToString();
        ctx.Response.OnStarting(() => {
            ctx.Response.Headers[Header] = correlationId;
            return Task.CompletedTask;
        });
        using (Serilog.Context.LogContext.PushProperty("CorrelationId", correlationId))
            await next(ctx);
    }
}
