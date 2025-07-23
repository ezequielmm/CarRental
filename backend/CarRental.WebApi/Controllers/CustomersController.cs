using MediatR;
using Microsoft.AspNetCore.Mvc;
using CarRental.Application.Commands;

namespace CarRental.WebApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CustomersController : ControllerBase
    {
        private readonly IMediator _mediator;

        public CustomersController(IMediator mediator)
        {
            _mediator = mediator;
        }

        /// <summary>
        /// Register a new customer in the system
        /// </summary>
        /// <param name="command">Customer registration details</param>
        /// <returns>Customer registration result</returns>
        [HttpPost("register")]
        public async Task<ActionResult<RegisterCustomerResult>> RegisterCustomer([FromBody] RegisterCustomerCommand command)
        {
            var result = await _mediator.Send(command);
            
            if (!result.IsSuccess)
            {
                return BadRequest(result);
            }

            return CreatedAtAction(nameof(GetCustomer), new { id = result.CustomerId }, result);
        }

        /// <summary>
        /// Get customer by ID (placeholder for future implementation)
        /// </summary>
        /// <param name="id">Customer ID</param>
        /// <returns>Customer details</returns>
        [HttpGet("{id}")]
        public async Task<ActionResult> GetCustomer(string id)
        {
            // This will be implemented when we add GetCustomerQuery
            return Ok($"Customer {id} details would be returned here");
        }
    }
}