namespace HelpingHands.Server.Dtos.Clients;

public sealed class ClientIncomeSnapshotDto
{
    public Guid ApplicationId { get; set; }
    public decimal IncomeAmount { get; set; }
    public string? IncomeSource { get; set; }
    public DateTimeOffset ReportedAt { get; set; }
}
