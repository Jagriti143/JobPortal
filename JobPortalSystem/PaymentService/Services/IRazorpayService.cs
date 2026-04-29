namespace PaymentService.Services;

public interface IRazorpayService
{
    Task<(string orderId, int amountInPaise)> CreateOrderAsync(int amountInPaise);
    bool VerifyWebhookSignature(string rawBody, string signature);
    bool VerifyPaymentSignature(string orderId, string paymentId, string signature);
}
