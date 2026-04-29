using IdentityService.Data;
using IdentityService.Data.Entities;
using IdentityService.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace IdentityService.Repositories;

public class RefreshTokenRepository(IdentityDbContext db) : IRefreshTokenRepository
{
    public Task AddTokenAsync(RefreshToken token)
    {
        db.RefreshTokens.Add(token);
        return db.SaveChangesAsync();
    }

    public Task<List<RefreshToken>> GetActiveTokensWithUserAsync()
    {
        return db.RefreshTokens
            .Include(r => r.User)
            .Where(r => !r.IsRevoked && r.ExpiresAt > DateTime.UtcNow)
            .ToListAsync();
    }

    public Task UpdateAsync(RefreshToken token)
    {
        db.RefreshTokens.Update(token);
        return db.SaveChangesAsync();
    }
}
