using AdminService.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace AdminService.Data;

public class AdminDbContext(DbContextOptions<AdminDbContext> options) : DbContext(options)
{
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AuditLog>(e =>
        {
            e.HasKey(a => a.Id);
            e.HasIndex(a => new { a.AdminId, a.CreatedAt });
            e.Property(a => a.Action).HasMaxLength(100).IsRequired();
            e.Property(a => a.TargetType).HasMaxLength(50).IsRequired();
        });
    }
}
