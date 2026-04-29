namespace IdentityService.Services;

public interface IEmailService
{
    Task SendVerificationEmailAsync(string toEmail, string verificationToken);
    Task SendPasswordResetEmailAsync(string toEmail, string resetToken);
    Task SendWelcomeEmailAsync(string toEmail);
    Task SendLoginNotificationEmailAsync(string toEmail, string ipAddress);
}
