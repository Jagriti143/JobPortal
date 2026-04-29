using AdminService.Data;

namespace AdminService.Repositories.Interfaces;

public interface IUserRepository
{
    Task<(List<UserReadModel> Users, int Total)> GetUsersAsync(string? role, string? search, int page, int limit);
    Task<UserReadModel?> GetUserByIdAsync(Guid userId);
    Task UpdateUserAsync(UserReadModel user);
}
