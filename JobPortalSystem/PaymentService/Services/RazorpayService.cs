using System.Net.Http.Headers;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;

namespace PaymentService.Services;

/// <summary>
/// Razorpay integration using direct HTTP calls (no SDK dependency issues).
/// </summary>
public class RazorpayService(IConfiguration config, ILogger<RazorpayService> logger) : IRazorpayService
{
    private readonly HttpClient _http = new();

    private (string keyId, string keySecret) GetKeys()
    {
        var keyId = config["Razorpay:KeyId"] ?? "";
        var keySecret = config["Razorpay:KeySecret"] ?? "";
        return (keyId, keySecret);
    }

    public async Task<(string orderId, int amountInPaise)> CreateOrderAsync(int amountInPaise)
    {
        var (keyId, keySecret) = GetKeys();

        if (string.IsNullOrEmpty(keyId) || keyId.Contains("PLACEHOLDER"))
            throw new InvalidOperationException("Razorpay KeyId not configured. Update appsettings.json with your TEST keys.");

        var credentials = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{keyId}:{keySecret}"));

        var requestBody = new
        {
            amount = amountInPaise,
            currency = "INR",
            receipt = Guid.NewGuid().ToString("N")[..20]
        };

        var request = new HttpRequestMessage(HttpMethod.Post, "https://api.razorpay.com/v1/orders");
        request.Headers.Authorization = new AuthenticationHeaderValue("Basic", credentials);
        request.Content = new StringContent(
            JsonSerializer.Serialize(requestBody),
            Encoding.UTF8,
            "application/json");

        var response = await _http.SendAsync(request);
        var body = await response.Content.ReadAsStringAsync();

        if (!response.IsSuccessStatusCode)
        {
            logger.LogError("Razorpay order creation failed: {Status} {Body}", response.StatusCode, body);
            throw new Exception($"Razorpay error: {response.StatusCode} - {body}");
        }

        using var doc = JsonDocument.Parse(body);
        var orderId = doc.RootElement.GetProperty("id").GetString()!;
        logger.LogInformation("Razorpay order created: {OrderId}", orderId);
        return (orderId, amountInPaise);
    }

    public bool VerifyWebhookSignature(string rawBody, string signature)
    {
        try
        {
            var secret = config["Razorpay:WebhookSecret"] ?? "";
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(secret));
            var computed = Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes(rawBody))).ToLower();
            return computed == signature.ToLower();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Webhook HMAC verification failed");
            return false;
        }
    }

    public bool VerifyPaymentSignature(string orderId, string paymentId, string signature)
    {
        try
        {
            var (_, keySecret) = GetKeys();
            // Razorpay payment signature: HMAC-SHA256(orderId + "|" + paymentId, keySecret)
            var payload = $"{orderId}|{paymentId}";
            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(keySecret));
            var computed = Convert.ToHexString(hmac.ComputeHash(Encoding.UTF8.GetBytes(payload))).ToLower();
            return computed == signature.ToLower();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Payment signature verification failed");
            return false;
        }
    }
}
