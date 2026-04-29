namespace ResumeService.Data.Entities;

public class UnlockedResume
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid RecruiterId { get; set; }
    public Guid ResumeId { get; set; }
    public DateTime UnlockedAt { get; set; } = DateTime.UtcNow;
}
