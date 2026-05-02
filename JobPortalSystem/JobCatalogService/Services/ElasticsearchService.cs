using Elastic.Clients.Elasticsearch;
using Elastic.Clients.Elasticsearch.Mapping;
using Elastic.Clients.Elasticsearch.QueryDsl;
using JobCatalogService.Data.Entities;
using Microsoft.Extensions.Configuration;

namespace JobCatalogService.Services;

public class ElasticsearchService(ElasticsearchClient client, IConfiguration config, ILogger<ElasticsearchService> logger) : IElasticsearchService
{
    private readonly string _index = config["Elasticsearch:IndexName"] ?? "jobs";

    private record JobDocument(
        Guid Id,
        string Title,
        string Description,
        string Location,
        string JobType,
        decimal? SalaryMin,
        decimal? SalaryMax,
        string CompanyName,
        Guid CompanyId,
        string ModerationStatus,
        DateTime CreatedAt
    );

    /// <summary>
    /// Creates the index with explicit mappings if it does not already exist.
    /// ModerationStatus and JobType are mapped as keyword so term filters work reliably.
    /// </summary>
    public async Task EnsureIndexAsync()
    {
        var exists = await client.Indices.ExistsAsync(_index);
        if (exists.Exists) return;

        var createResp = await client.Indices.CreateAsync(_index, c => c
            .Mappings(m => m
                .Properties<JobDocument>(p => p
                    .Keyword(k => k.ModerationStatus)
                    .Keyword(k => k.JobType)
                    .Text(t => t.Title)
                    .Text(t => t.Description)
                    .Text(t => t.Location)
                    .Text(t => t.CompanyName)
                    .Keyword(k => k.Id)
                    .Keyword(k => k.CompanyId)
                    .FloatNumber(f => f.SalaryMin)
                    .FloatNumber(f => f.SalaryMax)
                    .Date(d => d.CreatedAt)
                )));

        if (!createResp.IsValidResponse)
            logger.LogWarning("ES index creation failed: {Debug}", createResp.DebugInformation);
        else
            logger.LogInformation("ES index '{Index}' created with explicit mappings.", _index);
    }

    /// <summary>
    /// Returns all job IDs currently indexed in Elasticsearch.
    /// Used by JobSyncService to detect orphans (hard-deleted from DB but still in ES).
    /// </summary>
    public async Task<List<string>> GetAllIndexedJobIdsAsync()
    {
        var response = await client.SearchAsync<JobDocument>(s => s
            .Index(_index)
            .Size(10000)           // fetch up to 10k IDs — sufficient for this scale
            .Source(false)         // don't fetch _source, only need _id
            .Query(q => q.MatchAll(_ => { })));

        if (!response.IsValidResponse)
        {
            logger.LogWarning("ES get-all-ids failed: {Debug}", response.DebugInformation ?? response.ElasticsearchServerError?.ToString());
            return [];
        }

        return response.Hits.Select(h => h.Id ?? string.Empty)
                            .Where(id => !string.IsNullOrEmpty(id))
                            .ToList();
    }

    public async Task<object> SearchAsync(
        string? q, string? location, string? jobType,
        decimal? salaryMin, decimal? salaryMax, int page, int limit)
    {
        var from = (page - 1) * limit;

        // Build all filter clauses — these are AND conditions (must all match)
        var filters = new List<Action<QueryDescriptor<JobDocument>>>();

        // Always filter: only Approved jobs.
        // Both moderationStatus and jobType are explicitly mapped as 'keyword' in EnsureIndexAsync,
        // so term queries use the field name directly — no .keyword sub-field needed.
        filters.Add(f => f.Term(t => t.Field("moderationStatus").Value("Approved")));

        // Optional filters
        if (!string.IsNullOrWhiteSpace(jobType))
            filters.Add(f => f.Term(t => t.Field("jobType").Value(jobType)));

        if (salaryMin.HasValue)
            filters.Add(f => f.Range(r => r.Number(n => n
                .Field(d => d.SalaryMax).Gte((double)salaryMin.Value))));

        if (salaryMax.HasValue)
            filters.Add(f => f.Range(r => r.Number(n => n
                .Field(d => d.SalaryMin).Lte((double)salaryMax.Value))));

        // Build must clauses — these affect relevance scoring
        var musts = new List<Action<QueryDescriptor<JobDocument>>>();

        if (!string.IsNullOrWhiteSpace(q))
            musts.Add(m => m.MultiMatch(mm => mm
                .Fields(new[] { "title^3", "description", "companyName" })
                .Query(q)
                .Fuzziness(new Fuzziness("AUTO"))
                .MinimumShouldMatch("1")));

        if (!string.IsNullOrWhiteSpace(location))
            musts.Add(m => m.Match(mm => mm
                .Field(d => d.Location)
                .Query(location)
                .Fuzziness(new Fuzziness("AUTO"))));

        var response = await client.SearchAsync<JobDocument>(s => s
            .Index(_index)
            .From(from)
            .Size(limit)
            .Query(query => query
                .Bool(b =>
                {
                    // Set all filters at once
                    b.Filter(filters.ToArray());

                    // Set must clauses if any (keyword search)
                    if (musts.Count > 0)
                        b.Must(musts.ToArray());
                    else
                        // No keyword — match all approved jobs
                        b.Must(m => m.MatchAll(_ => { }));
                }))
            .Sort(sort => sort.Field(f => f.Field(d => d.CreatedAt).Order(SortOrder.Desc)))
        );

        if (!response.IsValidResponse)
        {
            logger.LogWarning("ES search failed: {DebugInfo}",
                response.DebugInformation ?? response.ElasticsearchServerError?.ToString() ?? "Unknown ES error");
            return new { total = 0, jobs = new List<object>() };
        }

        var jobs = response.Documents.Select(d => (object)new
        {
            d.Id, d.Title, d.Description, d.Location, d.JobType,
            d.SalaryMin, d.SalaryMax, d.CompanyName, d.CompanyId, d.CreatedAt
        }).ToList();

        return new { total = response.Total, jobs };
    }

    public async Task IndexJobAsync(Job job, string companyName)
    {
        var doc = ToDocument(job, companyName);
        var resp = await client.IndexAsync(doc, i => i.Index(_index).Id(job.Id.ToString()));
        if (!resp.IsValidResponse)
            logger.LogWarning("ES index job {JobId} failed: {Debug}", job.Id, resp.DebugInformation);
    }

    public async Task UpdateJobAsync(Job job, string companyName)
    {
        var doc = ToDocument(job, companyName);
        var resp = await client.IndexAsync(doc, i => i.Index(_index).Id(job.Id.ToString()));
        if (!resp.IsValidResponse)
            logger.LogWarning("ES update job {JobId} failed: {Debug}", job.Id, resp.DebugInformation);
    }

    public async Task RemoveJobAsync(Guid jobId)
    {
        await client.DeleteAsync(_index, jobId.ToString());
    }

    private static JobDocument ToDocument(Job job, string companyName) => new(
        job.Id, job.Title, job.Description, job.Location, job.JobType,
        job.SalaryMin, job.SalaryMax, companyName, job.CompanyId,
        job.ModerationStatus, job.CreatedAt
    );
}
