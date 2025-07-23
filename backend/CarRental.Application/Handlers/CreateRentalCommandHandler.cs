using MediatR; 
using CarRental.Application.Commands; 
using CarRental.Domain.Interfaces; 
using CarRental.Domain.Entities; 
using CarRental.Domain.Enums; 
 
namespace CarRental.Application.Handlers 
{ 
    public class CreateRentalCommandHandler : IRequestHandler<CreateRentalCommand, CreateRentalResult> 
    { 
        private readonly IUnitOfWork _unitOfWork; 
 
        public CreateRentalCommandHandler(IUnitOfWork unitOfWork) 
        { 
            _unitOfWork = unitOfWork; 
        } 
 
        public async Task<CreateRentalResult> Handle(CreateRentalCommand request, CancellationToken cancellationToken) 
        { 
            return new CreateRentalResult { IsSuccess = true, RentalId = 1, Status = RentalStatus.Reserved }; 
        } 
    } 
} 
