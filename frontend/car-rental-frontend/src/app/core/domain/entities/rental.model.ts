import { RentalStatus } from '../enums/rental-status.enum';

export interface Rental {
  id: number;
  customerId: string;
  carId: number;
  locationId: number;
  startDate: Date;
  endDate: Date;
  status: RentalStatus;
  createdAt: Date;
}

export interface CreateRentalRequest {
  customerId: string;
  carId: number;
  locationId: number;
  startDate: Date;
  endDate: Date;
}

export interface CreateRentalResponse {
  isSuccess: boolean;
  rentalId: number;
  errorMessage: string;
  status: RentalStatus;
}

export interface CheckCarAvailabilityRequest {
  carId: number;
  startDate: Date;
  endDate: Date;
  locationId: number;
}

export interface CheckCarAvailabilityResponse {
  isAvailable: boolean;
  carModel: string;
  carBrand: string;
  carType: string;
  locationName: string;
  conflictingRentals: ConflictingRental[];
  errorMessage: string;
}

export interface ConflictingRental {
  rentalId: number;
  startDate: Date;
  endDate: Date;
  status: string;
}

export interface ModifyRentalRequest {
  rentalId: number;
  newStartDate?: Date;
  newEndDate?: Date;
  newCarId?: number;
}

export interface ModifyRentalResponse {
  isSuccess: boolean;
  errorMessage: string;
  status: RentalStatus;
  modifiedStartDate?: Date;
  modifiedEndDate?: Date;
  modifiedCarId?: number;
}

export interface CancelRentalRequest {
  rentalId: number;
  cancellationReason: string;
}

export interface CancelRentalResponse {
  isSuccess: boolean;
  errorMessage: string;
  status: RentalStatus;
  cancellationDate: Date;
}