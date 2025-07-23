using Microsoft.AspNetCore.Mvc;
using MediatR;
using CarRental.Application.Commands;
using CarRental.Application.Queries;
using CarRental.Application.Handlers;

namespace CarRental.WebApi.Controllers
{
    /// <summary>
    /// Controller for managing vehicle rental operations.
    /// Provides endpoints for checking availability, creating, modifying, and cancelling rentals.
    /// </summary>
    [ApiController]
    [Route("api/[controller]")]
    public class RentalsController : ControllerBase
    {
        private readonly IMediator _mediator;
        private readonly ILogger<RentalsController> _logger;

        public RentalsController(IMediator mediator, ILogger<RentalsController> logger)
        {
            _mediator = mediator ?? throw new ArgumentNullException(nameof(mediator));
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
        }

        /// <summary>
        /// Checks vehicle availability for a specific location and date range.
        /// </summary>
        /// <param name="locationId">The location ID to search in.</param>
        /// <param name="startDate">The start date for the rental period.</param>
        /// <param name="endDate">The end date for the rental period.</param>
        /// <param name="carType">Optional car type filter (e.g., "Sedan", "SUV").</param>
        /// <param name="minRate">Optional minimum daily rate filter.</param>
        /// <param name="maxRate">Optional maximum daily rate filter.</param>
        /// <returns>A list of available cars and related information.</returns>
        [HttpPost("check-availability")]
        public async Task<ActionResult<CheckCarAvailabilityResult>> CheckAvailability(
            [FromBody] CheckCarAvailabilityRequest request)
        {
            try
            {
                _logger.LogInformation("Checking car availability for location {LocationId} from {StartDate} to {EndDate}",
                    request.LocationId, request.StartDate, request.EndDate);

                var query = new CheckCarAvailabilityQuery
                {
                    LocationId = request.LocationId,
                    StartDate = request.StartDate,
                    EndDate = request.EndDate,
                    CarType = request.CarType,
                    MinDailyRate = request.MinDailyRate,
                    MaxDailyRate = request.MaxDailyRate
                };

                // Validate the query
                if (!query.IsValid())
                {
                    var validationErrors = query.GetValidationErrors();
                    return BadRequest(new { Errors = validationErrors });
                }

                var result = await _mediator.Send(query);

                _logger.LogInformation("Found {Count} available cars for the requested period",
                    result.TotalAvailableCount);

                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Invalid request parameters for availability check");
                return BadRequest(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while checking car availability");
                return StatusCode(500, new { Message = "An error occurred while processing your request" });
            }
        }

        /// <summary>
        /// Creates a new rental reservation.
        /// </summary>
        /// <param name="command">The rental creation details.</param>
        /// <returns>The created rental information.</returns>
        [HttpPost("create")]
        public async Task<ActionResult<CreateRentalResult>> CreateRental([FromBody] CreateRentalCommand command)
        {
            try
            {
                _logger.LogInformation("Creating rental for customer {CustomerId} and car {CarId}",
                    command.CustomerId, command.CarId);

                var result = await _mediator.Send(command);

                _logger.LogInformation("Successfully created rental with ID {RentalId}",
                    result.RentalId);

                return CreatedAtAction(nameof(GetRental), new { id = result.RentalId }, result);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Invalid rental creation request");
                return BadRequest(new { Message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Rental creation failed due to business rule violation");
                return Conflict(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while creating rental");
                return StatusCode(500, new { Message = "An error occurred while processing your request" });
            }
        }

        /// <summary>
        /// Modifies an existing rental reservation.
        /// </summary>
        /// <param name="id">The rental ID to modify.</param>
        /// <param name="command">The modification details.</param>
        /// <returns>The updated rental information.</returns>
        [HttpPut("{id}")]
        public async Task<ActionResult<ModifyRentalResult>> ModifyRental(int id, [FromBody] ModifyRentalCommand command)
        {
            try
            {
                if (id != command.RentalId)
                    return BadRequest(new { Message = "Rental ID in URL does not match request body" });

                _logger.LogInformation("Modifying rental {RentalId}", id);

                var result = await _mediator.Send(command);

                _logger.LogInformation("Successfully modified rental {RentalId}", id);

                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Invalid rental modification request");
                return BadRequest(new { Message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Rental modification failed due to business rule violation");
                return Conflict(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while modifying rental");
                return StatusCode(500, new { Message = "An error occurred while processing your request" });
            }
        }

        /// <summary>
        /// Cancels an existing rental reservation.
        /// </summary>
        /// <param name="id">The rental ID to cancel.</param>
        /// <param name="command">The cancellation details.</param>
        /// <returns>Confirmation of the cancellation.</returns>
        [HttpDelete("{id}")]
        public async Task<ActionResult<CancelRentalResult>> CancelRental(int id, [FromBody] CancelRentalCommand command)
        {
            try
            {
                if (id != command.RentalId)
                    return BadRequest(new { Message = "Rental ID in URL does not match request body" });

                _logger.LogInformation("Cancelling rental {RentalId}", id);

                var result = await _mediator.Send(command);

                _logger.LogInformation("Successfully cancelled rental {RentalId}", id);

                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                _logger.LogWarning(ex, "Invalid rental cancellation request");
                return BadRequest(new { Message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                _logger.LogWarning(ex, "Rental cancellation failed due to business rule violation");
                return Conflict(new { Message = ex.Message });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while cancelling rental");
                return StatusCode(500, new { Message = "An error occurred while processing your request" });
            }
        }

        /// <summary>
        /// Gets a specific rental by ID.
        /// </summary>
        /// <param name="id">The rental ID.</param>
        /// <returns>The rental information.</returns>
        [HttpGet("{id}")]
        public async Task<ActionResult> GetRental(int id)
        {
            try
            {
                _logger.LogInformation("Retrieving rental {RentalId}", id);

                // TODO: Implement GetRentalQuery and handler
                return Ok(new { Message = $"Rental {id} retrieved successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while retrieving rental {RentalId}", id);
                return StatusCode(500, new { Message = "An error occurred while processing your request" });
            }
        }

        /// <summary>
        /// Gets all rentals for a specific customer.
        /// </summary>
        /// <param name="customerId">The customer ID.</param>
        /// <returns>List of rentals for the customer.</returns>
        [HttpGet("customer/{customerId}")]
        public async Task<ActionResult> GetCustomerRentals(string customerId)
        {
            try
            {
                _logger.LogInformation("Retrieving rentals for customer {CustomerId}", customerId);

                // TODO: Implement GetCustomerRentalsQuery and handler
                return Ok(new { Message = $"Rentals for customer {customerId} retrieved successfully" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while retrieving rentals for customer {CustomerId}", customerId);
                return StatusCode(500, new { Message = "An error occurred while processing your request" });
            }
        }
    }

    /// <summary>
    /// Request model for checking car availability.
    /// </summary>
    public class CheckCarAvailabilityRequest
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
        /// Gets or sets the car type filter (optional).
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
    }
}