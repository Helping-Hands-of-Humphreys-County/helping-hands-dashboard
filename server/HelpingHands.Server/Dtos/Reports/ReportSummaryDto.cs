namespace HelpingHands.Server.Dtos.Reports;

public sealed class ReportSummaryDto
{
    public string Program { get; set; } = string.Empty;
    public DateOnly From { get; set; }
    public DateOnly To { get; set; }

    public int TotalEvents { get; set; }
    public int UniqueHouseholds { get; set; }
    public int UniqueClients { get; set; }

    public IDictionary<string, int> PantryItemTotals { get; set; } =
        new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

    public decimal AssistancePaidTotal { get; set; }
    public IDictionary<string, decimal> AssistancePaidByBillType { get; set; } =
        new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);
}
