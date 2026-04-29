namespace JobCatalogService.Data.Entities;

public class Job
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CompanyId { get; set; }
    public Company Company { get; set; } = null!;
    public Guid PostedByRecruiterId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Location { get; set; } = string.Empty;
    public string JobType { get; set; } = string.Empty; // "FullTime"|"PartTime"|"Contract"|"Remote"
    public decimal? SalaryMin { get; set; }
    public decimal? SalaryMax { get; set; }
    public string ModerationStatus { get; set; } = "Pending"; // "Pending"|"Approved"|"Flagged"
    public bool IsDeleted { get; set; } = false;
    public DateTime? DeletedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
