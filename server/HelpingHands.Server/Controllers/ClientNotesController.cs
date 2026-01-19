using HelpingHands.Server.Dtos.Clients.Notes;
using HelpingHands.Server.Models;
using HelpingHands.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace HelpingHands.Server.Controllers;

[ApiController]
[Route("clients/{clientId:guid}/notes")]
[Authorize]
public sealed class ClientNotesController : ControllerBase
{
    private readonly ClientNotesService _notesService;
    private readonly UserManager<AppUser> _userManager;

    public ClientNotesController(ClientNotesService notesService, UserManager<AppUser> userManager)
    {
        _notesService = notesService;
        _userManager = userManager;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ClientNoteDto>>> List(Guid clientId, CancellationToken ct)
    {
        var items = await _notesService.GetForClientAsync(clientId, ct);
        return Ok(items);
    }

    [HttpPost]
    public async Task<IActionResult> Create(Guid clientId, [FromBody] CreateClientNoteRequest dto, CancellationToken ct)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user is null || !user.IsActive)
        {
            return Unauthorized();
        }

        var id = await _notesService.CreateAsync(clientId, user.Id, dto, ct);
        if (id is null)
        {
            return NotFound();
        }

        return CreatedAtAction(nameof(List), new { clientId }, id);
    }

    [HttpPut("{noteId:guid}")]
    public async Task<IActionResult> Update(Guid clientId, Guid noteId, [FromBody] UpdateClientNoteRequest dto, CancellationToken ct)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user is null || !user.IsActive)
        {
            return Unauthorized();
        }

        var ok = await _notesService.UpdateAsync(clientId, noteId, user.Id, dto, ct);
        return ok ? NoContent() : Forbid();
    }

    [HttpPost("{noteId:guid}/delete")]
    public async Task<IActionResult> Delete(Guid clientId, Guid noteId, CancellationToken ct)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user is null || !user.IsActive)
        {
            return Unauthorized();
        }

        var ok = await _notesService.SetDeletedAsync(clientId, noteId, true, user.Id, ct);
        return ok ? NoContent() : Forbid();
    }

    [HttpPost("{noteId:guid}/restore")]
    public async Task<IActionResult> Restore(Guid clientId, Guid noteId, CancellationToken ct)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user is null || !user.IsActive)
        {
            return Unauthorized();
        }

        var ok = await _notesService.SetDeletedAsync(clientId, noteId, false, user.Id, ct);
        return ok ? NoContent() : Forbid();
    }
}
