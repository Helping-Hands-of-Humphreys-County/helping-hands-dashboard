namespace HelpingHands.Server.Dtos.Clients;

public sealed class UpdateClientRequest
{
    public Guid? HouseholdId { get; set; }
    public string FirstName { get; set; } = "";
    public string LastName { get; set; } = "";
    public DateOnly? Dob { get; set; }
    public string? Phone { get; set; }
}
