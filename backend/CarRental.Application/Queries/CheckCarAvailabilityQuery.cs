using MediatR;
using CarRental.Application.Handlers;

namespace CarRental.Application.Queries
{
    /// <summary>
    /// Query to check car availability for a specific location and date range.
    /// Implements MediatR IRequest pattern for CQRS architecture.
    /// </summary>
    public class CheckCarAvailabilityQuery : IRequest<CheckCarAvailabilityResult>
    {
        /// <summary>
        /// Gets or sets the location ID where cars are requested.
        /// </summary>
        public int LocationId { get; set; }

        /// <summary>
        /// Gets or sets the start date for the rental period.
        /// </summary>
        public DateTime StartDate { get; set; }

        /// <summary>
        /// Gets or sets the end date for the rental period.
        /// </summary>
        public DateTime EndDate { get; set; }

        /// <summary>
        /// Gets or sets the specific car type to filter by (optional).
        /// Examples: "Sedan", "SUV", "Compact", "Luxury"
        /// </summary>
        public string? CarType { get; set; }

        /// <summary>
        /// Gets or sets the minimum daily rate filter (optional).
        /// </summary>
        public decimal? MinDailyRate { get; set; }

        /// <summary>
        /// Gets or sets the maximum daily rate filter (optional).
        /// </summary>
        public decimal? MaxDailyRate { get; set; }

        /// <summary>
        /// Gets the number of rental days.
        /// </summary>
        public int RentalDays => (EndDate.Date - StartDate.Date).Days;

        /// <summary>
        /// Validates the query parameters.
        /// </summary>
        /// <returns>True if the query is valid, false otherwise.</returns>
        public bool IsValid()
        {
            return LocationId > 0 &&
                   StartDate >= DateTime.UtcNow.Date &&
                   EndDate > StartDate &&
                   RentalDays <= 365; // Maximum rental period of 1 year
        }

        /// <summary>
        /// Gets validation error messages if the query is invalid.
        /// </summary>
        /// <returns>List of validation error messages.</returns>
        public IEnumerable<string> GetValidationErrors()
        {
            var errors = new List<string>();

            if (LocationId <= 0)
                errors.Add("Location ID must be greater than 0.");

            if (StartDate < DateTime.UtcNow.Date)
                errors.Add("Start date cannot be in the past.");

            if (EndDate <= StartDate)
                errors.Add("End date must be after start date.");

            if (RentalDays > 365)
                errors.Add("Rental period cannot exceed 365 days.");

            if (MinDailyRate.HasValue && MinDailyRate.Value < 0)
                errors.Add("Minimum daily rate cannot be negative.");

            if (MaxDailyRate.HasValue && MaxDailyRate.Value < 0)
                errors.Add("Maximum daily rate cannot be negative.");

            if (MinDailyRate.HasValue && MaxDailyRate.HasValue && MinDailyRate.Value > MaxDailyRate.Value)
                errors.Add("Minimum daily rate cannot be greater than maximum daily rate.");

            return errors;
        }
    }
}