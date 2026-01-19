namespace HelpingHands.Server.Dtos.Dashboard;

public sealed class DashboardSummaryDto
{
    public DateOnly From { get; set; }
    public DateOnly To { get; set; }

    public int HouseholdsServed { get; set; }
    public int ClientsServed { get; set; }

    public IDictionary<string, int> PantryItemTotals { get; set; } =
        new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);

    public decimal AssistancePaidTotal { get; set; }
    public IDictionary<string, decimal> AssistancePaidByBillType { get; set; } =
        new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase);

    public IDictionary<string, int> ApplicationsByStatus { get; set; } =
        new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
}
