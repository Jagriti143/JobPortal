namespace ResumeService.Data.Entities;

public class ResumeUnlockRequest
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid RecruiterId { get; set; }
    public Guid ResumeId { get; set; }
    public string Status { get; set; } = "Pending";
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
