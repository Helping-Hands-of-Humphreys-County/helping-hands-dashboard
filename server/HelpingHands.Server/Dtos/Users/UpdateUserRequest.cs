namespace HelpingHands.Server.Dtos.Users;

public sealed class UpdateUserRequest
{
    public string DisplayName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}
