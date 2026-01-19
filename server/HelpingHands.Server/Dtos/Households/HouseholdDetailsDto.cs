using HelpingHands.Server.Dtos.Clients;
using HelpingHands.Server.Dtos.Applications;
using HelpingHands.Server.Dtos.Assistance;

namespace HelpingHands.Server.Dtos.Households;

public sealed class HouseholdDetailsDto
{
    public Guid Id { get; set; }
    public string Street1 { get; set; } = "";
    public string? Street2 { get; set; }
    public string City { get; set; } = "";
    public string State { get; set; } = "";
    public string? Zip { get; set; }
    public bool IsArchived { get; set; }

    public IReadOnlyList<ClientListItemDto> Members { get; set; } = Array.Empty<ClientListItemDto>();
    public IReadOnlyList<ApplicationListItemDto> RecentApplications { get; set; } = Array.Empty<ApplicationListItemDto>();
    public IReadOnlyList<AssistanceEventListItemDto> RecentAssistance { get; set; } = Array.Empty<AssistanceEventListItemDto>();
}
