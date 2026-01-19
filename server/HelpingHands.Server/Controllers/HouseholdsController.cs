using HelpingHands.Server.Dtos.Households;
using HelpingHands.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HelpingHands.Server.Controllers;

[ApiController]
[Route("households")]
[Authorize]
public sealed class HouseholdsController : ControllerBase
{
    private readonly HouseholdsService _householdsService;

    public HouseholdsController(HouseholdsService householdsService)
    {
        _householdsService = householdsService;
    }

    [HttpGet]
    public async Task<ActionResult> List([FromQuery] HouseholdQueryDto query, CancellationToken ct)
    {
        var result = await _householdsService.GetPagedAsync(query, ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<HouseholdDetailsDto>> Get(Guid id, CancellationToken ct)
    {
        var dto = await _householdsService.GetDetailsAsync(id, ct);
        if (dto is null)
        {
            return NotFound();
        }

        return Ok(dto);
    }

    [HttpPost]
    public async Task<ActionResult<Guid>> Create([FromBody] CreateHouseholdRequest dto, CancellationToken ct)
    {
        var id = await _householdsService.CreateAsync(dto, ct);
        return CreatedAtAction(nameof(Get), new { id }, id);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateHouseholdAddressRequest dto, CancellationToken ct)
    {
        var ok = await _householdsService.UpdateAddressAsync(id, dto, ct);
        return ok ? NoContent() : NotFound();
    }

    [HttpPost("{id:guid}/archive")]
    public async Task<IActionResult> Archive(Guid id, CancellationToken ct)
    {
        var ok = await _householdsService.SetArchivedAsync(id, true, ct);
        return ok ? NoContent() : NotFound();
    }

    [HttpPost("{id:guid}/unarchive")]
    public async Task<IActionResult> Unarchive(Guid id, CancellationToken ct)
    {
        var ok = await _householdsService.SetArchivedAsync(id, false, ct);
        return ok ? NoContent() : NotFound();
    }

    [HttpPost("{id:guid}/add-member")]
    public async Task<IActionResult> AddMember(Guid id, [FromBody] AddMemberRequest dto, CancellationToken ct)
    {
        var ok = await _householdsService.AddMemberAsync(id, dto.ClientId, ct);
        return ok ? NoContent() : NotFound();
    }

    [HttpPost("{id:guid}/remove-member")]
    public async Task<IActionResult> RemoveMember(Guid id, [FromBody] AddMemberRequest dto, CancellationToken ct)
    {
        var ok = await _householdsService.RemoveMemberAsync(id, dto.ClientId, ct);
        return ok ? NoContent() : NotFound();
    }

    [HttpPost("move-member")]
    public async Task<IActionResult> MoveMember([FromBody] MoveMemberRequest dto, CancellationToken ct)
    {
        var ok = await _householdsService.MoveMemberAsync(dto.ClientId, dto.NewHouseholdId, ct);
        return ok ? NoContent() : NotFound();
    }
}
