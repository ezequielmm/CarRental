using MediatR;
using CarRental.Domain.Enums;

namespace CarRental.Application.Commands
{
    public class CancelRentalCommand : IRequest<CancelRentalResult>
    {
        public int RentalId { get; set; }
        public string CancellationReason { get; set; } = string.Empty;
    }

    public class CancelRentalResult
    {
        public bool IsSuccess { get; set; }
        public string ErrorMessage { get; set; } = string.Empty;
        public RentalStatus Status { get; set; }
        public DateTime CancellationDate { get; set; }
    }
}