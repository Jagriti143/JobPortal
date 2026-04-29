using ApplicationService.Data.Entities;

namespace ApplicationService.Services;

public interface IApplicationStateMachine
{
    bool ValidateTransition(ApplicationStatus current, ApplicationStatus next);
    IEnumerable<ApplicationStatus> GetAllowedTransitions(ApplicationStatus current);
}
