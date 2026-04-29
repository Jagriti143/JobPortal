namespace JobCatalogService.Data.Entities;

public class Company
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Website { get; set; }
    public string? LogoUrl { get; set; }
    public string? Industry { get; set; }
    public string? Location { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<Job> Jobs { get; set; } = new List<Job>();
    public ICollection<CompanyReview> Reviews { get; set; } = new List<CompanyReview>();
}
