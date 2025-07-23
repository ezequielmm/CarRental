import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  CreateRentalRequest, 
  CreateRentalResponse, 
  CheckCarAvailabilityRequest, 
  CheckCarAvailabilityResponse,
  ModifyRentalRequest,
  ModifyRentalResponse,
  CancelRentalRequest,
  CancelRentalResponse
} from '../../domain/entities/rental.model';
import { CreateCustomerRequest, CreateCustomerResponse } from '../../domain/entities/customer.model';

@Injectable({
  providedIn: 'root'
})
export class RentalService {
  private readonly apiUrl = 'https://localhost:7000/api'; // Backend API URL

  constructor(private http: HttpClient) { }

  // Customer operations
  registerCustomer(request: CreateCustomerRequest): Observable<CreateCustomerResponse> {
    return this.http.post<CreateCustomerResponse>(`${this.apiUrl}/customers/register`, request);
  }

  // Rental operations
  createRental(request: CreateRentalRequest): Observable<CreateRentalResponse> {
    return this.http.post<CreateRentalResponse>(`${this.apiUrl}/rentals`, request);
  }

  checkCarAvailability(request: CheckCarAvailabilityRequest): Observable<CheckCarAvailabilityResponse> {
    const params = {
      carId: request.carId.toString(),
      startDate: request.startDate.toISOString(),
      endDate: request.endDate.toISOString(),
      locationId: request.locationId.toString()
    };
    
    return this.http.get<CheckCarAvailabilityResponse>(`${this.apiUrl}/rentals/check-availability`, { params });
  }

  modifyRental(rentalId: number, request: ModifyRentalRequest): Observable<ModifyRentalResponse> {
    return this.http.put<ModifyRentalResponse>(`${this.apiUrl}/rentals/${rentalId}`, request);
  }

  cancelRental(rentalId: number, request: CancelRentalRequest): Observable<CancelRentalResponse> {
    return this.http.post<CancelRentalResponse>(`${this.apiUrl}/rentals/${rentalId}/cancel`, request);
  }

  getRental(rentalId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/rentals/${rentalId}`);
  }
}