using SendGrid;
using SendGrid.Helpers.Mail;

namespace IdentityService.Services;

public class SendGridEmailService(IConfiguration config, ILogger<SendGridEmailService> logger) : IEmailService
{
    public async Task SendVerificationEmailAsync(string toEmail, string verificationToken)
    {
        var baseUrl = config["AppBaseUrl"] ?? "http://localhost:5001";
        var verifyUrl = $"{baseUrl}/auth/verify-email?token={Uri.EscapeDataString(verificationToken)}";
        await SendEmailAsync(toEmail, "Verify your email", 
            $"<p>Your 6-digit verification code is: <strong>{verificationToken}</strong></p><p>Or click <a href='{verifyUrl}'>{verifyUrl}</a></p>");
    }

    public async Task SendPasswordResetEmailAsync(string toEmail, string resetToken)
    {
        var baseUrl = config["AppBaseUrl"] ?? "http://localhost:5001";
        var resetUrl = $"{baseUrl}/auth/reset-password?token={Uri.EscapeDataString(resetToken)}";
        await SendEmailAsync(toEmail, "Reset your password", 
            $"<p>Your 6-digit password reset code is: <strong>{resetToken}</strong></p><p>Or click <a href='{resetUrl}'>{resetUrl}</a></p>");
    }

    public async Task SendWelcomeEmailAsync(string toEmail)
    {
        await SendEmailAsync(toEmail, "Welcome to Job Portal!",
            "<p>Thank you for registering successfully. Welcome to Job Portal!</p>");
    }

    public async Task SendLoginNotificationEmailAsync(string toEmail, string ipAddress)
    {
        await SendEmailAsync(toEmail, "New Login Detected",
            $"<p>A new login was detected on your account from IP address: <strong>{ipAddress}</strong> at {DateTime.UtcNow:f} UTC.</p>");
    }

    private async Task SendEmailAsync(string toEmail, string subject, string htmlContent)
    {
        try
        {
            var apiKey = config["SendGrid:ApiKey"];
            if (string.IsNullOrEmpty(apiKey) || apiKey.StartsWith("SG.PLACEHOLDER"))
            {
                logger.LogWarning("SendGrid API key not configured. Email to {Email} with subject '{Subject}' was not sent.", toEmail, subject);
                return;
            }

            var client = new SendGridClient(apiKey);
            var from = new EmailAddress(config["SendGrid:FromEmail"] ?? "noreply@jobportal.local", config["SendGrid:FromName"] ?? "Job Portal");
            var to = new EmailAddress(toEmail);
            var msg = MailHelper.CreateSingleEmail(from, to, subject, string.Empty, htmlContent);
            var response = await client.SendEmailAsync(msg);

            if (!response.IsSuccessStatusCode)
                logger.LogError("SendGrid returned {StatusCode} for email to {Email}", response.StatusCode, toEmail);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to send email to {Email} — swallowing error", toEmail);
        }
    }
}
