using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;
using System;
using System.Threading.Tasks;

class Program
{
    static async Task Main(string[] args)
    {
        try
        {
            var emailMsg = new MimeMessage();
            emailMsg.From.Add(new MailboxAddress("Job Portal Support", "karan12k12k@gmail.com"));
            emailMsg.To.Add(new MailboxAddress("", "karan12k12k@gmail.com"));
            emailMsg.Subject = "Test Email";

            var bodyBuilder = new BodyBuilder { HtmlBody = "<p>Test</p>" };
            emailMsg.Body = bodyBuilder.ToMessageBody();

            using var client = new SmtpClient();
            
            Console.WriteLine("Connecting...");
            await client.ConnectAsync("smtp.gmail.com", 587, SecureSocketOptions.StartTls);
            
            Console.WriteLine("Authenticating...");
            await client.AuthenticateAsync("karan12k12k@gmail.com", "uugtfsmjopovrtpd");
            
            Console.WriteLine("Sending...");
            await client.SendAsync(emailMsg);
            
            Console.WriteLine("Disconnecting...");
            await client.DisconnectAsync(true);
            
            Console.WriteLine("SUCCESS!");
        }
        catch (Exception ex)
        {
            Console.WriteLine("ERROR: " + ex.ToString());
        }
    }
}
