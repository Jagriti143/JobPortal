using AdminService.Common;
using AdminService.Data.Entities;
using AdminService.Repositories.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace AdminService.Controllers;

[ApiController]
[Route("admin/jobs")]
[Authorize(Roles = "Admin")]
public class AdminJobsController(
    IJobRepository jobRepository,
    IAuditLogRepository auditLogRepository,
    ILogger<AdminJobsController> logger) : ControllerBase
{
    private Guid GetAdminId() => Guid.Parse(
        User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? Guid.Empty.ToString());

    /// <summary>Get jobs pending moderation.</summary>
    [HttpGet("moderation-queue")]
    public async Task<IActionResult> GetModerationQueue()
    {
        var jobs = await jobRepository.GetModerationQueueAsync();
        return Ok(ResponseEnvelope<object>.Ok(jobs, traceId: HttpContext.TraceIdentifier));
    }

    /// <summary>Approve a job listing.</summary>
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

        return Ok(ResponseEnvelope<object>.Ok(new { jobId, status = "Approved" }, traceId: traceId));
    }

    /// <summary>Flag a job listing.</summary>
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

        return Ok(ResponseEnvelope<object>.Ok(new { jobId, status = "Flagged" }, traceId: traceId));
    }
}
