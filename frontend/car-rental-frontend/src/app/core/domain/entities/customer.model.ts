export interface Customer {
  id: string;
  fullName: string;
  address: string;
}

export interface CreateCustomerRequest {
  id: string;
  fullName: string;
  address: string;
}

export interface CreateCustomerResponse {
  isSuccess: boolean;
  customerId: string;
  errorMessage: string;
}