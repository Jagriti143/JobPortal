namespace ApiGateway.Middleware;

/// <summary>
/// Generates a unique X-Correlation-ID for every request and propagates it
/// downstream so all microservices log the same ID for a single user request.
/// </summary>
public class CorrelationIdMiddleware(RequestDelegate next)
{
    private const string Header = "X-Correlation-ID";

    public async Task InvokeAsync(HttpContext ctx)
    {
        // Use incoming ID if client sent one, otherwise generate a new one
        var correlationId = ctx.Request.Headers[Header].FirstOrDefault()
                            ?? Guid.NewGuid().ToString();

        // Attach to the request so Ocelot forwards it downstream
        ctx.Request.Headers[Header] = correlationId;

        // Attach to the response so the frontend can read it
        ctx.Response.OnStarting(() =>
        {
            ctx.Response.Headers[Header] = correlationId;
            return Task.CompletedTask;
        });

        // Make it available in Serilog structured logs
        using (Serilog.Context.LogContext.PushProperty("CorrelationId", correlationId))
        {
            await next(ctx);
        }
    }
}
