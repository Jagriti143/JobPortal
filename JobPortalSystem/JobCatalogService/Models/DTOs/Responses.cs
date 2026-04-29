using JobCatalogService.Data.Entities;

namespace JobCatalogService.Models.DTOs;

public class CompanyResponseDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Website { get; set; }
    public string? LogoUrl { get; set; }
    public string? Industry { get; set; }
    public string? Location { get; set; }
    public DateTime CreatedAt { get; set; }

    public static CompanyResponseDto FromEntity(Company company)
    {
        return new CompanyResponseDto
        {
            Id = company.Id,
            Name = company.Name,
            Description = company.Description,
            Website = company.Website,
            LogoUrl = company.LogoUrl,
            Industry = company.Industry,
            Location = company.Location,
            CreatedAt = company.CreatedAt
        };
    }
}

public class CompanyReviewResponseDto
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public Guid ReviewerId { get; set; }
    public int Rating { get; set; }
    public string? Comment { get; set; }
    public DateTime CreatedAt { get; set; }

    public static CompanyReviewResponseDto FromEntity(CompanyReview review)
    {
        return new CompanyReviewResponseDto
        {
            Id = review.Id,
            CompanyId = review.CompanyId,
            ReviewerId = review.ReviewerId,
            Rating = review.Rating,
            Comment = review.Comment,
            CreatedAt = review.CreatedAt
        };
    }
}

public class JobResponseDto
{
    public Guid Id { get; set; }
    public Guid CompanyId { get; set; }
    public Guid PostedByRecruiterId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string JobType { get; set; } = string.Empty;
    public decimal? SalaryMin { get; set; }
    public decimal? SalaryMax { get; set; }
    public string ModerationStatus { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public CompanyResponseDto? Company { get; set; }

    public static JobResponseDto FromEntity(Job job)
    {
        return new JobResponseDto
        {
            Id = job.Id,
            CompanyId = job.CompanyId,
            PostedByRecruiterId = job.PostedByRecruiterId,
            Title = job.Title,
            Description = job.Description,
            Location = job.Location,
            JobType = job.JobType,
            SalaryMin = job.SalaryMin,
            SalaryMax = job.SalaryMax,
            ModerationStatus = job.ModerationStatus,
            CreatedAt = job.CreatedAt,
            UpdatedAt = job.UpdatedAt,
            Company = job.Company != null ? CompanyResponseDto.FromEntity(job.Company) : null
        };
    }
}
