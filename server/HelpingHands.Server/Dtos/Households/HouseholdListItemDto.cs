namespace HelpingHands.Server.Dtos.Households;

public sealed class HouseholdListItemDto
{
    public Guid Id { get; set; }
    public string Street1 { get; set; } = "";
    public string? Street2 { get; set; }
    public string City { get; set; } = "";
    public string State { get; set; } = "";
    public string? Zip { get; set; }
    public int MemberCount { get; set; }
    public DateTimeOffset? LastActivityAt { get; set; }
}
