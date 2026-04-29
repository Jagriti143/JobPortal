using JobCatalogService.Data.Entities;

namespace JobCatalogService.Repositories.Interfaces;

public interface IJobRepository
{
    Task<Job?> GetJobByIdAsync(Guid jobId);
    Task<List<Job>> GetJobsByCompanyAsync(Guid companyId);
    Task<List<Job>> GetAllJobsAsync();
    Task AddJobAsync(Job job);
    Task UpdateJobAsync(Job job);
    Task<bool> DeleteJobAsync(Guid jobId, Guid recruiterId);
}
