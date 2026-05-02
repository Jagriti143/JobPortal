using JobCatalogService.Common;
using JobCatalogService.Data.Entities;
using JobCatalogService.Models.DTOs;
using JobCatalogService.Repositories.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace JobCatalogService.Controllers;

[ApiController]
[Route("companies")]
public class CompaniesController(
    ICompanyRepository companyRepository,
    IConfiguration config) : ControllerBase
{
    /// <summary>Get company profile by ID.</summary>
    [HttpGet("{companyId:guid}")]
    public async Task<IActionResult> GetCompany(Guid companyId)
    {
        var company = await companyRepository.GetCompanyByIdAsync(companyId);
        if (company == null)
            return NotFound(ResponseEnvelope<object>.Fail("Company not found.", HttpContext.TraceIdentifier));
        return Ok(ResponseEnvelope<object>.Ok(CompanyResponseDto.FromEntity(company), traceId: HttpContext.TraceIdentifier));
    }

    /// <summary>Get the company associated with the currently logged-in recruiter.</summary>
    [HttpGet("my")]
    [Authorize(Roles = "Recruiter")]
    public async Task<IActionResult> GetMyCompany()
    {
        var recruiterId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub") ?? Guid.Empty.ToString());

        var company = await companyRepository.GetCompanyByRecruiterIdAsync(recruiterId);
        if (company == null)
            return NotFound(ResponseEnvelope<object>.Fail(
                "No company registered for your account. Please complete your registration.",
                HttpContext.TraceIdentifier));

        return Ok(ResponseEnvelope<object>.Ok(CompanyResponseDto.FromEntity(company), traceId: HttpContext.TraceIdentifier));
    }

    /// <summary>
    /// Update the company owned by the currently logged-in recruiter.
    /// Only non-null fields in the request body are applied; others are left unchanged.
    /// </summary>
    [HttpPut("my")]
    [Authorize(Roles = "Recruiter")]
    public async Task<IActionResult> UpdateMyCompany([FromBody] UpdateCompanyRequest req)
    {
        var recruiterId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub") ?? Guid.Empty.ToString());

        var company = await companyRepository.GetCompanyByRecruiterIdAsync(recruiterId);
        if (company == null)
            return NotFound(ResponseEnvelope<object>.Fail(
                "No company registered for your account.",
                HttpContext.TraceIdentifier));

        // Patch only supplied fields — preserve everything else
        if (req.Name         != null) company.Name        = req.Name;
        if (req.Description  != null) company.Description = req.Description;
        if (req.Website      != null) company.Website     = req.Website;
        if (req.LogoUrl      != null) company.LogoUrl     = req.LogoUrl;
        if (req.Industry     != null) company.Industry    = req.Industry;
        if (req.Location     != null) company.Location    = req.Location;

        await companyRepository.UpdateCompanyAsync(company);

        return Ok(ResponseEnvelope<object>.Ok(
            CompanyResponseDto.FromEntity(company), traceId: HttpContext.TraceIdentifier));
    }

    /// <summary>Get company reviews.</summary>
    [HttpGet("{companyId:guid}/reviews")]
    public async Task<IActionResult> GetReviews(Guid companyId)
    {
        var reviews = await companyRepository.GetApprovedReviewsAsync(companyId);
        var dtos = reviews.Select(CompanyReviewResponseDto.FromEntity).ToList();
        return Ok(ResponseEnvelope<object>.Ok(dtos, traceId: HttpContext.TraceIdentifier));
    }

    /// <summary>Submit a company review (JobSeeker only).</summary>
    [HttpPost("{companyId:guid}/reviews")]
    [Authorize(Roles = "JobSeeker")]
    public async Task<IActionResult> AddReview(Guid companyId, [FromBody] CreateReviewRequest req)
    {
        var company = await companyRepository.GetCompanyByIdAsync(companyId);
        if (company == null)
            return NotFound(ResponseEnvelope<object>.Fail("Company not found.", HttpContext.TraceIdentifier));

        var reviewerId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub") ?? Guid.Empty.ToString());

        var review = new CompanyReview
        {
            CompanyId = companyId,
            ReviewerId = reviewerId,
            Rating = req.Rating,
            Comment = req.Comment
        };

        await companyRepository.AddReviewAsync(review);
        return StatusCode(201, ResponseEnvelope<object>.Ok(new { reviewId = review.Id }, traceId: HttpContext.TraceIdentifier));
    }

    /// <summary>
    /// Create a company profile (Recruiter only, called once during registration flow).
    /// A recruiter may only own one company — subsequent calls return 409 Conflict.
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Recruiter")]
    public async Task<IActionResult> CreateCompany([FromBody] CreateCompanyRequest req)
    {
        var recruiterId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub") ?? Guid.Empty.ToString());

        var existing = await companyRepository.GetCompanyByRecruiterIdAsync(recruiterId);
        if (existing != null)
            return Conflict(ResponseEnvelope<object>.Fail(
                "A company is already registered for your account. Company details can only be set during registration.",
                HttpContext.TraceIdentifier));

        var company = new Company
        {
            RecruiterId = recruiterId,
            Name = req.Name,
            Description = req.Description,
            Website = req.Website,
            LogoUrl = req.LogoUrl,
            Industry = req.Industry,
            Location = req.Location
        };

        await companyRepository.AddCompanyAsync(company);
        return StatusCode(201, ResponseEnvelope<object>.Ok(new { companyId = company.Id }, traceId: HttpContext.TraceIdentifier));
    }

    // ── POST /companies/internal ──────────────────────────────────────────────
    /// <summary>
    /// Internal endpoint called ONLY by IdentityService during recruiter registration.
    /// Protected by X-Service-Key header — NOT JWT Bearer.
    /// Creates a Company record with the supplied RecruiterId and returns the companyId.
    /// </summary>
    [HttpPost("internal")]
    public async Task<IActionResult> CreateCompanyInternal([FromBody] CreateCompanyInternalRequest req)
    {
        var traceId = HttpContext.TraceIdentifier;

        // ── Validate shared service key ───────────────────────────────────────
        var expectedKey = config["InternalServices:ServiceKey"] ?? string.Empty;
        if (string.IsNullOrEmpty(expectedKey))
            return StatusCode(503, ResponseEnvelope<object>.Fail(
                "Internal service key not configured.", traceId));

        if (!Request.Headers.TryGetValue("X-Service-Key", out var providedKey)
            || providedKey.ToString() != expectedKey)
            return StatusCode(401, ResponseEnvelope<object>.Fail(
                "Unauthorized internal request.", traceId));

        // ── Basic validation ──────────────────────────────────────────────────
        if (req.RecruiterId == Guid.Empty)
            return BadRequest(ResponseEnvelope<object>.Fail("RecruiterId is required.", traceId));

        if (string.IsNullOrWhiteSpace(req.Name))
            return BadRequest(ResponseEnvelope<object>.Fail("Company name is required.", traceId));

        // ── Guard: one company per recruiter ──────────────────────────────────
        var existing = await companyRepository.GetCompanyByRecruiterIdAsync(req.RecruiterId);
        if (existing != null)
            return Conflict(ResponseEnvelope<object>.Fail(
                "A company is already registered for this recruiter.", traceId));

        // ── Create and persist ────────────────────────────────────────────────
        var company = new Company
        {
            RecruiterId = req.RecruiterId,
            Name = req.Name,
            Description = req.Description,
            Website = req.Website,
            LogoUrl = req.LogoUrl,
            Industry = req.Industry,
            Location = req.Location
        };

        await companyRepository.AddCompanyAsync(company);

        return StatusCode(201, ResponseEnvelope<object>.Ok(
            new { companyId = company.Id }, traceId: traceId));
    }
}
