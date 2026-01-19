namespace HelpingHands.Server.Models;

public sealed class ApplicationHouseholdMember
{
    public Guid Id { get; set; }

    public Guid ApplicationId { get; set; }
    public Application Application { get; set; } = null!;

    public Guid? ClientId { get; set; }
    public Client? Client { get; set; }

    public string FullName { get; set; } = "";
    public DateOnly? Dob { get; set; }
    public string? RelationshipToApplicant { get; set; }
    public decimal? IncomeAmount { get; set; }
    public string? IncomeSource { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
}