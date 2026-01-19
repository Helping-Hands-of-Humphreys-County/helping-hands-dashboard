namespace HelpingHands.Server.Dtos.Households;

public sealed class HouseholdSummaryDto
{
    public Guid Id { get; set; }
    public string Street1 { get; set; } = "";
    public string? Street2 { get; set; }
    public string City { get; set; } = "";
    public string State { get; set; } = "";
    public string? Zip { get; set; }
}
