using HelpingHands.Server.Dtos.Assistance;
using HelpingHands.Server.Dtos.Clients.Notes;

namespace HelpingHands.Server.Dtos.Applications;

public sealed class ApplicationDetailsDto
{
    public Guid Id { get; set; }
    public string ProgramType { get; set; } = "";
    public string Status { get; set; } = "";
    public DateTimeOffset? SubmittedAt { get; set; }
    public bool IsArchived { get; set; }

    public Guid ApplicantClientId { get; set; }
    public string ApplicantName { get; set; } = "";

    public Guid HouseholdId { get; set; }
    public string Street1 { get; set; } = "";
    public string? Street2 { get; set; }
    public string City { get; set; } = "";
    public string State { get; set; } = "";
    public string? Zip { get; set; }

    public string EmergencySummary { get; set; } = "";
    public decimal? TotalHouseholdMonthlyIncome { get; set; }

    public bool? ReceivedUtilityAssistancePastYear { get; set; }
    public string? UtilityAssistanceFrom { get; set; }
    public string? PreventionPlan { get; set; }

    public bool? ReceivesFoodStamps { get; set; }
    public decimal? FoodStampsAmount { get; set; }
    public DateOnly? FoodStampsDateAvailable { get; set; }

    public string? LandlordName { get; set; }
    public string? LandlordPhone { get; set; }
    public string? LandlordAddress { get; set; }

    public Guid? VerifiedByUserId { get; set; }

    public string Decision { get; set; } = "Pending";
    public DateOnly? DecisionDate { get; set; }
    public string? BoardNotes { get; set; }

    public IReadOnlyList<ApplicationHouseholdMemberDto> HouseholdMembers { get; set; } = Array.Empty<ApplicationHouseholdMemberDto>();
    public IReadOnlyList<ApplicationBillRequestDto> BillRequests { get; set; } = Array.Empty<ApplicationBillRequestDto>();
    public IReadOnlyList<AssistanceEventListItemDto> Assistance { get; set; } = Array.Empty<AssistanceEventListItemDto>();
    public IReadOnlyList<HouseholdNoteDto> HouseholdNotes { get; set; } = Array.Empty<HouseholdNoteDto>();
    public IReadOnlyList<AssistanceEventListItemDto> HouseholdAssistance { get; set; } = Array.Empty<AssistanceEventListItemDto>();
}
