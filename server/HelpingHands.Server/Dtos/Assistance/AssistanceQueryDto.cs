using HelpingHands.Server.Dtos.Common;

namespace HelpingHands.Server.Dtos.Assistance;

public sealed class AssistanceQueryDto : PagedRequest
{
    public string? ProgramType { get; set; }
    public DateOnly? From { get; set; }
    public DateOnly? To { get; set; }
    public string? Type { get; set; }
    public string? Search { get; set; }
    public string? Sort { get; set; }
}
