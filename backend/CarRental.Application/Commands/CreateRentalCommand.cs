using MediatR;
using CarRental.Domain.Enums;

namespace CarRental.Application.Commands
{
    public class CreateRentalCommand : IRequest<CreateRentalResult>
    {
        public string CustomerId { get; set; } = string.Empty;
        public int CarId { get; set; }
        public int LocationId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
    }

    public class CreateRentalResult
    {
        public bool IsSuccess { get; set; }
        public int RentalId { get; set; }
        public string ErrorMessage { get; set; } = string.Empty;
        public RentalStatus Status { get; set; }
    }
}