namespace HelpingHands.Server.Dtos.Users;

public sealed class CreateUserRequest
{
    public string DisplayName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    // Optional: if not provided, an invite/reset token will be generated
    public string? Password { get; set; }
}
