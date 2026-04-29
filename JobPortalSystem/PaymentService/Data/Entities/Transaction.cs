namespace PaymentService.Data.Entities;

public enum TransactionType { Credit, Debit }

public class Transaction
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid WalletId { get; set; }
    public RecruiterWallet Wallet { get; set; } = null!;
    public TransactionType Type { get; set; }
    public int Points { get; set; }
    public string? Description { get; set; }
    public string? IdempotencyKey { get; set; }
    public string? RazorpayPaymentId { get; set; }
    public decimal? AmountPaid { get; set; }
    public string? Currency { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
