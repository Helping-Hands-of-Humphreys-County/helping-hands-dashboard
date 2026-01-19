namespace HelpingHands.Server.Dtos.Applications;

public sealed class ApplicationBillRequestDto
{
    public Guid Id { get; set; }
    public Guid ApplicationId { get; set; }
    public string BillType { get; set; } = "Rent";
    public decimal AmountRequested { get; set; }
    public string? AccountNumber { get; set; }
}
