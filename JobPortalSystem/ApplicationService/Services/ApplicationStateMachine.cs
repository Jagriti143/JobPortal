using ApplicationService.Data.Entities;

namespace ApplicationService.Services;

public class ApplicationStateMachine : IApplicationStateMachine
{
    private static readonly Dictionary<ApplicationStatus, HashSet<ApplicationStatus>> _allowed = new()
    {
        [ApplicationStatus.Submitted]   = new() { ApplicationStatus.Reviewed, ApplicationStatus.Rejected, ApplicationStatus.Withdrawn },
        [ApplicationStatus.Reviewed]    = new() { ApplicationStatus.Shortlisted, ApplicationStatus.Rejected },
        [ApplicationStatus.Shortlisted] = new() { ApplicationStatus.Rejected },
        [ApplicationStatus.Rejected]    = new(), // terminal
        [ApplicationStatus.Withdrawn]   = new()  // terminal
    };

    public bool ValidateTransition(ApplicationStatus current, ApplicationStatus next)
        => _allowed.TryGetValue(current, out var allowed) && allowed.Contains(next);

    public IEnumerable<ApplicationStatus> GetAllowedTransitions(ApplicationStatus current)
        => _allowed.TryGetValue(current, out var allowed) ? allowed : Enumerable.Empty<ApplicationStatus>();
}
