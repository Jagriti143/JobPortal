using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ResumeService.Common;
using ResumeService.Data.Entities;
using ResumeService.Models.DTOs;
using ResumeService.Repositories.Interfaces;
using ResumeService.Services;
using System.Security.Claims;
using ResumeService.Data;
using MassTransit;
using Microsoft.EntityFrameworkCore;

namespace ResumeService.Controllers;

[ApiController]
[Route("resumes")]
public class ResumesController(
    IResumeRepository resumeRepository,
    IPdfGeneratorService pdfService,
    ResumeDbContext db,
    IPublishEndpoint publishEndpoint) : ControllerBase
{
    private Guid GetUserId() =>
        Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub")
            ?? Guid.Empty.ToString());

    /// <summary>
    /// Safely parse a date string from the Angular month-picker (“YYYY-MM” or “YYYY-MM-DD”)
    /// into a nullable DateTime. Returns null for null/empty input so optional dates don’t
    /// cause 400 Bad Request when the user leaves the field blank.
    /// </summary>
    private static DateTime? ParseDate(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        // “2020-01” → first day of that month
        if (value.Length == 7 && DateTime.TryParseExact(
                value + "-01",
                "yyyy-MM-dd",
                System.Globalization.CultureInfo.InvariantCulture,
                System.Globalization.DateTimeStyles.None,
                out var d))
            return d;
        // “2020-01-15” or ISO format
        if (DateTime.TryParse(value,
                System.Globalization.CultureInfo.InvariantCulture,
                System.Globalization.DateTimeStyles.AssumeUniversal,
                out var dt))
            return dt.ToUniversalTime();
        return null;
    }

    // ---------------- GET TEMPLATES ----------------

    [HttpGet("templates")]
    public IActionResult GetTemplates() =>
        Ok(ResponseEnvelope<object>.Ok(
            new[]
            {
                new { templateId = "Classic",  name = "Classic" },
                new { templateId = "Modern",   name = "Modern" },
                new { templateId = "Minimal",  name = "Minimal" },
                new { templateId = "Creative", name = "Creative" }
            },
            traceId: HttpContext.TraceIdentifier));

    // ---------------- GET MY RESUMES ----------------

    [HttpGet("my")]
    [Authorize(Roles = "JobSeeker")]
    public async Task<IActionResult> GetMyResumes()
    {
        var ownerId = GetUserId();
        var resumes = await resumeRepository.GetResumesByOwnerAsync(ownerId);
        var dtos = resumes.Select(ResumeResponseDto.FromEntity);
        return Ok(ResponseEnvelope<object>.Ok(dtos, traceId: HttpContext.TraceIdentifier));
    }

    // ---------------- GET SINGLE RESUME (owner) ----------------

    [HttpGet("{resumeId:guid}")]
    [Authorize(Roles = "JobSeeker")]
    public async Task<IActionResult> GetMyResume(Guid resumeId)
    {
        var ownerId = GetUserId();
        var resume = await resumeRepository.GetResumeWithDetailsAsync(resumeId);
        if (resume == null)
            return NotFound(ResponseEnvelope<object>.Fail("Resume not found.", HttpContext.TraceIdentifier));
        if (resume.OwnerId != ownerId)
            return Forbid();
        return Ok(ResponseEnvelope<object>.Ok(ResumeResponseDto.FromEntity(resume), traceId: HttpContext.TraceIdentifier));
    }

    // ---------------- CREATE RESUME ----------------

    [HttpPost]
    [Authorize(Roles = "JobSeeker")]
    public async Task<IActionResult> CreateResume([FromBody] CreateResumeRequest req)
    {
        var ownerId = GetUserId();

        var resume = new Resume
        {
            OwnerId = ownerId,
            Title = req.Title,
            Summary = req.Summary,
            TemplateId = req.TemplateId ?? "Classic",
            Certifications = req.Certifications
        };

        if (req.Educations != null)
            foreach (var e in req.Educations)
                resume.Educations.Add(new ResumeEducation
                {
                    Institution = e.Institution,
                    Degree = e.Degree,
                    FieldOfStudy = e.FieldOfStudy,
                    StartDate = ParseDate(e.StartDate) ?? DateTime.UtcNow,
                    EndDate = ParseDate(e.EndDate)
                });

        if (req.Experiences != null)
            foreach (var e in req.Experiences)
                resume.Experiences.Add(new ResumeExperience
                {
                    Company = e.Company,
                    JobTitle = e.JobTitle,
                    Description = e.Description,
                    StartDate = ParseDate(e.StartDate) ?? DateTime.UtcNow,
                    EndDate = ParseDate(e.EndDate),
                    IsCurrentRole = e.IsCurrentRole
                });

        if (req.Skills != null)
            foreach (var s in req.Skills)
                resume.Skills.Add(new ResumeSkill
                {
                    Name = s.Name,
                    Level = s.Level
                });

        if (req.Projects != null)
            foreach (var p in req.Projects)
                resume.Projects.Add(new ResumeProject
                {
                    Name = p.Name,
                    Description = p.Description,
                    Url = p.Url
                });

        await resumeRepository.AddResumeAsync(resume);

        return StatusCode(201,
            ResponseEnvelope<object>.Ok(
                new { resumeId = resume.Id },
                traceId: HttpContext.TraceIdentifier));
    }

    // ---------------- UPDATE RESUME ----------------

    [HttpPut("{resumeId:guid}")]
    [Authorize(Roles = "JobSeeker")]
    public async Task<IActionResult> UpdateResume(Guid resumeId, [FromBody] CreateResumeRequest req)
    {
        var ownerId = GetUserId();

        // Use AsNoTracking so EF never tracks the resume or its children
        var existing = await db.Resumes.AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == resumeId);

        if (existing == null)
            return NotFound(ResponseEnvelope<object>.Fail("Resume not found.", HttpContext.TraceIdentifier));

        if (existing.OwnerId != ownerId)
            return Forbid();

        // Bulk-delete children via direct SQL — bypasses change tracker entirely
        await db.Educations.Where(e => e.ResumeId == resumeId).ExecuteDeleteAsync();
        await db.Experiences.Where(e => e.ResumeId == resumeId).ExecuteDeleteAsync();
        await db.Skills.Where(e => e.ResumeId == resumeId).ExecuteDeleteAsync();
        await db.Projects.Where(e => e.ResumeId == resumeId).ExecuteDeleteAsync();

        // Bulk-update resume fields via direct SQL — no tracked entity, no concurrency check
        await db.Resumes.Where(r => r.Id == resumeId).ExecuteUpdateAsync(s => s
            .SetProperty(r => r.Title, req.Title)
            .SetProperty(r => r.Summary, req.Summary)
            .SetProperty(r => r.TemplateId, req.TemplateId ?? existing.TemplateId)
            .SetProperty(r => r.Certifications, req.Certifications)
            .SetProperty(r => r.UpdatedAt, DateTime.UtcNow));

        // Insert new children — these are brand new entities, no tracking conflict
        if (req.Educations != null)
            db.Educations.AddRange(req.Educations.Select(e => new ResumeEducation
            {
                ResumeId = resumeId,
                Institution = e.Institution,
                Degree = e.Degree,
                FieldOfStudy = e.FieldOfStudy,
                StartDate = ParseDate(e.StartDate) ?? DateTime.UtcNow,
                EndDate = ParseDate(e.EndDate)
            }));

        if (req.Experiences != null)
            db.Experiences.AddRange(req.Experiences.Select(e => new ResumeExperience
            {
                ResumeId = resumeId,
                Company = e.Company,
                JobTitle = e.JobTitle,
                Description = e.Description,
                StartDate = ParseDate(e.StartDate) ?? DateTime.UtcNow,
                EndDate = ParseDate(e.EndDate),
                IsCurrentRole = e.IsCurrentRole
            }));

        if (req.Skills != null)
            db.Skills.AddRange(req.Skills.Select(s => new ResumeSkill
            {
                ResumeId = resumeId,
                Name = s.Name,
                Level = s.Level
            }));

        if (req.Projects != null)
            db.Projects.AddRange(req.Projects.Select(p => new ResumeProject
            {
                ResumeId = resumeId,
                Name = p.Name,
                Description = p.Description,
                Url = p.Url
            }));

        await db.SaveChangesAsync();

        return Ok(ResponseEnvelope<object>.Ok(
            new { resumeId },
            traceId: HttpContext.TraceIdentifier));
    }

    // ---------------- GET PDF ----------------

    [HttpGet("{resumeId:guid}/pdf")]
    [Authorize(Roles = "JobSeeker,Recruiter")]
    public async Task<IActionResult> GetPdf(Guid resumeId)
    {
        var userId = GetUserId();

        var resume = await resumeRepository.GetResumeWithDetailsAsync(resumeId);
        if (resume == null)
            return NotFound(ResponseEnvelope<object>.Fail("Resume not found.", HttpContext.TraceIdentifier));

        // JobSeekers can only download their own resume
        if (User.IsInRole("JobSeeker") && resume.OwnerId != userId)
            return Forbid();

        // Recruiters can download any resume (points already deducted by frontend)
        try
        {
            var pdf = pdfService.GeneratePdf(resume);
            return File(pdf, "application/pdf", $"resume-{resumeId}.pdf");
        }
        catch (Exception ex)
        {
            var logger = HttpContext.RequestServices.GetRequiredService<ILogger<ResumesController>>();
            logger.LogError(ex, "PDF generation failed for resume {ResumeId}", resumeId);
            return StatusCode(500,
                ResponseEnvelope<object>.Fail(
                    "PDF generation failed. Please try again later.",
                    HttpContext.TraceIdentifier));
        }
    }

    // ---------------- UNLOCK RESUME ----------------

    [HttpPost("{resumeId:guid}/unlock")]
    [Authorize(Roles = "Recruiter")]
    public async Task<IActionResult> UnlockResume(Guid resumeId)
    {
        var recruiterId = GetUserId();
        var traceId = HttpContext.TraceIdentifier;

        var resume = await resumeRepository.GetResumeWithDetailsAsync(resumeId);

        if (resume == null)
            return NotFound(ResponseEnvelope<object>.Fail("Resume not found.", traceId));

        var req = new ResumeUnlockRequest
        {
            RecruiterId = recruiterId,
            ResumeId = resumeId,
            Status = "Pending"
        };

        db.ResumeUnlockRequests.Add(req);
        await db.SaveChangesAsync();

        await publishEndpoint.Publish(
            new JobPortalSystem.Messages.UnlockResumeRequested(req.Id, recruiterId, resumeId));

        return Accepted(ResponseEnvelope<object>.Ok(
            new { unlockRequestId = req.Id, status = "Processing" },
            traceId: traceId));
    }

    // ---------------- UNLOCK STATUS ----------------

    [HttpGet("unlock-status/{unlockRequestId:guid}")]
    [Authorize(Roles = "Recruiter")]
    public async Task<IActionResult> GetUnlockStatus(Guid unlockRequestId)
    {
        var recruiterId = GetUserId();
        var traceId = HttpContext.TraceIdentifier;

        var req = await db.ResumeUnlockRequests.FindAsync(unlockRequestId);

        if (req == null)
            return NotFound(ResponseEnvelope<object>.Fail("Unlock request not found.", traceId));

        if (req.RecruiterId != recruiterId)
            return Forbid();

        return Ok(ResponseEnvelope<object>.Ok(
            new { unlockRequestId, status = req.Status },
            traceId: traceId));
    }

    // ---------------- VIEW RESUME ----------------

    [HttpGet("{resumeId:guid}/view")]
    [Authorize(Roles = "Recruiter")]
    public async Task<IActionResult> ViewResume(Guid resumeId)
    {
        var recruiterId = GetUserId();
        var traceId = HttpContext.TraceIdentifier;

        var isUnlocked = await db.UnlockedResumes
            .AnyAsync(u => u.RecruiterId == recruiterId && u.ResumeId == resumeId);

        if (!isUnlocked)
            return StatusCode(402,
                ResponseEnvelope<object>.Fail(
                    "Payment Required. Please unlock this resume first.",
                    traceId));

        var resume = await resumeRepository.GetResumeWithDetailsAsync(resumeId);

        if (resume == null)
            return NotFound(ResponseEnvelope<object>.Fail("Resume not found.", traceId));

        var dto = ResumeResponseDto.FromEntity(resume);

        return Ok(ResponseEnvelope<object>.Ok(dto, traceId: traceId));
    }

    // ---------------- DELETE RESUME ----------------

    /// <summary>Permanently delete a resume. Only the owning JobSeeker may do this.</summary>
    [HttpDelete("{resumeId:guid}")]
    [Authorize(Roles = "JobSeeker")]
    public async Task<IActionResult> DeleteResume(Guid resumeId)
    {
        var ownerId = GetUserId();
        var deleted = await resumeRepository.DeleteResumeAsync(resumeId, ownerId);

        if (!deleted)
            return NotFound(ResponseEnvelope<object>.Fail(
                "Resume not found or you do not have permission to delete it.",
                HttpContext.TraceIdentifier));

        return NoContent(); // 204
    }
}
