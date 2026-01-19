using HelpingHands.Server.Data;
using HelpingHands.Server.Dtos.Dashboard;
using Microsoft.EntityFrameworkCore;

namespace HelpingHands.Server.Services;

public sealed class DashboardService
{
    private readonly ApplicationDbContext _db;

    public DashboardService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<DashboardSummaryDto> GetSummaryAsync(DashboardSummaryQueryDto query, CancellationToken ct = default)
    {
        var now = DateTimeOffset.UtcNow;
        var defaultFrom = new DateOnly(now.Year, now.Month, 1);
        var defaultTo = new DateOnly(now.Year, now.Month, DateTime.DaysInMonth(now.Year, now.Month));

        var from = query.From ?? defaultFrom;
        var to = query.To ?? defaultTo;

        var fromUtc = from.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var toUtc = to.ToDateTime(TimeOnly.MaxValue, DateTimeKind.Utc);

        var baseEvents = _db.AssistanceEvents
            .AsNoTracking()
            .Where(x => !x.IsArchived && x.OccurredAt >= fromUtc && x.OccurredAt <= toUtc);

        var householdsServed = await baseEvents
            .Select(x => x.HouseholdId)
            .Distinct()
            .CountAsync(ct);

        var clientsServed = await baseEvents
            .Where(x => x.ClientId != null)
            .Select(x => x.ClientId!.Value)
            .Distinct()
            .CountAsync(ct);

        var pantryItemData = await baseEvents
            .Where(x => x.ProgramType == "FoodPantry")
            .SelectMany(x => x.Items)
            .GroupBy(i => i.ItemType)
            .Select(g => new { ItemType = g.Key, Total = g.Sum(i => i.Quantity) })
            .ToListAsync(ct);

        var assistanceQuery = baseEvents.Where(x => x.ProgramType == "HelpingHands");

        var assistancePaidTotal = await assistanceQuery
            .Select(x => x.AmountPaid ?? 0)
            .SumAsync(ct);

        var assistanceByBillTypeData = await assistanceQuery
            .Where(x => x.BillType != null)
            .GroupBy(x => x.BillType!)
            .Select(g => new { BillType = g.Key, Total = g.Sum(x => x.AmountPaid ?? 0) })
            .ToListAsync(ct);

        var applicationsQuery = _db.Applications
            .AsNoTracking()
            .Where(x => !x.IsArchived)
            .Where(x => (x.SubmittedAt ?? x.CreatedAt) >= fromUtc && (x.SubmittedAt ?? x.CreatedAt) <= toUtc);

        var applicationsByStatusData = await applicationsQuery
            .GroupBy(x => x.Status)
            .Select(g => new { Status = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        var pantryItems = pantryItemData
            .ToDictionary(x => x.ItemType, x => x.Total, StringComparer.OrdinalIgnoreCase);

        var assistanceByBillType = assistanceByBillTypeData
            .ToDictionary(x => x.BillType, x => x.Total, StringComparer.OrdinalIgnoreCase);

        var applicationsByStatus = applicationsByStatusData
            .ToDictionary(x => x.Status, x => x.Count, StringComparer.OrdinalIgnoreCase);

        return new DashboardSummaryDto
        {
            From = from,
            To = to,
            HouseholdsServed = householdsServed,
            ClientsServed = clientsServed,
            PantryItemTotals = pantryItems,
            AssistancePaidTotal = assistancePaidTotal,
            AssistancePaidByBillType = assistanceByBillType,
            ApplicationsByStatus = applicationsByStatus
        };
    }
}
