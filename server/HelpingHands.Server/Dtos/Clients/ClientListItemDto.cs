namespace HelpingHands.Server.Dtos.Clients;

public sealed class ClientListItemDto
{
    public Guid Id { get; set; }
    public string FirstName { get; set; } = "";
    public string LastName { get; set; } = "";
    public DateOnly? Dob { get; set; }
    public string? Phone { get; set; }

    public string? Street1 { get; set; }
    public string? City { get; set; }
    public string? State { get; set; }
    public string? Zip { get; set; }
}
