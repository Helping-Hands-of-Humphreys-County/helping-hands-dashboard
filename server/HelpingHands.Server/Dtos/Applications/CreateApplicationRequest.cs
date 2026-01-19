namespace HelpingHands.Server.Dtos.Applications;

public sealed class CreateApplicationRequest
{
    public string ProgramType { get; set; } = "FoodPantry";
    public string Status { get; set; } = "Submitted";
    public DateTimeOffset? SubmittedAt { get; set; }

    public Guid ApplicantClientId { get; set; }
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

public sealed class CreateApplicationHouseholdMemberRequest
{
    public Guid? ClientId { get; set; }
    public string FullName { get; set; } = "";
    public DateOnly? Dob { get; set; }
    public string? RelationshipToApplicant { get; set; }
    public decimal? IncomeAmount { get; set; }
    public string? IncomeSource { get; set; }
}

public sealed class CreateApplicationBillRequestRequest
{
    public string BillType { get; set; } = "Rent";
    public decimal AmountRequested { get; set; }
    public string? AccountNumber { get; set; }
}
