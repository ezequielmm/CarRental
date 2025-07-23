using MediatR;
using CarRental.Domain.Enums;

namespace CarRental.Application.Commands
{
    public class ModifyRentalCommand : IRequest<ModifyRentalResult>
    {
        public int RentalId { get; set; }
        public DateTime? NewStartDate { get; set; }
        public DateTime? NewEndDate { get; set; }
        public int? NewCarId { get; set; }
    }

    public class ModifyRentalResult
    {
        public bool IsSuccess { get; set; }
        public string ErrorMessage { get; set; } = string.Empty;
        public RentalStatus Status { get; set; }
        public DateTime? ModifiedStartDate { get; set; }
        public DateTime? ModifiedEndDate { get; set; }
        public int? ModifiedCarId { get; set; }
    }
}