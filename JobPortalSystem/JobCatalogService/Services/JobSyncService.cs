using JobCatalogService.Repositories.Interfaces;

namespace JobCatalogService.Services;

public class JobSyncService(IServiceProvider services, ILogger<JobSyncService> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Wait briefly for the app to fully start
        await Task.Delay(TimeSpan.FromSeconds(3), stoppingToken);

        using var scope = services.CreateScope();
        var jobRepo    = scope.ServiceProvider.GetRequiredService<IJobRepository>();
        var companyRepo = scope.ServiceProvider.GetRequiredService<ICompanyRepository>();
        var es         = scope.ServiceProvider.GetRequiredService<IElasticsearchService>();

        try
        {
            // Ensure index exists with correct explicit mappings before writing any docs
            await es.EnsureIndexAsync();

            var jobs = await jobRepo.GetAllJobsAsync();
            var synced  = 0;
            var removed = 0;

            // --- Phase 1: index Approved jobs, remove soft-deleted / non-approved ---
            var dbJobIds = new HashSet<string>();
            foreach (var job in jobs)
            {
                dbJobIds.Add(job.Id.ToString());

                if (job.ModerationStatus == "Approved" && !job.IsDeleted)
                {
                    var company = await companyRepo.GetCompanyByIdAsync(job.CompanyId);
                    await es.IndexJobAsync(job, company?.Name ?? "Unknown");
                    synced++;
                }
                else
                {
                    // Remove Pending, Flagged, or soft-deleted jobs from ES
                    await es.RemoveJobAsync(job.Id);
                    removed++;
                }
            }

            // --- Phase 2: orphan cleanup ---
            // Find ES documents whose IDs no longer exist in the DB at all
            // (hard-deleted rows). These would never be found in Phase 1.
            var esIds = await es.GetAllIndexedJobIdsAsync();
            foreach (var esId in esIds)
            {
                if (!dbJobIds.Contains(esId))
                {
                    await es.RemoveJobAsync(Guid.Parse(esId));
                    removed++;
                    logger.LogInformation(
                        "JobSyncService: removed orphan ES doc {Id} (no longer in DB)", esId);
                }
            }

            logger.LogInformation(
                "JobSyncService: indexed {Synced} approved jobs, removed {Removed} non-approved/deleted/orphan jobs from ES",
                synced, removed);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "JobSyncService: failed to sync jobs to Elasticsearch");
        }
    }
}
