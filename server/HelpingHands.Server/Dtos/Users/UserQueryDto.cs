using HelpingHands.Server.Dtos.Common;

namespace HelpingHands.Server.Dtos.Users;

public sealed class UserQueryDto : PagedRequest
{
    public string? Search { get; set; }
    public string? Sort { get; set; }
}
