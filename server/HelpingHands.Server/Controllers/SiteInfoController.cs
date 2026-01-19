using HelpingHands.Server.Dtos.SiteInfo;
using HelpingHands.Server.Models;
using HelpingHands.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace HelpingHands.Server.Controllers;

[ApiController]
[Route("site-info")]
public sealed class SiteInfoController : ControllerBase
{
    private readonly SiteInfoService _siteInfoService;
    private readonly UserManager<AppUser> _userManager;

    public SiteInfoController(SiteInfoService siteInfoService, UserManager<AppUser> userManager)
    {
        _siteInfoService = siteInfoService;
        _userManager = userManager;
    }

    [AllowAnonymous]
    [HttpGet]
    public async Task<ActionResult<SiteInfoDto>> Get()
    {
        return Ok(await _siteInfoService.GetAsync());
    }

    [Authorize]
    [HttpPut]
    public async Task<IActionResult> Update([FromBody] UpdateSiteInfoRequest dto)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user is null)
        {
            return Unauthorized();
        }

        if (!user.IsActive)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { code = "ACCOUNT_DISABLED" });
        }

        await _siteInfoService.UpdateAsync(dto, user.Id);
        return NoContent();
    }
}
