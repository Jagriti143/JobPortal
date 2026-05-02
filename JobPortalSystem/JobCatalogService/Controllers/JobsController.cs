using JobCatalogService.Common;
using JobCatalogService.Data.Entities;
using JobCatalogService.Models.DTOs;
using JobCatalogService.Repositories.Interfaces;
using JobCatalogService.Services;
using JobCatalogService.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace JobCatalogService.Controllers;

[ApiController]
[Route("jobs")]
public class JobsController(
    IJobRepository jobRepository,
    ICompanyRepository companyRepository,
    IElasticsearchService es,
    IConfiguration config,
    ILogger<JobsController> logger) : ControllerBase
{
    /// <summary>Search jobs via Elasticsearch.</summary>
    [HttpGet("search")]
    public async Task<IActionResult> Search(
        [FromQuery] string? q,
        [FromQuery] string? location,
        [FromQuery] string? jobType,
        [FromQuery] decimal? salaryMin,
        [FromQuery] decimal? salaryMax,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20)
    {
        var results = await es.SearchAsync(q, location, jobType, salaryMin, salaryMax, page, limit);
        return Ok(ResponseEnvelope<object>.Ok(results, new { page, limit }, HttpContext.TraceIdentifier));
    }

    /// <summary>Get job detail by ID.</summary>
    [HttpGet("{jobId:guid}")]
    public async Task<IActionResult> GetJob(Guid jobId)
    {
        var job = await jobRepository.GetJobByIdAsync(jobId);
        if (job == null) return NotFound(ResponseEnvelope<object>.Fail("Job not found.", HttpContext.TraceIdentifier));
        if (job.IsDeleted)
            return NotFound(ResponseEnvelope<object>.Fail(
                "This job listing is no longer available. It may have been removed by the recruiter.",
                HttpContext.TraceIdentifier));
        return Ok(ResponseEnvelope<object>.Ok(JobResponseDto.FromEntity(job), traceId: HttpContext.TraceIdentifier));
    }

    /// <summary>Get all approved jobs for a company (public).</summary>
    [HttpGet("company/{companyId:guid}")]
    public async Task<IActionResult> GetJobsByCompany(Guid companyId)
    {
        var jobs = await jobRepository.GetJobsByCompanyAsync(companyId);
        var dtos = jobs.Select(JobResponseDto.FromEntity).ToList();
        return Ok(ResponseEnvelope<object>.Ok(dtos, traceId: HttpContext.TraceIdentifier));
    }

    /// <summary>
    /// Get all jobs posted by the currently authenticated recruiter (all statuses).
    /// Used exclusively by the recruiter dashboard — no companyId required from client.
    /// </summary>
    [HttpGet("my")]
    [Authorize(Roles = "Recruiter")]
    public async Task<IActionResult> GetMyJobs()
    {
        var recruiterId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub") ?? Guid.Empty.ToString());

        var jobs = await jobRepository.GetJobsByRecruiterAsync(recruiterId);
        var dtos = jobs.Select(JobResponseDto.FromEntity).ToList();
        return Ok(ResponseEnvelope<object>.Ok(dtos, traceId: HttpContext.TraceIdentifier));
    }

    /// <summary>Post a new job listing (Recruiter only).</summary>
    [HttpPost]
    [Authorize(Roles = "Recruiter")]
    public async Task<IActionResult> CreateJob([FromBody] CreateJobRequest req)
    {
        var recruiterId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub") ?? Guid.Empty.ToString());

        // Auto-fetch the company registered during this recruiter's registration
        var company = await companyRepository.GetCompanyByRecruiterIdAsync(recruiterId);
        if (company == null)
            return BadRequest(ResponseEnvelope<object>.Fail(
                "No company registered for your account. A recruiter must have a registered company to post jobs.",
                HttpContext.TraceIdentifier));

        var job = new Job
        {
            CompanyId = company.Id,
            PostedByRecruiterId = recruiterId,
            Title = req.Title,
            Description = req.Description,
            Location = req.Location,
            JobType = req.JobType,
            SalaryMin = req.SalaryMin,
            SalaryMax = req.SalaryMax,
            ModerationStatus = "Pending"
        };

        await jobRepository.AddJobAsync(job);
        // Do NOT index into Elasticsearch yet — only Approved jobs are searchable.
        // The Admin will approve via PATCH /jobs/{id}/status which triggers indexing.

        return StatusCode(201, ResponseEnvelope<object>.Ok(new { jobId = job.Id }, traceId: HttpContext.TraceIdentifier));
    }

    /// <summary>Update a job listing (Recruiter, own jobs only).</summary>
    [HttpPut("{jobId:guid}")]
    [Authorize(Roles = "Recruiter")]
    public async Task<IActionResult> UpdateJob(Guid jobId, [FromBody] UpdateJobRequest req)
    {
        var recruiterId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub") ?? Guid.Empty.ToString());

        var job = await jobRepository.GetJobByIdAsync(jobId);
        if (job == null) return NotFound(ResponseEnvelope<object>.Fail("Job not found.", HttpContext.TraceIdentifier));
        if (job.PostedByRecruiterId != recruiterId) return Forbid();

        job.Title = req.Title ?? job.Title;
        job.Description = req.Description ?? job.Description;
        job.Location = req.Location ?? job.Location;
        job.JobType = req.JobType ?? job.JobType;
        job.SalaryMin = req.SalaryMin ?? job.SalaryMin;
        job.SalaryMax = req.SalaryMax ?? job.SalaryMax;
        job.UpdatedAt = DateTime.UtcNow;
        await jobRepository.UpdateJobAsync(job);

        _ = es.UpdateJobAsync(job, job.Company?.Name ?? "Unknown");
        return Ok(ResponseEnvelope<object>.Ok(new { jobId = job.Id }, traceId: HttpContext.TraceIdentifier));
    }

    /// <summary>Delete (soft) a job listing — Recruiter can only delete own jobs.</summary>
    [HttpDelete("{jobId:guid}")]
    [Authorize(Roles = "Recruiter")]
    public async Task<IActionResult> DeleteJob(Guid jobId)
    {
        var recruiterId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub") ?? Guid.Empty.ToString());
        var traceId = HttpContext.TraceIdentifier;

        var deleted = await jobRepository.DeleteJobAsync(jobId, recruiterId);
        if (!deleted)
            return NotFound(ResponseEnvelope<object>.Fail(
                "Job not found or you do not have permission to delete it.", traceId));

        // Remove from Elasticsearch so it no longer appears in search
        _ = es.RemoveJobAsync(jobId);

        return Ok(ResponseEnvelope<object>.Ok(
            new { jobId, message = "Job listing removed successfully." }, traceId: traceId));
    }

    /// <summary>
    /// Update job moderation status — called by AdminService after approve/flag.
    /// Protected by X-Service-Key header (internal service-to-service auth).
    /// </summary>
    [HttpPatch("{jobId:guid}/status")]
    [AllowAnonymous]   // JWT not used here — AdminService is a backend process with no user token
    public async Task<IActionResult> UpdateStatus(Guid jobId, [FromBody] UpdateModerationStatusRequest req)
    {
        // Validate the shared internal service key
        var expectedKey = config["InternalServices:ServiceKey"] ?? string.Empty;
        if (string.IsNullOrEmpty(expectedKey)
            || !Request.Headers.TryGetValue("X-Service-Key", out var providedKey)
            || providedKey.ToString() != expectedKey)
        {
            return StatusCode(401, ResponseEnvelope<object>.Fail(
                "Unauthorized internal request.", HttpContext.TraceIdentifier));
        }

        // GetJobByIdAsync eagerly loads Company via Include(j => j.Company)
        var job = await jobRepository.GetJobByIdAsync(jobId);
        if (job == null) return NotFound(ResponseEnvelope<object>.Fail("Job not found.", HttpContext.TraceIdentifier));

        job.ModerationStatus = req.Status;
        job.UpdatedAt = DateTime.UtcNow;
        await jobRepository.UpdateJobAsync(job);

        switch (req.Status)
        {
            case "Approved":
                // Index with the real company name (loaded via Include)
                await es.IndexJobAsync(job, job.Company?.Name ?? "Unknown");
                logger.LogInformation("Job {JobId} approved and indexed in Elasticsearch.", jobId);
                break;
            case "Flagged":
            case "Pending":
                // Remove from search — job should not be publicly visible
                await es.RemoveJobAsync(jobId);
                logger.LogInformation("Job {JobId} set to {Status} and removed from Elasticsearch.", jobId, req.Status);
                break;
        }

        return Ok(ResponseEnvelope<object>.Ok(new { jobId, status = req.Status }, traceId: HttpContext.TraceIdentifier));
    }

    /// <summary>Force a full Elasticsearch re-sync of all approved jobs (Admin only).</summary>
    [HttpPost("admin/resync")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> ResyncElasticsearch()
    {
        var traceId = HttpContext.TraceIdentifier;
        try
        {
            await es.EnsureIndexAsync();

            var allJobs = await jobRepository.GetAllJobsAsync();
            var synced = 0;
            var removed = 0;
            var dbIds = new HashSet<string>();

            foreach (var job in allJobs)
            {
                dbIds.Add(job.Id.ToString());
                if (job.ModerationStatus == "Approved" && !job.IsDeleted)
                {
                    var company = await companyRepository.GetCompanyByIdAsync(job.CompanyId);
                    await es.IndexJobAsync(job, company?.Name ?? "Unknown");
                    synced++;
                }
                else
                {
                    await es.RemoveJobAsync(job.Id);
                    removed++;
                }
            }

            // Orphan cleanup — remove ES docs that no longer exist in DB
            var esIds = await es.GetAllIndexedJobIdsAsync();
            foreach (var esId in esIds)
            {
                if (!dbIds.Contains(esId))
                {
                    await es.RemoveJobAsync(Guid.Parse(esId));
                    removed++;
                }
            }

            logger.LogInformation("Manual ES resync: indexed {Synced}, removed {Removed}", synced, removed);
            return Ok(ResponseEnvelope<object>.Ok(
                new { synced, removed, message = "Elasticsearch re-sync completed successfully." },
                traceId: traceId));
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Manual ES resync failed");
            return StatusCode(500, ResponseEnvelope<object>.Fail("Re-sync failed: " + ex.Message, traceId));
        }
    }
}
