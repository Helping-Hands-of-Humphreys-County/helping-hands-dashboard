using HelpingHands.Server.Dtos.Dashboard;
using HelpingHands.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HelpingHands.Server.Controllers;

[ApiController]
[Route("dashboard")]
[Authorize]
public sealed class DashboardController : ControllerBase
{
    private readonly DashboardService _dashboardService;

    public DashboardController(DashboardService dashboardService)
    {
        _dashboardService = dashboardService;
    }

    [HttpGet("summary")]
    public async Task<ActionResult<DashboardSummaryDto>> Summary([FromQuery] DashboardSummaryQueryDto query, CancellationToken ct)
    {
        var result = await _dashboardService.GetSummaryAsync(query, ct);
        return Ok(result);
    }
}
