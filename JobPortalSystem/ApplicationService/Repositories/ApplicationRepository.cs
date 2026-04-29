using ApplicationService.Data;
using ApplicationService.Data.Entities;
using ApplicationService.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace ApplicationService.Repositories;

public class ApplicationRepository(ApplicationDbContext db) : IApplicationRepository
{
    public Task<bool> HasAppliedAsync(Guid jobSeekerId, Guid jobId)
    {
        return db.Applications.AnyAsync(a => a.JobSeekerId == jobSeekerId && a.JobId == jobId);
    }

    public Task AddApplicationAsync(Application application)
    {
        db.Applications.Add(application);
        return db.SaveChangesAsync();
    }

    public Task<List<Application>> GetApplicationsBySeekerAsync(Guid jobSeekerId)
    {
        return db.Applications.Where(a => a.JobSeekerId == jobSeekerId).ToListAsync();
    }

    public Task<Application?> GetApplicationByIdAsync(Guid applicationId)
    {
        return db.Applications.FindAsync(applicationId).AsTask();
    }

    public Task<List<Application>> GetApplicationsByJobAsync(Guid jobId, ApplicationStatus? status, bool? shortlisted)
    {
        var query = db.Applications.Where(a => a.JobId == jobId);
        
        if (status.HasValue)
            query = query.Where(a => a.Status == status.Value);
            
        if (shortlisted.HasValue && shortlisted.Value)
            query = query.Where(a => a.Status == ApplicationStatus.Shortlisted);

        return query.ToListAsync();
    }

    public Task UpdateApplicationAsync(Application application)
    {
        db.Applications.Update(application);
        return db.SaveChangesAsync();
    }
}
