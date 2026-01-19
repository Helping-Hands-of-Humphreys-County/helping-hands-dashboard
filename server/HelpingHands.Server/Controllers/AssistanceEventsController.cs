using HelpingHands.Server.Dtos.Assistance;
using HelpingHands.Server.Models;
using HelpingHands.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace HelpingHands.Server.Controllers;

[ApiController]
[Route("assistance-events")]
[Authorize]
public sealed class AssistanceEventsController : ControllerBase
{
    private readonly AssistanceService _assistanceService;
    private readonly UserManager<AppUser> _userManager;

    public AssistanceEventsController(AssistanceService assistanceService, UserManager<AppUser> userManager)
    {
        _assistanceService = assistanceService;
        _userManager = userManager;
    }

    [HttpGet]
    public async Task<ActionResult> List([FromQuery] AssistanceQueryDto query, CancellationToken ct)
    {
        var result = await _assistanceService.GetPagedAsync(query, ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<AssistanceEventDetailsDto>> Get(Guid id, CancellationToken ct)
    {
        var dto = await _assistanceService.GetDetailsAsync(id, ct);
        return dto is null ? NotFound() : Ok(dto);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateAssistanceEventRequest dto, CancellationToken ct)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user is null || !user.IsActive)
        {
            return Unauthorized();
        }

        var id = await _assistanceService.CreateAsync(dto, user.Id, ct);
        return CreatedAtAction(nameof(Get), new { id }, id);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateAssistanceEventRequest dto, CancellationToken ct)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user is null || !user.IsActive)
        {
            return Unauthorized();
        }

        var ok = await _assistanceService.UpdateAsync(id, dto, user.Id, ct);
        return ok ? NoContent() : NotFound();
    }

    [HttpPost("{id:guid}/archive")]
    public async Task<IActionResult> Archive(Guid id, CancellationToken ct)
    {
        var ok = await _assistanceService.SetArchivedAsync(id, true, ct);
        return ok ? NoContent() : NotFound();
    }

    [HttpPost("{id:guid}/unarchive")]
    public async Task<IActionResult> Unarchive(Guid id, CancellationToken ct)
    {
        var ok = await _assistanceService.SetArchivedAsync(id, false, ct);
        return ok ? NoContent() : NotFound();
    }
}
