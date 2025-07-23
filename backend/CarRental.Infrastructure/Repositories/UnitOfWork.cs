using CarRental.Domain.Entities;
using CarRental.Domain.Interfaces;
using CarRental.Infrastructure.Data;
using Microsoft.EntityFrameworkCore.Storage;

namespace CarRental.Infrastructure.Repositories
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly CarRentalDbContext _context;
        private IDbContextTransaction? _transaction;
        
        private IRepository<Customer>? _customers;
        private IRepository<Car>? _cars;
        private IRepository<Rental>? _rentals;
        private IRepository<Service>? _services;
        private IRepository<Location>? _locations;

        public UnitOfWork(CarRentalDbContext context)
        {
            _context = context;
        }

        public IRepository<Customer> Customers =>
            _customers ??= new Repository<Customer>(_context);

        public IRepository<Car> Cars =>
            _cars ??= new Repository<Car>(_context);

        public IRepository<Rental> Rentals =>
            _rentals ??= new Repository<Rental>(_context);

        public IRepository<Service> Services =>
            _services ??= new Repository<Service>(_context);

        public IRepository<Location> Locations =>
            _locations ??= new Repository<Location>(_context);

        public async Task<int> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync();
        }

        public async Task BeginTransactionAsync()
        {
            _transaction = await _context.Database.BeginTransactionAsync();
        }

        public async Task CommitTransactionAsync()
        {
            if (_transaction != null)
            {
                await _transaction.CommitAsync();
                await _transaction.DisposeAsync();
                _transaction = null;
            }
        }

        public async Task RollbackTransactionAsync()
        {
            if (_transaction != null)
            {
                await _transaction.RollbackAsync();
                await _transaction.DisposeAsync();
                _transaction = null;
            }
        }

        public void Dispose()
        {
            _transaction?.Dispose();
            _context.Dispose();
        }
    }
}