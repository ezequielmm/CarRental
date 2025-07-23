using CarRental.Application.Queries;
using CarRental.Domain.Interfaces;
using CarRental.Domain.Entities;
using MediatR;

namespace CarRental.Application.Handlers
{
    /// <summary>
    /// Handler for checking car availability queries.
    /// Processes requests to find available cars for rental during specified periods.
    /// </summary>
    public class CheckCarAvailabilityQueryHandler : IRequestHandler<CheckCarAvailabilityQuery, CheckCarAvailabilityResult>
    {
        private readonly IUnitOfWork _unitOfWork;

        public CheckCarAvailabilityQueryHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
        }

        /// <summary>
        /// Handles the car availability check query.
        /// </summary>
        /// <param name="request">The availability check query.</param>
        /// <param name="cancellationToken">The cancellation token.</param>
        /// <returns>A result containing available cars and any conflicting rentals.</returns>
        public async Task<CheckCarAvailabilityResult> Handle(CheckCarAvailabilityQuery request, CancellationToken cancellationToken)
        {
            if (request.StartDate >= request.EndDate)
                throw new ArgumentException("End date must be after start date.");

            if (request.StartDate < DateTime.UtcNow.Date)
                throw new ArgumentException("Start date cannot be in the past.");

            // Get all cars at the specified location
            var allCars = await _unitOfWork.Cars.GetAllAsync();
            var locationCars = allCars.Where(c => c.LocationId == request.LocationId && c.IsAvailable);

            // Filter by car type if specified
            if (!string.IsNullOrWhiteSpace(request.CarType))
            {
                locationCars = locationCars.Where(c => c.Type.Equals(request.CarType, StringComparison.OrdinalIgnoreCase));
            }

            // Get all rentals that might conflict with the requested period
            var allRentals = await _unitOfWork.Rentals.GetAllAsync();
            var conflictingRentals = allRentals.Where(r =>
                r.Status != Domain.Enums.RentalStatus.Cancelled &&
                locationCars.Any(c => c.Id == r.CarId) &&
                HasDateConflict(r.StartDate, r.EndDate, request.StartDate, request.EndDate))
                .ToList();

            // Get cars that have no conflicting rentals
            var conflictingCarIds = conflictingRentals.Select(r => r.CarId).Distinct();
            var availableCars = locationCars.Where(c => !conflictingCarIds.Contains(c.Id)).ToList();

            // Get upcoming services that might affect availability
            var allServices = await _unitOfWork.Services.GetAllAsync();
            var upcomingServices = allServices.Where(s =>
                s.LocationId == request.LocationId &&
                s.Status == Domain.Entities.ServiceStatus.Scheduled &&
                s.ScheduledDate >= request.StartDate && s.ScheduledDate <= request.EndDate)
                .ToList();

            // Remove cars that have conflicting service appointments
            var servicingCarIds = upcomingServices.Select(s => s.CarId).Distinct();
            availableCars = availableCars.Where(c => !servicingCarIds.Contains(c.Id)).ToList();

            return new CheckCarAvailabilityResult
            {
                AvailableCars = availableCars,
                ConflictingRentals = conflictingRentals,
                UpcomingServices = upcomingServices,
                TotalAvailableCount = availableCars.Count,
                SearchCriteria = new SearchCriteria
                {
                    LocationId = request.LocationId,
                    StartDate = request.StartDate,
                    EndDate = request.EndDate,
                    CarType = request.CarType
                }
            };
        }

        /// <summary>
        /// Checks if two date ranges overlap.
        /// </summary>
        /// <param name="start1">Start date of first range.</param>
        /// <param name="end1">End date of first range.</param>
        /// <param name="start2">Start date of second range.</param>
        /// <param name="end2">End date of second range.</param>
        /// <returns>True if the ranges overlap, false otherwise.</returns>
        private static bool HasDateConflict(DateTime start1, DateTime end1, DateTime start2, DateTime end2)
        {
            return start1 < end2 && start2 < end1;
        }
    }

    /// <summary>
    /// Result of a car availability check query.
    /// Contains information about available cars and any conflicts.
    /// </summary>
    public class CheckCarAvailabilityResult
    {
        /// <summary>
        /// Gets or sets the list of cars available for the requested period.
        /// </summary>
        public IEnumerable<Car> AvailableCars { get; set; } = new List<Car>();

        /// <summary>
        /// Gets or sets the list of rentals that conflict with the requested period.
        /// </summary>
        public IEnumerable<Rental> ConflictingRentals { get; set; } = new List<Rental>();

        /// <summary>
        /// Gets or sets the list of upcoming services that might affect availability.
        /// </summary>
        public IEnumerable<Service> UpcomingServices { get; set; } = new List<Service>();

        /// <summary>
        /// Gets or sets the total count of available cars.
        /// </summary>
        public int TotalAvailableCount { get; set; }

        /// <summary>
        /// Gets or sets the search criteria used for this availability check.
        /// </summary>
        public SearchCriteria SearchCriteria { get; set; } = new SearchCriteria();
    }

    /// <summary>
    /// Represents the search criteria used for car availability checks.
    /// </summary>
    public class SearchCriteria
    {
        /// <summary>
        /// Gets or sets the location ID for the search.
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
        /// Gets or sets the car type filter (optional).
        /// </summary>
        public string? CarType { get; set; }

        /// <summary>
        /// Gets the rental period in days.
        /// </summary>
        public int RentalDays => (EndDate.Date - StartDate.Date).Days;
    }
}