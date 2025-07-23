using CarRental.Application.Commands;
using CarRental.Application.Handlers;
using CarRental.Domain.Entities;
using CarRental.Domain.Enums;
using CarRental.Domain.Interfaces;
using Moq;
using Xunit;

namespace CarRental.Tests.UnitTests
{
    public class CreateRentalCommandHandlerTests
    {
        private readonly Mock<IUnitOfWork> _mockUnitOfWork;
        private readonly Mock<IRepository<Customer>> _mockCustomerRepo;
        private readonly Mock<IRepository<Car>> _mockCarRepo;
        private readonly Mock<IRepository<Rental>> _mockRentalRepo;
        private readonly CreateRentalCommandHandler _handler;

        public CreateRentalCommandHandlerTests()
        {
            _mockUnitOfWork = new Mock<IUnitOfWork>();
            _mockCustomerRepo = new Mock<IRepository<Customer>>();
            _mockCarRepo = new Mock<IRepository<Car>>();
            _mockRentalRepo = new Mock<IRepository<Rental>>();

            _mockUnitOfWork.Setup(x => x.Customers).Returns(_mockCustomerRepo.Object);
            _mockUnitOfWork.Setup(x => x.Cars).Returns(_mockCarRepo.Object);
            _mockUnitOfWork.Setup(x => x.Rentals).Returns(_mockRentalRepo.Object);

            _handler = new CreateRentalCommandHandler(_mockUnitOfWork.Object);
        }

        [Fact]
        public async Task Handle_WhenCustomerNotExists_ShouldReturnFailureResult()
        {
            // Arrange
            var command = new CreateRentalCommand
            {
                CustomerId = "123456789",
                CarId = 1,
                LocationId = 1,
                StartDate = DateTime.Today.AddDays(1),
                EndDate = DateTime.Today.AddDays(3)
            };

            _mockCustomerRepo.Setup(x => x.ExistsAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Customer, bool>>>()))
                           .ReturnsAsync(false);

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.Equal("Customer not found", result.ErrorMessage);
        }

        [Fact]
        public async Task Handle_WhenCarNotExists_ShouldReturnFailureResult()
        {
            // Arrange
            var command = new CreateRentalCommand
            {
                CustomerId = "123456789",
                CarId = 1,
                LocationId = 1,
                StartDate = DateTime.Today.AddDays(1),
                EndDate = DateTime.Today.AddDays(3)
            };

            _mockCustomerRepo.Setup(x => x.ExistsAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Customer, bool>>>()))
                           .ReturnsAsync(true);
            _mockCarRepo.Setup(x => x.FirstOrDefaultAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Car, bool>>>()))
                       .ReturnsAsync((Car?)null);

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.Equal("Car not found", result.ErrorMessage);
        }

        [Fact]
        public async Task Handle_WhenCarNotAvailable_ShouldReturnFailureResult()
        {
            // Arrange
            var command = new CreateRentalCommand
            {
                CustomerId = "123456789",
                CarId = 1,
                LocationId = 1,
                StartDate = DateTime.Today.AddDays(1),
                EndDate = DateTime.Today.AddDays(3)
            };

            var unavailableCar = new Car
            {
                Id = 1,
                Type = "SUV",
                Model = "Toyota RAV4",
                Brand = "Toyota",
                LocationId = 1,
                IsAvailable = false
            };

            _mockCustomerRepo.Setup(x => x.ExistsAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Customer, bool>>>()))
                           .ReturnsAsync(true);
            _mockCarRepo.Setup(x => x.FirstOrDefaultAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Car, bool>>>()))
                       .ReturnsAsync(unavailableCar);

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.Equal("Car is not available", result.ErrorMessage);
        }

        [Fact]
        public async Task Handle_WhenCarHasConflictingRental_ShouldReturnFailureResult()
        {
            // Arrange
            var command = new CreateRentalCommand
            {
                CustomerId = "123456789",
                CarId = 1,
                LocationId = 1,
                StartDate = DateTime.Today.AddDays(1),
                EndDate = DateTime.Today.AddDays(3)
            };

            var availableCar = new Car
            {
                Id = 1,
                Type = "SUV",
                Model = "Toyota RAV4",
                Brand = "Toyota",
                LocationId = 1,
                IsAvailable = true
            };

            _mockCustomerRepo.Setup(x => x.ExistsAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Customer, bool>>>()))
                           .ReturnsAsync(true);
            _mockCarRepo.Setup(x => x.FirstOrDefaultAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Car, bool>>>()))
                       .ReturnsAsync(availableCar);
            _mockRentalRepo.Setup(x => x.ExistsAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Rental, bool>>>()))
                          .ReturnsAsync(true);

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.Equal("The selected car is already reserved for the specified dates", result.ErrorMessage);
        }

        [Fact]
        public async Task Handle_WhenStartDateIsAfterEndDate_ShouldReturnFailureResult()
        {
            // Arrange
            var command = new CreateRentalCommand
            {
                CustomerId = "123456789",
                CarId = 1,
                LocationId = 1,
                StartDate = DateTime.Today.AddDays(3), // After end date
                EndDate = DateTime.Today.AddDays(1)
            };

            var availableCar = new Car
            {
                Id = 1,
                Type = "SUV",
                Model = "Toyota RAV4",
                Brand = "Toyota",
                LocationId = 1,
                IsAvailable = true
            };

            _mockCustomerRepo.Setup(x => x.ExistsAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Customer, bool>>>()))
                           .ReturnsAsync(true);
            _mockCarRepo.Setup(x => x.FirstOrDefaultAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Car, bool>>>()))
                       .ReturnsAsync(availableCar);
            _mockRentalRepo.Setup(x => x.ExistsAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Rental, bool>>>()))
                          .ReturnsAsync(false);

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.Equal("Start date must be before end date", result.ErrorMessage);
        }

        [Fact]
        public async Task Handle_WhenStartDateIsInThePast_ShouldReturnFailureResult()
        {
            // Arrange
            var command = new CreateRentalCommand
            {
                CustomerId = "123456789",
                CarId = 1,
                LocationId = 1,
                StartDate = DateTime.Today.AddDays(-1), // In the past
                EndDate = DateTime.Today.AddDays(1)
            };

            var availableCar = new Car
            {
                Id = 1,
                Type = "SUV",
                Model = "Toyota RAV4",
                Brand = "Toyota",
                LocationId = 1,
                IsAvailable = true
            };

            _mockCustomerRepo.Setup(x => x.ExistsAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Customer, bool>>>()))
                           .ReturnsAsync(true);
            _mockCarRepo.Setup(x => x.FirstOrDefaultAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Car, bool>>>()))
                       .ReturnsAsync(availableCar);
            _mockRentalRepo.Setup(x => x.ExistsAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Rental, bool>>>()))
                          .ReturnsAsync(false);

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.False(result.IsSuccess);
            Assert.Equal("Start date cannot be in the past", result.ErrorMessage);
        }

        [Fact]
        public async Task Handle_WhenAllValidationsPass_ShouldReturnSuccessResult()
        {
            // Arrange
            var command = new CreateRentalCommand
            {
                CustomerId = "123456789",
                CarId = 1,
                LocationId = 1,
                StartDate = DateTime.Today.AddDays(1),
                EndDate = DateTime.Today.AddDays(3)
            };

            var availableCar = new Car
            {
                Id = 1,
                Type = "SUV",
                Model = "Toyota RAV4",
                Brand = "Toyota",
                LocationId = 1,
                IsAvailable = true
            };

            _mockCustomerRepo.Setup(x => x.ExistsAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Customer, bool>>>()))
                           .ReturnsAsync(true);
            _mockCarRepo.Setup(x => x.FirstOrDefaultAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Car, bool>>>()))
                       .ReturnsAsync(availableCar);
            _mockRentalRepo.Setup(x => x.ExistsAsync(It.IsAny<System.Linq.Expressions.Expression<Func<Rental, bool>>>()))
                          .ReturnsAsync(false);
            _mockUnitOfWork.Setup(x => x.SaveChangesAsync()).ReturnsAsync(1);

            // Act
            var result = await _handler.Handle(command, CancellationToken.None);

            // Assert
            Assert.True(result.IsSuccess);
            Assert.Equal(RentalStatus.Reserved, result.Status);
            Assert.Empty(result.ErrorMessage);
            _mockRentalRepo.Verify(x => x.AddAsync(It.IsAny<Rental>()), Times.Once);
            _mockUnitOfWork.Verify(x => x.SaveChangesAsync(), Times.Once);
        }
    }
}