using MediatR; 
using CarRental.Application.Queries; 
 
namespace CarRental.Application.Handlers 
{ 
    public class GetCarStatisticsQueryHandler : IRequestHandler<GetCarStatisticsQuery, object> 
    { 
        public Task<object> Handle(GetCarStatisticsQuery request, CancellationToken cancellationToken) 
        { 
            return Task.FromResult(new object()); 
        } 
    } 
} 
