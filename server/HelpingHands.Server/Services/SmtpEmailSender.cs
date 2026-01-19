using Microsoft.Extensions.Configuration;
using System;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;

namespace HelpingHands.Server.Services;

public class SmtpEmailSender : IEmailSender
{
    private readonly IConfiguration _config;

    public SmtpEmailSender(IConfiguration config)
    {
        _config = config;
    }

    public async Task SendEmailAsync(string toEmail, string subject, string htmlBody, string plainBody = null)
    {
        var host = _config["Smtp:Host"];
        if (string.IsNullOrWhiteSpace(host)) throw new InvalidOperationException("Smtp:Host is not configured.");

        var port = int.TryParse(_config["Smtp:Port"], out var p) ? p : 25;
        var username = _config["Smtp:Username"];
        var password = _config["Smtp:Password"];
        var from = _config["Smtp:From"] ?? "no-reply@example.com";
        var enableSsl = bool.TryParse(_config["Smtp:EnableSsl"], out var ssl) ? ssl : true;

        using var client = new SmtpClient(host, port)
        {
            EnableSsl = enableSsl,
        };

        if (!string.IsNullOrEmpty(username))
        {
            client.Credentials = new NetworkCredential(username, password);
        }

        using var msg = new MailMessage(from, toEmail)
        {
            Subject = subject,
            Body = htmlBody ?? plainBody ?? string.Empty,
            IsBodyHtml = !string.IsNullOrEmpty(htmlBody)
        };

        if (!string.IsNullOrEmpty(plainBody) && !string.IsNullOrEmpty(htmlBody))
        {
            var alt = AlternateView.CreateAlternateViewFromString(plainBody, null, "text/plain");
            msg.AlternateViews.Add(alt);
            var altHtml = AlternateView.CreateAlternateViewFromString(htmlBody, null, "text/html");
            msg.AlternateViews.Add(altHtml);
        }

        await client.SendMailAsync(msg);
    }
}
