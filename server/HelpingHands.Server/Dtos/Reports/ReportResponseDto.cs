namespace HelpingHands.Server.Dtos.Reports;

public sealed class ReportResponseDto
{
    public ReportSummaryDto Summary { get; set; } = new();
    public DateTimeOffset GeneratedAt { get; set; } = DateTimeOffset.UtcNow;
    public IReadOnlyList<ReportDetailRowDto> Details { get; set; } = Array.Empty<ReportDetailRowDto>();
}
