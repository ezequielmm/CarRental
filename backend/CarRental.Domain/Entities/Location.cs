namespace CarRental.Domain.Entities
{
    public class Location
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string City { get; set; } = string.Empty;
        public string Country { get; set; } = string.Empty;

        // Navigation properties
        public ICollection<Car> Cars { get; set; } = new List<Car>();
        public ICollection<Rental> Rentals { get; set; } = new List<Rental>();
    }
}