import { Injectable, signal, computed } from '@angular/core';
import { Observable, of, tap, shareReplay } from 'rxjs';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
  hitCount: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number; // Maximum cache size
  persistent?: boolean; // Use localStorage for persistence
}

/**
 * Servicio de caché avanzado para Angular - Funcionalidad Senior
 * Implementa LRU cache, persistencia opcional y métricas
 */
@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly DEFAULT_MAX_SIZE = 100;
  
  private cache = new Map<string, CacheEntry<any>>();
  private accessOrder = new Map<string, number>(); // For LRU implementation
  private accessCounter = 0;
  
  // Signals for reactive metrics
  private _hitCount = signal(0);
  private _missCount = signal(0);
  private _evictionCount = signal(0);
  private _cacheSize = signal(0);

  // Computed metrics
  readonly hitCount = this._hitCount.asReadonly();
  readonly missCount = this._missCount.asReadonly();
  readonly evictionCount = this._evictionCount.asReadonly();
  readonly cacheSize = this._cacheSize.asReadonly();
  readonly hitRate = computed(() => {
    const total = this.hitCount() + this.missCount();
    return total > 0 ? (this.hitCount() / total) * 100 : 0;
  });

  constructor() {
    this.startCleanupInterval();
    this.loadFromPersistentStorage();
  }

  /**
   * Obtiene un valor del caché
   */
  get<T>(key: string): T | null {
    this.cleanup(); // Clean expired entries
    
    const entry = this.cache.get(key);
    
    if (!entry) {
      this._missCount.update(count => count + 1);
      return null;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
      this._missCount.update(count => count + 1);
      this.updateCacheSize();
      return null;
    }

    // Update access order for LRU
    this.updateAccessOrder(key);
    entry.hitCount++;
    this._hitCount.update(count => count + 1);
    
    return entry.data;
  }

  /**
   * Establece un valor en el caché
   */
  set<T>(key: string, value: T, options: CacheOptions = {}): void {
    const ttl = options.ttl ?? this.DEFAULT_TTL;
    const maxSize = options.maxSize ?? this.DEFAULT_MAX_SIZE;
    
    // Remove if already exists
    if (this.cache.has(key)) {
      this.cache.delete(key);
      this.accessOrder.delete(key);
    }

    // Check size limit and evict if necessary
    if (this.cache.size >= maxSize) {
      this.evictLRU();
    }

    const entry: CacheEntry<T> = {
      data: value,
      timestamp: Date.now(),
      expiry: Date.now() + ttl,
      hitCount: 0
    };

    this.cache.set(key, entry);
    this.updateAccessOrder(key);
    this.updateCacheSize();

    // Persist if requested
    if (options.persistent) {
      this.persistEntry(key, entry);
    }
  }

  /**
   * Obtiene o establece un valor usando un factory observable
   */
  getOrSet<T>(
    key: string, 
    factory: () => Observable<T>, 
    options: CacheOptions = {}
  ): Observable<T> {
    const cached = this.get<T>(key);
    
    if (cached !== null) {
      return of(cached);
    }

    return factory().pipe(
      tap(value => this.set(key, value, options)),
      shareReplay(1)
    );
  }

  /**
   * Invalida una entrada específica
   */
  invalidate(key: string): boolean {
    const existed = this.cache.has(key);
    this.cache.delete(key);
    this.accessOrder.delete(key);
    this.removePersistentEntry(key);
    this.updateCacheSize();
    return existed;
  }

  /**
   * Invalida múltiples entradas por patrón
   */
  invalidatePattern(pattern: string): number {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    const keysToRemove: string[] = [];
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => this.invalidate(key));
    return keysToRemove.length;
  }

  /**
   * Limpia todo el caché
   */
  clear(): void {
    this.cache.clear();
    this.accessOrder.clear();
    this.clearPersistentStorage();
    this.updateCacheSize();
  }

  /**
   * Obtiene todas las claves del caché
   */
  keys(): string[] {
    this.cleanup();
    return Array.from(this.cache.keys());
  }

  /**
   * Verifica si una clave existe
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    return entry !== undefined && !this.isExpired(entry);
  }

  /**
   * Obtiene el tamaño actual del caché
   */
  size(): number {
    this.cleanup();
    return this.cache.size;
  }

  /**
   * Obtiene estadísticas completas del caché
   */
  getStats(): {
    hitCount: number;
    missCount: number;
    evictionCount: number;
    size: number;
    hitRate: number;
    memoryUsage: number;
    oldestEntry?: Date;
    mostAccessedKey?: string;
  } {
    let oldestTimestamp = Infinity;
    let mostAccessedKey = '';
    let maxHitCount = 0;
    let totalMemoryUsage = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
      }
      
      if (entry.hitCount > maxHitCount) {
        maxHitCount = entry.hitCount;
        mostAccessedKey = key;
      }

      // Estimate memory usage
      totalMemoryUsage += this.estimateSize(key, entry.data);
    }

    return {
      hitCount: this.hitCount(),
      missCount: this.missCount(),
      evictionCount: this.evictionCount(),
      size: this.cacheSize(),
      hitRate: this.hitRate(),
      memoryUsage: totalMemoryUsage,
      oldestEntry: oldestTimestamp !== Infinity ? new Date(oldestTimestamp) : undefined,
      mostAccessedKey: mostAccessedKey || undefined
    };
  }

  /**
   * Warming del caché con datos precargados
   */
  warm<T>(entries: Array<{ key: string; value: T; options?: CacheOptions }>): void {
    entries.forEach(({ key, value, options }) => {
      this.set(key, value, options);
    });
  }

  /**
   * Exporta el estado del caché
   */
  export(): Record<string, any> {
    const exportData: Record<string, any> = {};
    
    for (const [key, entry] of this.cache.entries()) {
      if (!this.isExpired(entry)) {
        exportData[key] = {
          data: entry.data,
          timestamp: entry.timestamp,
          expiry: entry.expiry,
          hitCount: entry.hitCount
        };
      }
    }
    
    return exportData;
  }

  /**
   * Importa estado del caché
   */
  import(data: Record<string, any>): void {
    for (const [key, entry] of Object.entries(data)) {
      if (entry && typeof entry === 'object' && 'data' in entry) {
        this.cache.set(key, entry as CacheEntry<any>);
        this.updateAccessOrder(key);
      }
    }
    this.updateCacheSize();
  }

  // Private methods

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() > entry.expiry;
  }

  private updateAccessOrder(key: string): void {
    this.accessOrder.set(key, ++this.accessCounter);
  }

  private evictLRU(): void {
    let oldestKey = '';
    let oldestAccess = Infinity;

    for (const [key, accessTime] of this.accessOrder.entries()) {
      if (accessTime < oldestAccess) {
        oldestAccess = accessTime;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.accessOrder.delete(oldestKey);
      this._evictionCount.update(count => count + 1);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToRemove: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => {
      this.cache.delete(key);
      this.accessOrder.delete(key);
      this.removePersistentEntry(key);
    });

    if (keysToRemove.length > 0) {
      this.updateCacheSize();
    }
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanup();
    }, 60000); // Clean up every minute
  }

  private updateCacheSize(): void {
    this._cacheSize.set(this.cache.size);
  }

  private estimateSize(key: string, value: any): number {
    try {
      const jsonString = JSON.stringify({ key, value });
      return jsonString.length * 2; // Rough estimate (2 bytes per character)
    } catch {
      return 1000; // Default estimate
    }
  }

  private persistEntry(key: string, entry: CacheEntry<any>): void {
    try {
      const persistKey = `cache_${key}`;
      localStorage.setItem(persistKey, JSON.stringify(entry));
    } catch (error) {
      console.warn('Failed to persist cache entry:', error);
    }
  }

  private removePersistentEntry(key: string): void {
    try {
      const persistKey = `cache_${key}`;
      localStorage.removeItem(persistKey);
    } catch (error) {
      console.warn('Failed to remove persistent cache entry:', error);
    }
  }

  private loadFromPersistentStorage(): void {
    try {
      const cacheKeys = Object.keys(localStorage).filter(key => key.startsWith('cache_'));
      
      for (const persistKey of cacheKeys) {
        const originalKey = persistKey.replace('cache_', '');
        const entryData = localStorage.getItem(persistKey);
        
        if (entryData) {
          const entry = JSON.parse(entryData) as CacheEntry<any>;
          
          if (!this.isExpired(entry)) {
            this.cache.set(originalKey, entry);
            this.updateAccessOrder(originalKey);
          } else {
            localStorage.removeItem(persistKey);
          }
        }
      }
      
      this.updateCacheSize();
    } catch (error) {
      console.warn('Failed to load from persistent storage:', error);
    }
  }

  private clearPersistentStorage(): void {
    try {
      const cacheKeys = Object.keys(localStorage).filter(key => key.startsWith('cache_'));
      cacheKeys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('Failed to clear persistent storage:', error);
    }
  }
}

// Cache key constants for common use cases
export const CacheKeys = {
  // API responses
  AVAILABLE_CARS: (locationId: number, startDate: string, endDate: string) => 
    `api_cars_${locationId}_${startDate}_${endDate}`,
  
  CAR_DETAILS: (carId: number) => `api_car_${carId}`,
  
  CUSTOMER_DATA: (customerId: string) => `api_customer_${customerId}`,
  
  RENTAL_HISTORY: (customerId: string) => `api_rental_history_${customerId}`,
  
  STATISTICS: (startDate: string, endDate: string) => 
    `api_stats_${startDate}_${endDate}`,
  
  // UI state
  THEME_PREFERENCES: 'ui_theme_prefs',
  
  FORM_DRAFTS: (formName: string) => `ui_form_draft_${formName}`,
  
  USER_PREFERENCES: 'ui_user_prefs',

  // Computed results
  SEARCH_RESULTS: (query: string) => `computed_search_${btoa(query)}`,
  
  FILTERED_DATA: (filters: string) => `computed_filtered_${btoa(filters)}`
} as const;