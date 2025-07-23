using CarRental.Domain.Interfaces;
using Microsoft.Extensions.Caching.Memory;
using System.Collections.Concurrent;
using System.Text.RegularExpressions;

namespace CarRental.Infrastructure.Services
{
    /// <summary>
    /// In-memory cache service implementation using Microsoft.Extensions.Caching.Memory.
    /// Provides caching functionality with expiration policies and statistics tracking.
    /// </summary>
    public class CachingService : ICachingService
    {
        private readonly IMemoryCache _memoryCache;
        private readonly ConcurrentDictionary<string, DateTime> _keyExpirations;
        private readonly DateTime _startTime;
        
        // Private fields for thread-safe statistics
        private long _hitCount;
        private long _missCount;
        private long _keyCount;

        /// <summary>
        /// Initializes a new instance of the CachingService class.
        /// </summary>
        /// <param name="memoryCache">The memory cache instance.</param>
        public CachingService(IMemoryCache memoryCache)
        {
            _memoryCache = memoryCache ?? throw new ArgumentNullException(nameof(memoryCache));
            _keyExpirations = new ConcurrentDictionary<string, DateTime>();
            _startTime = DateTime.UtcNow;
            _hitCount = 0;
            _missCount = 0;
            _keyCount = 0;
        }

        /// <inheritdoc />
        public async Task<T?> GetAsync<T>(string key) where T : class
        {
            if (string.IsNullOrEmpty(key))
                throw new ArgumentException("Key cannot be null or empty.", nameof(key));

            await Task.CompletedTask; // For async interface compliance

            if (_memoryCache.TryGetValue(key, out var value))
            {
                Interlocked.Increment(ref _hitCount);
                return value as T;
            }

            Interlocked.Increment(ref _missCount);
            return null;
        }

        /// <inheritdoc />
        public async Task<bool> SetAsync<T>(string key, T value, TimeSpan? expiration = null) where T : class
        {
            if (string.IsNullOrEmpty(key))
                throw new ArgumentException("Key cannot be null or empty.", nameof(key));

            if (value == null)
                throw new ArgumentNullException(nameof(value));

            await Task.CompletedTask; // For async interface compliance

            try
            {
                var options = new MemoryCacheEntryOptions();
                
                if (expiration.HasValue)
                {
                    options.AbsoluteExpirationRelativeToNow = expiration;
                    _keyExpirations[key] = DateTime.UtcNow.Add(expiration.Value);
                }
                else
                {
                    // Default expiration of 1 hour
                    options.AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(1);
                    _keyExpirations[key] = DateTime.UtcNow.Add(TimeSpan.FromHours(1));
                }

                options.PostEvictionCallbacks.Add(new PostEvictionCallbackRegistration
                {
                    EvictionCallback = (key, value, reason, state) =>
                    {
                        _keyExpirations.TryRemove(key.ToString()!, out _);
                        Interlocked.Decrement(ref _keyCount);
                    }
                });

                _memoryCache.Set(key, value, options);
                Interlocked.Increment(ref _keyCount);
                return true;
            }
            catch
            {
                return false;
            }
        }

        /// <inheritdoc />
        public async Task<bool> RemoveAsync(string key)
        {
            if (string.IsNullOrEmpty(key))
                throw new ArgumentException("Key cannot be null or empty.", nameof(key));

            await Task.CompletedTask; // For async interface compliance

            try
            {
                if (_memoryCache.TryGetValue(key, out _))
                {
                    _memoryCache.Remove(key);
                    _keyExpirations.TryRemove(key, out _);
                    Interlocked.Decrement(ref _keyCount);
                    return true;
                }
                return false;
            }
            catch
            {
                return false;
            }
        }

        /// <inheritdoc />
        public async Task<long> RemoveByPatternAsync(string pattern)
        {
            if (string.IsNullOrEmpty(pattern))
                throw new ArgumentException("Pattern cannot be null or empty.", nameof(pattern));

            await Task.CompletedTask; // For async interface compliance

            try
            {
                var regex = new Regex(pattern, RegexOptions.IgnoreCase);
                var keysToRemove = _keyExpirations.Keys.Where(key => regex.IsMatch(key)).ToList();
                
                long removedCount = 0;
                foreach (var key in keysToRemove)
                {
                    if (_memoryCache.TryGetValue(key, out _))
                    {
                        _memoryCache.Remove(key);
                        _keyExpirations.TryRemove(key, out _);
                        removedCount++;
                    }
                }

                Interlocked.Add(ref _keyCount, -removedCount);
                return removedCount;
            }
            catch
            {
                return 0;
            }
        }

        /// <inheritdoc />
        public async Task<bool> ExistsAsync(string key)
        {
            if (string.IsNullOrEmpty(key))
                throw new ArgumentException("Key cannot be null or empty.", nameof(key));

            await Task.CompletedTask; // For async interface compliance

            return _memoryCache.TryGetValue(key, out _);
        }

        /// <inheritdoc />
        public async Task<TimeSpan?> GetTimeToLiveAsync(string key)
        {
            if (string.IsNullOrEmpty(key))
                throw new ArgumentException("Key cannot be null or empty.", nameof(key));

            await Task.CompletedTask; // For async interface compliance

            if (_keyExpirations.TryGetValue(key, out var expiration))
            {
                var remaining = expiration - DateTime.UtcNow;
                return remaining > TimeSpan.Zero ? remaining : null;
            }

            return null;
        }

        /// <inheritdoc />
        public async Task<bool> RefreshAsync(string key, TimeSpan expiration)
        {
            if (string.IsNullOrEmpty(key))
                throw new ArgumentException("Key cannot be null or empty.", nameof(key));

            await Task.CompletedTask; // For async interface compliance

            if (_memoryCache.TryGetValue(key, out var value))
            {
                _memoryCache.Remove(key);
                var options = new MemoryCacheEntryOptions
                {
                    AbsoluteExpirationRelativeToNow = expiration
                };

                options.PostEvictionCallbacks.Add(new PostEvictionCallbackRegistration
                {
                    EvictionCallback = (key, value, reason, state) =>
                    {
                        _keyExpirations.TryRemove(key.ToString()!, out _);
                        Interlocked.Decrement(ref _keyCount);
                    }
                });

                _memoryCache.Set(key, value, options);
                _keyExpirations[key] = DateTime.UtcNow.Add(expiration);
                return true;
            }

            return false;
        }

        /// <inheritdoc />
        public async Task<Dictionary<string, T?>> GetManyAsync<T>(IEnumerable<string> keys) where T : class
        {
            if (keys == null)
                throw new ArgumentNullException(nameof(keys));

            await Task.CompletedTask; // For async interface compliance

            var result = new Dictionary<string, T?>();
            
            foreach (var key in keys)
            {
                if (!string.IsNullOrEmpty(key) && _memoryCache.TryGetValue(key, out var value))
                {
                    result[key] = value as T;
                    Interlocked.Increment(ref _hitCount);
                }
                else
                {
                    result[key] = null;
                    Interlocked.Increment(ref _missCount);
                }
            }

            return result;
        }

        /// <inheritdoc />
        public async Task<bool> SetManyAsync<T>(Dictionary<string, T> values, TimeSpan? expiration = null) where T : class
        {
            if (values == null)
                throw new ArgumentNullException(nameof(values));

            await Task.CompletedTask; // For async interface compliance

            try
            {
                foreach (var kvp in values)
                {
                    if (string.IsNullOrEmpty(kvp.Key) || kvp.Value == null)
                        continue;

                    var options = new MemoryCacheEntryOptions();
                    
                    if (expiration.HasValue)
                    {
                        options.AbsoluteExpirationRelativeToNow = expiration;
                        _keyExpirations[kvp.Key] = DateTime.UtcNow.Add(expiration.Value);
                    }
                    else
                    {
                        options.AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(1);
                        _keyExpirations[kvp.Key] = DateTime.UtcNow.Add(TimeSpan.FromHours(1));
                    }

                    options.PostEvictionCallbacks.Add(new PostEvictionCallbackRegistration
                    {
                        EvictionCallback = (key, value, reason, state) =>
                        {
                            _keyExpirations.TryRemove(key.ToString()!, out _);
                            Interlocked.Decrement(ref _keyCount);
                        }
                    });

                    _memoryCache.Set(kvp.Key, kvp.Value, options);
                    Interlocked.Increment(ref _keyCount);
                }

                return true;
            }
            catch
            {
                return false;
            }
        }

        /// <inheritdoc />
        public async Task<bool> ClearAllAsync()
        {
            await Task.CompletedTask; // For async interface compliance

            try
            {
                var keys = _keyExpirations.Keys.ToList();
                foreach (var key in keys)
                {
                    _memoryCache.Remove(key);
                }

                _keyExpirations.Clear();
                Interlocked.Exchange(ref _keyCount, 0);
                return true;
            }
            catch
            {
                return false;
            }
        }

        /// <inheritdoc />
        public async Task<CacheStatistics> GetStatisticsAsync()
        {
            await Task.CompletedTask; // For async interface compliance

            return new CacheStatistics
            {
                HitCount = Interlocked.Read(ref _hitCount),
                MissCount = Interlocked.Read(ref _missCount),
                KeyCount = Interlocked.Read(ref _keyCount),
                MemoryUsage = GC.GetTotalMemory(false), // Approximate memory usage
                Uptime = DateTime.UtcNow - _startTime,
                AdditionalMetrics = new Dictionary<string, object>
                {
                    { "CacheType", "InMemory" },
                    { "MaxItems", "Unlimited" },
                    { "EvictionPolicy", "LRU" }
                }
            };
        }
    }
}
