namespace HelpingHands.Server.Dtos.Households;

public sealed class MoveMemberRequest
{
    public Guid ClientId { get; set; }
    public Guid NewHouseholdId { get; set; }
}
