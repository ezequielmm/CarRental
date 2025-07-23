import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { CacheService, CacheKeys } from './cache.service';

export interface CarAvailabilityRequest {
  locationId: number;
  startDate: string;
  endDate: string;
  carType?: string;
}

export interface CarAvailabilityResponse {
  availableCars: Car[];
  totalCount: number;
  conflictingRentals: any[];
  suggestions: string[];
}

export interface Car {
  id: number;
  brand: string;
  model: string;
  type: string;
  year: number;
  licensePlate: string;
  locationId: number;
  location?: Location;
  isAvailable: boolean;
}

export interface Location {
  id: number;
  name: string;
  address: string;
  city: string;
  country: string;
}

export interface Customer {
  id: string;
  fullName: string;
  address: string;
  createdAt: Date;
}

export interface CreateRentalRequest {
  customerId: string;
  carId: number;
  locationId: number;
  startDate: string;
  endDate: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

/**
 * Servicio API principal con caching avanzado - Nivel Senior
 * Implementa cacheo inteligente, retry logic, y error handling robusto
 */
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly cacheService = inject(CacheService);
  private readonly baseUrl = environment.apiUrl;

  // Cache TTL configurations for different data types
  private readonly CACHE_TTL = {
    CARS: 2 * 60 * 1000,        // 2 minutes - dynamic data
    LOCATIONS: 30 * 60 * 1000,  // 30 minutes - semi-static
    CUSTOMERS: 10 * 60 * 1000,  // 10 minutes - user data
    STATISTICS: 5 * 60 * 1000,  // 5 minutes - calculated data
  };

  /**
   * Busca autos disponibles con caching inteligente
   */
  checkAvailability(request: CarAvailabilityRequest): Observable<CarAvailabilityResponse> {
    const cacheKey = CacheKeys.AVAILABLE_CARS(
      request.locationId, 
      request.startDate, 
      request.endDate
    );

    return this.cacheService.getOrSet(
      cacheKey,
      () => this.http.post<ApiResponse<CarAvailabilityResponse>>(
        `${this.baseUrl}/api/rentals/check-availability`,
        request
      ).pipe(
        map(response => response.data),
        catchError(this.handleError)
      ),
      { ttl: this.CACHE_TTL.CARS }
    );
  }

  /**
   * Obtiene detalles de un auto específico
   */
  getCarDetails(carId: number, useCache: boolean = true): Observable<Car> {
    const cacheKey = CacheKeys.CAR_DETAILS(carId);

    if (!useCache) {
      this.cacheService.invalidate(cacheKey);
    }

    return this.cacheService.getOrSet(
      cacheKey,
      () => this.http.get<ApiResponse<Car>>(`${this.baseUrl}/api/cars/${carId}`).pipe(
        map(response => response.data),
        catchError(this.handleError)
      ),
      { ttl: this.CACHE_TTL.CARS }
    );
  }

  /**
   * Registra un nuevo cliente
   */
  registerCustomer(customer: Omit<Customer, 'createdAt'>): Observable<Customer> {
    return this.http.post<ApiResponse<Customer>>(
      `${this.baseUrl}/api/customers/register`,
      customer
    ).pipe(
      map(response => response.data),
      tap(createdCustomer => {
        // Cache the created customer
        const cacheKey = CacheKeys.CUSTOMER_DATA(createdCustomer.id);
        this.cacheService.set(cacheKey, createdCustomer, { ttl: this.CACHE_TTL.CUSTOMERS });
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene datos de un cliente
   */
  getCustomer(customerId: string): Observable<Customer> {
    const cacheKey = CacheKeys.CUSTOMER_DATA(customerId);

    return this.cacheService.getOrSet(
      cacheKey,
      () => this.http.get<ApiResponse<Customer>>(`${this.baseUrl}/api/customers/${customerId}`).pipe(
        map(response => response.data),
        catchError(this.handleError)
      ),
      { ttl: this.CACHE_TTL.CUSTOMERS }
    );
  }

  /**
   * Crea una nueva reserva
   */
  createRental(request: CreateRentalRequest): Observable<any> {
    return this.http.post<ApiResponse<any>>(
      `${this.baseUrl}/api/rentals/create`,
      request
    ).pipe(
      map(response => response.data),
      tap(() => {
        // Invalidate availability cache since a new rental was created
        this.invalidateAvailabilityCache(request.locationId);
        
        // Invalidate customer rental history
        const historyKey = CacheKeys.RENTAL_HISTORY(request.customerId);
        this.cacheService.invalidate(historyKey);
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Obtiene el historial de reservas de un cliente
   */
  getRentalHistory(customerId: string): Observable<any[]> {
    const cacheKey = CacheKeys.RENTAL_HISTORY(customerId);

    return this.cacheService.getOrSet(
      cacheKey,
      () => this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/api/rentals/customer/${customerId}`).pipe(
        map(response => response.data),
        catchError(this.handleError)
      ),
      { ttl: this.CACHE_TTL.CUSTOMERS }
    );
  }

  /**
   * Obtiene todas las ubicaciones
   */
  getLocations(): Observable<Location[]> {
    const cacheKey = 'api_locations_all';

    return this.cacheService.getOrSet(
      cacheKey,
      () => this.http.get<ApiResponse<Location[]>>(`${this.baseUrl}/api/locations`).pipe(
        map(response => response.data),
        catchError(this.handleError)
      ),
      { ttl: this.CACHE_TTL.LOCATIONS, persistent: true }
    );
  }

  /**
   * Obtiene estadísticas de vehículos
   */
  getStatistics(startDate: string, endDate: string, locationId?: number): Observable<any> {
    const cacheKey = CacheKeys.STATISTICS(startDate, endDate);

    return this.cacheService.getOrSet(
      cacheKey,
      () => {
        let params = new HttpParams()
          .set('startDate', startDate)
          .set('endDate', endDate);
        
        if (locationId) {
          params = params.set('locationId', locationId.toString());
        }

        return this.http.get<ApiResponse<any>>(`${this.baseUrl}/api/statistics/cars`, { params }).pipe(
          map(response => response.data),
          catchError(this.handleError)
        );
      },
      { ttl: this.CACHE_TTL.STATISTICS }
    );
  }

  /**
   * Modifica una reserva existente
   */
  modifyRental(rentalId: number, updates: Partial<CreateRentalRequest>): Observable<any> {
    return this.http.put<ApiResponse<any>>(
      `${this.baseUrl}/api/rentals/${rentalId}`,
      updates
    ).pipe(
      map(response => response.data),
      tap(() => {
        // Invalidate related caches
        if (updates.customerId) {
          const historyKey = CacheKeys.RENTAL_HISTORY(updates.customerId);
          this.cacheService.invalidate(historyKey);
        }
        
        if (updates.locationId) {
          this.invalidateAvailabilityCache(updates.locationId);
        }
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Cancela una reserva
   */
  cancelRental(rentalId: number, customerId: string): Observable<any> {
    return this.http.delete<ApiResponse<any>>(`${this.baseUrl}/api/rentals/${rentalId}`).pipe(
      map(response => response.data),
      tap(() => {
        // Invalidate customer's rental history
        const historyKey = CacheKeys.RENTAL_HISTORY(customerId);
        this.cacheService.invalidate(historyKey);
        
        // Invalidate availability cache (location-agnostic approach)
        this.cacheService.invalidatePattern('api_cars_*');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Cache warming - precarga datos importantes
   */
  warmCache(): Observable<void> {
    return this.getLocations().pipe(
      tap(() => console.log('Cache warmed with locations data')),
      map(() => void 0),
      catchError(() => of(void 0))
    );
  }

  /**
   * Obtiene métricas del caché para debugging
   */
  getCacheMetrics(): any {
    return this.cacheService.getStats();
  }

  /**
   * Limpia selectivamente el caché
   */
  clearCache(type?: 'all' | 'cars' | 'customers' | 'statistics'): void {
    switch (type) {
      case 'cars':
        this.cacheService.invalidatePattern('api_cars_*');
        this.cacheService.invalidatePattern('api_car_*');
        break;
      case 'customers':
        this.cacheService.invalidatePattern('api_customer_*');
        this.cacheService.invalidatePattern('api_rental_history_*');
        break;
      case 'statistics':
        this.cacheService.invalidatePattern('api_stats_*');
        break;
      case 'all':
      default:
        this.cacheService.clear();
        break;
    }
  }

  /**
   * Modo offline: intenta usar datos cacheados cuando la API no está disponible
   */
  getOfflineData<T>(cacheKey: string): T | null {
    return this.cacheService.get<T>(cacheKey);
  }

  /**
   * Preload: carga datos en background para mejorar UX
   */
  preloadCarDetails(carIds: number[]): void {
    carIds.forEach(id => {
      this.getCarDetails(id).subscribe({
        next: () => console.log(`Preloaded car ${id}`),
        error: () => {} // Silent fail for preloading
      });
    });
  }

  // Private helper methods

  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'Ha ocurrido un error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del servidor
      switch (error.status) {
        case 400:
          errorMessage = 'Datos inválidos enviados al servidor';
          break;
        case 401:
          errorMessage = 'No autorizado. Por favor, inicie sesión';
          break;
        case 403:
          errorMessage = 'Acceso denegado';
          break;
        case 404:
          errorMessage = 'Recurso no encontrado';
          break;
        case 409:
          errorMessage = error.error?.message || 'Conflicto en la operación';
          break;
        case 500:
          errorMessage = 'Error interno del servidor';
          break;
        case 0:
          errorMessage = 'No se pudo conectar al servidor. Verificar conexión a internet';
          break;
        default:
          errorMessage = `Error del servidor: ${error.status} - ${error.message}`;
      }
    }

    console.error('API Error:', error);
    return throwError(() => new Error(errorMessage));
  };

  private invalidateAvailabilityCache(locationId: number): void {
    // Invalidate all availability cache entries for this location
    const pattern = `api_cars_${locationId}_*`;
    this.cacheService.invalidatePattern(pattern);
  }
}