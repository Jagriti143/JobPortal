using JobCatalogService.Data.Entities;
using Microsoft.EntityFrameworkCore;

namespace JobCatalogService.Data;

public class JobDbContext(DbContextOptions<JobDbContext> options) : DbContext(options)
{
    public DbSet<Company> Companies => Set<Company>();
    public DbSet<CompanyReview> CompanyReviews => Set<CompanyReview>();
    public DbSet<Job> Jobs => Set<Job>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Company>(e =>
        {
            e.HasKey(c => c.Id);
            e.Property(c => c.Name).HasMaxLength(200).IsRequired();
        });

        modelBuilder.Entity<CompanyReview>(e =>
        {
            e.HasKey(r => r.Id);
            e.HasOne(r => r.Company).WithMany(c => c.Reviews).HasForeignKey(r => r.CompanyId);
        });

        modelBuilder.Entity<Job>(e =>
        {
            e.HasKey(j => j.Id);
            e.HasIndex(j => new { j.ModerationStatus, j.CreatedAt });
            e.HasIndex(j => j.CompanyId);
            e.Property(j => j.Title).HasMaxLength(300).IsRequired();
            e.Property(j => j.ModerationStatus).HasMaxLength(20).IsRequired();
            e.HasOne(j => j.Company).WithMany(c => c.Jobs).HasForeignKey(j => j.CompanyId);
        });
    }
}
