namespace IdentityService.Services;

public interface IRedisBlocklistService
{
    Task AddToBlocklistAsync(string jti, TimeSpan ttl);
    Task<bool> IsBlockedAsync(string jti);
}
