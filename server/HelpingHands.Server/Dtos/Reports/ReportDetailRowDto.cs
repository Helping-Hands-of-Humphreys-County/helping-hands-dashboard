using HelpingHands.Server.Dtos.Assistance;

namespace HelpingHands.Server.Dtos.Reports;

public sealed class ReportDetailRowDto
{
    public Guid Id { get; set; }
    public string ProgramType { get; set; } = string.Empty;
    public DateTimeOffset OccurredAt { get; set; }

    public string Street1 { get; set; } = string.Empty;
    public string? Street2 { get; set; }
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string? Zip { get; set; }

    public string? ClientName { get; set; }
    public IReadOnlyList<string> ClientNames { get; set; } = Array.Empty<string>();

    public string? BillType { get; set; }
    public decimal? AmountPaid { get; set; }
    public string? CheckNumber { get; set; }
    public string? Notes { get; set; }

    public IReadOnlyList<AssistanceItemDto> Items { get; set; } = Array.Empty<AssistanceItemDto>();
}
