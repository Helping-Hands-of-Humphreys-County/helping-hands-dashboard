namespace HelpingHands.Server.Models;

public sealed class Client
{
    public Guid Id { get; set; }

    public Guid? HouseholdId { get; set; }
    public Household? Household { get; set; }

    public string FirstName { get; set; } = "";
    public string LastName { get; set; } = "";
    public DateOnly? Dob { get; set; }
    public string? Phone { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
    public bool IsArchived { get; set; }

    public List<ClientNote> Notes { get; set; } = new();

    public List<Application> Applications { get; set; } = new();
    public List<AssistanceEvent> AssistanceEvents { get; set; } = new();
}
