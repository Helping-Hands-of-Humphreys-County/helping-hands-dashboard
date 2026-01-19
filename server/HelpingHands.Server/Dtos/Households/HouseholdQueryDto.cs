using HelpingHands.Server.Dtos.Common;

namespace HelpingHands.Server.Dtos.Households;

public sealed class HouseholdQueryDto : PagedRequest
{
    public string? Search { get; set; }
    public bool Archived { get; set; }
    public string? Sort { get; set; }
}
