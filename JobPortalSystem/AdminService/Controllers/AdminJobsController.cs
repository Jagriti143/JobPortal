using AdminService.Common;
using AdminService.Data.Entities;
using AdminService.Repositories.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Net.Http.Json;
using System.Security.Claims;

namespace AdminService.Controllers;

[ApiController]
[Route("admin/jobs")]
[Authorize(Roles = "Admin")]
public class AdminJobsController(
    IJobRepository jobRepository,
    IAuditLogRepository auditLogRepository,
    IHttpClientFactory httpClientFactory,
    IConfiguration config,
    ILogger<AdminJobsController> logger) : ControllerBase
{
    private Guid GetAdminId() => Guid.Parse(
        User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? Guid.Empty.ToString());

    /// >Get jobs pending moderation.
    [HttpGet("moderation-queue")]
    public async Task<IActionResult> GetModerationQueue()
    {
        var jobs = await jobRepository.GetModerationQueueAsync();
        return Ok(ResponseEnvelope<object>.Ok(jobs, traceId: HttpContext.TraceIdentifier));
    }

    /// Approve a job listing.
    [HttpPost("{jobId:guid}/approve")]
    public async Task<IActionResult> ApproveJob(Guid jobId)
    {
        var traceId = HttpContext.TraceIdentifier;
        var job = await jobRepository.GetJobByIdAsync(jobId);
        if (job == null) return NotFound(ResponseEnvelope<object>.Fail("Job not found.", traceId));

        job.ModerationStatus = "Approved";
        job.UpdatedAt = DateTime.UtcNow;
        await jobRepository.UpdateJobAsync(job);

        await auditLogRepository.AddAuditLogAsync(new AuditLog
        {
            AdminId = GetAdminId(), Action = "ApproveJob", TargetType = "Job", TargetId = jobId
        });

        // Notify JobCatalogService to index this job in Elasticsearch
        _ = NotifyJobCatalogServiceAsync(jobId, "Approved");

        return Ok(ResponseEnvelope<object>.Ok(new { jobId, status = "Approved" }, traceId: traceId));
    }

    /// Flag a job listing
    [HttpPost("{jobId:guid}/flag")]
    public async Task<IActionResult> FlagJob(Guid jobId)
    {
        var traceId = HttpContext.TraceIdentifier;
        var job = await jobRepository.GetJobByIdAsync(jobId);
        if (job == null) return NotFound(ResponseEnvelope<object>.Fail("Job not found.", traceId));

        job.ModerationStatus = "Flagged";
        job.UpdatedAt = DateTime.UtcNow;
        await jobRepository.UpdateJobAsync(job);

        await auditLogRepository.AddAuditLogAsync(new AuditLog
        {
            AdminId = GetAdminId(), Action = "FlagJob", TargetType = "Job", TargetId = jobId
        });

        // Notify JobCatalogService to remove this job from Elasticsearch
        _ = NotifyJobCatalogServiceAsync(jobId, "Flagged");

        return Ok(ResponseEnvelope<object>.Ok(new { jobId, status = "Flagged" }, traceId: traceId));
    }

    
    /// Calls JobCatalogService PATCH /jobs/{id}/status to sync the Elasticsearch index.
    /// This is fire-and-forget — the admin response is not blocked by this call.
    
    private async Task NotifyJobCatalogServiceAsync(Guid jobId, string status)
    {
        try
        {
            var serviceKey = config["InternalServices:ServiceKey"] ?? string.Empty;
            var client = httpClientFactory.CreateClient("JobCatalogService");

            // Attach the shared internal service key — JobCatalogService validates this
            // on the PATCH /jobs/{id}/status endpoint instead of requiring a JWT.
            using var request = new HttpRequestMessage(
                HttpMethod.Patch, $"/jobs/{jobId}/status");
            request.Headers.TryAddWithoutValidation("X-Service-Key", serviceKey);
            request.Content = JsonContent.Create(new { Status = status });

            var response = await client.SendAsync(request);

            if (!response.IsSuccessStatusCode)
                logger.LogWarning(
                    "JobCatalogService ES sync returned {Status} for job {JobId} — body: {Body}",
                    response.StatusCode, jobId, await response.Content.ReadAsStringAsync());
            else
                logger.LogInformation(
                    "JobCatalogService ES sync succeeded for job {JobId} → {Status}",
                    jobId, status);
        }
        catch (Exception ex)
        {
            logger.LogError(ex,
                "Failed to notify JobCatalogService for ES sync of job {JobId}", ex.Message);
        }
    }
}
