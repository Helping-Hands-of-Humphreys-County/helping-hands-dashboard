using HelpingHands.Server.Dtos.Users;
using HelpingHands.Server.Models;
using HelpingHands.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace HelpingHands.Server.Controllers;

[ApiController]
[Route("users")]
[Authorize]
public sealed class UsersController : ControllerBase
{
    private readonly UsersService _usersService;
    private readonly UserManager<AppUser> _userManager;

    public UsersController(UsersService usersService, UserManager<AppUser> userManager)
    {
        _usersService = usersService;
        _userManager = userManager;
    }

    [HttpGet]
    public async Task<ActionResult> List([FromQuery] UserQueryDto query, CancellationToken ct)
    {
        var result = await _usersService.GetPagedAsync(query, ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<UserDetailsDto>> Get(Guid id, CancellationToken ct)
    {
        var dto = await _usersService.GetDetailsAsync(id, ct);
        return dto is null ? NotFound() : Ok(dto);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserRequest dto, CancellationToken ct)
    {
        var requester = await _userManager.GetUserAsync(User);
        if (requester is null || !requester.IsActive)
        {
            return Unauthorized();
        }

        var (ok, id, inviteToken, error) = await _usersService.CreateAsync(dto, ct);
        if (!ok)
        {
            return BadRequest(new { message = error ?? "Unable to create user." });
        }

        // Return token in response body for dev workflows; callers should email it to user.
        var body = new { id, inviteToken };
        return CreatedAtAction(nameof(Get), new { id }, body);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateUserRequest dto, CancellationToken ct)
    {
        var requester = await _userManager.GetUserAsync(User);
        if (requester is null || !requester.IsActive)
        {
            return Unauthorized();
        }

        var (ok, error) = await _usersService.UpdateAsync(id, dto, ct);
        if (!ok)
        {
            return error is null ? NotFound() : BadRequest(new { message = error });
        }

        return NoContent();
    }

    [HttpPost("{id:guid}/deactivate")]
    public async Task<IActionResult> Deactivate(Guid id, CancellationToken ct)
    {
        var requester = await _userManager.GetUserAsync(User);
        if (requester is null || !requester.IsActive)
        {
            return Unauthorized();
        }

        // Prevent users from deactivating themselves
        if (requester.Id == id)
        {
            return BadRequest(new { message = "You cannot deactivate your own account." });
        }

        var ok = await _usersService.SetActiveAsync(id, false, ct);
        return ok ? NoContent() : NotFound();
    }

    [HttpPost("{id:guid}/activate")]
    public async Task<IActionResult> Activate(Guid id, CancellationToken ct)
    {
        var requester = await _userManager.GetUserAsync(User);
        if (requester is null || !requester.IsActive)
        {
            return Unauthorized();
        }

        var ok = await _usersService.SetActiveAsync(id, true, ct);
        return ok ? NoContent() : NotFound();
    }
}
