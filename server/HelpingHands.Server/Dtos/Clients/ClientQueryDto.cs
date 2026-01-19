using HelpingHands.Server.Dtos.Common;

namespace HelpingHands.Server.Dtos.Clients;

public sealed class ClientQueryDto : PagedRequest
{
    public string? Search { get; set; }
    public bool Archived { get; set; }
    public string? Sort { get; set; }
}
