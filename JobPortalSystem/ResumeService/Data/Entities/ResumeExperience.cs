namespace ResumeService.Data.Entities;

public class ResumeExperience
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ResumeId { get; set; }
    public Resume Resume { get; set; } = null!;
    public string Company { get; set; } = string.Empty;
    public string JobTitle { get; set; } = string.Empty;
    public string? Description { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool IsCurrentRole { get; set; }
}
