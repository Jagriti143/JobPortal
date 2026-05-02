using IdentityService.Data.Entities;

namespace IdentityService.Models.DTOs;

public class UserProfileDto
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public bool EmailVerified { get; set; }
    public Guid? CompanyId { get; set; }
    public DateTime CreatedAt { get; set; }

    public static UserProfileDto FromEntity(User user)
    {
        return new UserProfileDto
        {
            Id = user.Id,
            Email = user.Email,
            Role = user.Role,
            DisplayName = user.DisplayName,
            EmailVerified = user.EmailVerified,
            CompanyId = user.CompanyId,
            CreatedAt = user.CreatedAt
        };
    }
}
