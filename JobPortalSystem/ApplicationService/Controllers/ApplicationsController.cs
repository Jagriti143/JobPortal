using ApplicationService.Common;
using ApplicationService.Data.Entities;
using ApplicationService.Models;
using ApplicationService.Repositories.Interfaces;
using ApplicationService.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace ApplicationService.Controllers;

[ApiController]
[Route("applications")]
public class ApplicationsController(
    IApplicationRepository applicationRepository,
    IApplicationStateMachine stateMachine,
    IRabbitMqPublisher publisher,
    IEmailService emailService,
    ILogger<ApplicationsController> logger) : ControllerBase
{
    private Guid GetUserId() => Guid.Parse(
        User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub") ?? Guid.Empty.ToString());

    private string GetUserEmail() => 
        User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Email) ?? string.Empty;

    /// <summary>Apply to a job (JobSeeker only).</summary>
    [HttpPost]
    [Authorize(Roles = "JobSeeker")]
    public async Task<IActionResult> Apply([FromBody] CreateApplicationRequest req)
    {
        var jobSeekerId = GetUserId();
        var traceId = HttpContext.TraceIdentifier;

        var exists = await applicationRepository.HasAppliedAsync(jobSeekerId, req.JobId);
        if (exists) return Conflict(ResponseEnvelope<object>.Fail("You have already applied to this job.", traceId));

        // Validate required fields
        if (string.IsNullOrWhiteSpace(req.PhoneNumber))
            return BadRequest(ResponseEnvelope<object>.Fail("Phone number is required.", traceId));
        if (req.ResumeId == null || req.ResumeId == Guid.Empty)
            return BadRequest(ResponseEnvelope<object>.Fail("Please select a resume to attach.", traceId));

        var application = new Application
        {
            JobSeekerId = jobSeekerId,
            JobId = req.JobId,
            CoverLetter = req.CoverLetter,
            JobSeekerEmail = req.Email,
            PhoneNumber = req.PhoneNumber,
            ResumeId = req.ResumeId,
            Status = ApplicationStatus.Submitted
        };

        await applicationRepository.AddApplicationAsync(application);

        _ = publisher.PublishStatusChangedAsync(new ApplicationStatusChangedEvent
        {
            ApplicationId = application.Id,
            JobSeekerId = jobSeekerId,
            JobId = req.JobId,
            OldStatus = "",
            NewStatus = ApplicationStatus.Submitted.ToString()
        });

        if (!string.IsNullOrEmpty(req.Email))
            _ = emailService.SendApplicationSubmittedAsync(req.Email, req.JobId, application.Id);

        return StatusCode(201, ResponseEnvelope<object>.Ok(new { applicationId = application.Id }, traceId: traceId));
    }

    /// <summary>Get my applications (JobSeeker).</summary>
    [HttpGet("my")]
    [Authorize(Roles = "JobSeeker")]
    public async Task<IActionResult> GetMyApplications()
    {
        var jobSeekerId = GetUserId();
        var apps = await applicationRepository.GetApplicationsBySeekerAsync(jobSeekerId);
        var dtos = apps.Select(ApplicationResponseDto.FromEntity).ToList();
        return Ok(ResponseEnvelope<object>.Ok(dtos, traceId: HttpContext.TraceIdentifier));
    }

    /// <summary>Get application by ID.</summary>
    [HttpGet("{applicationId:guid}")]
    [Authorize]
    public async Task<IActionResult> GetApplication(Guid applicationId)
    {
        var app = await applicationRepository.GetApplicationByIdAsync(applicationId);
        if (app == null) return NotFound(ResponseEnvelope<object>.Fail("Application not found.", HttpContext.TraceIdentifier));
        return Ok(ResponseEnvelope<object>.Ok(ApplicationResponseDto.FromEntity(app), traceId: HttpContext.TraceIdentifier));
    }

    /// <summary>Get all applications for a job (Recruiter).</summary>
    [HttpGet("job/{jobId:guid}")]
    [Authorize(Roles = "Recruiter")]
    public async Task<IActionResult> GetJobApplications(Guid jobId,
        [FromQuery] string? status, [FromQuery] bool? shortlisted)
    {
        ApplicationStatus? filterStatus = null;
        if (!string.IsNullOrEmpty(status) && Enum.TryParse<ApplicationStatus>(status, out var s))
            filterStatus = s;

        var apps = await applicationRepository.GetApplicationsByJobAsync(jobId, filterStatus, shortlisted);
        var dtos = apps.Select(ApplicationResponseDto.FromEntity).ToList();
        return Ok(ResponseEnvelope<object>.Ok(dtos, traceId: HttpContext.TraceIdentifier));
    }

    /// <summary>Update application status (Recruiter).</summary>
    [HttpPatch("{applicationId:guid}/status")]
    [Authorize(Roles = "Recruiter")]
    public async Task<IActionResult> UpdateStatus(Guid applicationId, [FromBody] UpdateStatusRequest req)
    {
        var traceId = HttpContext.TraceIdentifier;
        var app = await applicationRepository.GetApplicationByIdAsync(applicationId);
        if (app == null) return NotFound(ResponseEnvelope<object>.Fail("Application not found.", traceId));

        if (!Enum.TryParse<ApplicationStatus>(req.NewStatus, out var newStatus))
            return BadRequest(ResponseEnvelope<object>.Fail("Invalid status value.", traceId));

        if (!stateMachine.ValidateTransition(app.Status, newStatus))
            return UnprocessableEntity(ResponseEnvelope<object>.Fail(
                $"Cannot transition from {app.Status} to {newStatus}.", traceId));

        var oldStatus = app.Status.ToString();
        app.Status = newStatus;
        app.UpdatedAt = DateTime.UtcNow;
        await applicationRepository.UpdateApplicationAsync(app);

        _ = publisher.PublishStatusChangedAsync(new ApplicationStatusChangedEvent
        {
            ApplicationId = app.Id,
            JobSeekerId = app.JobSeekerId,
            JobId = app.JobId,
            OldStatus = oldStatus,
            NewStatus = newStatus.ToString()
        });

        if (!string.IsNullOrEmpty(app.JobSeekerEmail))
            _ = emailService.SendApplicationStatusChangedAsync(app.JobSeekerEmail, app.JobId, app.Id, newStatus.ToString());

        return Ok(ResponseEnvelope<object>.Ok(new { applicationId, status = newStatus.ToString() }, traceId: traceId));
    }

    /// <summary>Shortlist a candidate (Recruiter).</summary>
    [HttpPatch("{applicationId:guid}/shortlist")]
    [Authorize(Roles = "Recruiter")]
    public async Task<IActionResult> Shortlist(Guid applicationId)
    {
        var traceId = HttpContext.TraceIdentifier;
        var app = await applicationRepository.GetApplicationByIdAsync(applicationId);
        if (app == null) return NotFound(ResponseEnvelope<object>.Fail("Application not found.", traceId));

        if (!stateMachine.ValidateTransition(app.Status, ApplicationStatus.Shortlisted))
            return UnprocessableEntity(ResponseEnvelope<object>.Fail(
                $"Cannot shortlist from status {app.Status}.", traceId));

        var oldStatus = app.Status.ToString();
        app.Status = ApplicationStatus.Shortlisted;
        app.UpdatedAt = DateTime.UtcNow;
        await applicationRepository.UpdateApplicationAsync(app);

        _ = publisher.PublishStatusChangedAsync(new ApplicationStatusChangedEvent
        {
            ApplicationId = app.Id, JobSeekerId = app.JobSeekerId, JobId = app.JobId,
            OldStatus = oldStatus, NewStatus = ApplicationStatus.Shortlisted.ToString()
        });

        if (!string.IsNullOrEmpty(app.JobSeekerEmail))
            _ = emailService.SendApplicationStatusChangedAsync(app.JobSeekerEmail, app.JobId, app.Id, "Shortlisted");

        return Ok(ResponseEnvelope<object>.Ok(new { applicationId, status = "Shortlisted" }, traceId: traceId));
    }

    /// <summary>Withdraw application (JobSeeker, only when Submitted).</summary>
    [HttpDelete("{applicationId:guid}")]
    [Authorize(Roles = "JobSeeker")]
    public async Task<IActionResult> Withdraw(Guid applicationId)
    {
        var traceId = HttpContext.TraceIdentifier;
        var jobSeekerId = GetUserId();
        var app = await applicationRepository.GetApplicationByIdAsync(applicationId);

        if (app == null) return NotFound(ResponseEnvelope<object>.Fail("Application not found.", traceId));
        if (app.JobSeekerId != jobSeekerId) return Forbid();
        if (app.Status != ApplicationStatus.Submitted)
            return UnprocessableEntity(ResponseEnvelope<object>.Fail(
                "Can only withdraw a Submitted application.", traceId));

        app.Status = ApplicationStatus.Withdrawn;
        app.UpdatedAt = DateTime.UtcNow;
        await applicationRepository.UpdateApplicationAsync(app);

        var email = app.JobSeekerEmail;
        if (!string.IsNullOrEmpty(email))
            _ = emailService.SendApplicationWithdrawnAsync(email, app.JobId, app.Id);

        return Ok(ResponseEnvelope<object>.Ok(new { applicationId, status = "Withdrawn" }, traceId: traceId));
    }
}
