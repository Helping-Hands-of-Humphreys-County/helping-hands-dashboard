namespace HelpingHands.Server.Dtos.Applications;

public sealed class ApplicationListItemDto
{
    public Guid Id { get; set; }
    public string ProgramType { get; set; } = "";
    public string Status { get; set; } = "";
    public DateTimeOffset? SubmittedAt { get; set; }
    public Guid ApplicantClientId { get; set; }
    public string ApplicantName { get; set; } = "";
    public Guid HouseholdId { get; set; }
    public string Street1 { get; set; } = "";
    public string? Street2 { get; set; }
    public string City { get; set; } = "";
    public string State { get; set; } = "";
    public string? Zip { get; set; }
    public string Decision { get; set; } = "Pending";
    public DateOnly? DecisionDate { get; set; }
}
