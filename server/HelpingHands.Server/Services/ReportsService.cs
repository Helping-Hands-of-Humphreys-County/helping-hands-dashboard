using HelpingHands.Server.Data;
using HelpingHands.Server.Dtos.Assistance;
using HelpingHands.Server.Dtos.Reports;
using Microsoft.EntityFrameworkCore;
using HelpingHands.Server.Models;

namespace HelpingHands.Server.Services;

public sealed class ReportsService
{
    private static readonly HashSet<string> AllowedPrograms = new(StringComparer.OrdinalIgnoreCase)
    {
        "FoodPantry",
        "HelpingHands",
        "Both"
    };

    private readonly ApplicationDbContext _db;

    public ReportsService(ApplicationDbContext db)
    {
        _db = db;
    }

    public async Task<ReportResponseDto?> GenerateAsync(ReportQueryDto query, CancellationToken ct = default)
    {
        var program = string.IsNullOrWhiteSpace(query.Program) ? "Both" : query.Program.Trim();
        if (!AllowedPrograms.Contains(program))
        {
            return null;
        }

        var now = DateTimeOffset.UtcNow;
        var defaultFrom = new DateOnly(now.Year, now.Month, 1);
        var defaultTo = new DateOnly(now.Year, now.Month, DateTime.DaysInMonth(now.Year, now.Month));

        var from = query.From ?? defaultFrom;
        var to = query.To ?? defaultTo;

        var fromUtc = from.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
        var toUtc = to.ToDateTime(TimeOnly.MaxValue, DateTimeKind.Utc);

        var summaryEvents = _db.AssistanceEvents
            .AsNoTracking()
            .Where(x => !x.IsArchived)
            .Where(x => x.OccurredAt >= fromUtc && x.OccurredAt <= toUtc);

        if (!program.Equals("Both", StringComparison.OrdinalIgnoreCase))
        {
            summaryEvents = summaryEvents.Where(x => x.ProgramType == program);
        }

        var totalEvents = await summaryEvents.CountAsync(ct);
        var householdCount = await summaryEvents.Select(x => x.HouseholdId).Distinct().CountAsync(ct);

        // Count unique clients served. If an event references a household, all members of that household
        // are considered served. Build the set by combining event-level clients and household members.
        var servedClientIds = new HashSet<Guid>();

        var clientIdsFromEvents = await summaryEvents.Where(x => x.ClientId != null).Select(x => x.ClientId!.Value).ToListAsync(ct);
        foreach (var cid in clientIdsFromEvents) servedClientIds.Add(cid);

        var householdIds = await summaryEvents.Select(x => x.HouseholdId).Distinct().ToListAsync(ct);
        if (householdIds.Count > 0)
        {
            var memberClientIds = await _db.Clients
                .AsNoTracking()
                .Where(c => c.HouseholdId != null && householdIds.Contains(c.HouseholdId.Value))
                .Select(c => c.Id)
                .ToListAsync(ct);

            foreach (var cid in memberClientIds) servedClientIds.Add(cid);
        }

        var clientCount = servedClientIds.Count;

        var pantryItemsData = await _db.AssistanceEvents
            .AsNoTracking()
            .Where(x => !x.IsArchived)
            .Where(x => x.OccurredAt >= fromUtc && x.OccurredAt <= toUtc)
            .Where(x => x.ProgramType == "FoodPantry")
            .Join(
                _db.AssistanceItems.AsNoTracking(),
                e => e.Id,
                i => i.AssistanceEventId,
                (e, i) => new { i.ItemType, i.Quantity })
            .GroupBy(x => x.ItemType)
            .Select(g => new ValueTuple<string, int>(g.Key, g.Sum(x => x.Quantity)))
            .ToListAsync(ct);

        var assistancePaidTotal = await summaryEvents
            .Where(x => x.ProgramType == "HelpingHands")
            .Select(x => x.AmountPaid ?? 0)
            .SumAsync(ct);

        IQueryable<AssistanceEvent> detailEvents = _db.AssistanceEvents
            .AsNoTracking()
            .Where(x => !x.IsArchived)
            .Where(x => x.OccurredAt >= fromUtc && x.OccurredAt <= toUtc)
            .Include(x => x.Household)
            .Include(x => x.Client)
            .Include(x => x.Items)
            ;

        if (!program.Equals("Both", StringComparison.OrdinalIgnoreCase))
        {
            detailEvents = detailEvents.Where(x => x.ProgramType == program);
        }

        var detailRows = await detailEvents
            .OrderByDescending(x => x.OccurredAt)
            .Select(x => new ReportDetailRowDto
            {
                Id = x.Id,
                ProgramType = x.ProgramType,
                OccurredAt = x.OccurredAt,
                Street1 = x.Household.Street1,
                Street2 = x.Household.Street2,
                City = x.Household.City,
                State = x.Household.State,
                Zip = x.Household.Zip,
                ClientName = x.Client == null
                    ? null
                    : ((x.Client.FirstName ?? string.Empty) + " " + (x.Client.LastName ?? string.Empty)).Trim(),
                ClientNames = Array.Empty<string>(),
                BillType = x.BillType,
                AmountPaid = x.AmountPaid,
                CheckNumber = x.CheckNumber,
                Notes = x.Notes,
                Items = new List<AssistanceItemDto>()
            })
            .ToListAsync(ct);

        if (detailRows.Count > 0)
        {
            var eventRefs = await detailEvents
                .Select(x => new { x.Id, ClientId = x.ClientId, HouseholdId = x.HouseholdId })
                .ToListAsync(ct);

            var clientIds = eventRefs.Where(e => e.ClientId != null).Select(e => e.ClientId!.Value).Distinct().ToList();
            var householdIdsForEvents = eventRefs.Select(e => e.HouseholdId).Distinct().ToList();

            var clientNamesMap = new Dictionary<Guid, string>();
            if (clientIds.Count > 0)
            {
                var clients = await _db.Clients.AsNoTracking()
                    .Where(c => clientIds.Contains(c.Id))
                    .Select(c => new { c.Id, Name = ((c.FirstName ?? string.Empty) + " " + (c.LastName ?? string.Empty)).Trim() })
                    .ToListAsync(ct);
                foreach (var c in clients) clientNamesMap[c.Id] = c.Name;
            }

            var householdMembers = new List<(Guid HouseholdId, Guid ClientId, string Name)>();
            if (householdIdsForEvents.Count > 0)
            {
                var hm = await _db.Clients.AsNoTracking()
                    .Where(c => c.HouseholdId != null && householdIdsForEvents.Contains(c.HouseholdId.Value))
                    .Select(c => new { HouseholdId = c.HouseholdId!.Value, c.Id, Name = ((c.FirstName ?? string.Empty) + " " + (c.LastName ?? string.Empty)).Trim() })
                    .ToListAsync(ct);
                householdMembers = hm.Select(r => (r.HouseholdId, r.Id, r.Name)).ToList();
            }

            var membersByHousehold = householdMembers
                .GroupBy(x => x.HouseholdId)
                .ToDictionary(g => g.Key, g => g.Select(x => x.Name).ToList());

            var eventClientNames = eventRefs.ToDictionary(e => e.Id, e =>
            {
                var list = new List<string>();
                if (membersByHousehold.TryGetValue(e.HouseholdId, out var members)) list.AddRange(members);
                if (e.ClientId != null && clientNamesMap.TryGetValue(e.ClientId.Value, out var nm) && !list.Contains(nm))
                {
                    // ensure the referenced client appears (put first)
                    list.Insert(0, nm);
                }
                return list;
            });

            foreach (var row in detailRows)
            {
                if (eventClientNames.TryGetValue(row.Id, out var list))
                {
                    row.ClientNames = list;
                    if (row.ClientName == null && list.Count > 0) row.ClientName = list.First();
                }
            }
        }
            var pantryItems = pantryItemsData
                .ToDictionary(t => t.Item1, t => t.Item2, StringComparer.OrdinalIgnoreCase);

            var assistanceByBillTypeData = await summaryEvents
                .Where(x => x.BillType != null)
                .GroupBy(x => x.BillType!)
                .Select(g => new { BillType = g.Key, Total = g.Sum(x => x.AmountPaid ?? 0) })
                .ToListAsync(ct);

            var assistanceByBillType = assistanceByBillTypeData
                .ToDictionary(x => x.BillType, x => x.Total, StringComparer.OrdinalIgnoreCase);

            var summary = new ReportSummaryDto
            {
                Program = program,
                From = from,
                To = to,
                TotalEvents = totalEvents,
                UniqueHouseholds = householdCount,
                UniqueClients = clientCount,
                PantryItemTotals = pantryItems,
                AssistancePaidTotal = assistancePaidTotal,
                AssistancePaidByBillType = assistanceByBillType
            };

            return new ReportResponseDto
            {
                Summary = summary,
                GeneratedAt = DateTimeOffset.UtcNow,
                Details = detailRows
            };
    }
}
