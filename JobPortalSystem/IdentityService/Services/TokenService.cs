using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using IdentityService.Data.Entities;
using Microsoft.IdentityModel.Tokens;

namespace IdentityService.Services;

public class TokenService(IConfiguration config, ILogger<TokenService> logger) : ITokenService
{
    private RSA? _privateKey;
    private RSA? _publicKey;

    public void Initialize()
    {
        var privateKeyPath = config["Jwt:PrivateKeyPath"] ?? "keys/private.pem";
        var publicKeyPath = config["Jwt:PublicKeyPath"] ?? "keys/public.pem";

        if (!File.Exists(privateKeyPath))
        {
            logger.LogWarning("RSA key pair not found. Generating new key pair at {Path}", privateKeyPath);
            Directory.CreateDirectory(Path.GetDirectoryName(privateKeyPath)!);
            using var rsa = RSA.Create(2048);
            File.WriteAllText(privateKeyPath, rsa.ExportRSAPrivateKeyPem());
            File.WriteAllText(publicKeyPath, rsa.ExportRSAPublicKeyPem());
        }

        _privateKey = RSA.Create();
        _privateKey.ImportFromPem(File.ReadAllText(privateKeyPath));

        _publicKey = RSA.Create();
        _publicKey.ImportFromPem(File.ReadAllText(publicKeyPath));
    }

    public RsaSecurityKey GetPublicKey()
    {
        if (_publicKey == null) Initialize();
        return new RsaSecurityKey(_publicKey!);
    }

    public string GetPublicKeyPem()
    {
        var publicKeyPath = config["Jwt:PublicKeyPath"] ?? "keys/public.pem";
        return File.Exists(publicKeyPath) ? File.ReadAllText(publicKeyPath) : string.Empty;
    }

    public string GenerateAccessToken(User user)
    {
        if (_privateKey == null) Initialize();

        var issuer = config["Jwt:Issuer"] ?? "JobPortal";
        var audience = config["Jwt:Audience"] ?? "JobPortalClients";
        var expiryMinutes = int.Parse(config["Jwt:AccessTokenExpiryMinutes"] ?? "15");
        var jti = Guid.NewGuid().ToString();

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Role),
            new Claim(JwtRegisteredClaimNames.Jti, jti),
            new Claim(JwtRegisteredClaimNames.Iss, issuer),
            new Claim(JwtRegisteredClaimNames.Aud, audience),
        };

        var key = new RsaSecurityKey(_privateKey);
        var creds = new SigningCredentials(key, SecurityAlgorithms.RsaSha256);

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateRefreshToken()
    {
        var bytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(bytes);
        return Convert.ToBase64String(bytes);
    }

    public (Guid userId, string jti, DateTime expiry) ValidateAccessToken(string token)
    {
        if (_publicKey == null) Initialize();
        if (_publicKey == null) throw new InvalidOperationException("RSA public key not initialized.");

        var handler = new JwtSecurityTokenHandler();

        // Read token without validation first to extract claims
        if (!handler.CanReadToken(token))
            throw new ArgumentException("Token is not a valid JWT.");

        var jwt = handler.ReadJwtToken(token);
        var userId = Guid.Parse(jwt.Subject);
        var jti = jwt.Id;
        var expiry = jwt.ValidTo;

        return (userId, jti, expiry);
    }
}
