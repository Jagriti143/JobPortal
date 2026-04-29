using Microsoft.EntityFrameworkCore;
using ResumeService.Data.Entities;

namespace ResumeService.Data;

public class ResumeDbContext(DbContextOptions<ResumeDbContext> options) : DbContext(options)
{
    public DbSet<Resume> Resumes => Set<Resume>();
    public DbSet<ResumeEducation> Educations => Set<ResumeEducation>();
    public DbSet<ResumeExperience> Experiences => Set<ResumeExperience>();
    public DbSet<ResumeSkill> Skills => Set<ResumeSkill>();
    public DbSet<ResumeProject> Projects => Set<ResumeProject>();
    public DbSet<ResumeUnlockRequest> ResumeUnlockRequests => Set<ResumeUnlockRequest>();
    public DbSet<UnlockedResume> UnlockedResumes => Set<UnlockedResume>();
    protected override void OnModelCreating(ModelBuilder m)
    {
        m.Entity<Resume>(e =>
        {
            e.HasKey(r => r.Id);
            e.HasIndex(r => r.OwnerId);
            e.Property(r => r.Title).HasMaxLength(300).IsRequired();
            e.Property(r => r.TemplateId).HasMaxLength(50);
        });

        m.Entity<ResumeEducation>(e =>
        {
            e.HasKey(r => r.Id);

            e.HasOne(r => r.Resume)
             .WithMany(r => r.Educations)
             .HasForeignKey(r => r.ResumeId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        m.Entity<ResumeExperience>(e =>
        {
            e.HasKey(r => r.Id);

            e.HasOne(r => r.Resume)
             .WithMany(r => r.Experiences)
             .HasForeignKey(r => r.ResumeId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        m.Entity<ResumeSkill>(e =>
        {
            e.HasKey(r => r.Id);

            e.HasOne(r => r.Resume)
             .WithMany(r => r.Skills)
             .HasForeignKey(r => r.ResumeId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        m.Entity<ResumeProject>(e =>
        {
            e.HasKey(r => r.Id);

            e.HasOne(r => r.Resume)
             .WithMany(r => r.Projects)
             .HasForeignKey(r => r.ResumeId)
             .OnDelete(DeleteBehavior.Cascade);
        });

        m.Entity<ResumeUnlockRequest>(e =>
        {
            e.HasKey(r => r.Id);
            e.HasIndex(r => r.RecruiterId);
            e.Property(r => r.Status).HasMaxLength(50).IsRequired();
        });

        m.Entity<UnlockedResume>(e =>
        {
            e.HasKey(r => r.Id);
            e.HasIndex(r => new { r.RecruiterId, r.ResumeId }).IsUnique();
        });
    }
}
