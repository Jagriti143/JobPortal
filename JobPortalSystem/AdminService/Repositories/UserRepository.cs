using AdminService.Data;
using AdminService.Repositories.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace AdminService.Repositories;

public class UserRepository(IdentityReadDbContext identityDb) : IUserRepository
{
    public async Task<(List<UserReadModel> Users, int Total)> GetUsersAsync(string? role, string? search, int page, int limit)
    {
        var query = identityDb.Users.AsQueryable();
        
        if (!string.IsNullOrEmpty(role)) query = query.Where(u => u.Role == role);
        if (!string.IsNullOrEmpty(search)) query = query.Where(u => u.Email.Contains(search) || (u.DisplayName != null && u.DisplayName.Contains(search)));

        var total = await query.CountAsync();
        var users = await query.Skip((page - 1) * limit)
                               .Take(limit)
                               .ToListAsync();
                               
        return (users, total);
    }

    public Task<UserReadModel?> GetUserByIdAsync(Guid userId)
    {
        return identityDb.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Id == userId);
    }

    public Task UpdateUserAsync(UserReadModel user)
    {
        identityDb.Users.Update(user);
        return identityDb.SaveChangesAsync();
    }
}
