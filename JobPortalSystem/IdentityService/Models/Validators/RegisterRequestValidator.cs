using FluentValidation;
using IdentityService.Models.DTOs;

namespace IdentityService.Models.Validators;

public class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().WithMessage("A valid email is required.");
        RuleFor(x => x.Password).NotEmpty().MinimumLength(8).WithMessage("Password must be at least 8 characters.");
        RuleFor(x => x.Role).NotEmpty().Must(r => r == "JobSeeker" || r == "Recruiter")
            .WithMessage("Role must be 'JobSeeker' or 'Recruiter'.");
    }
}
