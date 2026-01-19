namespace HelpingHands.Server.Dtos.Applications;

public sealed class UpdateApplicationRequest
{
    public string Status { get; set; } = "Submitted";
    public DateTimeOffset? SubmittedAt { get; set; }

    public Guid HouseholdId { get; set; }

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

    public List<CreateApplicationHouseholdMemberRequest> HouseholdMembers { get; set; } = new();
    public List<CreateApplicationBillRequestRequest> BillRequests { get; set; } = new();
}
