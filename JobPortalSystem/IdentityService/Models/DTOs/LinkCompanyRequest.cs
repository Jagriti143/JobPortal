namespace IdentityService.Models.DTOs;

/// <summary>Request body for linking a company to a recruiter account (one-time only).</summary>
public class LinkCompanyRequest
{
    public Guid CompanyId { get; set; }
}
