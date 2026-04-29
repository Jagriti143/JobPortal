using ApplicationService.Data.Entities;

namespace ApplicationService.Models;

public class ApplicationResponseDto
{
    public Guid Id { get; set; }
    public Guid JobSeekerId { get; set; }
    public Guid JobId { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? CoverLetter { get; set; }
    public string PhoneNumber { get; set; } = string.Empty;
    public Guid? ResumeId { get; set; }
    public string JobSeekerEmail { get; set; } = string.Empty;
    public DateTime AppliedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public static ApplicationResponseDto FromEntity(Application entity)
    {
        return new ApplicationResponseDto
        {
            Id = entity.Id,
            JobSeekerId = entity.JobSeekerId,
            JobId = entity.JobId,
            Status = entity.Status.ToString(),
            CoverLetter = entity.CoverLetter,
            PhoneNumber = entity.PhoneNumber,
            ResumeId = entity.ResumeId,
            JobSeekerEmail = entity.JobSeekerEmail,
            AppliedAt = entity.AppliedAt,
            UpdatedAt = entity.UpdatedAt
        };
    }
}
