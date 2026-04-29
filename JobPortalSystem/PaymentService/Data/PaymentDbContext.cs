using Microsoft.EntityFrameworkCore;
using PaymentService.Data.Entities;

namespace PaymentService.Data;

public class PaymentDbContext(DbContextOptions<PaymentDbContext> options) : DbContext(options)
{
    public DbSet<RecruiterWallet> RecruiterWallets => Set<RecruiterWallet>();
    public DbSet<Transaction> Transactions => Set<Transaction>();
    public DbSet<PointsDeductionRule> PointsDeductionRules => Set<PointsDeductionRule>();
    public DbSet<UnlockResumeSagaState> UnlockResumeSagaStates => Set<UnlockResumeSagaState>();
    public DbSet<RecruiterUnlock> RecruiterUnlocks => Set<RecruiterUnlock>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<RecruiterWallet>(e =>
        {
            e.HasKey(w => w.Id);
            e.HasIndex(w => w.RecruiterId).IsUnique();
            e.Property(w => w.RowVersion).IsRowVersion();
            e.Property(w => w.PointsBalance).HasDefaultValue(0);
        });

        modelBuilder.Entity<Transaction>(e =>
        {
            e.HasKey(t => t.Id);
            e.HasIndex(t => new { t.WalletId, t.CreatedAt });
            e.HasIndex(t => new { t.Type, t.CreatedAt });
            e.HasIndex(t => t.IdempotencyKey).IsUnique().HasFilter("[IdempotencyKey] IS NOT NULL");
            e.Property(t => t.Type).HasConversion<string>();
            e.HasOne(t => t.Wallet).WithMany(w => w.Transactions).HasForeignKey(t => t.WalletId);
        });

        modelBuilder.Entity<PointsDeductionRule>(e =>
        {
            e.HasKey(r => r.Id);
            e.Property(r => r.Action).HasMaxLength(50).IsRequired();
        });

        modelBuilder.Entity<UnlockResumeSagaState>(e =>
        {
            e.HasKey(s => s.CorrelationId);
            e.Property(s => s.CurrentState).HasMaxLength(64).IsRequired();
            e.Property(s => s.RecruiterId).IsRequired();
            e.Property(s => s.ResumeId).IsRequired();
        });

        modelBuilder.Entity<RecruiterUnlock>(e =>
        {
            e.HasKey(u => u.Id);
            // Unique: one unlock record per recruiter+resource+type
            e.HasIndex(u => new { u.RecruiterId, u.ResourceId, u.UnlockType }).IsUnique();
            e.Property(u => u.UnlockType).HasMaxLength(50).IsRequired();
        });
    }
}
