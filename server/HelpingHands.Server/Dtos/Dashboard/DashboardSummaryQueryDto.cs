namespace HelpingHands.Server.Dtos.Dashboard;

public sealed class DashboardSummaryQueryDto
{
    public DateOnly? From { get; set; }
    public DateOnly? To { get; set; }
}
