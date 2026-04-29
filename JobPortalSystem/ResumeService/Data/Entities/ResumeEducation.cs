namespace ResumeService.Data.Entities;

public class ResumeEducation
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ResumeId { get; set; }
    public Resume Resume { get; set; } = null!;
    public string Institution { get; set; } = string.Empty;
    public string Degree { get; set; } = string.Empty;
    public string? FieldOfStudy { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime? EndDate { get; set; }
}
