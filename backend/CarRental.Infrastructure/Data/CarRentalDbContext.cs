using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using CarRental.Domain.Entities;

namespace CarRental.Infrastructure.Data;

/// <summary>
/// DbContext principal de la aplicación con soporte para ASP.NET Core Identity
/// Implementa Clean Architecture separando la configuración de entidades
/// </summary>
public class CarRentalDbContext : IdentityDbContext<ApplicationUser>
{
    public CarRentalDbContext(DbContextOptions<CarRentalDbContext> options) : base(options)
    {
    }

    // DbSets para las entidades del dominio
    public DbSet<Customer> Customers { get; set; }
    public DbSet<Car> Cars { get; set; }
    public DbSet<Location> Locations { get; set; }
    public DbSet<Rental> Rentals { get; set; }
    public DbSet<Service> Services { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder); // Necesario para Identity

        // Configuración de entidades
        ConfigureCustomer(modelBuilder);
        ConfigureCar(modelBuilder);
        ConfigureLocation(modelBuilder);
        ConfigureRental(modelBuilder);
        ConfigureService(modelBuilder);
        ConfigureApplicationUser(modelBuilder);

        // Datos semilla para desarrollo
        SeedData(modelBuilder);
    }

    private static void ConfigureCustomer(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Customer>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.Property(c => c.Id)
                  .HasMaxLength(20)
                  .IsRequired();

            entity.Property(c => c.FullName)
                  .HasMaxLength(100)
                  .IsRequired();

            entity.Property(c => c.Address)
                  .HasMaxLength(200)
                  .IsRequired();

            // Índices para optimización
            entity.HasIndex(c => c.Id).IsUnique();
        });
    }

    private static void ConfigureCar(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Car>(entity =>
        {
            entity.HasKey(c => c.Id);

            entity.Property(c => c.Brand)
                  .HasMaxLength(50)
                  .IsRequired();

            entity.Property(c => c.Model)
                  .HasMaxLength(50)
                  .IsRequired();

            entity.Property(c => c.Type)
                  .HasMaxLength(30)
                  .IsRequired();

            entity.Property(c => c.LicensePlate)
                  .HasMaxLength(10)
                  .IsRequired();

            // Relación con Location
            entity.HasOne(c => c.Location)
                  .WithMany(l => l.Cars)
                  .HasForeignKey(c => c.LocationId)
                  .OnDelete(DeleteBehavior.Restrict);

            // Índices
            entity.HasIndex(c => c.LicensePlate).IsUnique();
            entity.HasIndex(c => new { c.Brand, c.Model, c.Type });
        });
    }

    private static void ConfigureLocation(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Location>(entity =>
        {
            entity.HasKey(l => l.Id);

            entity.Property(l => l.Name)
                  .HasMaxLength(100)
                  .IsRequired();

            entity.Property(l => l.Address)
                  .HasMaxLength(200)
                  .IsRequired();

            entity.Property(l => l.City)
                  .HasMaxLength(50)
                  .IsRequired();

            entity.Property(l => l.Country)
                  .HasMaxLength(50)
                  .IsRequired();

            // Índices
            entity.HasIndex(l => new { l.City, l.Country });
        });
    }

    private static void ConfigureRental(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Rental>(entity =>
        {
            entity.HasKey(r => r.Id);

            entity.Property(r => r.CustomerId)
                  .HasMaxLength(20)
                  .IsRequired();

            entity.Property(r => r.Status)
                  .HasConversion<int>()
                  .IsRequired();

            entity.Property(r => r.CreatedAt)
                  .HasDefaultValueSql("GETUTCDATE()");

            // Relaciones
            entity.HasOne(r => r.Customer)
                  .WithMany(c => c.Rentals)
                  .HasForeignKey(r => r.CustomerId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(r => r.Car)
                  .WithMany(c => c.Rentals)
                  .HasForeignKey(r => r.CarId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(r => r.Location)
                  .WithMany(l => l.Rentals)
                  .HasForeignKey(r => r.LocationId)
                  .OnDelete(DeleteBehavior.Restrict);

            // Relación con ApplicationUser (opcional, para usuarios autenticados)
            entity.HasOne(r => r.User)
                  .WithMany(u => u.Rentals)
                  .HasForeignKey(r => r.UserId)
                  .OnDelete(DeleteBehavior.SetNull)
                  .IsRequired(false);

            // Índices para optimización
            entity.HasIndex(r => r.CustomerId);
            entity.HasIndex(r => r.CarId);
            entity.HasIndex(r => new { r.StartDate, r.EndDate });
            entity.HasIndex(r => r.Status);
        });
    }

    private static void ConfigureService(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Service>(entity =>
        {
            entity.HasKey(s => s.Id);

            entity.Property(s => s.ServiceType)
                  .HasMaxLength(50)
                  .IsRequired();

            entity.Property(s => s.Description)
                  .HasMaxLength(500);

            entity.Property(s => s.Status)
                  .HasConversion<int>()
                  .IsRequired();

            // Relación con Car
            entity.HasOne(s => s.Car)
                  .WithMany(c => c.Services)
                  .HasForeignKey(s => s.CarId)
                  .OnDelete(DeleteBehavior.Cascade);

            // Índices
            entity.HasIndex(s => s.CarId);
            entity.HasIndex(s => new { s.ScheduledDate, s.Status });
        });
    }

    private static void ConfigureApplicationUser(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ApplicationUser>(entity =>
        {
            entity.Property(u => u.FullName)
                  .HasMaxLength(100)
                  .IsRequired();

            entity.Property(u => u.Role)
                  .HasConversion<int>()
                  .HasDefaultValue(UserRole.Customer);

            entity.Property(u => u.RefreshToken)
                  .HasMaxLength(500);

            // Índices
            entity.HasIndex(u => u.Email).IsUnique();
            entity.HasIndex(u => u.Role);
        });
    }

    private static void SeedData(ModelBuilder modelBuilder)
    {
        // Seed Locations
        modelBuilder.Entity<Location>().HasData(
            new Location { Id = 1, Name = "Buenos Aires Centro", Address = "Av. Corrientes 1234", City = "Buenos Aires", Country = "Argentina" },
            new Location { Id = 2, Name = "Córdoba Centro", Address = "Av. Colón 567", City = "Córdoba", Country = "Argentina" },
            new Location { Id = 3, Name = "Mendoza Centro", Address = "San Martín 890", City = "Mendoza", Country = "Argentina" },
            new Location { Id = 4, Name = "Rosario Centro", Address = "Pellegrini 456", City = "Rosario", Country = "Argentina" }
        );

        // Seed Cars
        modelBuilder.Entity<Car>().HasData(
            new Car { Id = 1, Brand = "Toyota", Model = "Corolla", Type = "Sedan", Year = 2023, LicensePlate = "ABC123", LocationId = 1, IsAvailable = true },
            new Car { Id = 2, Brand = "Ford", Model = "EcoSport", Type = "SUV", Year = 2022, LicensePlate = "DEF456", LocationId = 1, IsAvailable = true },
            new Car { Id = 3, Brand = "Chevrolet", Model = "Onix", Type = "Hatchback", Year = 2023, LicensePlate = "GHI789", LocationId = 2, IsAvailable = true },
            new Car { Id = 4, Brand = "Volkswagen", Model = "Tiguan", Type = "SUV", Year = 2023, LicensePlate = "JKL012", LocationId = 3, IsAvailable = true },
            new Car { Id = 5, Brand = "Honda", Model = "Civic", Type = "Sedan", Year = 2022, LicensePlate = "MNO345", LocationId = 4, IsAvailable = true }
        );
    }
}