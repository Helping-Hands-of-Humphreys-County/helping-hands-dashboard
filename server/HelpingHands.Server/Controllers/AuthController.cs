using HelpingHands.Server.Dtos.Auth;
using HelpingHands.Server.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace HelpingHands.Server.Controllers;

[ApiController]
[Route("auth")]
public sealed class AuthController : ControllerBase
{
    private readonly AuthService _authService;

    public AuthController(AuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("login")]
    public async Task<ActionResult<MeDto>> Login([FromBody] LoginRequestDto dto)
    {
        var (ok, error) = await _authService.LoginAsync(dto);
        if (!ok)
        {
            return BadRequest(new { message = error ?? "Login failed." });
        }

        var me = await _authService.GetMeAsync(User);
        if (me is null)
        {
            return Unauthorized();
        }

        if (!me.IsActive)
        {
            await _authService.LogoutAsync();
            return StatusCode(StatusCodes.Status403Forbidden, new { code = "ACCOUNT_DISABLED" });
        }

        return Ok(me);
    }

    [Authorize]
    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await _authService.LogoutAsync();
        return NoContent();
    }

    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest req)
    {
        var (ok, error) = await _authService.ChangePasswordAsync(User, req.CurrentPassword, req.NewPassword);
        if (!ok)
        {
            return BadRequest(new { message = error });
        }

        return NoContent();
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<MeDto>> Me()
    {
        var me = await _authService.GetMeAsync(User);
        if (me is null)
        {
            return Unauthorized();
        }

        if (!me.IsActive)
        {
            await _authService.LogoutAsync();
            return StatusCode(StatusCodes.Status403Forbidden, new { code = "ACCOUNT_DISABLED" });
        }

        return Ok(me);
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] HelpingHands.Server.Dtos.Auth.ForgotPasswordRequest req)
    {
        // Always return 200 to avoid leaking which emails exist. In dev we return token.
        var token = await _authService.ForgotPasswordAsync(req.Email);
        if (token is null)
        {
            return Ok();
        }

        // In production, this should be emailed. For dev, return the token so callers can use it.
        return Ok(new { token });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] HelpingHands.Server.Dtos.Auth.ResetPasswordRequest req)
    {
        var (ok, error) = await _authService.ResetPasswordAsync(req.Email, req.Token, req.NewPassword);
        if (!ok)
        {
            return BadRequest(new { message = error });
        }

        return NoContent();
    }
}
