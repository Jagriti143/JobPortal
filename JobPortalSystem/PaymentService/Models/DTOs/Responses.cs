using PaymentService.Data.Entities;

namespace PaymentService.Models.DTOs;

public class TransactionResponseDto
{
    public Guid Id { get; set; }
    public string Type { get; set; } = string.Empty;
    public int Points { get; set; }
    public string? Description { get; set; }
    public string? RazorpayPaymentId { get; set; }
    public decimal? AmountPaid { get; set; }
    public string? Currency { get; set; }
    public DateTime CreatedAt { get; set; }

    public static TransactionResponseDto FromEntity(Transaction transaction)
    {
        return new TransactionResponseDto
        {
            Id = transaction.Id,
            Type = transaction.Type.ToString(),
            Points = transaction.Points,
            Description = transaction.Description,
            RazorpayPaymentId = transaction.RazorpayPaymentId,
            AmountPaid = transaction.AmountPaid,
            Currency = transaction.Currency,
            CreatedAt = transaction.CreatedAt
        };
    }
}

public class RevenueReportDto
{
    public DateTime Date { get; set; }
    public decimal TotalAmount { get; set; }
    public int Count { get; set; }
}
