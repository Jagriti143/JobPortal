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
public class CompaniesController(ICompanyRepository companyRepository) : ControllerBase
{
    /// <summary>Get company profile.</summary>
    [HttpGet("{companyId:guid}")]
    public async Task<IActionResult> GetCompany(Guid companyId)
    {
        var company = await companyRepository.GetCompanyByIdAsync(companyId);
        if (company == null) return NotFound(ResponseEnvelope<object>.Fail("Company not found.", HttpContext.TraceIdentifier));
        return Ok(ResponseEnvelope<object>.Ok(CompanyResponseDto.FromEntity(company), traceId: HttpContext.TraceIdentifier));
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
        if (company == null) return NotFound(ResponseEnvelope<object>.Fail("Company not found.", HttpContext.TraceIdentifier));

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

    /// <summary>Create a new company.</summary>
    [HttpPost]
    [Authorize(Roles = "Recruiter,Admin")]
    public async Task<IActionResult> CreateCompany([FromBody] CreateCompanyRequest req)
    {
        var company = new Company
        {
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
}
