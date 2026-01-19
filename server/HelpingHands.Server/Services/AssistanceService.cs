using AutoMapper;
using AutoMapper.QueryableExtensions;
using HelpingHands.Server.Data;
using HelpingHands.Server.Dtos.Assistance;
using HelpingHands.Server.Dtos.Common;
using HelpingHands.Server.Infrastructure;
using HelpingHands.Server.Models;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace HelpingHands.Server.Services;

public sealed class AssistanceService
{
    private readonly ApplicationDbContext _db;
    private readonly IMapper _mapper;

    private static readonly IReadOnlyDictionary<string, Expression<Func<AssistanceEvent, object>>> SortMap =
        new Dictionary<string, Expression<Func<AssistanceEvent, object>>>(StringComparer.OrdinalIgnoreCase)
        {
            ["occurredAt"] = x => x.OccurredAt,
            ["programType"] = x => x.ProgramType,
            ["billType"] = x => x.BillType ?? string.Empty,
            ["amountPaid"] = x => x.AmountPaid ?? 0,
            ["street1"] = x => x.Household.Street1,
            ["clientName"] = x => x.Client != null ? x.Client.LastName + " " + x.Client.FirstName : string.Empty
        };

    public AssistanceService(ApplicationDbContext db, IMapper mapper)
    {
        _db = db;
        _mapper = mapper;
    }

    public async Task<PagedResponse<AssistanceEventListItemDto>> GetPagedAsync(AssistanceQueryDto query, CancellationToken ct = default)
    {
        var baseQuery = _db.AssistanceEvents
            .AsNoTracking()
            .Include(x => x.Household)
            .Include(x => x.Client)
            .Where(x => !x.IsArchived);

        if (!string.IsNullOrWhiteSpace(query.ProgramType))
        {
            baseQuery = baseQuery.Where(x => x.ProgramType == query.ProgramType);
        }

        if (query.From.HasValue)
        {
            var fromUtc = query.From.Value.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
            baseQuery = baseQuery.Where(x => x.OccurredAt >= fromUtc);
        }

        if (query.To.HasValue)
        {
            var toUtc = query.To.Value.ToDateTime(TimeOnly.MaxValue, DateTimeKind.Utc);
            baseQuery = baseQuery.Where(x => x.OccurredAt <= toUtc);
        }

        if (!string.IsNullOrWhiteSpace(query.Type))
        {
            var term = query.Type.Trim();
            baseQuery = baseQuery.Where(x => (x.BillType != null && x.BillType == term) || x.Items.Any(i => i.ItemType == term));
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = query.Search.Trim().ToLower();
            baseQuery = baseQuery.Where(x =>
                x.Household.Street1.ToLower().Contains(term) ||
                x.Household.City.ToLower().Contains(term) ||
                (x.Household.Zip != null && x.Household.Zip.Contains(term)) ||
                (x.Client != null && (x.Client.FirstName.ToLower().Contains(term) || x.Client.LastName.ToLower().Contains(term))));
        }

        var ordered = baseQuery.OrderByOrDefault(query.Sort, SortMap, x => x.OccurredAt);
        var total = await ordered.CountAsync(ct);
        var items = await ordered
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ProjectTo<AssistanceEventListItemDto>(_mapper.ConfigurationProvider)
            .ToListAsync(ct);

        return new PagedResponse<AssistanceEventListItemDto>
        {
            Items = items,
            Page = query.Page,
            PageSize = query.PageSize,
            TotalCount = total
        };
    }

    public async Task<AssistanceEventDetailsDto?> GetDetailsAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await _db.AssistanceEvents
            .AsNoTracking()
            .AsSplitQuery()
            .Include(x => x.Household)
            .Include(x => x.Client)
            .Include(x => x.Items)
            .SingleOrDefaultAsync(x => x.Id == id, ct);

        return entity is null ? null : _mapper.Map<AssistanceEventDetailsDto>(entity);
    }

    public async Task<Guid> CreateAsync(CreateAssistanceEventRequest dto, Guid recordedByUserId, CancellationToken ct = default)
    {
        var entity = new AssistanceEvent
        {
            Id = Guid.NewGuid(),
            ProgramType = dto.ProgramType,
            OccurredAt = dto.OccurredAt,
            HouseholdId = dto.HouseholdId,
            HouseholdMemberCount = dto.HouseholdMemberCount,
            ClientId = dto.ClientId,
            ApplicationId = dto.ApplicationId,
            BillType = dto.BillType,
            AmountPaid = dto.AmountPaid,
            CheckNumber = dto.CheckNumber,
            Notes = dto.Notes,
            RecordedByUserId = recordedByUserId,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
            Items = dto.Items.Select(i => new AssistanceItem
            {
                Id = Guid.NewGuid(),
                ItemType = i.ItemType,
                Quantity = i.Quantity
            }).ToList()
        };

        foreach (var item in entity.Items)
        {
            item.AssistanceEventId = entity.Id;
        }

        _db.AssistanceEvents.Add(entity);
        await _db.SaveChangesAsync(ct);

        // If this assistance was created for an application, mark that application approved
        if (entity.ApplicationId.HasValue)
        {
            var app = await _db.Applications.SingleOrDefaultAsync(a => a.Id == entity.ApplicationId.Value, ct);
            if (app is not null)
            {
                app.Status = "Approved";
                app.Decision = "Approved";
                try
                {
                    app.DecisionDate = DateOnly.FromDateTime(DateTime.UtcNow);
                }
                catch
                {
                    // ignore if DateOnly not supported in runtime
                }
                app.UpdatedAt = DateTimeOffset.UtcNow;
                app.UpdatedByUserId = recordedByUserId;
                await _db.SaveChangesAsync(ct);
            }
        }

        return entity.Id;
    }

    public async Task<bool> UpdateAsync(Guid id, UpdateAssistanceEventRequest dto, Guid recordedByUserId, CancellationToken ct = default)
    {
        var entity = await _db.AssistanceEvents.Include(x => x.Items).SingleOrDefaultAsync(x => x.Id == id, ct);
        if (entity is null)
        {
            return false;
        }

        entity.OccurredAt = dto.OccurredAt;
        entity.HouseholdId = dto.HouseholdId;
        entity.HouseholdMemberCount = dto.HouseholdMemberCount;
        entity.ClientId = dto.ClientId;
        entity.ApplicationId = dto.ApplicationId;
        entity.BillType = dto.BillType;
        entity.AmountPaid = dto.AmountPaid;
        entity.CheckNumber = dto.CheckNumber;
        entity.Notes = dto.Notes;
        entity.RecordedByUserId = recordedByUserId;
        entity.UpdatedAt = DateTimeOffset.UtcNow;

        _db.AssistanceItems.RemoveRange(entity.Items);
        entity.Items = dto.Items.Select(i => new AssistanceItem
        {
            Id = Guid.NewGuid(),
            AssistanceEventId = entity.Id,
            ItemType = i.ItemType,
            Quantity = i.Quantity
        }).ToList();

        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> SetArchivedAsync(Guid id, bool isArchived, CancellationToken ct = default)
    {
        var entity = await _db.AssistanceEvents.SingleOrDefaultAsync(x => x.Id == id, ct);
        if (entity is null)
        {
            return false;
        }

        entity.IsArchived = isArchived;
        entity.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(ct);
        return true;
    }
}
