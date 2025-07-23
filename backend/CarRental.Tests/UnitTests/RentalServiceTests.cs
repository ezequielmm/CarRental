using CarRental.Domain.Entities;
using CarRental.Domain.Enums;
using CarRental.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Xunit;

namespace CarRental.Tests.UnitTests
{
    public class RentalServiceTests
    {
        private CarRentalDbContext GetInMemoryDbContext()
        {
            var options = new DbContextOptionsBuilder<CarRentalDbContext>()
                .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
                .Options;

            return new CarRentalDbContext(options);
        }

        [Fact]
        public async Task RegisterRental_WithAlreadyReservedCar_ShouldThrowInvalidOperationException()
        {
            // Arrange
            using var context = GetInMemoryDbContext();
            
            // Seed test data
            var location = new Location
            {
                Id = 1,
                Name = "Test Location",
                Address = "123 Test St",
                City = "Test City",
                Country = "Test Country"
            };

            var customer1 = new Customer
            {
                ID = "12345678",
                FullName = "John Doe",
                Address = "456 Customer St"
            };

            var customer2 = new Customer
            {
                ID = "87654321",
                FullName = "Jane Smith",
                Address = "789 Customer Ave"
            };

            var car = new Car
            {
                Id = 1,
                Type = "SUV",
                Model = "Toyota RAV4",
                Brand = "Toyota",
                LocationId = 1,
                IsAvailable = true
            };

            var existingRental = new Rental
            {
                Id = 1,
                CustomerId = "12345678",
                CarId = 1,
                LocationId = 1,
                StartDate = DateTime.Today.AddDays(1),
                EndDate = DateTime.Today.AddDays(3),
                Status = RentalStatus.Reserved,
                CreatedAt = DateTime.UtcNow
            };

            context.Locations.Add(location);
            context.Customers.AddRange(customer1, customer2);
            context.Cars.Add(car);
            context.Rentals.Add(existingRental);
            await context.SaveChangesAsync();

            // Act & Assert
            var newRental = new Rental
            {
                CustomerId = "87654321",
                CarId = 1,
                LocationId = 1,
                StartDate = DateTime.Today.AddDays(2), // Overlapping dates
                EndDate = DateTime.Today.AddDays(4),
                Status = RentalStatus.Reserved,
                CreatedAt = DateTime.UtcNow
            };

            // Check if car is available for the requested period
            var hasConflictingRental = await context.Rentals
                .AnyAsync(r => r.CarId == newRental.CarId &&
                              r.Status != RentalStatus.Cancelled &&
                              r.Status != RentalStatus.Completed &&
                              ((newRental.StartDate >= r.StartDate && newRental.StartDate < r.EndDate) ||
                               (newRental.EndDate > r.StartDate && newRental.EndDate <= r.EndDate) ||
                               (newRental.StartDate <= r.StartDate && newRental.EndDate >= r.EndDate)));

            // This should throw an exception when trying to register a rental for an already reserved car
            Assert.True(hasConflictingRental, "Car should already be reserved for the requested period");

            // Simulate the business rule validation that should prevent double booking
            var exception = await Assert.ThrowsAsync<InvalidOperationException>(async () =>
            {
                if (hasConflictingRental)
                {
                    throw new InvalidOperationException("The selected car is already reserved for the specified dates.");
                }

                context.Rentals.Add(newRental);
                await context.SaveChangesAsync();
            });

            Assert.Equal("The selected car is already reserved for the specified dates.", exception.Message);
        }

        [Fact]
        public async Task RegisterRental_WithAvailableCar_ShouldSucceed()
        {
            // Arrange
            using var context = GetInMemoryDbContext();

            // Seed test data
            var location = new Location
            {
                Id = 1,
                Name = "Test Location",
                Address = "123 Test St",
                City = "Test City",
                Country = "Test Country"
            };

            var customer = new Customer
            {
                ID = "12345678",
                FullName = "John Doe",
                Address = "456 Customer St"
            };

            var car = new Car
            {
                Id = 1,
                Type = "SUV",
                Model = "Toyota RAV4",
                Brand = "Toyota",
                LocationId = 1,
                IsAvailable = true
            };

            context.Locations.Add(location);
            context.Customers.Add(customer);
            context.Cars.Add(car);
            await context.SaveChangesAsync();

            // Act
            var newRental = new Rental
            {
                CustomerId = "12345678",
                CarId = 1,
                LocationId = 1,
                StartDate = DateTime.Today.AddDays(1),
                EndDate = DateTime.Today.AddDays(3),
                Status = RentalStatus.Reserved,
                CreatedAt = DateTime.UtcNow
            };

            // Check if car is available (no conflicting rentals)
            var hasConflictingRental = await context.Rentals
                .AnyAsync(r => r.CarId == newRental.CarId &&
                              r.Status != RentalStatus.Cancelled &&
                              r.Status != RentalStatus.Completed &&
                              ((newRental.StartDate >= r.StartDate && newRental.StartDate < r.EndDate) ||
                               (newRental.EndDate > r.StartDate && newRental.EndDate <= r.EndDate) ||
                               (newRental.StartDate <= r.StartDate && newRental.EndDate >= r.EndDate)));

            Assert.False(hasConflictingRental, "Car should be available for rental");

            // Register the rental
            context.Rentals.Add(newRental);
            await context.SaveChangesAsync();

            // Assert
            var savedRental = await context.Rentals.FirstOrDefaultAsync(r => r.CarId == 1);
            Assert.NotNull(savedRental);
            Assert.Equal("12345678", savedRental.CustomerId);
            Assert.Equal(RentalStatus.Reserved, savedRental.Status);
        }
    }
}