using HelpingHands.Server.Dtos.Reports;
using HelpingHands.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HelpingHands.Server.Controllers;

[ApiController]
[Route("reports")]
[Authorize]
public sealed class ReportsController : ControllerBase
{
    private readonly ReportsService _reportsService;

    public ReportsController(ReportsService reportsService)
    {
        _reportsService = reportsService;
    }

    [HttpGet]
    public async Task<ActionResult<ReportResponseDto>> Get([FromQuery] ReportQueryDto query, CancellationToken ct)
    {
        var result = await _reportsService.GenerateAsync(query, ct);
        if (result is null)
        {
            return BadRequest(new { message = "program must be FoodPantry, HelpingHands, or Both" });
        }

        return Ok(result);
    }
}
