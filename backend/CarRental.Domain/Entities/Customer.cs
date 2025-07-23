namespace CarRental.Domain.Entities;

/// <summary>
/// Represents a customer entity in the car rental system.
/// Contains essential customer information required for vehicle rental operations.
/// </summary>
public class Customer
{
    /// <summary>
    /// Gets or sets the unique identifier for the customer (typically a document ID or passport number).
    /// This serves as the primary key and must be unique across all customers.
    /// </summary>
    public string Id { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the customer's full name.
    /// This field is required for all rental operations and legal documentation.
    /// </summary>
    public string FullName { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the customer's complete address.
    /// Used for billing purposes and customer verification.
    /// </summary>
    public string Address { get; set; } = string.Empty;

    /// <summary>
    /// Gets or sets the timestamp when the customer record was created.
    /// Automatically set to UTC time upon creation.
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Gets or sets the timestamp when the customer record was last updated.
    /// Updated automatically whenever customer information is modified.
    /// </summary>
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Navigation property representing all rental records associated with this customer.
    /// Enables efficient querying of customer rental history.
    /// </summary>
    public virtual ICollection<Rental> Rentals { get; set; } = new List<Rental>();

    /// <summary>
    /// Validates whether the customer entity contains all required information.
    /// </summary>
    /// <returns>True if the customer data is valid and complete; otherwise, false.</returns>
    public bool IsValid()
    {
        return !string.IsNullOrWhiteSpace(Id) &&
               !string.IsNullOrWhiteSpace(FullName) &&
               !string.IsNullOrWhiteSpace(Address) &&
               Id.Length >= 7 &&
               FullName.Split(' ', StringSplitOptions.RemoveEmptyEntries).Length >= 2;
    }

    /// <summary>
    /// Determines whether the customer has any active rental reservations.
    /// </summary>
    /// <returns>True if the customer has active rentals; otherwise, false.</returns>
    public bool HasActiveRentals()
    {
        return Rentals.Any(r => r.IsActive());
    }

    /// <summary>
    /// Gets the total number of rental transactions for this customer.
    /// </summary>
    /// <returns>The count of all rental records associated with this customer.</returns>
    public int GetTotalRentals()
    {
        return Rentals.Count;
    }

    /// <summary>
    /// Retrieves all currently active rental records for this customer.
    /// </summary>
    /// <returns>An enumerable collection of active rental records.</returns>
    public IEnumerable<Rental> GetActiveRentals()
    {
        return Rentals.Where(r => r.IsActive());
    }

    /// <summary>
    /// Updates the customer's personal information with new data.
    /// Automatically updates the modification timestamp.
    /// </summary>
    /// <param name="fullName">The customer's new full name.</param>
    /// <param name="address">The customer's new address.</param>
    /// <exception cref="ArgumentException">Thrown when required parameters are null or empty.</exception>
    public void UpdateInfo(string fullName, string address)
    {
        if (string.IsNullOrWhiteSpace(fullName))
            throw new ArgumentException("Customer full name is required and cannot be empty.", nameof(fullName));

        if (string.IsNullOrWhiteSpace(address))
            throw new ArgumentException("Customer address is required and cannot be empty.", nameof(address));

        FullName = fullName.Trim();
        Address = address.Trim();
        UpdatedAt = DateTime.UtcNow;
    }
}