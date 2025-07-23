namespace CarRental.Domain.Common
{
    /// <summary>
    /// Base entity class that provides common properties for all entities in the domain.
    /// Contains auditing fields and primary key definition.
    /// </summary>
    public abstract class BaseEntity
    {
        /// <summary>
        /// Gets or sets the unique identifier for the entity.
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// Gets or sets the date and time when the entity was created.
        /// </summary>
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Gets or sets the date and time when the entity was last updated.
        /// </summary>
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        /// <summary>
        /// Gets or sets the ID of the user who created the entity.
        /// </summary>
        public string? CreatedBy { get; set; }

        /// <summary>
        /// Gets or sets the ID of the user who last updated the entity.
        /// </summary>
        public string? UpdatedBy { get; set; }

        /// <summary>
        /// Indicates whether the entity is soft deleted.
        /// </summary>
        public bool IsDeleted { get; set; } = false;

        /// <summary>
        /// Gets or sets the date and time when the entity was soft deleted.
        /// </summary>
        public DateTime? DeletedAt { get; set; }

        /// <summary>
        /// Gets or sets the ID of the user who deleted the entity.
        /// </summary>
        public string? DeletedBy { get; set; }

        /// <summary>
        /// Marks the entity as updated with the current timestamp.
        /// </summary>
        public virtual void MarkAsUpdated()
        {
            UpdatedAt = DateTime.UtcNow;
        }

        /// <summary>
        /// Soft deletes the entity by setting the IsDeleted flag and DeletedAt timestamp.
        /// </summary>
        /// <param name="deletedBy">The ID of the user performing the deletion.</param>
        public virtual void SoftDelete(string? deletedBy = null)
        {
            IsDeleted = true;
            DeletedAt = DateTime.UtcNow;
            DeletedBy = deletedBy;
        }

        /// <summary>
        /// Restores a soft deleted entity.
        /// </summary>
        public virtual void Restore()
        {
            IsDeleted = false;
            DeletedAt = null;
            DeletedBy = null;
            UpdatedAt = DateTime.UtcNow;
        }
    }
}