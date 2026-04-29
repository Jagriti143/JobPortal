namespace ResumeService.Data.Entities;

public class ResumeProject
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ResumeId { get; set; }
    public Resume Resume { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Url { get; set; }
}
