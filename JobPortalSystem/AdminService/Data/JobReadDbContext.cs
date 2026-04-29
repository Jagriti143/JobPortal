using Microsoft.EntityFrameworkCore;

namespace AdminService.Data;

public class JobReadDbContext(DbContextOptions<JobReadDbContext> options) : DbContext(options)
{
    public DbSet<JobReadModel> Jobs => Set<JobReadModel>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<JobReadModel>(e =>
        {
            e.ToTable("Jobs");
            e.HasKey(j => j.Id);
        });
    }
}

public class JobReadModel
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public Guid PostedByRecruiterId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string ModerationStatus { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
