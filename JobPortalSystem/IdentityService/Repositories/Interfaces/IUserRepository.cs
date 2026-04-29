using IdentityService.Data.Entities;

namespace IdentityService.Repositories.Interfaces;

public interface IUserRepository
{
    Task<bool> EmailExistsAsync(string email);
    Task AddUserAsync(User user);
    Task<User?> GetByVerificationTokenAsync(string token);
    Task<User?> GetByEmailWithRefreshTokensAsync(string email);
    Task<User?> GetByEmailAsync(string email);
    Task<User?> GetByPasswordResetTokenAsync(string token);
    Task<User?> GetByIdAsync(Guid userId);
    Task UpdateAsync(User user);
}
