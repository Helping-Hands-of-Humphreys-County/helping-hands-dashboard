using HelpingHands.Server.Dtos.Common;

namespace HelpingHands.Server.Dtos.Applications;

public sealed class ApplicationQueryDto : PagedRequest
{
    public string? ProgramType { get; set; }
    public string? Status { get; set; }
    public DateOnly? From { get; set; }
    public DateOnly? To { get; set; }
    public string? Search { get; set; }
    public string? Sort { get; set; }
    public bool Archived { get; set; }
}
