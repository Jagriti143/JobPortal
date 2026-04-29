namespace ApplicationService.Data.Entities;

public enum ApplicationStatus
{
    Submitted,
    Reviewed,
    Shortlisted,
    Rejected,
    Withdrawn
}

public class Application
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid JobSeekerId { get; set; }
    public Guid JobId { get; set; }
    public string JobSeekerEmail { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public Guid? ResumeId { get; set; }
    public ApplicationStatus Status { get; set; } = ApplicationStatus.Submitted;
    public string? CoverLetter { get; set; }
    public DateTime AppliedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
