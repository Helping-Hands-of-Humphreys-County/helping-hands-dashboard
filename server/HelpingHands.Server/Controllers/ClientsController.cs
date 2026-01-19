using HelpingHands.Server.Dtos.Clients;
using HelpingHands.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HelpingHands.Server.Controllers;

[ApiController]
[Route("clients")]
[Authorize]
public sealed class ClientsController : ControllerBase
{
    private readonly ClientsService _clientsService;

    public ClientsController(ClientsService clientsService)
    {
        _clientsService = clientsService;
    }

    [HttpGet]
    public async Task<ActionResult> List([FromQuery] ClientQueryDto query, CancellationToken ct)
    {
        var result = await _clientsService.GetPagedAsync(query, ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<ClientDetailsDto>> Get(Guid id, CancellationToken ct)
    {
        var dto = await _clientsService.GetDetailsAsync(id, ct);
        if (dto is null)
        {
            return NotFound();
        }

        return Ok(dto);
    }

    [HttpPost]
    public async Task<ActionResult<Guid>> Create([FromBody] CreateClientRequest dto, CancellationToken ct)
    {
        var id = await _clientsService.CreateAsync(dto, ct);
        return CreatedAtAction(nameof(Get), new { id }, id);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateClientRequest dto, CancellationToken ct)
    {
        var updated = await _clientsService.UpdateAsync(id, dto, ct);
        if (!updated)
        {
            return NotFound();
        }

        return NoContent();
    }

    [HttpPost("{id:guid}/archive")]
    public async Task<IActionResult> Archive(Guid id, CancellationToken ct)
    {
        var ok = await _clientsService.SetArchivedAsync(id, true, ct);
        return ok ? NoContent() : NotFound();
    }

    [HttpPost("{id:guid}/unarchive")]
    public async Task<IActionResult> Unarchive(Guid id, CancellationToken ct)
    {
        var ok = await _clientsService.SetArchivedAsync(id, false, ct);
        return ok ? NoContent() : NotFound();
    }
}
