using AutoMapper;
using AutoMapper.QueryableExtensions;
using HelpingHands.Server.Data;
using HelpingHands.Server.Dtos.Clients;
using HelpingHands.Server.Dtos.Clients.Notes;
using HelpingHands.Server.Dtos.Common;
using HelpingHands.Server.Dtos.Applications;
using HelpingHands.Server.Dtos.Assistance;
using HelpingHands.Server.Infrastructure;
using HelpingHands.Server.Models;
using Microsoft.EntityFrameworkCore;

namespace HelpingHands.Server.Services;

public sealed class ClientsService
{
    private readonly ApplicationDbContext _db;
    private readonly IMapper _mapper;

    private static readonly IReadOnlyDictionary<string, System.Linq.Expressions.Expression<Func<Client, object>>> SortMap =
        new Dictionary<string, System.Linq.Expressions.Expression<Func<Client, object>>>(StringComparer.OrdinalIgnoreCase)
        {
            ["lastName"] = x => x.LastName,
            ["firstName"] = x => x.FirstName,
            ["dob"] = x => x.Dob ?? DateOnly.MinValue,
            ["phone"] = x => x.Phone ?? string.Empty,
            ["street1"] = x => x.Household != null ? x.Household.Street1 : string.Empty,
            ["city"] = x => x.Household != null ? x.Household.City : string.Empty,
            ["zip"] = x => x.Household != null ? x.Household.Zip ?? string.Empty : string.Empty
        };

    public ClientsService(ApplicationDbContext db, IMapper mapper)
    {
        _db = db;
        _mapper = mapper;
    }

    public async Task<PagedResponse<ClientListItemDto>> GetPagedAsync(ClientQueryDto query, CancellationToken ct = default)
    {
        var baseQuery = _db.Clients
            .AsNoTracking()
            .Include(x => x.Household)
            .Where(x => query.Archived || !x.IsArchived);

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = query.Search.Trim();
            baseQuery = baseQuery.Where(x =>
                x.FirstName.ToLower().Contains(term.ToLower()) ||
                x.LastName.ToLower().Contains(term.ToLower()) ||
                (x.Phone != null && x.Phone.Contains(term)) ||
                (x.Household != null && (
                    x.Household.Street1.ToLower().Contains(term.ToLower()) ||
                    x.Household.City.ToLower().Contains(term.ToLower()) ||
                    (x.Household.Zip != null && x.Household.Zip.Contains(term))
                )));
        }

        var ordered = baseQuery.OrderByOrDefault(query.Sort, SortMap, x => x.LastName);

        var total = await ordered.CountAsync(ct);
        var items = await ordered
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ProjectTo<ClientListItemDto>(_mapper.ConfigurationProvider)
            .ToListAsync(ct);

        return new PagedResponse<ClientListItemDto>
        {
            Items = items,
            Page = query.Page,
            PageSize = query.PageSize,
            TotalCount = total
        };
    }

    public async Task<ClientDetailsDto?> GetDetailsAsync(Guid clientId, CancellationToken ct = default)
    {
        var client = await _db.Clients
            .AsNoTracking()
            .AsSplitQuery()
            .Include(x => x.Household)
            .Include(x => x.Notes.Where(n => !n.IsDeleted).OrderByDescending(n => n.CreatedAt))
                .ThenInclude(n => n.AuthorUser)
            .SingleOrDefaultAsync(x => x.Id == clientId, ct);

        if (client is null)
        {
            return null;
        }

        var dto = _mapper.Map<ClientDetailsDto>(client);

        if (client.HouseholdId.HasValue)
        {
            dto.HouseholdMembers = await _db.Clients
                .AsNoTracking()
                .Where(x => x.HouseholdId == client.HouseholdId && !x.IsArchived)
                .OrderBy(x => x.LastName)
                .ThenBy(x => x.FirstName)
                .ProjectTo<ClientListItemDto>(_mapper.ConfigurationProvider)
                .ToListAsync(ct);
        }

        dto.Applications = await _db.Applications
            .AsNoTracking()
            .Where(x => x.ApplicantClientId == clientId && !x.IsArchived)
            .OrderByDescending(x => x.SubmittedAt ?? x.CreatedAt)
            .Take(5)
            .ProjectTo<ApplicationListItemDto>(_mapper.ConfigurationProvider)
            .ToListAsync(ct);

        dto.Assistance = await _db.AssistanceEvents
            .AsNoTracking()
            .Where(x => x.ClientId == clientId && !x.IsArchived)
            .OrderByDescending(x => x.OccurredAt)
            .Take(5)
            .ProjectTo<AssistanceEventListItemDto>(_mapper.ConfigurationProvider)
            .ToListAsync(ct);

        if (client.HouseholdId.HasValue)
        {
            var householdId = client.HouseholdId.Value;

            dto.HouseholdNotes = await _db.ClientNotes
                .AsNoTracking()
                .Where(x => !x.IsDeleted && x.Client != null && x.Client.HouseholdId == householdId)
                .OrderByDescending(x => x.CreatedAt)
                .ProjectTo<HouseholdNoteDto>(_mapper.ConfigurationProvider)
                .ToListAsync(ct);

            dto.HouseholdAssistance = await _db.AssistanceEvents
                .AsNoTracking()
                .Where(x => x.HouseholdId == householdId && !x.IsArchived)
                .OrderByDescending(x => x.OccurredAt)
                .ProjectTo<AssistanceEventListItemDto>(_mapper.ConfigurationProvider)
                .ToListAsync(ct);
        }

        var income = await _db.ApplicationHouseholdMembers
            .AsNoTracking()
            .Where(x => x.ClientId == clientId && x.IncomeAmount != null)
            .Join(_db.Applications.AsNoTracking(), m => m.ApplicationId, a => a.Id, (m, a) => new { Member = m, App = a })
            .OrderByDescending(x => x.App.SubmittedAt ?? x.App.CreatedAt)
            .Select(x => new ClientIncomeSnapshotDto
            {
                ApplicationId = x.App.Id,
                IncomeAmount = x.Member.IncomeAmount ?? 0,
                IncomeSource = x.Member.IncomeSource,
                ReportedAt = x.App.SubmittedAt ?? x.App.CreatedAt
            })
            .FirstOrDefaultAsync(ct);

        dto.LatestIncomeSnapshot = income;

        return dto;
    }

    public async Task<Guid> CreateAsync(CreateClientRequest dto, CancellationToken ct = default)
    {
        var entity = _mapper.Map<Client>(dto);
        entity.Id = Guid.NewGuid();

        _db.Clients.Add(entity);
        await _db.SaveChangesAsync(ct);
        return entity.Id;
    }

    public async Task<bool> UpdateAsync(Guid clientId, UpdateClientRequest dto, CancellationToken ct = default)
    {
        var entity = await _db.Clients.SingleOrDefaultAsync(x => x.Id == clientId, ct);
        if (entity is null)
        {
            return false;
        }

        _mapper.Map(dto, entity);
        entity.UpdatedAt = DateTimeOffset.UtcNow;

        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> SetArchivedAsync(Guid clientId, bool isArchived, CancellationToken ct = default)
    {
        var entity = await _db.Clients.SingleOrDefaultAsync(x => x.Id == clientId, ct);
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
