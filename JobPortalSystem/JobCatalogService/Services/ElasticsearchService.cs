using Elastic.Clients.Elasticsearch;
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

    public async Task<object> SearchAsync(
        string? q, string? location, string? jobType,
        decimal? salaryMin, decimal? salaryMax, int page, int limit)
    {
        var from = (page - 1) * limit;

        // Build all filter clauses — these are AND conditions (must all match)
        var filters = new List<Action<QueryDescriptor<JobDocument>>>();

        // Always filter: only Approved jobs
        filters.Add(f => f.Term(t => t.Field("moderationStatus.keyword").Value("Approved")));

        // Optional filters
        if (!string.IsNullOrWhiteSpace(jobType))
            filters.Add(f => f.Term(t => t.Field("jobType.keyword").Value(jobType)));

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
            logger.LogWarning("ES search failed: {DebugInfo}", response.DebugInformation);
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
        await client.IndexAsync(doc, i => i.Index(_index).Id(job.Id.ToString()));
    }

    public async Task UpdateJobAsync(Job job, string companyName)
    {
        var doc = ToDocument(job, companyName);
        await client.IndexAsync(doc, i => i.Index(_index).Id(job.Id.ToString()));
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
