using AdminService.Data;
using AdminService.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AdminService.Repositories;

public class JobRepository(JobReadDbContext jobDb) : IJobRepository
{
    public Task<List<JobReadModel>> GetModerationQueueAsync()
    {
        return jobDb.Jobs.Where(j => j.ModerationStatus == "Pending").ToListAsync();
    }

    public Task<JobReadModel?> GetJobByIdAsync(Guid jobId)
    {
        return jobDb.Jobs.FindAsync(jobId).AsTask();
    }

    public Task UpdateJobAsync(JobReadModel job)
    {
        jobDb.Jobs.Update(job);
        return jobDb.SaveChangesAsync();
    }
}
