using IdentityService.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace IdentityService.Data;

public class IdentityDbContext(DbContextOptions<IdentityDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(e =>
        {
            e.HasKey(u => u.Id);
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.Email).HasMaxLength(255).IsRequired();
            e.Property(u => u.PasswordHash).HasMaxLength(512).IsRequired();
            e.Property(u => u.Role).HasMaxLength(50).IsRequired();
            e.Property(u => u.DisplayName).HasMaxLength(200);
            e.HasQueryFilter(u => !u.IsDeleted);
        });

        modelBuilder.Entity<RefreshToken>(e =>
        {
            e.HasKey(r => r.Id);
            e.HasIndex(r => r.UserId);
            e.Property(r => r.TokenHash).HasMaxLength(512).IsRequired();
            e.HasOne(r => r.User)
             .WithMany(u => u.RefreshTokens)
             .HasForeignKey(r => r.UserId)
             .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
