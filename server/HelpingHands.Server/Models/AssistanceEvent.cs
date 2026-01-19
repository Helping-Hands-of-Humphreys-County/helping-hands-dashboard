namespace HelpingHands.Server.Models;

public sealed class AssistanceEvent
{
    public Guid Id { get; set; }

    public string ProgramType { get; set; } = "FoodPantry";
    public DateTimeOffset OccurredAt { get; set; } = DateTimeOffset.UtcNow;

    public Guid HouseholdId { get; set; }
    public Household Household { get; set; } = null!;

    // Number of household members represented when this assistance was provided
    public int? HouseholdMemberCount { get; set; }

    public Guid? ClientId { get; set; }
    public Client? Client { get; set; }

    public Guid? ApplicationId { get; set; }
    public Application? Application { get; set; }

    public string? BillType { get; set; }
    public decimal? AmountPaid { get; set; }
    public string? CheckNumber { get; set; }
    public string? Notes { get; set; }

    public Guid RecordedByUserId { get; set; }
    public AppUser RecordedByUser { get; set; } = null!;

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public bool IsArchived { get; set; }

    public List<AssistanceItem> Items { get; set; } = new();
}