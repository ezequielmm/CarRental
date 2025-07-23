using MediatR;

namespace CarRental.Application.Commands
{
    public class RegisterCustomerCommand : IRequest<RegisterCustomerResult>
    {
        public string ID { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
    }

    public class RegisterCustomerResult
    {
        public bool IsSuccess { get; set; }
        public string CustomerId { get; set; } = string.Empty;
        public string ErrorMessage { get; set; } = string.Empty;
    }
}