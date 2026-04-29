using Microsoft.EntityFrameworkCore;

namespace AdminService.Data;

public class PaymentReadDbContext(DbContextOptions<PaymentReadDbContext> options) : DbContext(options)
{
    public DbSet<TransactionReadModel> Transactions => Set<TransactionReadModel>();
    public DbSet<WalletReadModel> RecruiterWallets => Set<WalletReadModel>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<TransactionReadModel>(e =>
        {
            e.ToTable("Transactions");
            e.HasKey(t => t.Id);
        });
        modelBuilder.Entity<WalletReadModel>(e =>
        {
            e.ToTable("RecruiterWallets");
            e.HasKey(w => w.Id);
        });
    }
}

public class TransactionReadModel
{
    public Guid Id { get; set; }
    public Guid WalletId { get; set; }
    public string Type { get; set; } = string.Empty;
    public int Points { get; set; }
    public string? Description { get; set; }
    public string? RazorpayPaymentId { get; set; }
    public decimal? AmountPaid { get; set; }
    public string? Currency { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class WalletReadModel
{
    public Guid Id { get; set; }
    public Guid RecruiterId { get; set; }
    public int PointsBalance { get; set; }
    public DateTime UpdatedAt { get; set; }
}
