using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace IdentityService.Services;

public class EmailService(IConfiguration config, ILogger<EmailService> logger) : IEmailService
{
    public async Task SendVerificationEmailAsync(string toEmail, string verificationToken)
    {
        var verifyUrl = $"http://localhost:5001/auth/verify-email?token={Uri.EscapeDataString(verificationToken)}";
        await SendEmailAsync(toEmail, "Verify your email",
            $"<p>Your 6-digit verification code is: <strong>{verificationToken}</strong></p><p>Or click <a href='{verifyUrl}'>here</a> to verify.</p>");
    }

    public async Task SendPasswordResetEmailAsync(string toEmail, string resetToken)
    {
        var resetUrl = $"http://localhost:5001/auth/reset-password?token={Uri.EscapeDataString(resetToken)}";
        await SendEmailAsync(toEmail, "Reset your password",
            $"<p>Your 6-digit password reset code is: <strong>{resetToken}</strong></p><p>Or click <a href='{resetUrl}'>here</a> to reset. This expires in 1 hour.</p>");
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
        var host = config["Smtp:Host"] ?? "smtp.gmail.com";
        var port = config.GetValue<int>("Smtp:Port", 587);
        var password = config["Smtp:Password"] ?? "";
        string fromEmail = config["Smtp:Username"] ?? "noreply@jobportal.local";
        string fromName = config["Smtp:FromName"] ?? "Job Portal Support";

        if (string.IsNullOrEmpty(password) || password == "your-app-password")
        {
            logger.LogWarning("Email sending bypassed — configure a real 'Smtp:Password' in appsettings.json");
            return;
        }

        try
        {
            var emailMsg = new MimeMessage();
            emailMsg.From.Add(new MailboxAddress(fromName, fromEmail));
            emailMsg.To.Add(new MailboxAddress("", toEmail));
            emailMsg.Subject = subject;

            var bodyBuilder = new BodyBuilder { HtmlBody = htmlContent };
            emailMsg.Body = bodyBuilder.ToMessageBody();

            using var client = new SmtpClient();

            logger.LogInformation("SMTP: Connecting to {Host}:{Port} with StartTls...", host, port);
            await client.ConnectAsync(host, port, SecureSocketOptions.StartTls);

            logger.LogInformation("SMTP: Authenticating as {User}...", fromEmail);
            await client.AuthenticateAsync(fromEmail, password);

            logger.LogInformation("SMTP: Sending email to {To} — subject: {Subject}", toEmail, subject);
            await client.SendAsync(emailMsg);
            await client.DisconnectAsync(true);

            logger.LogInformation("SMTP: Email sent successfully to {To}", toEmail);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "SMTP: Failed to send email to {Email}. Host={Host}, Port={Port}", toEmail, host, port);
        }
    }
}

