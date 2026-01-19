using System.Threading.Tasks;

namespace HelpingHands.Server.Services;

public interface IEmailSender
{
    Task SendEmailAsync(string toEmail, string subject, string htmlBody, string plainBody = null);
}
