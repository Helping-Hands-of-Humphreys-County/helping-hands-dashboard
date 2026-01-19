namespace HelpingHands.Server.Dtos.Assistance;

public sealed class UpdateAssistanceEventRequest
{
    public DateTimeOffset OccurredAt { get; set; } = DateTimeOffset.UtcNow;

    public Guid HouseholdId { get; set; }
    public int? HouseholdMemberCount { get; set; }
    public Guid? ClientId { get; set; }
    public Guid? ApplicationId { get; set; }

    public string? BillType { get; set; }
    public decimal? AmountPaid { get; set; }
    public string? CheckNumber { get; set; }
    public string? Notes { get; set; }

    public List<AssistanceItemDto> Items { get; set; } = new();
}
