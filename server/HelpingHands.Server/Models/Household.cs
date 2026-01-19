namespace HelpingHands.Server.Models;

public sealed class Household
{
    public Guid Id { get; set; }

    public string Street1 { get; set; } = "";
    public string? Street2 { get; set; }
    public string City { get; set; } = "";
    public string State { get; set; } = "TN";
    public string? Zip { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public bool IsArchived { get; set; }

    public List<Client> Clients { get; set; } = new();

    public List<Application> Applications { get; set; } = new();
    public List<AssistanceEvent> AssistanceEvents { get; set; } = new();
}
