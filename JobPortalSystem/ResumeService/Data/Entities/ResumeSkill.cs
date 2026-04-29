namespace ResumeService.Data.Entities;

public class ResumeSkill
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ResumeId { get; set; }
    public Resume Resume { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public string? Level { get; set; }
}
