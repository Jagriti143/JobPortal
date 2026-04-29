using Microsoft.IdentityModel.Tokens;
using System.Security.Cryptography;

namespace ApplicationService.Services;

public class RsaKeyProvider(IConfiguration config, ILogger<RsaKeyProvider> logger)
{
    private RsaSecurityKey? _cachedKey;
    private readonly object _lock = new();
    private readonly string _publicKeyUrl = config["IdentityService:PublicKeyUrl"]
        ?? "http://localhost:5001/auth/public-key";

    public RsaSecurityKey? GetKey()
    {
        if (_cachedKey != null) return _cachedKey;
        lock (_lock)
        {
            if (_cachedKey != null) return _cachedKey;
            try
            {
                using var http = new HttpClient { Timeout = TimeSpan.FromSeconds(5) };
                var resp = http.GetFromJsonAsync<PublicKeyResponse>(_publicKeyUrl).GetAwaiter().GetResult();
                if (resp?.PublicKey != null)
                {
                    var rsa = RSA.Create();
                    rsa.ImportFromPem(resp.PublicKey);
                    _cachedKey = new RsaSecurityKey(rsa);
                    logger.LogInformation("RSA public key loaded from IdentityService");
                }
            }
            catch (Exception ex) { logger.LogWarning(ex, "Could not fetch RSA public key from {Url}", _publicKeyUrl); }
        }
        return _cachedKey;
    }

    private record PublicKeyResponse(string PublicKey);
}
