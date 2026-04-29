using StackExchange.Redis;

namespace IdentityService.Services;

public class RedisBlocklistService(IConnectionMultiplexer redis, ILogger<RedisBlocklistService> logger) : IRedisBlocklistService
{
    private readonly IDatabase _db = redis.GetDatabase();

    public async Task AddToBlocklistAsync(string jti, TimeSpan ttl)
    {
        try
        {
            await _db.StringSetAsync($"jti:{jti}", "1", ttl);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to add JTI {Jti} to Redis blocklist", jti);
        }
    }

    public async Task<bool> IsBlockedAsync(string jti)
    {
        try
        {
            return await _db.KeyExistsAsync($"jti:{jti}");
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to check JTI {Jti} in Redis blocklist — failing open", jti);
            return false; // fail-open in dev
        }
    }
}
