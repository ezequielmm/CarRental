using Microsoft.AspNetCore.Identity;

namespace CarRental.Domain.Entities;

/// <summary>
/// Usuario del sistema con capacidades de autenticación y autorización
/// Extiende IdentityUser para funcionalidades avanzadas
/// </summary>
public class ApplicationUser : IdentityUser
{
    /// <summary>
    /// Nombre completo del usuario
    /// </summary>
    public string FullName { get; set; } = string.Empty;

    /// <summary>
    /// Fecha de creación del usuario
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Fecha de última modificación
    /// </summary>
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Indica si el usuario está activo
    /// </summary>
    public bool IsActive { get; set; } = true;

    /// <summary>
    /// Rol del usuario en el sistema
    /// </summary>
    public UserRole Role { get; set; } = UserRole.Customer;

    /// <summary>
    /// Token de refresh para JWT
    /// </summary>
    public string? RefreshToken { get; set; }

    /// <summary>
    /// Fecha de expiración del refresh token
    /// </summary>
    public DateTime RefreshTokenExpiryTime { get; set; }

    // Navegación: Un usuario puede tener múltiples reservas como cliente
    public virtual ICollection<Rental> Rentals { get; set; } = new List<Rental>();
}

/// <summary>
/// Roles disponibles en el sistema
/// </summary>
public enum UserRole
{
    /// <summary>
    /// Cliente del sistema - puede hacer reservas
    /// </summary>
    Customer = 0,

    /// <summary>
    /// Empleado - puede gestionar reservas y ver estadísticas básicas
    /// </summary>
    Employee = 1,

    /// <summary>
    /// Manager - puede acceder a estadísticas avanzadas y reportes
    /// </summary>
    Manager = 2,

    /// <summary>
    /// Administrador - acceso completo al sistema
    /// </summary>
    Administrator = 3
}