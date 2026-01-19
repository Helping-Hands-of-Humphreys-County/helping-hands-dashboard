namespace HelpingHands.Server.Dtos.Reports;

public sealed class ReportQueryDto
{
    public string Program { get; set; } = "Both"; // FoodPantry | HelpingHands | Both
    public DateOnly? From { get; set; }
    public DateOnly? To { get; set; }
}
