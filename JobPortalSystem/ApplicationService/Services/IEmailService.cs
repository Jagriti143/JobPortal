namespace ApplicationService.Services;

public interface IEmailService
{
    Task SendApplicationSubmittedAsync(string toEmail, Guid jobId, Guid applicationId);
    Task SendApplicationStatusChangedAsync(string toEmail, Guid jobId, Guid applicationId, string newStatus);
    Task SendApplicationWithdrawnAsync(string toEmail, Guid jobId, Guid applicationId);
}
