using MediatR;

namespace CarRental.Application.Queries;

/// <summary>
/// Query para obtener estadísticas de vehículos - Funcionalidad Semi-Senior/Senior
/// Incluye tipo más alquilado, porcentaje de utilización y rankings
/// </summary>
public class GetCarStatisticsQuery : IRequest<CarStatisticsResponse>
{
    /// <summary>
    /// Fecha de inicio del período de análisis
    /// </summary>
    public DateTime StartDate { get; set; }

    /// <summary>
    /// Fecha de fin del período de análisis
    /// </summary>
    public DateTime EndDate { get; set; }

    /// <summary>
    /// ID de ubicación específica (opcional)
    /// </summary>
    public int? LocationId { get; set; }

    /// <summary>
    /// Incluir estadísticas detalladas por marca y modelo
    /// </summary>
    public bool IncludeDetailedStats { get; set; } = false;
}

/// <summary>
/// Respuesta con estadísticas completas de vehículos
/// </summary>
public class CarStatisticsResponse
{
    /// <summary>
    /// Período analizado
    /// </summary>
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public int DaysAnalyzed { get; set; }

    /// <summary>
    /// Estadísticas generales
    /// </summary>
    public CarTypeStatistics MostRentedType { get; set; } = new();
    public double OverallUtilizationRate { get; set; }
    public int TotalRentals { get; set; }
    public int TotalCarsAvailable { get; set; }

    /// <summary>
    /// Top 3 vehículos más alquilados
    /// </summary>
    public List<CarRentalRanking> TopCarsRanking { get; set; } = new();

    /// <summary>
    /// Estadísticas por tipo de vehículo
    /// </summary>
    public List<CarTypeStatistics> StatsByCarType { get; set; } = new();

    /// <summary>
    /// Estadísticas por marca (opcional)
    /// </summary>
    public List<BrandStatistics> StatsByBrand { get; set; } = new();

    /// <summary>
    /// Estadísticas por ubicación
    /// </summary>
    public List<LocationStatistics> StatsByLocation { get; set; } = new();

    /// <summary>
    /// Estadísticas diarias para gráficos
    /// </summary>
    public List<DailyRentalStatistics> DailyStats { get; set; } = new();
}

/// <summary>
/// Estadísticas de un tipo de vehículo específico
/// </summary>
public class CarTypeStatistics
{
    public string CarType { get; set; } = string.Empty;
    public int TotalRentals { get; set; }
    public int AvailableCars { get; set; }
    public double UtilizationPercentage { get; set; }
    public decimal AverageRentalDuration { get; set; } // En días
    public decimal TotalRevenue { get; set; } // Si tuviéramos precios
}

/// <summary>
/// Ranking de vehículos individuales
/// </summary>
public class CarRentalRanking
{
    public int CarId { get; set; }
    public string Brand { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string LicensePlate { get; set; } = string.Empty;
    public int TotalRentals { get; set; }
    public int TotalDaysRented { get; set; }
    public double UtilizationPercentage { get; set; }
    public string LocationName { get; set; } = string.Empty;
}

/// <summary>
/// Estadísticas por marca de vehículo
/// </summary>
public class BrandStatistics
{
    public string Brand { get; set; } = string.Empty;
    public int TotalCars { get; set; }
    public int TotalRentals { get; set; }
    public double AverageUtilization { get; set; }
    public List<string> PopularModels { get; set; } = new();
}

/// <summary>
/// Estadísticas por ubicación
/// </summary>
public class LocationStatistics
{
    public int LocationId { get; set; }
    public string LocationName { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public int TotalCars { get; set; }
    public int TotalRentals { get; set; }
    public double UtilizationRate { get; set; }
    public string MostPopularCarType { get; set; } = string.Empty;
}

/// <summary>
/// Estadísticas diarias para análisis temporal
/// </summary>
public class DailyRentalStatistics
{
    public DateTime Date { get; set; }
    public int NewRentals { get; set; }
    public int CompletedRentals { get; set; }
    public int CancelledRentals { get; set; }
    public int ActiveRentals { get; set; }
    public int CarsAvailable { get; set; }
    public double DailyUtilizationRate { get; set; }
}