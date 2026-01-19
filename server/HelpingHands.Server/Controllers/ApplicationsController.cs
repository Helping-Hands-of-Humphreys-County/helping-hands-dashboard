using HelpingHands.Server.Dtos.Applications;
using HelpingHands.Server.Models;
using HelpingHands.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace HelpingHands.Server.Controllers;

[ApiController]
[Route("applications")]
[Authorize]
public sealed class ApplicationsController : ControllerBase
{
    private readonly ApplicationsService _applicationsService;
    private readonly UserManager<AppUser> _userManager;

    public ApplicationsController(ApplicationsService applicationsService, UserManager<AppUser> userManager)
    {
        _applicationsService = applicationsService;
        _userManager = userManager;
    }

    [HttpGet]
    public async Task<ActionResult> List([FromQuery] ApplicationQueryDto query, CancellationToken ct)
    {
        var result = await _applicationsService.GetPagedAsync(query, ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ApplicationDetailsDto>> Get(Guid id, CancellationToken ct)
    {
        var dto = await _applicationsService.GetDetailsAsync(id, ct);
        return dto is null ? NotFound() : Ok(dto);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateApplicationRequest dto, CancellationToken ct)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user is null || !user.IsActive)
        {
            return Unauthorized();
        }

        var id = await _applicationsService.CreateAsync(dto, user.Id, ct);
        return CreatedAtAction(nameof(Get), new { id }, id);
    }

    [HttpPost("both")]
    public async Task<ActionResult<CreateBothApplicationsResponse>> CreateBoth([FromBody] CreateBothApplicationsRequest dto, CancellationToken ct)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user is null || !user.IsActive)
        {
            return Unauthorized();
        }

        var response = await _applicationsService.CreateBothAsync(dto, user.Id, ct);
        return Ok(response);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateApplicationRequest dto, CancellationToken ct)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user is null || !user.IsActive)
        {
            return Unauthorized();
        }

        var ok = await _applicationsService.UpdateAsync(id, dto, user.Id, ct);
        return ok ? NoContent() : NotFound();
    }

    [HttpPost("{id:guid}/archive")]
    public async Task<IActionResult> Archive(Guid id, CancellationToken ct)
    {
        var ok = await _applicationsService.SetArchivedAsync(id, true, ct);
        return ok ? NoContent() : NotFound();
    }

    [HttpPost("{id:guid}/unarchive")]
    public async Task<IActionResult> Unarchive(Guid id, CancellationToken ct)
    {
        var ok = await _applicationsService.SetArchivedAsync(id, false, ct);
        return ok ? NoContent() : NotFound();
    }
}
