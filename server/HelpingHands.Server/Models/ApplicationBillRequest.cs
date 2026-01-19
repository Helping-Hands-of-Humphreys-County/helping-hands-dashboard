namespace HelpingHands.Server.Models;

public sealed class ApplicationBillRequest
{
    public Guid Id { get; set; }

    public Guid ApplicationId { get; set; }
    public Application Application { get; set; } = null!;

    public string BillType { get; set; } = "Rent";
    public decimal AmountRequested { get; set; }
    public string? AccountNumber { get; set; }
}