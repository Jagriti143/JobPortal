using Microsoft.EntityFrameworkCore;

namespace AdminService.Data;

// Read-only view of IdentityDb — no migrations owned here
public class IdentityReadDbContext(DbContextOptions<IdentityReadDbContext> options) : DbContext(options)
{
    public DbSet<UserReadModel> Users => Set<UserReadModel>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<UserReadModel>(e =>
        {
            e.ToTable("Users");
            e.HasKey(u => u.Id);
            e.HasQueryFilter(u => !u.IsDeleted);
        });
    }
}

public class UserReadModel
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public bool EmailVerified { get; set; }
    public bool IsDeleted { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
