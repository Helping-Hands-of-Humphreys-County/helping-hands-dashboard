using Microsoft.AspNetCore.Identity;

namespace HelpingHands.Server.Models;

public class AppUser : IdentityUser<Guid>
{
    public string DisplayName { get; set; } = "";
    public bool IsActive { get; set; } = true;

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    // When true the user must change their password on next interactive login
    public bool MustChangePassword { get; set; } = false;
}
