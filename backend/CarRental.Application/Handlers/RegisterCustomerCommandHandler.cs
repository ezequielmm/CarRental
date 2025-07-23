using MediatR;
using CarRental.Application.Commands;
using CarRental.Domain.Interfaces;
using CarRental.Domain.Entities;

namespace CarRental.Application.Handlers
{
    public class RegisterCustomerCommandHandler : IRequestHandler<RegisterCustomerCommand, RegisterCustomerResult>
    {
        private readonly IUnitOfWork _unitOfWork;

        public RegisterCustomerCommandHandler(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<RegisterCustomerResult> Handle(RegisterCustomerCommand request, CancellationToken cancellationToken)
        {
            try
            {
                // Validate input
                if (string.IsNullOrWhiteSpace(request.ID))
                {
                    return new RegisterCustomerResult
                    {
                        IsSuccess = false,
                        ErrorMessage = "Customer ID is required"
                    };
                }

                if (string.IsNullOrWhiteSpace(request.FullName))
                {
                    return new RegisterCustomerResult
                    {
                        IsSuccess = false,
                        ErrorMessage = "Customer full name is required"
                    };
                }

                if (string.IsNullOrWhiteSpace(request.Address))
                {
                    return new RegisterCustomerResult
                    {
                        IsSuccess = false,
                        ErrorMessage = "Customer address is required"
                    };
                }

                // Validate ID format (should be numeric and appropriate length)
                if (request.ID.Length < 7 || request.ID.Length > 10 || !request.ID.All(char.IsDigit))
                {
                    return new RegisterCustomerResult
                    {
                        IsSuccess = false,
                        ErrorMessage = "Customer ID must be between 7-10 digits"
                    };
                }

                // Check if customer already exists - FIXED: Use Id instead of ID
                var existingCustomer = await _unitOfWork.Customers.FirstOrDefaultAsync(c => c.Id == request.ID);
                if (existingCustomer != null)
                {
                    return new RegisterCustomerResult
                    {
                        IsSuccess = false,
                        ErrorMessage = "Customer with this ID already exists"
                    };
                }

                // Create new customer - FIXED: Use Id instead of ID
                var customer = new Customer
                {
                    Id = request.ID,
                    FullName = request.FullName.Trim(),
                    Address = request.Address.Trim()
                };

                await _unitOfWork.Customers.AddAsync(customer);
                await _unitOfWork.SaveChangesAsync();

                return new RegisterCustomerResult
                {
                    IsSuccess = true,
                    CustomerId = customer.Id // FIXED: Use Id instead of ID
                };
            }
            catch (Exception ex)
            {
                return new RegisterCustomerResult
                {
                    IsSuccess = false,
                    ErrorMessage = $"An error occurred while registering customer: {ex.Message}"
                };
            }
        }
    }
}