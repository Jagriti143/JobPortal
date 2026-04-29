using ApplicationService.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace ApplicationService.Data;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
{
    public DbSet<Application> Applications => Set<Application>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Application>(e =>
        {
            e.HasKey(a => a.Id);
            e.HasIndex(a => new { a.JobSeekerId, a.JobId }).IsUnique();
            e.HasIndex(a => new { a.JobSeekerId, a.Status });
            e.HasIndex(a => new { a.JobId, a.Status });
            e.Property(a => a.Status).HasConversion<string>();
            e.Property(a => a.PhoneNumber).HasMaxLength(20);
        });
    }
}
