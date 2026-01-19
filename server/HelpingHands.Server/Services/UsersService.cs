using AutoMapper;
using AutoMapper.QueryableExtensions;
using HelpingHands.Server.Dtos.Common;
using HelpingHands.Server.Dtos.Users;
using HelpingHands.Server.Infrastructure;
using HelpingHands.Server.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Linq.Expressions;

namespace HelpingHands.Server.Services;

public sealed class UsersService
{
    private readonly UserManager<AppUser> _userManager;
    private readonly IMapper _mapper;
    private readonly IEmailSender _emailSender;
    private readonly IConfiguration _config;

    private static readonly IReadOnlyDictionary<string, Expression<Func<AppUser, object>>> SortMap =
        new Dictionary<string, Expression<Func<AppUser, object>>>(StringComparer.OrdinalIgnoreCase)
        {
            ["displayName"] = x => x.DisplayName,
            ["email"] = x => x.Email ?? string.Empty,
            ["isActive"] = x => x.IsActive,
            ["createdAt"] = x => x.CreatedAt,
            ["updatedAt"] = x => x.UpdatedAt
        };

    public UsersService(UserManager<AppUser> userManager, IMapper mapper, IEmailSender emailSender, IConfiguration config)
    {
        _userManager = userManager;
        _mapper = mapper;
        _emailSender = emailSender;
        _config = config;
    }

    public async Task<PagedResponse<UserListItemDto>> GetPagedAsync(UserQueryDto query, CancellationToken ct = default)
    {
        var baseQuery = _userManager.Users.AsNoTracking();

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = query.Search.Trim().ToLower();
            baseQuery = baseQuery.Where(x =>
                x.DisplayName.ToLower().Contains(term) ||
                (x.Email != null && x.Email.ToLower().Contains(term)));
        }

        var ordered = baseQuery.OrderByOrDefault(query.Sort, SortMap, x => x.DisplayName);
        var total = await ordered.CountAsync(ct);
        var items = await ordered
            .Skip((query.Page - 1) * query.PageSize)
            .Take(query.PageSize)
            .ProjectTo<UserListItemDto>(_mapper.ConfigurationProvider)
            .ToListAsync(ct);

        return new PagedResponse<UserListItemDto>
        {
            Items = items,
            Page = query.Page,
            PageSize = query.PageSize,
            TotalCount = total
        };
    }

    public async Task<UserDetailsDto?> GetDetailsAsync(Guid id, CancellationToken ct = default)
    {
        var user = await _userManager.Users
            .AsNoTracking()
            .SingleOrDefaultAsync(x => x.Id == id, ct);

        return user is null ? null : _mapper.Map<UserDetailsDto>(user);
    }

    public async Task<(bool ok, Guid? id, string? inviteToken, string? error)> CreateAsync(CreateUserRequest dto, CancellationToken ct = default)
    {
        var user = new AppUser
        {
            Id = Guid.NewGuid(),
            DisplayName = dto.DisplayName,
            Email = dto.Email,
            UserName = dto.Email,
            IsActive = true,
            CreatedAt = DateTimeOffset.UtcNow,
            UpdatedAt = DateTimeOffset.UtcNow
        };

        IdentityResult result;
        string? inviteToken = null;

        if (string.IsNullOrWhiteSpace(dto.Password))
        {
            // When no password is provided by the creator, create the account with a default
            // password and require the user to change it on first interactive login.
            const string defaultPassword = "#H3lpingH4nds";
            user.MustChangePassword = true;
            result = await _userManager.CreateAsync(user, defaultPassword);
            if (!result.Succeeded)
            {
                return (false, null, null, string.Join("; ", result.Errors.Select(e => e.Description)));
            }

            // No invite token/email when creating with default password; admin should share the default password.
            inviteToken = null;
        }
        else
        {
            result = await _userManager.CreateAsync(user, dto.Password);
            if (!result.Succeeded)
            {
                return (false, null, null, string.Join("; ", result.Errors.Select(e => e.Description)));
            }
        }

        return (true, user.Id, inviteToken, null);
    }

    public async Task<(bool ok, string? error)> UpdateAsync(Guid id, UpdateUserRequest dto, CancellationToken ct = default)
    {
        var user = await _userManager.Users.SingleOrDefaultAsync(x => x.Id == id, ct);
        if (user is null)
        {
            return (false, null);
        }

        user.DisplayName = dto.DisplayName;
        user.UpdatedAt = DateTimeOffset.UtcNow;

        var emailResult = await _userManager.SetEmailAsync(user, dto.Email);
        if (!emailResult.Succeeded)
        {
            return (false, string.Join("; ", emailResult.Errors.Select(e => e.Description)));
        }

        var usernameResult = await _userManager.SetUserNameAsync(user, dto.Email);
        if (!usernameResult.Succeeded)
        {
            return (false, string.Join("; ", usernameResult.Errors.Select(e => e.Description)));
        }

        var updateResult = await _userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
        {
            return (false, string.Join("; ", updateResult.Errors.Select(e => e.Description)));
        }

        return (true, null);
    }

    public async Task<bool> SetActiveAsync(Guid id, bool isActive, CancellationToken ct = default)
    {
        var user = await _userManager.Users.SingleOrDefaultAsync(x => x.Id == id, ct);
        if (user is null)
        {
            return false;
        }

        user.IsActive = isActive;
        user.UpdatedAt = DateTimeOffset.UtcNow;

        var result = await _userManager.UpdateAsync(user);
        return result.Succeeded;
    }
}
