using JobCatalogService.Repositories.Interfaces;

namespace JobCatalogService.Services;

public class JobSyncService(IServiceProvider services, ILogger<JobSyncService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Wait briefly for the app to fully start
        await Task.Delay(TimeSpan.FromSeconds(3), stoppingToken);

        using var scope = services.CreateScope();
        var jobRepo = scope.ServiceProvider.GetRequiredService<IJobRepository>();
        var companyRepo = scope.ServiceProvider.GetRequiredService<ICompanyRepository>();
        var es = scope.ServiceProvider.GetRequiredService<IElasticsearchService>();

        try
        {
            var jobs = await jobRepo.GetAllJobsAsync();
            var synced = 0;
            var removed = 0;

            foreach (var job in jobs)
            {
                // Only index Approved, non-deleted jobs
                if (job.ModerationStatus == "Approved" && !job.IsDeleted)
                {
                    var company = await companyRepo.GetCompanyByIdAsync(job.CompanyId);
                    await es.IndexJobAsync(job, company?.Name ?? "Unknown");
                    synced++;
                }
                else
                {
                    // Remove Pending, Flagged, or deleted jobs from ES index
                    await es.RemoveJobAsync(job.Id);
                    removed++;
                }
            }
            logger.LogInformation(
                "JobSyncService: indexed {Synced} approved jobs, removed {Removed} non-approved/deleted jobs from ES",
                synced, removed);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "JobSyncService: failed to sync jobs to Elasticsearch");
        }
    }
}
