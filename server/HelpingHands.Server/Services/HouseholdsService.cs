using AutoMapper;
using AutoMapper.QueryableExtensions;
using HelpingHands.Server.Data;
using HelpingHands.Server.Dtos.Common;
using HelpingHands.Server.Dtos.Households;
using HelpingHands.Server.Dtos.Applications;
using HelpingHands.Server.Dtos.Assistance;
using HelpingHands.Server.Infrastructure;
using HelpingHands.Server.Models;
using Microsoft.EntityFrameworkCore;

namespace HelpingHands.Server.Services;

public sealed class HouseholdsService
{
    private readonly ApplicationDbContext _db;
    private readonly IMapper _mapper;

    private static readonly IReadOnlyDictionary<string, System.Linq.Expressions.Expression<Func<Household, object>>> SortMap =
        new Dictionary<string, System.Linq.Expressions.Expression<Func<Household, object>>>(StringComparer.OrdinalIgnoreCase)
        {
            ["street1"] = x => x.Street1,
            ["city"] = x => x.City,
            ["zip"] = x => x.Zip ?? string.Empty,
            ["memberCount"] = x => x.Clients.Count,
            ["lastActivityAt"] = x =>
                x.AssistanceEvents.Max(a => (DateTimeOffset?)a.OccurredAt)
                ?? x.Applications.Max(a => (DateTimeOffset?)(a.SubmittedAt ?? a.CreatedAt))
                ?? x.UpdatedAt
        };

    public HouseholdsService(ApplicationDbContext db, IMapper mapper)
    {
        _db = db;
        _mapper = mapper;
    }

    public async Task<PagedResponse<HouseholdListItemDto>> GetPagedAsync(HouseholdQueryDto query, CancellationToken ct = default)
    {
        var baseQuery = _db.Households
            .AsNoTracking()
            .Include(x => x.Clients)
            .Include(x => x.AssistanceEvents)
            .Include(x => x.Applications)
            .Where(x => query.Archived || !x.IsArchived);

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = query.Search.Trim();
            baseQuery = baseQuery.Where(x =>
                x.Street1.ToLower().Contains(term.ToLower()) ||
                x.City.ToLower().Contains(term.ToLower()) ||
                (x.Zip != null && x.Zip.Contains(term)) ||
                x.Clients.Any(c => c.FirstName.ToLower().Contains(term.ToLower()) || c.LastName.ToLower().Contains(term.ToLower()) || (c.Phone != null && c.Phone.Contains(term))));
        }

        var ordered = baseQuery.OrderByOrDefault(query.Sort, SortMap, x => x.Street1);
        var total = await ordered.CountAsync(ct);

        var items = await ordered
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ProjectTo<HouseholdListItemDto>(_mapper.ConfigurationProvider)
            .ToListAsync(ct);

        return new PagedResponse<HouseholdListItemDto>
        {
            Items = items,
            Page = query.Page,
            PageSize = query.PageSize,
            TotalCount = total
        };
    }

    public async Task<HouseholdDetailsDto?> GetDetailsAsync(Guid householdId, CancellationToken ct = default)
    {
        var household = await _db.Households
            .AsNoTracking()
            .Include(x => x.Clients)
            .SingleOrDefaultAsync(x => x.Id == householdId, ct);

        if (household is null)
        {
            return null;
        }

        var dto = _mapper.Map<HouseholdDetailsDto>(household);

        dto.RecentApplications = await _db.Applications
            .AsNoTracking()
            .Where(x => x.HouseholdId == householdId && !x.IsArchived)
            .OrderByDescending(x => x.SubmittedAt ?? x.CreatedAt)
            .Take(5)
            .ProjectTo<ApplicationListItemDto>(_mapper.ConfigurationProvider)
            .ToListAsync(ct);

        dto.RecentAssistance = await _db.AssistanceEvents
            .AsNoTracking()
            .Where(x => x.HouseholdId == householdId && !x.IsArchived)
            .OrderByDescending(x => x.OccurredAt)
            .Take(5)
            .ProjectTo<AssistanceEventListItemDto>(_mapper.ConfigurationProvider)
            .ToListAsync(ct);

        return dto;
    }

    public async Task<Guid> CreateAsync(CreateHouseholdRequest dto, CancellationToken ct = default)
    {
        var entity = _mapper.Map<Household>(dto);
        entity.Id = Guid.NewGuid();

        _db.Households.Add(entity);
        await _db.SaveChangesAsync(ct);
        return entity.Id;
    }

    public async Task<bool> UpdateAddressAsync(Guid householdId, UpdateHouseholdAddressRequest dto, CancellationToken ct = default)
    {
        var entity = await _db.Households.SingleOrDefaultAsync(x => x.Id == householdId, ct);
        if (entity is null)
        {
            return false;
        }

        _mapper.Map(dto, entity);
        entity.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> SetArchivedAsync(Guid householdId, bool isArchived, CancellationToken ct = default)
    {
        var entity = await _db.Households.SingleOrDefaultAsync(x => x.Id == householdId, ct);
        if (entity is null)
        {
            return false;
        }

        entity.IsArchived = isArchived;
        entity.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> AddMemberAsync(Guid householdId, Guid clientId, CancellationToken ct = default)
    {
        var client = await _db.Clients.SingleOrDefaultAsync(x => x.Id == clientId, ct);
        if (client is null)
        {
            return false;
        }

        client.HouseholdId = householdId;
        client.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> RemoveMemberAsync(Guid householdId, Guid clientId, CancellationToken ct = default)
    {
        var client = await _db.Clients.SingleOrDefaultAsync(x => x.Id == clientId && x.HouseholdId == householdId, ct);
        if (client is null)
        {
            return false;
        }

        client.HouseholdId = null;
        client.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> MoveMemberAsync(Guid clientId, Guid newHouseholdId, CancellationToken ct = default)
    {
        var client = await _db.Clients.SingleOrDefaultAsync(x => x.Id == clientId, ct);
        if (client is null)
        {
            return false;
        }

        client.HouseholdId = newHouseholdId;
        client.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(ct);
        return true;
    }
}
