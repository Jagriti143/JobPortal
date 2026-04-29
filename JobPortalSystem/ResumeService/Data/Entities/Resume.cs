namespace ResumeService.Data.Entities;

public class Resume
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OwnerId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Summary { get; set; }
    public string TemplateId { get; set; } = "Classic";
    public string? Certifications { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<ResumeEducation> Educations { get; set; } = new List<ResumeEducation>();
    public ICollection<ResumeExperience> Experiences { get; set; } = new List<ResumeExperience>();
    public ICollection<ResumeSkill> Skills { get; set; } = new List<ResumeSkill>();
    public ICollection<ResumeProject> Projects { get; set; } = new List<ResumeProject>();
}
