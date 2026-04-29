using AdminService.Data;

namespace AdminService.Repositories.Interfaces;

public interface IJobRepository
{
    Task<List<JobReadModel>> GetModerationQueueAsync();
    Task<JobReadModel?> GetJobByIdAsync(Guid jobId);
    Task UpdateJobAsync(JobReadModel job);
}
