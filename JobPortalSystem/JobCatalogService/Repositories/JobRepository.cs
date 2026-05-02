using JobCatalogService.Data;
using JobCatalogService.Data.Entities;
using JobCatalogService.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace JobCatalogService.Repositories;

public class JobRepository(JobDbContext db) : IJobRepository
{
    public Task<Job?> GetJobByIdAsync(Guid jobId)
    {
        return db.Jobs.Include(j => j.Company).FirstOrDefaultAsync(j => j.Id == jobId);
    }

    public Task<List<Job>> GetJobsByCompanyAsync(Guid companyId)
    {
        // Public endpoint — only approved, non-deleted jobs visible to job seekers
        return db.Jobs
            .Where(j => j.CompanyId == companyId && j.ModerationStatus == "Approved" && !j.IsDeleted)
            .ToListAsync();
    }

    public Task<List<Job>> GetJobsByRecruiterAsync(Guid recruiterId)
    {
        // Recruiter dashboard — all own jobs regardless of moderation status (excludes soft-deleted)
        return db.Jobs
            .Where(j => j.PostedByRecruiterId == recruiterId && !j.IsDeleted)
            .OrderByDescending(j => j.CreatedAt)
            .ToListAsync();
    }

    public Task<List<Job>> GetAllJobsAsync()
    {
        // Include deleted jobs so JobSyncService can remove them from Elasticsearch
        return db.Jobs.Include(j => j.Company).ToListAsync();
    }

    public Task AddJobAsync(Job job)
    {
        db.Jobs.Add(job);
        return db.SaveChangesAsync();
    }

    public Task UpdateJobAsync(Job job)
    {
        db.Jobs.Update(job);
        return db.SaveChangesAsync();
    }

    public async Task<bool> DeleteJobAsync(Guid jobId, Guid recruiterId)
    {
        var job = await db.Jobs.FirstOrDefaultAsync(j => j.Id == jobId && j.PostedByRecruiterId == recruiterId);
        if (job == null) return false;
        job.IsDeleted = true;
        job.DeletedAt = DateTime.UtcNow;
        job.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return true;
    }
}
