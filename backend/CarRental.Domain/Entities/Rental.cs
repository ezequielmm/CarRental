using CarRental.Domain.Enums;

namespace CarRental.Domain.Entities;

/// <summary>
/// Entidad que representa una reserva de vehículo
/// Implementa las reglas de negocio para el proceso de alquiler
/// </summary>
public class Rental
{
    /// <summary>
    /// Identificador único de la reserva
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Identificador del cliente que realiza la reserva
    /// </summary>
    public string CustomerId { get; set; } = string.Empty;

    /// <summary>
    /// Identificador del vehículo reservado
    /// </summary>
    public int CarId { get; set; }

    /// <summary>
    /// Identificador de la ubicación de la reserva
    /// </summary>
    public int LocationId { get; set; }

    /// <summary>
    /// Fecha de inicio de la reserva
    /// </summary>
    public DateTime StartDate { get; set; }

    /// <summary>
    /// Fecha de finalización de la reserva
    /// </summary>
    public DateTime EndDate { get; set; }

    /// <summary>
    /// Estado actual de la reserva
    /// </summary>
    public RentalStatus Status { get; set; } = RentalStatus.Reserved;

    /// <summary>
    /// Fecha de creación de la reserva
    /// </summary>
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// Fecha de última actualización
    /// </summary>
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    /// <summary>
    /// ID del usuario autenticado (opcional, para usuarios registrados)
    /// </summary>
    public string? UserId { get; set; }

    // Propiedades de navegación
    /// <summary>
    /// Cliente asociado a la reserva
    /// </summary>
    public virtual Customer Customer { get; set; } = null!;

    /// <summary>
    /// Vehículo reservado
    /// </summary>
    public virtual Car Car { get; set; } = null!;

    /// <summary>
    /// Ubicación de la reserva
    /// </summary>
    public virtual Location Location { get; set; } = null!;

    /// <summary>
    /// Usuario autenticado asociado (opcional)
    /// </summary>
    public virtual ApplicationUser? User { get; set; }

    // Métodos de dominio para encapsular lógica de negocio

    /// <summary>
    /// Valida si las fechas de la reserva son válidas
    /// </summary>
    public bool HasValidDates()
    {
        return StartDate < EndDate && StartDate >= DateTime.Today;
    }

    /// <summary>
    /// Verifica si la reserva está activa (no cancelada ni completada)
    /// </summary>
    public bool IsActive()
    {
        return Status != RentalStatus.Cancelled && Status != RentalStatus.Completed;
    }

    /// <summary>
    /// Verifica si dos reservas tienen conflicto de fechas
    /// </summary>
    public bool HasDateConflictWith(Rental other)
    {
        if (!IsActive() || !other.IsActive())
            return false;

        return StartDate < other.EndDate && EndDate > other.StartDate;
    }

    /// <summary>
    /// Cancela la reserva
    /// </summary>
    public void Cancel()
    {
        if (Status == RentalStatus.Completed)
            throw new InvalidOperationException("No se puede cancelar una reserva ya completada");

        Status = RentalStatus.Cancelled;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Modifica las fechas de la reserva
    /// </summary>
    public void ModifyDates(DateTime newStartDate, DateTime newEndDate)
    {
        if (Status == RentalStatus.Completed)
            throw new InvalidOperationException("No se puede modificar una reserva completada");

        if (Status == RentalStatus.Cancelled)
            throw new InvalidOperationException("No se puede modificar una reserva cancelada");

        if (newStartDate >= newEndDate)
            throw new ArgumentException("La fecha de inicio debe ser anterior a la fecha de fin");

        if (newStartDate < DateTime.Today)
            throw new ArgumentException("La fecha de inicio no puede ser anterior a hoy");

        StartDate = newStartDate;
        EndDate = newEndDate;
        Status = RentalStatus.Modified;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Marca la reserva como completada
    /// </summary>
    public void Complete()
    {
        if (Status == RentalStatus.Cancelled)
            throw new InvalidOperationException("No se puede completar una reserva cancelada");

        Status = RentalStatus.Completed;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Calcula la duración de la reserva en días
    /// </summary>
    public int GetDurationInDays()
    {
        return (EndDate - StartDate).Days;
    }
}