using System.Net;
using System.Text.Json;

namespace CarRental.WebApi.Middleware;

/// <summary>
/// Global exception handling middleware for the Car Rental API.
/// Provides centralized error processing and standardized error responses.
/// </summary>
public class GlobalExceptionMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<GlobalExceptionMiddleware> _logger;

    /// <summary>
    /// Initializes a new instance of the GlobalExceptionMiddleware class.
    /// </summary>
    /// <param name="next">The next middleware in the request pipeline.</param>
    /// <param name="logger">Logger instance for error reporting.</param>
    public GlobalExceptionMiddleware(RequestDelegate next, ILogger<GlobalExceptionMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    /// <summary>
    /// Processes HTTP requests and handles any unhandled exceptions.
    /// </summary>
    /// <param name="context">The HTTP context for the current request.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception exception)
        {
            _logger.LogError(exception, "An unhandled exception occurred during request processing");
            await HandleExceptionAsync(context, exception);
        }
    }

    /// <summary>
    /// Handles exceptions by creating appropriate HTTP responses based on exception type.
    /// </summary>
    /// <param name="context">The HTTP context for the current request.</param>
    /// <param name="exception">The exception that was thrown.</param>
    /// <returns>A task representing the asynchronous operation.</returns>
    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        var response = context.Response;
        response.ContentType = "application/json";

        var errorResponse = CreateErrorResponse(exception);
        response.StatusCode = (int)errorResponse.StatusCode;

        var jsonResponse = JsonSerializer.Serialize(new
        {
            success = false,
            message = errorResponse.Message,
            details = errorResponse.Details,
            timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ssZ")
        });

        await response.WriteAsync(jsonResponse);
    }

    /// <summary>
    /// Creates an error response based on the type and content of the exception.
    /// </summary>
    /// <param name="exception">The exception to process.</param>
    /// <returns>An ErrorResponse object containing status code and error details.</returns>
    private static ErrorResponse CreateErrorResponse(Exception exception)
    {
        return exception switch
        {
            ArgumentNullException => new ErrorResponse(
                HttpStatusCode.BadRequest,
                "Required parameter is missing",
                exception.Message
            ),
            
            ArgumentException => new ErrorResponse(
                HttpStatusCode.BadRequest,
                "Invalid request parameters",
                exception.Message
            ),
            
            InvalidOperationException => new ErrorResponse(
                HttpStatusCode.Conflict,
                "Operation cannot be performed",
                exception.Message
            ),
            
            UnauthorizedAccessException => new ErrorResponse(
                HttpStatusCode.Unauthorized,
                "Access denied",
                "You do not have permission to perform this operation"
            ),
            
            FileNotFoundException => new ErrorResponse(
                HttpStatusCode.NotFound,
                "Resource not found",
                "The requested resource could not be located"
            ),
            
            TimeoutException => new ErrorResponse(
                HttpStatusCode.RequestTimeout,
                "Request timeout",
                "The operation took too long to complete"
            ),
            
            NotImplementedException => new ErrorResponse(
                HttpStatusCode.NotImplemented,
                "Feature not implemented",
                "This feature is not yet available"
            ),
            
            _ => new ErrorResponse(
                HttpStatusCode.InternalServerError,
                "An unexpected error occurred",
                "Please try again later or contact support if the problem persists"
            )
        };
    }

    /// <summary>
    /// Represents a structured error response.
    /// </summary>
    private record ErrorResponse(HttpStatusCode StatusCode, string Message, string Details);
}

/// <summary>
/// Extension methods for configuring the global exception middleware.
/// </summary>
public static class GlobalExceptionMiddlewareExtensions
{
    /// <summary>
    /// Adds the global exception middleware to the application pipeline.
    /// </summary>
    /// <param name="app">The application builder instance.</param>
    /// <returns>The application builder for method chaining.</returns>
    public static IApplicationBuilder UseGlobalExceptionHandler(this IApplicationBuilder app)
    {
        return app.UseMiddleware<GlobalExceptionMiddleware>();
    }
}