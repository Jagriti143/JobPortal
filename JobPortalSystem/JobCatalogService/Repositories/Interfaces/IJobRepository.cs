using JobCatalogService.Data.Entities;

namespace JobCatalogService.Repositories.Interfaces;

public interface IJobRepository
{
    Task<Job?> GetJobByIdAsync(Guid jobId);
    Task<List<Job>> GetJobsByCompanyAsync(Guid companyId);
    /// <summary>
    /// Returns ALL jobs posted by this recruiter (all statuses, non-deleted).
    /// Used by GET /jobs/my — the recruiter's own dashboard view.
    /// </summary>
    Task<List<Job>> GetJobsByRecruiterAsync(Guid recruiterId);
    Task<List<Job>> GetAllJobsAsync();
    Task AddJobAsync(Job job);
    Task UpdateJobAsync(Job job);
    Task<bool> DeleteJobAsync(Guid jobId, Guid recruiterId);
}
