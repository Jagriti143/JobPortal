namespace PaymentService.Services;

public interface IWalletService
{
    Task<int> GetBalanceAsync(Guid recruiterId);
    Task<(bool success, string error)> DeductAsync(Guid recruiterId, string action);
    Task<bool> CreditAsync(Guid recruiterId, int points, string idempotencyKey, string? razorpayPaymentId = null, decimal? amountPaid = null);
    Task EnsureWalletExistsAsync(Guid recruiterId);
}
