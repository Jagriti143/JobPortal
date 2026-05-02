using JobCatalogService.Data.Entities;

namespace JobCatalogService.Services;

public interface IElasticsearchService
{
    Task EnsureIndexAsync();
    Task<List<string>> GetAllIndexedJobIdsAsync();
    Task<object> SearchAsync(string? q, string? location, string? jobType, decimal? salaryMin, decimal? salaryMax, int page, int limit);
    Task IndexJobAsync(Job job, string companyName);
    Task UpdateJobAsync(Job job, string companyName);
    Task RemoveJobAsync(Guid jobId);
}
