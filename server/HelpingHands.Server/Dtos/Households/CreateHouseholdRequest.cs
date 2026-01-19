namespace HelpingHands.Server.Dtos.Households;

public sealed class CreateHouseholdRequest
{
    public string Street1 { get; set; } = "";
    public string? Street2 { get; set; }
    public string City { get; set; } = "";
    public string State { get; set; } = "TN";
    public string? Zip { get; set; }
}
