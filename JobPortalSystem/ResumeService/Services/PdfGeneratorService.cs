using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using ResumeService.Data.Entities;

namespace ResumeService.Services;

public interface IPdfGeneratorService
{
    byte[] GeneratePdf(Resume resume);
}

public class PdfGeneratorService : IPdfGeneratorService
{
    public byte[] GeneratePdf(Resume resume)
    {
        // License is set once at startup in Program.cs — do NOT set it here.

        var doc = Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(2, Unit.Centimetre);
                page.DefaultTextStyle(x => x.FontSize(11));

                page.Header().Text(resume.Title).SemiBold().FontSize(20);

                page.Content().Column(col =>
                {
                    if (!string.IsNullOrEmpty(resume.Summary))
                    {
                        col.Item().Text("Summary").Bold().FontSize(14);
                        col.Item().Text(resume.Summary);
                        col.Item().PaddingBottom(10);
                    }

                    if (resume.Experiences.Any())
                    {
                        col.Item().Text("Experience").Bold().FontSize(14);
                        foreach (var exp in resume.Experiences)
                        {
                            col.Item().Text($"{exp.JobTitle} at {exp.Company}").SemiBold();
                            col.Item().Text($"{exp.StartDate:MMM yyyy} - {(exp.EndDate.HasValue ? exp.EndDate.Value.ToString("MMM yyyy") : "Present")}");
                            if (!string.IsNullOrEmpty(exp.Description))
                                col.Item().Text(exp.Description);
                            col.Item().PaddingBottom(5);
                        }
                    }

                    if (resume.Educations.Any())
                    {
                        col.Item().Text("Education").Bold().FontSize(14);
                        foreach (var edu in resume.Educations)
                        {
                            col.Item().Text($"{edu.Degree} - {edu.Institution}").SemiBold();
                            col.Item().Text($"{edu.StartDate:MMM yyyy} - {(edu.EndDate.HasValue ? edu.EndDate.Value.ToString("MMM yyyy") : "Present")}");
                            col.Item().PaddingBottom(5);
                        }
                    }

                    if (resume.Skills.Any())
                    {
                        col.Item().Text("Skills").Bold().FontSize(14);
                        col.Item().Text(string.Join(", ", resume.Skills.Select(s => s.Name)));
                        col.Item().PaddingBottom(5);
                    }

                    if (resume.Projects.Any())
                    {
                        col.Item().Text("Projects").Bold().FontSize(14);
                        foreach (var proj in resume.Projects)
                        {
                            col.Item().Text(proj.Name).SemiBold();
                            if (!string.IsNullOrEmpty(proj.Description))
                                col.Item().Text(proj.Description);
                            col.Item().PaddingBottom(5);
                        }
                    }
                });
            });
        });

        return doc.GeneratePdf();
    }
}
