using CarRental.Application.Commands;
using CarRental.WebApi;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using System.Net.Http.Json;
using System.Net;
using Xunit;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;

namespace CarRental.Tests.IntegrationTests
{
    /// <summary>
    /// Integration tests for the Car Rental API endpoints.
    /// Tests the complete request/response cycle including database operations.
    /// </summary>
    public class RentalApiIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly WebApplicationFactory<Program> _factory;
        private readonly HttpClient _client;

        public RentalApiIntegrationTests(WebApplicationFactory<Program> factory)
        {
            _factory = factory.WithWebHostBuilder(builder =>
            {
                builder.ConfigureAppConfiguration((context, config) =>
                {
                    config.AddInMemoryCollection(new Dictionary<string, string>
                    {
                        ["ConnectionStrings:DefaultConnection"] = "Server=(localdb)\\mssqllocaldb;Database=CarRentalTest;Trusted_Connection=true;MultipleActiveResultSets=true;TrustServerCertificate=true",
                        ["JwtSettings:SecretKey"] = "ThisIsATestSecretKeyForJWTTokenGeneration123456789!",
                        ["JwtSettings:Issuer"] = "CarRentalTestAPI",
                        ["JwtSettings:Audience"] = "CarRentalTestClient"
                    });
                });
            });
            
            _client = _factory.CreateClient();
        }

        [Fact]
        public async Task GetHealth_ShouldReturnOk()
        {
            // Act
            var response = await _client.GetAsync("/health");

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            
            var content = await response.Content.ReadAsStringAsync();
            Assert.Contains("Healthy", content);
        }

        [Fact]
        public async Task GetSwagger_ShouldReturnSwaggerDoc()
        {
            // Act
            var response = await _client.GetAsync("/swagger/v1/swagger.json");

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            
            var content = await response.Content.ReadAsStringAsync();
            Assert.Contains("Car Rental API", content);
            Assert.Contains("/api/rentals", content);
        }

        [Fact]
        public async Task GetLocations_ShouldReturnLocationsList()
        {
            // Act
            var response = await _client.GetAsync("/api/locations");

            // Assert
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);
            
            var content = await response.Content.ReadAsStringAsync();
            Assert.NotNull(content);
        }

        [Fact]
        public async Task PostRegisterCustomer_WithValidData_ShouldReturnCreated()
        {
            // Arrange
            var customerRequest = new
            {
                Id = $"TEST{DateTime.Now.Ticks}",
                FullName = "Integration Test Customer",
                Address = "123 Test Street, Test City"
            };

            // Act
            var response = await _client.PostAsJsonAsync("/api/customers/register", customerRequest);

            // Assert
            Assert.True(response.IsSuccessStatusCode);
            
            var content = await response.Content.ReadAsStringAsync();
            Assert.Contains(customerRequest.FullName, content);
        }

        [Fact]
        public async Task PostRegisterCustomer_WithInvalidData_ShouldReturnBadRequest()
        {
            // Arrange
            var invalidCustomerRequest = new
            {
                Id = "", // Invalid empty ID
                FullName = "Test Customer",
                Address = "Test Address"
            };

            // Act
            var response = await _client.PostAsJsonAsync("/api/customers/register", invalidCustomerRequest);

            // Assert
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task PostCheckAvailability_WithValidRequest_ShouldReturnAvailableCars()
        {
            // Arrange
            var availabilityRequest = new
            {
                LocationId = 1,
                StartDate = DateTime.UtcNow.AddDays(1).ToString("yyyy-MM-ddTHH:mm:ssZ"),
                EndDate = DateTime.UtcNow.AddDays(5).ToString("yyyy-MM-ddTHH:mm:ssZ")
            };

            // Act
            var response = await _client.PostAsJsonAsync("/api/rentals/check-availability", availabilityRequest);

            // Assert
            Assert.True(response.IsSuccessStatusCode);
            
            var content = await response.Content.ReadAsStringAsync();
            Assert.NotNull(content);
        }

        [Fact]
        public async Task GetStatistics_ShouldReturnStatisticsData()
        {
            // Arrange
            var startDate = DateTime.UtcNow.AddDays(-30).ToString("yyyy-MM-dd");
            var endDate = DateTime.UtcNow.ToString("yyyy-MM-dd");

            // Act
            var response = await _client.GetAsync($"/api/statistics/cars?startDate={startDate}&endDate={endDate}");

            // Assert
            Assert.True(response.IsSuccessStatusCode);
            
            var content = await response.Content.ReadAsStringAsync();
            Assert.NotNull(content);
        }

        [Fact]
        public async Task ApiEndpoints_ShouldHaveCorsEnabled()
        {
            // Arrange
            _client.DefaultRequestHeaders.Add("Origin", "http://localhost:4200");

            // Act
            var response = await _client.GetAsync("/api/locations");

            // Assert
            Assert.True(response.Headers.Contains("Access-Control-Allow-Origin") ||
                       response.Headers.GetValues("Access-Control-Allow-Origin").Any());
        }

        [Fact]
        public async Task Api_ShouldHandleInvalidEndpoints()
        {
            // Act
            var response = await _client.GetAsync("/api/nonexistent");

            // Assert
            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
        }

        [Theory]
        [InlineData("/api/customers/register")]
        [InlineData("/api/rentals/check-availability")]
        [InlineData("/api/rentals/create")]
        public async Task PostEndpoints_WithEmptyBody_ShouldReturnBadRequest(string endpoint)
        {
            // Act
            var response = await _client.PostAsync(endpoint, null);

            // Assert
            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task CompleteRentalFlow_ShouldWorkEndToEnd()
        {
            // Step 1: Register a customer
            var customerId = $"E2E{DateTime.Now.Ticks}";
            var customerRequest = new
            {
                Id = customerId,
                FullName = "End-to-End Test Customer",
                Address = "456 E2E Test Avenue"
            };

            var customerResponse = await _client.PostAsJsonAsync("/api/customers/register", customerRequest);
            Assert.True(customerResponse.IsSuccessStatusCode);

            // Step 2: Check availability
            var availabilityRequest = new
            {
                LocationId = 1,
                StartDate = DateTime.UtcNow.AddDays(1).ToString("yyyy-MM-ddTHH:mm:ssZ"),
                EndDate = DateTime.UtcNow.AddDays(3).ToString("yyyy-MM-ddTHH:mm:ssZ")
            };

            var availabilityResponse = await _client.PostAsJsonAsync("/api/rentals/check-availability", availabilityRequest);
            Assert.True(availabilityResponse.IsSuccessStatusCode);

            // Step 3: Get customer details
            var customerDetailsResponse = await _client.GetAsync($"/api/customers/{customerId}");
            if (customerDetailsResponse.IsSuccessStatusCode)
            {
                var customerContent = await customerDetailsResponse.Content.ReadAsStringAsync();
                Assert.Contains(customerRequest.FullName, customerContent);
            }

            // Step 4: Verify statistics endpoint works
            var statsResponse = await _client.GetAsync($"/api/statistics/cars?startDate={DateTime.UtcNow.AddDays(-7):yyyy-MM-dd}&endDate={DateTime.UtcNow:yyyy-MM-dd}");
            Assert.True(statsResponse.IsSuccessStatusCode);
        }

        protected virtual void Dispose(bool disposing)
        {
            if (disposing)
            {
                _client?.Dispose();
            }
        }

        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }
    }

    /// <summary>
    /// Performance integration tests for API endpoints.
    /// Tests response times and system behavior under load.
    /// </summary>
    public class PerformanceIntegrationTests : IClassFixture<WebApplicationFactory<Program>>
    {
        private readonly WebApplicationFactory<Program> _factory;
        private readonly HttpClient _client;

        public PerformanceIntegrationTests(WebApplicationFactory<Program> factory)
        {
            _factory = factory;
            _client = _factory.CreateClient();
        }

        [Fact]
        public async Task GetLocations_ShouldRespondWithinReasonableTime()
        {
            // Arrange
            var stopwatch = System.Diagnostics.Stopwatch.StartNew();

            // Act
            var response = await _client.GetAsync("/api/locations");
            stopwatch.Stop();

            // Assert
            Assert.True(response.IsSuccessStatusCode);
            Assert.True(stopwatch.ElapsedMilliseconds < 5000, 
                $"API response took too long: {stopwatch.ElapsedMilliseconds}ms");
        }

        [Fact]
        public async Task ConcurrentRequests_ShouldHandleMultipleClients()
        {
            // Arrange
            const int numberOfRequests = 10;
            var tasks = new List<Task<HttpResponseMessage>>();

            // Act
            for (int i = 0; i < numberOfRequests; i++)
            {
                tasks.Add(_client.GetAsync("/api/locations"));
            }

            var responses = await Task.WhenAll(tasks);

            // Assert
            Assert.All(responses, response => 
            {
                Assert.True(response.IsSuccessStatusCode);
            });
        }

        public void Dispose()
        {
            _client?.Dispose();
        }
    }
}