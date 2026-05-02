using ResumeService.Data.Entities;

namespace ResumeService.Repositories.Interfaces;

public interface IResumeRepository
{
    Task<List<Resume>> GetResumesByOwnerAsync(Guid ownerId);
    Task<Resume?> GetResumeWithDetailsAsync(Guid resumeId);
    Task AddResumeAsync(Resume resume);
    Task RemoveDetailsAsync(Resume resume);
    Task SaveChangesAsync();
    Task<bool> DeleteResumeAsync(Guid resumeId, Guid ownerId);
}
