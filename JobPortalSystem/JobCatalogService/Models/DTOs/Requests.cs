namespace JobCatalogService.Models.DTOs;

public class CreateCompanyRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Website { get; set; }
    public string? LogoUrl { get; set; }
    public string? Industry { get; set; }
    public string? Location { get; set; }
}

/// <summary>
/// DTO for the internal POST /companies/internal endpoint.
/// Called only by IdentityService during recruiter registration.
/// RecruiterId is passed directly (not extracted from JWT).
/// </summary>
public class CreateCompanyInternalRequest
{
    public Guid RecruiterId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Website { get; set; }
    public string? LogoUrl { get; set; }
    public string? Industry { get; set; }
    public string? Location { get; set; }
}

/// <summary>
/// DTO for PUT /companies/my — recruiter updates their own company details.
/// All fields are optional; only non-null values will overwrite existing data.
/// </summary>
public class UpdateCompanyRequest
{
    public string? Name { get; set; }
    public string? Description { get; set; }
    public string? Website { get; set; }
    public string? LogoUrl { get; set; }
    public string? Industry { get; set; }
    public string? Location { get; set; }
}


public class CreateReviewRequest
{
    public int Rating { get; set; }
    public string? Comment { get; set; }
}

public class CreateJobRequest
{
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string JobType { get; set; } = string.Empty;
    public decimal? SalaryMin { get; set; }
    public decimal? SalaryMax { get; set; }
}

public class UpdateJobRequest
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string? Location { get; set; }
    public string? JobType { get; set; }
    public decimal? SalaryMin { get; set; }
    public decimal? SalaryMax { get; set; }
}

public class UpdateModerationStatusRequest
{
    public string Status { get; set; } = string.Empty; // "Pending"|"Approved"|"Flagged"
}
