using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using CarRental.Domain.Entities;

namespace CarRental.Infrastructure.Services;

/// <summary>
/// Servicio para manejo de JWT tokens - Funcionalidad de nivel Senior
/// Implementa generación, validación y refresh de tokens JWT
/// </summary>
public interface IJwtTokenService
{
    Task<string> GenerateAccessTokenAsync(ApplicationUser user);
    Task<string> GenerateRefreshTokenAsync();
    Task<ClaimsPrincipal?> ValidateTokenAsync(string token);
    Task<bool> ValidateRefreshTokenAsync(string refreshToken, ApplicationUser user);
    Task RevokeRefreshTokenAsync(ApplicationUser user);
}

public class JwtTokenService : IJwtTokenService
{
    private readonly IConfiguration _configuration;
    private readonly string _secretKey;
    private readonly string _issuer;
    private readonly string _audience;
    private readonly TimeSpan _accessTokenLifetime;
    private readonly TimeSpan _refreshTokenLifetime;

    public JwtTokenService(IConfiguration configuration)
    {
        _configuration = configuration;
        _secretKey = _configuration["JwtSettings:SecretKey"] ?? throw new ArgumentNullException("JwtSettings:SecretKey not configured");
        _issuer = _configuration["JwtSettings:Issuer"] ?? "CarRentalAPI";
        _audience = _configuration["JwtSettings:Audience"] ?? "CarRentalClient";
        
        // Configuraciones de tiempo de vida
        _accessTokenLifetime = TimeSpan.FromMinutes(double.Parse(_configuration["JwtSettings:AccessTokenLifetimeMinutes"] ?? "30"));
        _refreshTokenLifetime = TimeSpan.FromDays(double.Parse(_configuration["JwtSettings:RefreshTokenLifetimeDays"] ?? "7"));
    }

    /// <summary>
    /// Genera un Access Token JWT para el usuario autenticado
    /// </summary>
    public async Task<string> GenerateAccessTokenAsync(ApplicationUser user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = await GenerateClaimsAsync(user);

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.Add(_accessTokenLifetime),
            SigningCredentials = credentials,
            Issuer = _issuer,
            Audience = _audience,
            NotBefore = DateTime.UtcNow,
            IssuedAt = DateTime.UtcNow
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);

        return tokenHandler.WriteToken(token);
    }

    /// <summary>
    /// Genera un Refresh Token criptográficamente seguro
    /// </summary>
    public async Task<string> GenerateRefreshTokenAsync()
    {
        var randomBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);

        var refreshToken = Convert.ToBase64String(randomBytes);
        
        return await Task.FromResult(refreshToken);
    }

    /// <summary>
    /// Valida un token JWT y retorna el ClaimsPrincipal si es válido
    /// </summary>
    public async Task<ClaimsPrincipal?> ValidateTokenAsync(string token)
    {
        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_secretKey));

            var validationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = key,
                ValidateIssuer = true,
                ValidIssuer = _issuer,
                ValidateAudience = true,
                ValidAudience = _audience,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.FromMinutes(5) // Tolerancia de 5 minutos
            };

            var principal = tokenHandler.ValidateToken(token, validationParameters, out SecurityToken validatedToken);

            if (validatedToken is JwtSecurityToken jwtToken &&
                jwtToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
            {
                return await Task.FromResult(principal);
            }

            return null;
        }
        catch (Exception ex)
        {
            // Log the exception in a real-world scenario
            Console.WriteLine($"Token validation failed: {ex.Message}");
            return null;
        }
    }

    /// <summary>
    /// Valida un refresh token contra el usuario
    /// </summary>
    public async Task<bool> ValidateRefreshTokenAsync(string refreshToken, ApplicationUser user)
    {
        if (string.IsNullOrEmpty(refreshToken) || string.IsNullOrEmpty(user.RefreshToken))
        {
            return false;
        }

        // Verificar que el token coincida
        var isTokenMatch = user.RefreshToken == refreshToken;
        
        // Verificar que no haya expirado
        var isNotExpired = user.RefreshTokenExpiryTime > DateTime.UtcNow;

        return await Task.FromResult(isTokenMatch && isNotExpired);
    }

    /// <summary>
    /// Revoca el refresh token del usuario
    /// </summary>
    public async Task RevokeRefreshTokenAsync(ApplicationUser user)
    {
        user.RefreshToken = null;
        user.RefreshTokenExpiryTime = DateTime.UtcNow; // Marca como expirado
        
        await Task.CompletedTask;
    }

    /// <summary>
    /// Genera las claims para el usuario
    /// </summary>
    private async Task<List<Claim>> GenerateClaimsAsync(ApplicationUser user)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id),
            new(ClaimTypes.Name, user.UserName ?? user.Email ?? ""),
            new(ClaimTypes.Email, user.Email ?? ""),
            new("fullName", user.FullName),
            new("role", user.Role.ToString()),
            new("isActive", user.IsActive.ToString()),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()), // Token ID único
            new(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64)
        };

        // Agregar claims específicos según el rol
        switch (user.Role)
        {
            case UserRole.Administrator:
                claims.Add(new Claim("permission", "admin.full_access"));
                claims.Add(new Claim("permission", "reports.advanced"));
                claims.Add(new Claim("permission", "users.manage"));
                break;
                
            case UserRole.Manager:
                claims.Add(new Claim("permission", "reports.advanced"));
                claims.Add(new Claim("permission", "rentals.manage"));
                claims.Add(new Claim("permission", "statistics.view"));
                break;
                
            case UserRole.Employee:
                claims.Add(new Claim("permission", "rentals.manage"));
                claims.Add(new Claim("permission", "customers.view"));
                break;
                
            case UserRole.Customer:
                claims.Add(new Claim("permission", "rentals.own"));
                claims.Add(new Claim("permission", "profile.edit"));
                break;
        }

        return await Task.FromResult(claims);
    }

    /// <summary>
    /// Extrae el User ID de un token JWT
    /// </summary>
    public static string? GetUserIdFromToken(string token)
    {
        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var jsonToken = tokenHandler.ReadJwtToken(token);
            
            return jsonToken.Claims?.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier)?.Value;
        }
        catch
        {
            return null;
        }
    }

    /// <summary>
    /// Obtiene el tiempo de expiración de un token
    /// </summary>
    public static DateTime? GetTokenExpirationTime(string token)
    {
        try
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var jsonToken = tokenHandler.ReadJwtToken(token);
            
            return jsonToken.ValidTo;
        }
        catch
        {
            return null;
        }
    }
}