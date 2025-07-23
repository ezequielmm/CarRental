using CarRental.Domain.Common;
using CarRental.Domain.Enums;

namespace CarRental.Domain.Entities
{
    /// <summary>
    /// Represents a maintenance or service record for a vehicle in the car rental system.
    /// Contains information about scheduled and completed services, repairs, and maintenance activities.
    /// </summary>
    public class Service : BaseEntity
    {
        /// <summary>
        /// Gets or sets the ID of the car being serviced.
        /// </summary>
        public int CarId { get; set; }

        /// <summary>
        /// Gets or sets the type of service (e.g., Oil Change, Brake Inspection, General Maintenance).
        /// </summary>
        public string ServiceType { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets a detailed description of the service performed or to be performed.
        /// </summary>
        public string Description { get; set; } = string.Empty;

        /// <summary>
        /// Gets or sets the scheduled date and time for the service.
        /// </summary>
        public DateTime ScheduledDate { get; set; }

        /// <summary>
        /// Gets or sets the actual completion date and time of the service.
        /// This is null until the service is completed.
        /// </summary>
        public DateTime? CompletedDate { get; set; }

        /// <summary>
        /// Gets or sets the estimated duration of the service in minutes.
        /// </summary>
        public int EstimatedDurationMinutes { get; set; }

        /// <summary>
        /// Gets or sets the actual duration of the service in minutes.
        /// This is null until the service is completed.
        /// </summary>
        public int? ActualDurationMinutes { get; set; }

        /// <summary>
        /// Gets or sets the current status of the service.
        /// </summary>
        public ServiceStatus Status { get; set; } = ServiceStatus.Scheduled;

        /// <summary>
        /// Gets or sets the cost of the service.
        /// </summary>
        public decimal Cost { get; set; }

        /// <summary>
        /// Gets or sets the ID of the location where the service is performed.
        /// </summary>
        public int LocationId { get; set; }

        /// <summary>
        /// Gets or sets the technician or service provider name.
        /// </summary>
        public string? Technician { get; set; }

        /// <summary>
        /// Gets or sets additional notes about the service.
        /// </summary>
        public string? Notes { get; set; }

        /// <summary>
        /// Gets or sets the priority level of the service.
        /// </summary>
        public ServicePriority Priority { get; set; } = ServicePriority.Medium;

        /// <summary>
        /// Gets or sets the odometer reading at the time of service.
        /// </summary>
        public int? OdometerReading { get; set; }

        /// <summary>
        /// Navigation property to the car being serviced.
        /// </summary>
        public virtual Car? Car { get; set; }

        /// <summary>
        /// Navigation property to the location where the service is performed.
        /// </summary>
        public virtual Location? Location { get; set; }

        /// <summary>
        /// Gets the service duration in a human-readable format.
        /// </summary>
        public string FormattedDuration
        {
            get
            {
                var duration = ActualDurationMinutes ?? EstimatedDurationMinutes;
                var hours = duration / 60;
                var minutes = duration % 60;
                
                if (hours > 0)
                    return minutes > 0 ? $"{hours}h {minutes}m" : $"{hours}h";
                return $"{minutes}m";
            }
        }

        /// <summary>
        /// Checks if the service is overdue based on the scheduled date.
        /// </summary>
        public bool IsOverdue => 
            Status == ServiceStatus.Scheduled && 
            ScheduledDate < DateTime.UtcNow;

        /// <summary>
        /// Marks the service as completed with the specified completion details.
        /// </summary>
        /// <param name="completedDate">The date and time the service was completed.</param>
        /// <param name="actualDuration">The actual duration in minutes.</param>
        /// <param name="technician">The technician who performed the service.</param>
        /// <param name="notes">Additional notes about the completed service.</param>
        public void MarkAsCompleted(DateTime? completedDate = null, int? actualDuration = null, 
            string? technician = null, string? notes = null)
        {
            if (Status == ServiceStatus.Completed)
                throw new InvalidOperationException("Service is already marked as completed.");

            Status = ServiceStatus.Completed;
            CompletedDate = completedDate ?? DateTime.UtcNow;
            ActualDurationMinutes = actualDuration;
            
            if (!string.IsNullOrWhiteSpace(technician))
                Technician = technician;
            
            if (!string.IsNullOrWhiteSpace(notes))
                Notes = notes;

            UpdatedAt = DateTime.UtcNow;
        }

        /// <summary>
        /// Marks the service as in progress.
        /// </summary>
        public void MarkAsInProgress()
        {
            if (Status == ServiceStatus.Completed)
                throw new InvalidOperationException("Cannot change status of completed service.");

            Status = ServiceStatus.InProgress;
            UpdatedAt = DateTime.UtcNow;
        }

        /// <summary>
        /// Cancels the service.
        /// </summary>
        /// <param name="reason">The reason for cancellation.</param>
        public void Cancel(string? reason = null)
        {
            if (Status == ServiceStatus.Completed)
                throw new InvalidOperationException("Cannot cancel completed service.");

            Status = ServiceStatus.Cancelled;
            
            if (!string.IsNullOrWhiteSpace(reason))
            {
                Notes = string.IsNullOrWhiteSpace(Notes) ? 
                    $"Cancelled: {reason}" : 
                    $"{Notes}\nCancelled: {reason}";
            }

            UpdatedAt = DateTime.UtcNow;
        }

        /// <summary>
        /// Reschedules the service to a new date.
        /// </summary>
        /// <param name="newDate">The new scheduled date.</param>
        public void Reschedule(DateTime newDate)
        {
            if (Status == ServiceStatus.Completed)
                throw new InvalidOperationException("Cannot reschedule completed service.");

            if (newDate <= DateTime.UtcNow)
                throw new ArgumentException("New scheduled date must be in the future.", nameof(newDate));

            ScheduledDate = newDate;
            Status = ServiceStatus.Scheduled;
            UpdatedAt = DateTime.UtcNow;
        }

        /// <summary>
        /// Updates the service cost.
        /// </summary>
        /// <param name="newCost">The new cost amount.</param>
        public void UpdateCost(decimal newCost)
        {
            if (newCost < 0)
                throw new ArgumentException("Cost cannot be negative.", nameof(newCost));

            Cost = newCost;
            UpdatedAt = DateTime.UtcNow;
        }

        /// <summary>
        /// Validates that all required properties are properly set.
        /// </summary>
        /// <returns>True if the service entity is valid, false otherwise.</returns>
        public bool IsValid()
        {
            return CarId > 0 &&
                   !string.IsNullOrWhiteSpace(ServiceType) &&
                   !string.IsNullOrWhiteSpace(Description) &&
                   ScheduledDate > default(DateTime) &&
                   EstimatedDurationMinutes > 0 &&
                   LocationId > 0 &&
                   Cost >= 0;
        }
    }

    /// <summary>
    /// Represents the status of a service or maintenance activity.
    /// </summary>
    public enum ServiceStatus
    {
        /// <summary>
        /// Service is scheduled but not yet started.
        /// </summary>
        Scheduled = 1,

        /// <summary>
        /// Service is currently in progress.
        /// </summary>
        InProgress = 2,

        /// <summary>
        /// Service has been completed.
        /// </summary>
        Completed = 3,

        /// <summary>
        /// Service has been cancelled.
        /// </summary>
        Cancelled = 4,

        /// <summary>
        /// Service is on hold or postponed.
        /// </summary>
        OnHold = 5
    }

    /// <summary>
    /// Represents the priority level of a service or maintenance activity.
    /// </summary>
    public enum ServicePriority
    {
        /// <summary>
        /// Low priority service that can be scheduled flexibly.
        /// </summary>
        Low = 1,

        /// <summary>
        /// Medium priority service with standard scheduling.
        /// </summary>
        Medium = 2,

        /// <summary>
        /// High priority service that should be scheduled soon.
        /// </summary>
        High = 3,

        /// <summary>
        /// Critical priority service that requires immediate attention.
        /// </summary>
        Critical = 4
    }
}