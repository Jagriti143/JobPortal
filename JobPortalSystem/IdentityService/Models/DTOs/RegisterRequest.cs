namespace IdentityService.Models.DTOs;

/// <summary>
/// Payload for POST /auth/register.
/// When Role == "Recruiter", CompanyName is required and the remaining
/// Company* fields are optional. The server creates the Company record
/// atomically during registration — no deferred post-login processing.
/// </summary>
public class RegisterRequest
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty; // "JobSeeker" or "Recruiter"

    // ── Company fields (Recruiter registration only) ─────────────────────────
    /// <summary>Required when Role == "Recruiter".</summary>
    public string? CompanyName { get; set; }
    public string? CompanyDescription { get; set; }
    public string? CompanyWebsite { get; set; }
    public string? CompanyLogoUrl { get; set; }
    public string? CompanyIndustry { get; set; }
    public string? CompanyLocation { get; set; }
}
