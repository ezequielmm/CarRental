using CarRental.Domain.Common;

namespace CarRental.Domain.Entities
{
    /// <summary>
    /// Represents a vehicle available for rental in the car rental system.
    /// Contains all vehicle information including specifications, location, and availability status.
    /// </summary>
    public class Car : BaseEntity
    {
        /// <summary>
        /// Gets or sets the vehicle brand (e.g., Toyota, Honda, BMW).
        /// </summary>
        public string Brand { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the vehicle model (e.g., Camry, Civic, X5).
        /// </summary>
        public string Model { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the manufacturing year of the vehicle.
        /// </summary>
        public int Year { get; set; }

        /// <summary>
        /// Gets or sets the vehicle type (e.g., Sedan, SUV, Compact, Luxury).
        /// </summary>
        public string Type { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the license plate number of the vehicle.
        /// This is unique for each vehicle and used for identification.
        /// </summary>
        public string LicensePlate { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the daily rental price for this vehicle.
        /// </summary>
        public decimal DailyRate { get; set; }

        /// <summary>
        /// Gets or sets the current availability status of the vehicle.
        /// True if available for rental, false if currently rented or under maintenance.
        /// </summary>
        public bool IsAvailable { get; set; } = true;

        /// <summary>
        /// Gets or sets the location ID where this vehicle is currently stationed.
        /// </summary>
        public int LocationId { get; set; }

        /// <summary>
        /// Navigation property to the location where this car is stationed.
        /// </summary>
        public virtual Location? Location { get; set; }

        /// <summary>
        /// Navigation property to all rentals associated with this car.
        /// </summary>
        public virtual ICollection<Rental> Rentals { get; set; } = new List<Rental>();

        /// <summary>
        /// Navigation property to all service records for this car.
        /// </summary>
        public virtual ICollection<Service> Services { get; set; } = new List<Service>();

        /// <summary>
        /// Gets the vehicle's full display name including brand, model, and year.
        /// </summary>
        public string FullName => $"{Year} {Brand} {Model}";

        /// <summary>
        /// Checks if the car is available for rental during the specified period.
        /// </summary>
        /// <param name="startDate">The desired rental start date.</param>
        /// <param name="endDate">The desired rental end date.</param>
        /// <param name="existingRentals">List of existing rentals to check against.</param>
        /// <returns>True if the car is available, false otherwise.</returns>
        public bool IsAvailableForPeriod(DateTime startDate, DateTime endDate, IEnumerable<Rental> existingRentals)
        {
            if (!IsAvailable)
                return false;

            // Check if there are any conflicting rentals
            return !existingRentals.Any(rental =>
                rental.CarId == Id &&
                rental.Status != Domain.Enums.RentalStatus.Cancelled &&
                HasDateOverlap(rental.StartDate, rental.EndDate, startDate, endDate));
        }

        /// <summary>
        /// Checks if two date ranges overlap.
        /// </summary>
        /// <param name="start1">Start date of first range.</param>
        /// <param name="end1">End date of first range.</param>
        /// <param name="start2">Start date of second range.</param>
        /// <param name="end2">End date of second range.</param>
        /// <returns>True if the ranges overlap, false otherwise.</returns>
        private static bool HasDateOverlap(DateTime start1, DateTime end1, DateTime start2, DateTime end2)
        {
            return start1 < end2 && start2 < end1;
        }

        /// <summary>
        /// Marks the car as unavailable (e.g., when rented or under maintenance).
        /// </summary>
        public void SetUnavailable()
        {
            IsAvailable = false;
            UpdatedAt = DateTime.UtcNow;
        }

        /// <summary>
        /// Marks the car as available for rental.
        /// </summary>
        public void SetAvailable()
        {
            IsAvailable = true;
            UpdatedAt = DateTime.UtcNow;
        }

        /// <summary>
        /// Updates the car's location.
        /// </summary>
        /// <param name="newLocationId">The new location ID.</param>
        public void UpdateLocation(int newLocationId)
        {
            if (newLocationId <= 0)
                throw new ArgumentException("Location ID must be positive", nameof(newLocationId));

            LocationId = newLocationId;
            UpdatedAt = DateTime.UtcNow;
        }

        /// <summary>
        /// Validates that all required properties are properly set.
        /// </summary>
        /// <returns>True if the car entity is valid, false otherwise.</returns>
        public bool IsValid()
        {
            return !string.IsNullOrWhiteSpace(Brand) &&
                   !string.IsNullOrWhiteSpace(Model) &&
                   !string.IsNullOrWhiteSpace(Type) &&
                   !string.IsNullOrWhiteSpace(LicensePlate) &&
                   Year > 1900 && Year <= DateTime.Now.Year + 1 &&
                   DailyRate > 0 &&
                   LocationId > 0;
        }
    }
}