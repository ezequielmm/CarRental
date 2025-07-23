using CarRental.Domain.Entities;

namespace CarRental.Domain.Interfaces
{
    public interface IUnitOfWork : IDisposable
    {
        IRepository<Customer> Customers { get; }
        IRepository<Car> Cars { get; }
        IRepository<Rental> Rentals { get; }
        IRepository<Service> Services { get; }
        IRepository<Location> Locations { get; }
        
        Task<int> SaveChangesAsync();
        Task BeginTransactionAsync();
        Task CommitTransactionAsync();
        Task RollbackTransactionAsync();
    }
}