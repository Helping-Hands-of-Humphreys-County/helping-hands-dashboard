namespace HelpingHands.Server.Dtos.Auth;

public sealed class MeDto
{
    public Guid Id { get; set; }
    public string DisplayName { get; set; } = "";
    public string Email { get; set; } = "";
    public bool IsActive { get; set; }
    public bool MustChangePassword { get; set; }
}
