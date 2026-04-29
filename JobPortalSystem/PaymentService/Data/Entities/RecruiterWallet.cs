using System.ComponentModel.DataAnnotations;

namespace PaymentService.Data.Entities;

public class RecruiterWallet
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid RecruiterId { get; set; }
    public int PointsBalance { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    [Timestamp]
    public byte[] RowVersion { get; set; } = Array.Empty<byte>();
    public ICollection<Transaction> Transactions { get; set; } = new List<Transaction>();
}
