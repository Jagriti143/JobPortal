namespace PaymentService.Data.Entities;

/// <summary>
/// Tracks what a recruiter has already paid to unlock.
/// Prevents double-charging for the same resource.
/// </summary>
public class RecruiterUnlock
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid RecruiterId { get; set; }

    /// <summary>The resource being unlocked — e.g. applicationId or jobSeekerId</summary>
    public Guid ResourceId { get; set; }

    /// <summary>"ResumeView" | "ResumePdfDownload" | "ContactUnlock"</summary>
    public string UnlockType { get; set; } = string.Empty;

    public DateTime UnlockedAt { get; set; } = DateTime.UtcNow;
}
