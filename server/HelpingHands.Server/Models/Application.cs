namespace HelpingHands.Server.Models;

public sealed class Application
{
    public Guid Id { get; set; }

    public string ProgramType { get; set; } = "FoodPantry";
    public string Status { get; set; } = "Submitted";
    public DateTimeOffset? SubmittedAt { get; set; }
    public Guid ApplicantClientId { get; set; }
    public Client ApplicantClient { get; set; } = null!;

    public Guid HouseholdId { get; set; }
    public Household Household { get; set; } = null!;

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
    public AppUser? VerifiedByUser { get; set; }
    public string Decision { get; set; } = "Pending";
    public DateOnly? DecisionDate { get; set; }
    public string? BoardNotes { get; set; }

    public Guid CreatedByUserId { get; set; }
    public AppUser CreatedByUser { get; set; } = null!;
    public Guid? UpdatedByUserId { get; set; }
    public AppUser? UpdatedByUser { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public bool IsArchived { get; set; }

    public List<ApplicationHouseholdMember> HouseholdMembers { get; set; } = new();
    public List<ApplicationBillRequest> BillRequests { get; set; } = new();
    public List<AssistanceEvent> AssistanceEvents { get; set; } = new();
}