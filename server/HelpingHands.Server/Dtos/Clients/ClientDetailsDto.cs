using HelpingHands.Server.Dtos.Households;
using HelpingHands.Server.Dtos.Clients.Notes;
using HelpingHands.Server.Dtos.Applications;
using HelpingHands.Server.Dtos.Assistance;

namespace HelpingHands.Server.Dtos.Clients;

public sealed class ClientDetailsDto
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = "";
    public string LastName { get; set; } = "";
    public DateOnly? Dob { get; set; }
    public string? Phone { get; set; }
    public bool IsArchived { get; set; }

    public HouseholdSummaryDto? Household { get; set; }
    public IReadOnlyList<ClientListItemDto> HouseholdMembers { get; set; } = Array.Empty<ClientListItemDto>();
    public IReadOnlyList<ClientNoteDto> Notes { get; set; } = Array.Empty<ClientNoteDto>();
    public IReadOnlyList<HouseholdNoteDto> HouseholdNotes { get; set; } = Array.Empty<HouseholdNoteDto>();

    public IReadOnlyList<ApplicationListItemDto> Applications { get; set; } = Array.Empty<ApplicationListItemDto>();
    public IReadOnlyList<AssistanceEventListItemDto> Assistance { get; set; } = Array.Empty<AssistanceEventListItemDto>();
    public IReadOnlyList<AssistanceEventListItemDto> HouseholdAssistance { get; set; } = Array.Empty<AssistanceEventListItemDto>();
    public ClientIncomeSnapshotDto? LatestIncomeSnapshot { get; set; }
}
