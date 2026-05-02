namespace ResumeService.Models.DTOs;

public class CreateResumeRequest
{
    public string Title { get; set; } = string.Empty;
    public string? Summary { get; set; }
    public string? TemplateId { get; set; }
    public string? Certifications { get; set; }
    public List<EducationDto>? Educations { get; set; }
    public List<ExperienceDto>? Experiences { get; set; }
    public List<SkillDto>? Skills { get; set; }
    public List<ProjectDto>? Projects { get; set; }
}

public class EducationDto
{
    public string Institution { get; set; } = string.Empty;
    public string Degree { get; set; } = string.Empty;
    public string? FieldOfStudy { get; set; }
    /// <summary>YYYY-MM or YYYY-MM-DD string from the frontend month picker. Nullable — blank = unknown.</summary>
    public string? StartDate { get; set; }
    public string? EndDate { get; set; }
}

public class ExperienceDto
{
    public string Company { get; set; } = string.Empty;
    public string JobTitle { get; set; } = string.Empty;
    public string? Description { get; set; }
    /// <summary>YYYY-MM or YYYY-MM-DD string from the frontend month picker. Nullable — blank = unknown.</summary>
    public string? StartDate { get; set; }
    public string? EndDate { get; set; }
    public bool IsCurrentRole { get; set; }
}

public class SkillDto
{
    public string Name { get; set; } = string.Empty;
    public string? Level { get; set; }
}

public class ProjectDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Url { get; set; }
}
