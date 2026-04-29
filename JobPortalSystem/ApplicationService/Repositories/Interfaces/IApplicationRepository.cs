using ApplicationService.Data.Entities;

namespace ApplicationService.Repositories.Interfaces;

public interface IApplicationRepository
{
    Task<bool> HasAppliedAsync(Guid jobSeekerId, Guid jobId);
    Task AddApplicationAsync(Application application);
    Task<List<Application>> GetApplicationsBySeekerAsync(Guid jobSeekerId);
    Task<Application?> GetApplicationByIdAsync(Guid applicationId);
    Task<List<Application>> GetApplicationsByJobAsync(Guid jobId, ApplicationStatus? status, bool? shortlisted);
    Task UpdateApplicationAsync(Application application);
}
