using IdentityService.Data.Entities;

namespace IdentityService.Services;

public interface ITokenService
{
    string GenerateAccessToken(User user);
    string GenerateRefreshToken();
    (Guid userId, string jti, DateTime expiry) ValidateAccessToken(string token);
}
