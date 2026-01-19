using AutoMapper;
using AutoMapper.QueryableExtensions;
using HelpingHands.Server.Data;
using HelpingHands.Server.Dtos.Applications;
using HelpingHands.Server.Dtos.Assistance;
using HelpingHands.Server.Dtos.Clients.Notes;
using HelpingHands.Server.Dtos.Common;
using HelpingHands.Server.Infrastructure;
using HelpingHands.Server.Models;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace HelpingHands.Server.Services;

public sealed class ApplicationsService
{
    private readonly ApplicationDbContext _db;
    private readonly IMapper _mapper;

    private static readonly IReadOnlyDictionary<string, Expression<Func<Application, object>>> SortMap =
        new Dictionary<string, Expression<Func<Application, object>>>(StringComparer.OrdinalIgnoreCase)
        {
            ["submittedAt"] = x => x.SubmittedAt ?? x.CreatedAt,
            ["programType"] = x => x.ProgramType,
            ["status"] = x => x.Status,
            ["applicantName"] = x => x.ApplicantClient.LastName + " " + x.ApplicantClient.FirstName,
            ["street1"] = x => x.Household.Street1,
            ["zip"] = x => x.Household.Zip ?? string.Empty,
            ["decision"] = x => x.Decision
        };

    public ApplicationsService(ApplicationDbContext db, IMapper mapper)
    {
        _db = db;
        _mapper = mapper;
    }

    public async Task<PagedResponse<ApplicationListItemDto>> GetPagedAsync(ApplicationQueryDto query, CancellationToken ct = default)
    {
        var baseQuery = _db.Applications
            .AsNoTracking()
            .Include(x => x.ApplicantClient)
            .Include(x => x.Household)
            .Where(x => query.Archived || !x.IsArchived);

        if (!string.IsNullOrWhiteSpace(query.ProgramType))
        {
            baseQuery = baseQuery.Where(x => x.ProgramType == query.ProgramType);
        }

        if (!string.IsNullOrWhiteSpace(query.Status))
        {
            baseQuery = baseQuery.Where(x => x.Status == query.Status);
        }

        if (query.From.HasValue)
        {
            var fromUtc = query.From.Value.ToDateTime(TimeOnly.MinValue, DateTimeKind.Utc);
            baseQuery = baseQuery.Where(x => (x.SubmittedAt ?? x.CreatedAt) >= fromUtc);
        }

        if (query.To.HasValue)
        {
            var toUtc = query.To.Value.ToDateTime(TimeOnly.MaxValue, DateTimeKind.Utc);
            baseQuery = baseQuery.Where(x => (x.SubmittedAt ?? x.CreatedAt) <= toUtc);
        }

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = query.Search.Trim().ToLower();
            baseQuery = baseQuery.Where(x =>
                (x.ApplicantClient.FirstName.ToLower().Contains(term) || x.ApplicantClient.LastName.ToLower().Contains(term)) ||
                x.Household.Street1.ToLower().Contains(term) ||
                x.Household.City.ToLower().Contains(term) ||
                (x.Household.Zip != null && x.Household.Zip.Contains(term)));
        }

        var ordered = baseQuery.OrderByOrDefault(query.Sort, SortMap, x => x.SubmittedAt ?? x.CreatedAt);
        var total = await ordered.CountAsync(ct);
        var items = await ordered
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ProjectTo<ApplicationListItemDto>(_mapper.ConfigurationProvider)
            .ToListAsync(ct);

        return new PagedResponse<ApplicationListItemDto>
        {
            Items = items,
            Page = query.Page,
            PageSize = query.PageSize,
            TotalCount = total
        };
    }

    public async Task<ApplicationDetailsDto?> GetDetailsAsync(Guid id, CancellationToken ct = default)
    {
        var entity = await _db.Applications
            .AsNoTracking()
            .AsSplitQuery()
            .Include(x => x.ApplicantClient)
            .Include(x => x.Household)
            .Include(x => x.HouseholdMembers)
            .Include(x => x.BillRequests)
            .SingleOrDefaultAsync(x => x.Id == id, ct);

        if (entity is null)
        {
            return null;
        }

        var dto = _mapper.Map<ApplicationDetailsDto>(entity);

        dto.Assistance = await _db.AssistanceEvents
            .AsNoTracking()
            .Where(x => x.ApplicationId == id && !x.IsArchived)
            .OrderByDescending(x => x.OccurredAt)
            .ProjectTo<AssistanceEventListItemDto>(_mapper.ConfigurationProvider)
            .ToListAsync(ct);

        dto.HouseholdNotes = await _db.ClientNotes
            .AsNoTracking()
            .Where(x => !x.IsDeleted && x.Client != null && x.Client.HouseholdId == entity.HouseholdId)
            .OrderByDescending(x => x.CreatedAt)
            .ProjectTo<HouseholdNoteDto>(_mapper.ConfigurationProvider)
            .ToListAsync(ct);

        dto.HouseholdAssistance = await _db.AssistanceEvents
            .AsNoTracking()
            .Where(x => x.HouseholdId == entity.HouseholdId && !x.IsArchived)
            .OrderByDescending(x => x.OccurredAt)
            .ProjectTo<AssistanceEventListItemDto>(_mapper.ConfigurationProvider)
            .ToListAsync(ct);

        return dto;
    }

    public async Task<Guid> CreateAsync(CreateApplicationRequest dto, Guid userId, CancellationToken ct = default)
    {
        var entity = _mapper.Map<Application>(dto);
        entity.Id = Guid.NewGuid();
        entity.CreatedByUserId = userId;
        entity.CreatedAt = DateTimeOffset.UtcNow;
        entity.UpdatedAt = entity.CreatedAt;

        entity.HouseholdMembers = dto.HouseholdMembers.Select(m => new ApplicationHouseholdMember
        {
            Id = Guid.NewGuid(),
            ApplicationId = entity.Id,
            ClientId = m.ClientId,
            FullName = m.FullName,
            Dob = m.Dob,
            RelationshipToApplicant = m.RelationshipToApplicant,
            IncomeAmount = m.IncomeAmount,
            IncomeSource = m.IncomeSource,
            CreatedAt = DateTimeOffset.UtcNow
        }).ToList();

        entity.BillRequests = dto.BillRequests.Select(b => new ApplicationBillRequest
        {
            Id = Guid.NewGuid(),
            ApplicationId = entity.Id,
            BillType = b.BillType,
            AmountRequested = b.AmountRequested,
            AccountNumber = b.AccountNumber
        }).ToList();

        _db.Applications.Add(entity);
        await _db.SaveChangesAsync(ct);
        return entity.Id;
    }

    public async Task<CreateBothApplicationsResponse> CreateBothAsync(CreateBothApplicationsRequest dto, Guid userId, CancellationToken ct = default)
    {
        using var tx = await _db.Database.BeginTransactionAsync(ct);

        var sharedMembers = dto.HouseholdMembers.Select(m => new ApplicationHouseholdMember
        {
            Id = Guid.NewGuid(),
            ClientId = m.ClientId,
            FullName = m.FullName,
            Dob = m.Dob,
            RelationshipToApplicant = m.RelationshipToApplicant,
            IncomeAmount = m.IncomeAmount,
            IncomeSource = m.IncomeSource,
            CreatedAt = DateTimeOffset.UtcNow
        }).ToList();

        var foodApp = BuildApplicationEntity(dto, userId, "FoodPantry", sharedMembers, billRequests: new());
        var helpApp = BuildApplicationEntity(dto, userId, "HelpingHands", sharedMembers.Select(sm => CloneMember(sm)).ToList(),
            dto.BillRequests.Select(b => new ApplicationBillRequest
            {
                Id = Guid.NewGuid(),
                BillType = b.BillType,
                AmountRequested = b.AmountRequested,
                AccountNumber = b.AccountNumber
            }).ToList());

        _db.Applications.AddRange(foodApp, helpApp);
        await _db.SaveChangesAsync(ct);
        await tx.CommitAsync(ct);

        return new CreateBothApplicationsResponse
        {
            FoodPantryApplicationId = foodApp.Id,
            HelpingHandsApplicationId = helpApp.Id
        };
    }

    public async Task<bool> UpdateAsync(Guid id, UpdateApplicationRequest dto, Guid userId, CancellationToken ct = default)
    {
        var entity = await _db.Applications.SingleOrDefaultAsync(x => x.Id == id, ct);

        if (entity is null)
        {
            return false;
        }

        _mapper.Map(dto, entity);
        entity.UpdatedAt = DateTimeOffset.UtcNow;
        entity.UpdatedByUserId = userId;

        await _db.ApplicationHouseholdMembers
            .Where(x => x.ApplicationId == id)
            .ExecuteDeleteAsync(ct);

        await _db.ApplicationBillRequests
            .Where(x => x.ApplicationId == id)
            .ExecuteDeleteAsync(ct);

        var newMembers = dto.HouseholdMembers.Select(m => new ApplicationHouseholdMember
        {
            Id = Guid.NewGuid(),
            ApplicationId = id,
            ClientId = m.ClientId,
            FullName = m.FullName,
            Dob = m.Dob,
            RelationshipToApplicant = m.RelationshipToApplicant,
            IncomeAmount = m.IncomeAmount,
            IncomeSource = m.IncomeSource,
            CreatedAt = DateTimeOffset.UtcNow
        }).ToList();

        var newBills = dto.BillRequests.Select(b => new ApplicationBillRequest
        {
            Id = Guid.NewGuid(),
            ApplicationId = id,
            BillType = b.BillType,
            AmountRequested = b.AmountRequested,
            AccountNumber = b.AccountNumber
        }).ToList();

        if (newMembers.Count > 0)
        {
            _db.ApplicationHouseholdMembers.AddRange(newMembers);
        }

        if (newBills.Count > 0)
        {
            _db.ApplicationBillRequests.AddRange(newBills);
        }

        await _db.SaveChangesAsync(ct);
        return true;
    }

    public async Task<bool> SetArchivedAsync(Guid id, bool isArchived, CancellationToken ct = default)
    {
        var entity = await _db.Applications.SingleOrDefaultAsync(x => x.Id == id, ct);
        if (entity is null)
        {
            return false;
        }

        entity.IsArchived = isArchived;
        entity.UpdatedAt = DateTimeOffset.UtcNow;
        await _db.SaveChangesAsync(ct);
        return true;
    }

    private static Application BuildApplicationEntity(CreateBothApplicationsRequest dto, Guid userId, string programType, List<ApplicationHouseholdMember> members, List<ApplicationBillRequest> billRequests)
    {
        var app = new Application
        {
            Id = Guid.NewGuid(),
            ProgramType = programType,
            Status = "Submitted",
            SubmittedAt = DateTimeOffset.UtcNow,
            ApplicantClientId = dto.ApplicantClientId,
            HouseholdId = dto.HouseholdId,
            EmergencySummary = dto.EmergencySummary,
            TotalHouseholdMonthlyIncome = dto.TotalHouseholdMonthlyIncome,
            ReceivedUtilityAssistancePastYear = dto.ReceivedUtilityAssistancePastYear,
            UtilityAssistanceFrom = dto.UtilityAssistanceFrom,
            PreventionPlan = dto.PreventionPlan,
            ReceivesFoodStamps = dto.ReceivesFoodStamps,
            FoodStampsAmount = dto.FoodStampsAmount,
            FoodStampsDateAvailable = dto.FoodStampsDateAvailable,
            LandlordName = dto.LandlordName,
            LandlordPhone = dto.LandlordPhone,
            LandlordAddress = dto.LandlordAddress,
            VerifiedByUserId = dto.VerifiedByUserId,
            Decision = "Pending",
            CreatedByUserId = userId,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow,
            HouseholdMembers = members,
            BillRequests = billRequests
        };

        foreach (var member in app.HouseholdMembers)
        {
            member.ApplicationId = app.Id;
        }

        foreach (var bill in app.BillRequests)
        {
            bill.ApplicationId = app.Id;
        }

        return app;
    }

    private static ApplicationHouseholdMember CloneMember(ApplicationHouseholdMember member)
    {
        return new ApplicationHouseholdMember
        {
            Id = Guid.NewGuid(),
            ClientId = member.ClientId,
            FullName = member.FullName,
            Dob = member.Dob,
            RelationshipToApplicant = member.RelationshipToApplicant,
            IncomeAmount = member.IncomeAmount,
            IncomeSource = member.IncomeSource,
            CreatedAt = DateTimeOffset.UtcNow
        };
    }
}
