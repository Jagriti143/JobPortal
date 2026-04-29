namespace ApplicationService.Models;

public class CreateApplicationRequest
{
    public Guid JobId { get; set; }
    public string? CoverLetter { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public Guid? ResumeId { get; set; }
}

public class UpdateStatusRequest
{
    public string NewStatus { get; set; } = string.Empty;
}
