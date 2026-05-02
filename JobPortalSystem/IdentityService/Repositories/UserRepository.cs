using IdentityService.Data;
using IdentityService.Data.Entities;
using IdentityService.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace IdentityService.Repositories;

public class UserRepository(IdentityDbContext db) : IUserRepository
{
    public Task<bool> EmailExistsAsync(string email)
    {
        return db.Users.AnyAsync(u => u.Email == email);
    }

    public Task AddUserAsync(User user)
    {
        db.Users.Add(user);
        return db.SaveChangesAsync();
    }

    public Task<User?> GetByVerificationTokenAsync(string token)
    {
        return db.Users.IgnoreQueryFilters()
            .FirstOrDefaultAsync(u => u.EmailVerificationToken == token);
    }

    public Task<User?> GetByEmailWithRefreshTokensAsync(string email)
    {
        return db.Users.IgnoreQueryFilters()
            .Include(u => u.RefreshTokens)
            .FirstOrDefaultAsync(u => u.Email == email);
    }

    public Task<User?> GetByEmailAsync(string email)
    {
        return db.Users.FirstOrDefaultAsync(u => u.Email == email);
    }

    public Task<User?> GetByPasswordResetTokenAsync(string token)
    {
        return db.Users.FirstOrDefaultAsync(u => u.PasswordResetToken == token);
    }

    public Task<User?> GetByIdAsync(Guid userId)
    {
        return db.Users.FindAsync(userId).AsTask();
    }

    public Task UpdateAsync(User user)
    {
        db.Users.Update(user);
        return db.SaveChangesAsync();
    }

    public async Task DeleteUserAsync(Guid userId)
    {
        var user = await db.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Id == userId);
        if (user != null)
        {
            db.Users.Remove(user);
            await db.SaveChangesAsync();
        }
    }
}
