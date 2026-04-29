using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace ApplicationService.Services;

public class EmailService(IConfiguration config, ILogger<EmailService> logger) : IEmailService
{
    public Task SendApplicationSubmittedAsync(string toEmail, Guid jobId, Guid applicationId) =>
        SendEmailAsync(toEmail,
            "Application Submitted Successfully",
            $"""
            <h2>Application Submitted</h2>
            <p>Your application has been <strong>submitted successfully</strong>.</p>
            <p><strong>Application ID:</strong> {applicationId}</p>
            <p><strong>Job ID:</strong> {jobId}</p>
            <p>We will notify you when the recruiter reviews your application.</p>
            """);

    public Task SendApplicationStatusChangedAsync(string toEmail, Guid jobId, Guid applicationId, string newStatus) =>
        SendEmailAsync(toEmail,
            $"Application Status Updated: {newStatus}",
            $"""
            <h2>Application Status Update</h2>
            <p>Your application status has been updated to <strong>{newStatus}</strong>.</p>
            <p><strong>Application ID:</strong> {applicationId}</p>
            <p><strong>Job ID:</strong> {jobId}</p>
            {StatusMessage(newStatus)}
            """);

    public Task SendApplicationWithdrawnAsync(string toEmail, Guid jobId, Guid applicationId) =>
        SendEmailAsync(toEmail,
            "Application Withdrawn",
            $"""
            <h2>Application Withdrawn</h2>
            <p>Your application has been <strong>withdrawn</strong> successfully.</p>
            <p><strong>Application ID:</strong> {applicationId}</p>
            <p><strong>Job ID:</strong> {jobId}</p>
            """);

    private static string StatusMessage(string status) => status switch
    {
        "Reviewed"    => "<p>Good news! A recruiter has reviewed your application.</p>",
        "Shortlisted" => "<p>Congratulations! You have been shortlisted for this position.</p>",
        "Rejected"    => "<p>Unfortunately, your application was not selected at this time.</p>",
        _             => string.Empty
    };

    private async Task SendEmailAsync(string toEmail, string subject, string htmlContent)
    {
        try
        {
            var host     = config["Smtp:Host"]     ?? "smtp.gmail.com";
            var port     = config.GetValue<int>("Smtp:Port", 587);
            var username = config["Smtp:Username"] ?? string.Empty;
            var password = config["Smtp:Password"] ?? string.Empty;
            var fromName = config["Smtp:FromName"] ?? "Job Portal";

            if (string.IsNullOrEmpty(password) || password == "your-app-password")
            {
                logger.LogWarning("Email sending bypassed — Smtp:Password not configured.");
                return;
            }

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(fromName, username));
            message.To.Add(new MailboxAddress(string.Empty, toEmail));
            message.Subject = subject;
            message.Body = new BodyBuilder { HtmlBody = htmlContent }.ToMessageBody();

            using var client = new SmtpClient();
            await client.ConnectAsync(host, port, SecureSocketOptions.StartTls);
            await client.AuthenticateAsync(username, password);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);

            logger.LogInformation("Email sent to {Email} — {Subject}", toEmail, subject);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send email to {Email}", toEmail);
        }
    }
}
