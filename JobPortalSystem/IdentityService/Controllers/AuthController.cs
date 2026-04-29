using BCrypt.Net;
using IdentityService.Common;
using IdentityService.Data.Entities;
using IdentityService.Models.DTOs;
using IdentityService.Repositories.Interfaces;
using IdentityService.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace IdentityService.Controllers;

/// <summary>Auth controller — registration, login, token management, profile</summary>
[ApiController]
[Route("auth")]
public class AuthController(
    IUserRepository userRepository,
    IRefreshTokenRepository refreshTokenRepository,
    ITokenService tokenService,
    IEmailService emailService,
    IRedisBlocklistService blocklist,
    IConfiguration config,
    ILogger<AuthController> logger) : ControllerBase
{
    // ── POST /auth/register ──────────────────────────────────────────────────
    /// <summary>Register a new JobSeeker or Recruiter account.</summary>
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req)
    {
        var traceId = HttpContext.TraceIdentifier;

        if (await userRepository.EmailExistsAsync(req.Email))
            return Conflict(ResponseEnvelope<object>.Fail("Email already registered.", traceId));

        var user = new User
        {
            Email = req.Email.ToLowerInvariant(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
            Role = req.Role,
            EmailVerificationToken = new Random().Next(100000, 999999).ToString(),
            EmailVerificationTokenExpiry = DateTime.UtcNow.AddDays(1)
        };

        await userRepository.AddUserAsync(user);

        await emailService.SendWelcomeEmailAsync(user.Email);
        await emailService.SendVerificationEmailAsync(user.Email, user.EmailVerificationToken!);

        logger.LogInformation("User registered: {Email} as {Role}", user.Email, user.Role);
        return StatusCode(201, ResponseEnvelope<object>.Ok(new { userId = user.Id }, traceId: traceId));
    }

    // ── GET /auth/verify-email ───────────────────────────────────────────────
    /// <summary>Verify email address using token from verification email.</summary>
    [HttpGet("verify-email")]
    public async Task<IActionResult> VerifyEmail([FromQuery] string token)
    {
        var traceId = HttpContext.TraceIdentifier;
        var user = await userRepository.GetByVerificationTokenAsync(token);

        if (user == null)
            return BadRequest(ResponseEnvelope<object>.Fail("Invalid verification token.", traceId));

        if (user.EmailVerificationTokenExpiry < DateTime.UtcNow)
            return BadRequest(ResponseEnvelope<object>.Fail("Verification token has expired.", traceId));

        user.EmailVerified = true;
        user.EmailVerificationToken = null;
        user.EmailVerificationTokenExpiry = null;
        user.UpdatedAt = DateTime.UtcNow;
        
        await userRepository.UpdateAsync(user);

        return Ok(ResponseEnvelope<object>.Ok(new { message = "Email verified successfully." }, traceId: traceId));
    }

    // ── POST /auth/login ─────────────────────────────────────────────────────
    /// <summary>Login with email and password. Returns JWT access token and refresh token.</summary>
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        var traceId = HttpContext.TraceIdentifier;
        var user = await userRepository.GetByEmailWithRefreshTokensAsync(req.Email.ToLowerInvariant());

        if (user == null)
            return Unauthorized(ResponseEnvelope<object>.Fail("Invalid credentials.", traceId));

        // Check lockout
        if (user.LockoutEnd.HasValue && user.LockoutEnd > DateTime.UtcNow)
        {
            var remaining = (int)(user.LockoutEnd.Value - DateTime.UtcNow).TotalSeconds;
            return StatusCode(423, ResponseEnvelope<object>.Fail(
                $"Account locked. Try again in {remaining} seconds.", traceId));
        }

        // Check email verified
        if (!user.EmailVerified)
            return StatusCode(403, ResponseEnvelope<object>.Fail(
                "Please verify your email before logging in.", traceId));

        // Verify password
        if (!BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
        {
            user.FailedLoginAttempts++;
            if (user.FailedLoginAttempts >= 5)
            {
                user.LockoutEnd = DateTime.UtcNow.AddMinutes(15);
                user.FailedLoginAttempts = 0;
                logger.LogWarning("Account locked after 5 failed attempts: {Email}", user.Email);
            }
            await userRepository.UpdateAsync(user);
            return Unauthorized(ResponseEnvelope<object>.Fail("Invalid credentials.", traceId));
        }

        // Success — reset lockout
        user.FailedLoginAttempts = 0;
        user.LockoutEnd = null;
        user.UpdatedAt = DateTime.UtcNow;
        await userRepository.UpdateAsync(user); // Separate update to save lockout reset right away

        // Issue tokens
        var accessToken = tokenService.GenerateAccessToken(user);
        var rawRefreshToken = tokenService.GenerateRefreshToken();
        var refreshExpiryDays = config.GetValue<int>("Jwt:RefreshTokenExpiryDays", 7);

        var refreshToken = new RefreshToken
        {
            UserId = user.Id,
            TokenHash = BCrypt.Net.BCrypt.HashPassword(rawRefreshToken),
            ExpiresAt = DateTime.UtcNow.AddDays(refreshExpiryDays)
        };
        await refreshTokenRepository.AddTokenAsync(refreshToken);

        var authResponse = new AuthResponseDto
        {
            AccessToken = accessToken,
            RefreshToken = rawRefreshToken,
            ExpiresIn = config.GetValue<int>("Jwt:AccessTokenExpiryMinutes", 15) * 60
        };

        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "Unknown IP";
        await emailService.SendLoginNotificationEmailAsync(user.Email, ip);

        return Ok(ResponseEnvelope<object>.Ok(authResponse, traceId: traceId));
    }

    // ── POST /auth/refresh-token ─────────────────────────────────────────────
    /// <summary>Rotate refresh token. Returns new access token and refresh token.</summary>
    [HttpPost("refresh-token")]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest req)
    {
        var traceId = HttpContext.TraceIdentifier;

        var candidates = await refreshTokenRepository.GetActiveTokensWithUserAsync();

        var stored = candidates.FirstOrDefault(r =>
            BCrypt.Net.BCrypt.Verify(req.RefreshToken, r.TokenHash));

        if (stored == null)
            return Unauthorized(ResponseEnvelope<object>.Fail("Invalid or expired refresh token.", traceId));

        // Revoke old token
        stored.IsRevoked = true;
        await refreshTokenRepository.UpdateAsync(stored);

        // Issue new tokens
        var accessToken = tokenService.GenerateAccessToken(stored.User);
        var rawRefreshToken = tokenService.GenerateRefreshToken();
        var refreshExpiryDays = config.GetValue<int>("Jwt:RefreshTokenExpiryDays", 7);

        var newRefreshToken = new RefreshToken
        {
            UserId = stored.UserId,
            TokenHash = BCrypt.Net.BCrypt.HashPassword(rawRefreshToken),
            ExpiresAt = DateTime.UtcNow.AddDays(refreshExpiryDays)
        };
        await refreshTokenRepository.AddTokenAsync(newRefreshToken);

        var authResponse = new AuthResponseDto
        {
            AccessToken = accessToken,
            RefreshToken = rawRefreshToken,
            ExpiresIn = config.GetValue<int>("Jwt:AccessTokenExpiryMinutes", 15) * 60
        };

        return Ok(ResponseEnvelope<object>.Ok(authResponse, traceId: traceId));
    }

    // ── POST /auth/logout ────────────────────────────────────────────────────
    /// <summary>Logout — revokes session and adds JWT JTI to blocklist.</summary>
    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        var traceId = HttpContext.TraceIdentifier;
        var authHeader = Request.Headers.Authorization.ToString();
        if (!authHeader.StartsWith("Bearer "))
            return Unauthorized(ResponseEnvelope<object>.Fail("No token provided.", traceId));

        var token = authHeader["Bearer ".Length..].Trim();
        try
        {
            var (_, jti, expiry) = tokenService.ValidateAccessToken(token);
            var ttl = expiry - DateTime.UtcNow;
            if (ttl > TimeSpan.Zero)
                await blocklist.AddToBlocklistAsync(jti, ttl);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Could not parse token during logout");
        }

        return Ok(ResponseEnvelope<object>.Ok(new { message = "Logged out successfully." }, traceId: traceId));
    }

    // ── POST /auth/forgot-password ───────────────────────────────────────────
    /// <summary>Send password reset email.</summary>
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequest req)
    {
        var traceId = HttpContext.TraceIdentifier;
        var user = await userRepository.GetByEmailAsync(req.Email.ToLowerInvariant());

        // Always return 200 to prevent email enumeration
        if (user != null)
        {
            user.PasswordResetToken = new Random().Next(100000, 999999).ToString();
            user.PasswordResetTokenExpiry = DateTime.UtcNow.AddHours(1);
            user.UpdatedAt = DateTime.UtcNow;
            await userRepository.UpdateAsync(user);
            await emailService.SendPasswordResetEmailAsync(user.Email, user.PasswordResetToken!);
        }

        return Ok(ResponseEnvelope<object>.Ok(
            new { message = "If that email exists, a reset link has been sent." }, traceId: traceId));
    }

    // ── POST /auth/reset-password ────────────────────────────────────────────
    /// <summary>Reset password using token from reset email.</summary>
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest req)
    {
        var traceId = HttpContext.TraceIdentifier;
        var user = await userRepository.GetByPasswordResetTokenAsync(req.Token);

        if (user == null)
            return BadRequest(ResponseEnvelope<object>.Fail("Invalid reset token.", traceId));

        if (user.PasswordResetTokenExpiry < DateTime.UtcNow)
            return BadRequest(ResponseEnvelope<object>.Fail("Reset token has expired.", traceId));

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.NewPassword);
        user.PasswordResetToken = null;
        user.PasswordResetTokenExpiry = null;
        user.UpdatedAt = DateTime.UtcNow;
        await userRepository.UpdateAsync(user);

        return Ok(ResponseEnvelope<object>.Ok(new { message = "Password reset successfully." }, traceId: traceId));
    }

    // ── GET /auth/me ─────────────────────────────────────────────────────────
    /// <summary>Get current user profile.</summary>
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetMe()
    {
        var traceId = HttpContext.TraceIdentifier;
        var userId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value ?? Guid.Empty.ToString());

        var user = await userRepository.GetByIdAsync(userId);
        if (user == null)
            return NotFound(ResponseEnvelope<object>.Fail("User not found.", traceId));

        var profile = UserProfileDto.FromEntity(user);
        return Ok(ResponseEnvelope<object>.Ok(profile, traceId: traceId));
    }

    // ── PUT /auth/me ─────────────────────────────────────────────────────────
    /// <summary>Update current user profile (display name only).</summary>
    [HttpPut("me")]
    [Authorize]
    public async Task<IActionResult> UpdateMe([FromBody] UpdateProfileRequest req)
    {
        var traceId = HttpContext.TraceIdentifier;
        var userId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value ?? Guid.Empty.ToString());

        var user = await userRepository.GetByIdAsync(userId);
        if (user == null)
            return NotFound(ResponseEnvelope<object>.Fail("User not found.", traceId));

        user.DisplayName = req.DisplayName;
        user.UpdatedAt = DateTime.UtcNow;
        await userRepository.UpdateAsync(user);

        return Ok(ResponseEnvelope<object>.Ok(new { message = "Profile updated." }, traceId: traceId));
    }

    // ── GET /auth/public-key ─────────────────────────────────────────────────
    /// <summary>Get RSA public key in PEM format for JWT validation.</summary>
    [HttpGet("public-key")]
    public IActionResult GetPublicKey()
    {
        var tokenSvc = (TokenService)tokenService;
        var pem = tokenSvc.GetPublicKeyPem();
        if (string.IsNullOrEmpty(pem))
            return StatusCode(503, ResponseEnvelope<object>.Fail("Public key not available.", HttpContext.TraceIdentifier));

        return Ok(ResponseEnvelope<object>.Ok(new { publicKey = pem }, traceId: HttpContext.TraceIdentifier));
    }
}
