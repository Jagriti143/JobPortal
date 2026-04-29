using ResumeService.Data.Entities;

namespace ResumeService.Models.DTOs;

public class ResumeResponseDto
{
    public Guid Id { get; set; }
    public Guid OwnerId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Summary { get; set; }
    public string? TemplateId { get; set; }
    public string? Certifications { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    public List<EducationDto> Educations { get; set; } = new();
    public List<ExperienceDto> Experiences { get; set; } = new();
    public List<SkillDto> Skills { get; set; } = new();
    public List<ProjectDto> Projects { get; set; } = new();

    public static ResumeResponseDto FromEntity(Resume resume)
    {
        return new ResumeResponseDto
        {
            Id = resume.Id,
            OwnerId = resume.OwnerId,
            Title = resume.Title,
            Summary = resume.Summary,
            TemplateId = resume.TemplateId,
            Certifications = resume.Certifications,
            CreatedAt = resume.CreatedAt,
            UpdatedAt = resume.UpdatedAt,
            Educations = resume.Educations.Select(e => new EducationDto
            {
                Institution = e.Institution,
                Degree = e.Degree,
                FieldOfStudy = e.FieldOfStudy,
                StartDate = e.StartDate,
                EndDate = e.EndDate
            }).ToList(),
            Experiences = resume.Experiences.Select(e => new ExperienceDto
            {
                Company = e.Company,
                JobTitle = e.JobTitle,
                Description = e.Description,
                StartDate = e.StartDate,
                EndDate = e.EndDate,
                IsCurrentRole = e.IsCurrentRole
            }).ToList(),
            Skills = resume.Skills.Select(s => new SkillDto
            {
                Name = s.Name,
                Level = s.Level
            }).ToList(),
            Projects = resume.Projects.Select(p => new ProjectDto
            {
                Name = p.Name,
                Description = p.Description,
                Url = p.Url
            }).ToList()
        };
    }
}
