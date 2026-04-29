using IdentityService.Data.Entities;

namespace IdentityService.Repositories.Interfaces;

public interface IRefreshTokenRepository
{
    Task AddTokenAsync(RefreshToken token);
    Task<List<RefreshToken>> GetActiveTokensWithUserAsync();
    Task UpdateAsync(RefreshToken token);
}
