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

    /// <summary>Get all approved jobs for a company.</summary>
    [HttpGet("company/{companyId:guid}")]
    public async Task<IActionResult> GetJobsByCompany(Guid companyId)
    {
        var jobs = await jobRepository.GetJobsByCompanyAsync(companyId);
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

        var company = await companyRepository.GetCompanyByIdAsync(req.CompanyId);
        if (company == null) return BadRequest(ResponseEnvelope<object>.Fail("Company not found.", HttpContext.TraceIdentifier));

        var job = new Job
        {
            CompanyId = req.CompanyId,
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
        _ = es.IndexJobAsync(job, company.Name);

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

    /// <summary>Update job moderation status (Admin only).</summary>
    [HttpPatch("{jobId:guid}/status")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateStatus(Guid jobId, [FromBody] UpdateModerationStatusRequest req)
    {
        var job = await jobRepository.GetJobByIdAsync(jobId);
        if (job == null) return NotFound(ResponseEnvelope<object>.Fail("Job not found.", HttpContext.TraceIdentifier));

        job.ModerationStatus = req.Status;
        job.UpdatedAt = DateTime.UtcNow;
        await jobRepository.UpdateJobAsync(job);

        if (req.Status == "Flagged")
            _ = es.RemoveJobAsync(jobId);
        else if (req.Status == "Approved")
            _ = es.UpdateJobAsync(job, job.Company?.Name ?? "Unknown");

        return Ok(ResponseEnvelope<object>.Ok(new { jobId, status = req.Status }, traceId: HttpContext.TraceIdentifier));
    }
}
