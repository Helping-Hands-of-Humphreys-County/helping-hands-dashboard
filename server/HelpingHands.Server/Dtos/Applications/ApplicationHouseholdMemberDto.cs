namespace HelpingHands.Server.Dtos.Applications;

public sealed class ApplicationHouseholdMemberDto
{
    public Guid Id { get; set; }
    public Guid ApplicationId { get; set; }
    public Guid? ClientId { get; set; }
    public string FullName { get; set; } = "";
    public DateOnly? Dob { get; set; }
    public string? RelationshipToApplicant { get; set; }
    public decimal? IncomeAmount { get; set; }
    public string? IncomeSource { get; set; }
}
