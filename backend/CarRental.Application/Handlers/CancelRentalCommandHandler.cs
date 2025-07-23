using MediatR;
using CarRental.Application.Commands;
using CarRental.Domain.Interfaces;
using CarRental.Domain.Enums;

namespace CarRental.Application.Handlers
{
    public class CancelRentalCommandHandler : IRequestHandler<CancelRentalCommand, CancelRentalResult>
    {
        private readonly IUnitOfWork _unitOfWork;

        public CancelRentalCommandHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<CancelRentalResult> Handle(CancelRentalCommand request, CancellationToken cancellationToken)
        {
            try
            {
                // Get the rental to cancel
                var rental = await _unitOfWork.Rentals.GetByIdAsync(request.RentalId);
                if (rental == null)
                {
                    return new CancelRentalResult
                    {
                        IsSuccess = false,
                        ErrorMessage = "Rental not found"
                    };
                }

                // Check if rental can be cancelled
                if (rental.Status == RentalStatus.Cancelled)
                {
                    return new CancelRentalResult
                    {
                        IsSuccess = false,
                        ErrorMessage = "Rental is already cancelled"
                    };
                }

                if (rental.Status == RentalStatus.Completed)
                {
                    return new CancelRentalResult
                    {
                        IsSuccess = false,
                        ErrorMessage = "Cannot cancel a completed rental"
                    };
                }

                if (rental.Status == RentalStatus.Active && rental.StartDate <= DateTime.Today)
                {
                    return new CancelRentalResult
                    {
                        IsSuccess = false,
                        ErrorMessage = "Cannot cancel an active rental that has already started"
                    };
                }

                // Cancel the rental
                rental.Status = RentalStatus.Cancelled;
                _unitOfWork.Rentals.Update(rental);
                await _unitOfWork.SaveChangesAsync();

                return new CancelRentalResult
                {
                    IsSuccess = true,
                    Status = rental.Status,
                    CancellationDate = DateTime.UtcNow
                };
            }
            catch (Exception ex)
            {
                return new CancelRentalResult
                {
                    IsSuccess = false,
                    ErrorMessage = $"An error occurred while cancelling the rental: {ex.Message}"
                };
            }
        }
    }
}