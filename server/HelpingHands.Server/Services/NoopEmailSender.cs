using System;
using System.Threading.Tasks;

namespace HelpingHands.Server.Services;

public class NoopEmailSender : IEmailSender
{
    public Task SendEmailAsync(string toEmail, string subject, string htmlBody, string plainBody = null)
    {
        Console.WriteLine($"[NoopEmailSender] To={toEmail} Subject={subject}");
        return Task.CompletedTask;
    }
}
