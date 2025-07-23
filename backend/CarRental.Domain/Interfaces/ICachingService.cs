namespace CarRental.Domain.Interfaces
{
    /// <summary>
    /// Interface for caching service operations.
    /// Provides methods for storing, retrieving, and managing cached data with expiration policies.
    /// </summary>
    public interface ICachingService
    {
        /// <summary>
        /// Gets a cached value by key.
        /// </summary>
        /// <typeparam name="T">The type of the cached value.</typeparam>
        /// <param name="key">The cache key.</param>
        /// <returns>The cached value if found, otherwise default(T).</returns>
        Task<T?> GetAsync<T>(string key) where T : class;

        /// <summary>
        /// Sets a value in the cache with the specified key.
        /// </summary>
        /// <typeparam name="T">The type of the value to cache.</typeparam>
        /// <param name="key">The cache key.</param>
        /// <param name="value">The value to cache.</param>
        /// <param name="expiration">The expiration time for the cached value. If null, uses default expiration.</param>
        /// <returns>True if the value was successfully cached, otherwise false.</returns>
        Task<bool> SetAsync<T>(string key, T value, TimeSpan? expiration = null) where T : class;

        /// <summary>
        /// Removes a cached value by key.
        /// </summary>
        /// <param name="key">The cache key to remove.</param>
        /// <returns>True if the key was found and removed, otherwise false.</returns>
        Task<bool> RemoveAsync(string key);

        /// <summary>
        /// Removes all cached values that match the specified pattern.
        /// </summary>
        /// <param name="pattern">The pattern to match keys against.</param>
        /// <returns>The number of keys that were removed.</returns>
        Task<long> RemoveByPatternAsync(string pattern);

        /// <summary>
        /// Checks if a key exists in the cache.
        /// </summary>
        /// <param name="key">The cache key to check.</param>
        /// <returns>True if the key exists, otherwise false.</returns>
        Task<bool> ExistsAsync(string key);

        /// <summary>
        /// Gets the remaining time to live for a cached key.
        /// </summary>
        /// <param name="key">The cache key.</param>
        /// <returns>The remaining time to live, or null if the key doesn't exist or has no expiration.</returns>
        Task<TimeSpan?> GetTimeToLiveAsync(string key);

        /// <summary>
        /// Refreshes the expiration time for a cached key.
        /// </summary>
        /// <param name="key">The cache key.</param>
        /// <param name="expiration">The new expiration time.</param>
        /// <returns>True if the expiration was successfully updated, otherwise false.</returns>
        Task<bool> RefreshAsync(string key, TimeSpan expiration);

        /// <summary>
        /// Gets multiple cached values by keys.
        /// </summary>
        /// <typeparam name="T">The type of the cached values.</typeparam>
        /// <param name="keys">The cache keys.</param>
        /// <returns>A dictionary with the found cached values.</returns>
        Task<Dictionary<string, T?>> GetManyAsync<T>(IEnumerable<string> keys) where T : class;

        /// <summary>
        /// Sets multiple values in the cache.
        /// </summary>
        /// <typeparam name="T">The type of the values to cache.</typeparam>
        /// <param name="values">Dictionary of key-value pairs to cache.</param>
        /// <param name="expiration">The expiration time for all cached values.</param>
        /// <returns>True if all values were successfully cached, otherwise false.</returns>
        Task<bool> SetManyAsync<T>(Dictionary<string, T> values, TimeSpan? expiration = null) where T : class;

        /// <summary>
        /// Clears all cached data.
        /// </summary>
        /// <returns>True if the cache was successfully cleared, otherwise false.</returns>
        Task<bool> ClearAllAsync();

        /// <summary>
        /// Gets cache statistics and information.
        /// </summary>
        /// <returns>Cache statistics including hit/miss ratios, memory usage, etc.</returns>
        Task<CacheStatistics> GetStatisticsAsync();
    }

    /// <summary>
    /// Represents cache statistics and performance metrics.
    /// </summary>
    public class CacheStatistics
    {
        /// <summary>
        /// Gets or sets the total number of cache hits.
        /// </summary>
        public long HitCount { get; set; }

        /// <summary>
        /// Gets or sets the total number of cache misses.
        /// </summary>
        public long MissCount { get; set; }

        /// <summary>
        /// Gets the cache hit ratio as a percentage.
        /// </summary>
        public double HitRatio => TotalRequests > 0 ? (double)HitCount / TotalRequests * 100 : 0;

        /// <summary>
        /// Gets the total number of cache requests.
        /// </summary>
        public long TotalRequests => HitCount + MissCount;

        /// <summary>
        /// Gets or sets the number of keys currently in the cache.
        /// </summary>
        public long KeyCount { get; set; }

        /// <summary>
        /// Gets or sets the approximate memory usage in bytes.
        /// </summary>
        public long MemoryUsage { get; set; }

        /// <summary>
        /// Gets or sets the cache uptime.
        /// </summary>
        public TimeSpan Uptime { get; set; }

        /// <summary>
        /// Gets or sets additional cache-specific metrics.
        /// </summary>
        public Dictionary<string, object> AdditionalMetrics { get; set; } = new Dictionary<string, object>();
    }
}