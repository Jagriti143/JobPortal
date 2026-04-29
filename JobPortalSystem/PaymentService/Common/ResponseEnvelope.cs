namespace PaymentService.Common;

public class ResponseEnvelope<T>
{
    public bool Success { get; init; }
    public T? Data { get; init; }
    public object? Meta { get; init; }
    public string? Error { get; init; }
    public string TraceId { get; init; } = string.Empty;

    public static ResponseEnvelope<T> Ok(T data, object? meta = null, string traceId = "") =>
        new() { Success = true, Data = data, Meta = meta, TraceId = traceId };

    public static ResponseEnvelope<T> Fail(string error, string traceId = "") =>
        new() { Success = false, Error = error, TraceId = traceId };
}
