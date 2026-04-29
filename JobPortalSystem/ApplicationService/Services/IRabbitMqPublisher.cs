namespace ApplicationService.Services;

public interface IRabbitMqPublisher
{
    Task PublishStatusChangedAsync(ApplicationStatusChangedEvent evt);
}

public class ApplicationStatusChangedEvent
{
    public Guid ApplicationId { get; set; }
    public Guid JobSeekerId { get; set; }
    public Guid JobId { get; set; }
    public string OldStatus { get; set; } = string.Empty;
    public string NewStatus { get; set; } = string.Empty;
    public DateTime ChangedAt { get; set; } = DateTime.UtcNow;
}
