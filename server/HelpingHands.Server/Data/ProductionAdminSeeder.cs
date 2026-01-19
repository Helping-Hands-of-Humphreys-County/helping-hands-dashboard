using HelpingHands.Server.Models;
using Microsoft.AspNetCore.Identity;

namespace HelpingHands.Server.Data;

public static class ProductionAdminSeeder
{
    public static async Task EnsureAdminAsync(IServiceProvider services, IConfiguration configuration)
    {
        var email = configuration["DefaultAdmin:Email"];
        var password = configuration["DefaultAdmin:Password"];
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
        {
            return; // nothing configured
        }

        var userManager = services.GetRequiredService<UserManager<AppUser>>();

        var existing = await userManager.FindByEmailAsync(email);
        if (existing is not null)
        {
            // Ensure active
            if (!existing.IsActive)
            {
                existing.IsActive = true;
                existing.UpdatedAt = DateTimeOffset.UtcNow;
                await userManager.UpdateAsync(existing);
            }
            return;
        }

        var user = new AppUser
        {
            Id = Guid.NewGuid(),
            UserName = email,
            Email = email,
            DisplayName = configuration["DefaultAdmin:DisplayName"] ?? "Administrator",
            EmailConfirmed = true,
            IsActive = true,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
            MustChangePassword = bool.TryParse(configuration["DefaultAdmin:MustChangePassword"], out var mcp) ? mcp : true
        };

        var result = await userManager.CreateAsync(user, password);
        if (!result.Succeeded)
        {
            var errors = string.Join("; ", result.Errors.Select(e => e.Description));
            Console.WriteLine($"ProductionAdminSeeder: failed to create admin {email}: {errors}");
        }
        else
        {
            Console.WriteLine($"ProductionAdminSeeder: created admin user {email}");
        }
    }
}
