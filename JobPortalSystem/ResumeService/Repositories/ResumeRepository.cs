using Microsoft.EntityFrameworkCore;
using ResumeService.Data;
using ResumeService.Data.Entities;
using ResumeService.Repositories.Interfaces;

namespace ResumeService.Repositories;

public class ResumeRepository(ResumeDbContext db) : IResumeRepository
{
    public Task<List<Resume>> GetResumesByOwnerAsync(Guid ownerId)
    {
        return db.Resumes.Where(r => r.OwnerId == ownerId).ToListAsync();
    }

    public Task<Resume?> GetResumeWithDetailsAsync(Guid resumeId)
    {
        return db.Resumes
            .Include(r => r.Educations)
            .Include(r => r.Experiences)
            .Include(r => r.Skills)
            .Include(r => r.Projects)
            .FirstOrDefaultAsync(r => r.Id == resumeId);
    }

    public Task AddResumeAsync(Resume resume)
    {
        db.Resumes.Add(resume);
        return db.SaveChangesAsync();
    }

    public Task RemoveDetailsAsync(Resume resume)
    {
        db.Educations.RemoveRange(resume.Educations);
        db.Experiences.RemoveRange(resume.Experiences);
        db.Skills.RemoveRange(resume.Skills);
        db.Projects.RemoveRange(resume.Projects);

        return Task.CompletedTask;
    }

    public Task SaveChangesAsync()
    {
        return db.SaveChangesAsync();
    }
}