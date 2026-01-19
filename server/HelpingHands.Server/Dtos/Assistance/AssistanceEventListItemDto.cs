namespace HelpingHands.Server.Dtos.Assistance;

public sealed class AssistanceEventListItemDto
{
    public Guid Id { get; set; }
    public string ProgramType { get; set; } = "";
    public DateTimeOffset OccurredAt { get; set; }

    public Guid HouseholdId { get; set; }
    public Guid? ApplicationId { get; set; }
    public int? HouseholdMemberCount { get; set; }
    public string Street1 { get; set; } = "";
    public string? Street2 { get; set; }
    public string City { get; set; } = "";
    public string State { get; set; } = "";
    public string? Zip { get; set; }

    public Guid? ClientId { get; set; }
    public string? ClientName { get; set; }

    public string? BillType { get; set; }
    public decimal? AmountPaid { get; set; }
    public string? CheckNumber { get; set; }
    public string? Notes { get; set; }

    public string? RecordedByUserDisplayName { get; set; }

    public IReadOnlyList<AssistanceItemDto> Items { get; set; } = Array.Empty<AssistanceItemDto>();
}
