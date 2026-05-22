using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

class Program
{
    static async Task Main(string[] args)
    {
        try
        {
            var emailMsg = new MimeMessage();
            emailMsg.From.Add(new MailboxAddress("Job Portal Support", "jagritikamboj9@gmail.com"));
            emailMsg.To.Add(new MailboxAddress("", "jagritikamboj9@gmail.com"));
            emailMsg.Subject = "Test OTP Email from Job Portal";

            var bodyBuilder = new BodyBuilder { HtmlBody = "<p>Your 6-digit verification code is: <strong>123456</strong></p><p>This is a test email to verify SMTP configuration.</p>" };
            emailMsg.Body = bodyBuilder.ToMessageBody();

            using var client = new SmtpClient();
            
            Console.WriteLine("Step 1: Connecting to smtp.gmail.com:587 with StartTls...");
            await client.ConnectAsync("smtp.gmail.com", 587, SecureSocketOptions.StartTls);
            Console.WriteLine("Step 2: Connected! Authenticating...");
            
            await client.AuthenticateAsync("jagritikamboj9@gmail.com", "hvgrljehgdohcctj");
            Console.WriteLine("Step 3: Authenticated! Sending email...");
            
            await client.SendAsync(emailMsg);
            Console.WriteLine("Step 4: Email sent! Disconnecting...");
            
            await client.DisconnectAsync(true);
            Console.WriteLine("SUCCESS: Email sent to jagritikamboj9@gmail.com!");
        }
        catch (Exception ex)
        {
            Console.WriteLine("ERROR: " + ex.ToString());
        }
    }
}
