import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { ApiService } from '../../infrastructure/services/api.service';

interface Rental {
  id: number;
  customerId: string;
  customerName: string;
  carId: number;
  carBrand: string;
  carModel: string;
  startDate: Date;
  endDate: Date;
  status: string;
  totalDays: number;
  locationName: string;
}

@Component({
  selector: 'app-rental-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    MatTableModule,
    MatDialogModule,
    MatSnackBarModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  template: `
    <div class="rental-management-container">
      <mat-card class="search-card">
        <mat-card-header>
          <mat-card-title>Rental Management</mat-card-title>
          <mat-card-subtitle>Search, modify, and cancel existing reservations</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <form [formGroup]="searchForm" (ngSubmit)="searchRentals()">
            <div class="search-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Customer ID (DNI/Passport)</mat-label>
                <input matInput formControlName="customerId" placeholder="Enter customer ID">
                <mat-icon matSuffix>person</mat-icon>
              </mat-form-field>
              
              <button mat-raised-button color="primary" type="submit" 
                      [disabled]="searchForm.invalid || isLoading()">
                <mat-icon>search</mat-icon>
                Search Rentals
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      @if (rentals().length > 0) {
        <mat-card class="results-card">
          <mat-card-header>
            <mat-card-title>Customer Rentals</mat-card-title>
            <mat-card-subtitle>{{ rentals().length }} reservation(s) found</mat-card-subtitle>
          </mat-card-header>
          
          <mat-card-content>
            <div class="table-container">
              <table mat-table [dataSource]="rentals()" class="rental-table">
                <ng-container matColumnDef="id">
                  <th mat-header-cell *matHeaderCellDef>ID</th>
                  <td mat-cell *matCellDef="let rental">{{ rental.id }}</td>
                </ng-container>

                <ng-container matColumnDef="vehicle">
                  <th mat-header-cell *matHeaderCellDef>Vehicle</th>
                  <td mat-cell *matCellDef="let rental">
                    <div class="vehicle-info">
                      <strong>{{ rental.carBrand }} {{ rental.carModel }}</strong>
                      <small>{{ rental.locationName }}</small>
                    </div>
                  </td>
                </ng-container>

                <ng-container matColumnDef="dates">
                  <th mat-header-cell *matHeaderCellDef>Rental Period</th>
                  <td mat-cell *matCellDef="let rental">
                    <div class="date-info">
                      <div>{{ formatDate(rental.startDate) }} - {{ formatDate(rental.endDate) }}</div>
                      <small>{{ rental.totalDays }} day(s)</small>
                    </div>
                  </td>
                </ng-container>

                <ng-container matColumnDef="status">
                  <th mat-header-cell *matHeaderCellDef>Status</th>
                  <td mat-cell *matCellDef="let rental">
                    <span [class]="'status-badge status-' + rental.status.toLowerCase()">
                      {{ rental.status }}
                    </span>
                  </td>
                </ng-container>

                <ng-container matColumnDef="actions">
                  <th mat-header-cell *matHeaderCellDef>Actions</th>
                  <td mat-cell *matCellDef="let rental">
                    <div class="action-buttons">
                      @if (canModify(rental)) {
                        <button mat-stroked-button color="primary" 
                                (click)="modifyRental(rental)">
                          <mat-icon>edit</mat-icon>
                          Modify
                        </button>
                      }
                      
                      @if (canCancel(rental)) {
                        <button mat-stroked-button color="warn" 
                                (click)="cancelRental(rental)">
                          <mat-icon>cancel</mat-icon>
                          Cancel
                        </button>
                      }
                    </div>
                  </td>
                </ng-container>

                <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
                <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
              </table>
            </div>
          </mat-card-content>
        </mat-card>
      }

      @if (isLoading()) {
        <div class="loading-indicator">
          <mat-icon class="spinning">refresh</mat-icon>
          <p>Searching for rentals...</p>
        </div>
      }

      @if (searchAttempted() && rentals().length === 0 && !isLoading()) {
        <mat-card class="no-results-card">
          <mat-card-content>
            <div class="no-results">
              <mat-icon>info</mat-icon>
              <h3>No Rentals Found</h3>
              <p>No reservations were found for the specified customer ID.</p>
            </div>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .rental-management-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
      gap: 2rem;
      display: flex;
      flex-direction: column;
    }

    .search-card {
      box-shadow: var(--shadow-medium);
    }

    .search-row {
      display: flex;
      gap: 1rem;
      align-items: flex-end;
    }

    .full-width {
      flex: 1;
    }

    .results-card {
      box-shadow: var(--shadow-medium);
    }

    .table-container {
      overflow-x: auto;
    }

    .rental-table {
      width: 100%;
      margin-top: 1rem;
    }

    .vehicle-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .vehicle-info small {
      color: var(--color-textSecondary);
      font-size: 0.8rem;
    }

    .date-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .date-info small {
      color: var(--color-textSecondary);
      font-size: 0.8rem;
    }

    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-reserved {
      background-color: #e3f2fd;
      color: #1565c0;
    }

    .status-confirmed {
      background-color: #e8f5e8;
      color: #2e7d2e;
    }

    .status-inprogress {
      background-color: #fff3e0;
      color: #f57c00;
    }

    .status-completed {
      background-color: #f3e5f5;
      color: #7b1fa2;
    }

    .status-cancelled {
      background-color: #ffebee;
      color: #c62828;
    }

    .action-buttons {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .action-buttons button {
      min-width: auto;
    }

    .loading-indicator {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      text-align: center;
    }

    .spinning {
      animation: spin 1s linear infinite;
      font-size: 2rem;
      margin-bottom: 1rem;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .no-results-card {
      box-shadow: var(--shadow-light);
    }

    .no-results {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 2rem;
      color: var(--color-textSecondary);
    }

    .no-results mat-icon {
      font-size: 3rem;
      height: 3rem;
      width: 3rem;
      margin-bottom: 1rem;
      color: var(--color-primary);
    }

    @media (max-width: 768px) {
      .rental-management-container {
        padding: 1rem;
      }

      .search-row {
        flex-direction: column;
        align-items: stretch;
      }

      .action-buttons {
        flex-direction: column;
      }
    }
  `]
})
export class RentalManagementComponent implements OnInit {
  private apiService = inject(ApiService);
  private formBuilder = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  searchForm: FormGroup;
  rentals = signal<Rental[]>([]);
  isLoading = signal(false);
  searchAttempted = signal(false);

  displayedColumns: string[] = ['id', 'vehicle', 'dates', 'status', 'actions'];

  constructor() {
    this.searchForm = this.formBuilder.group({
      customerId: ['', [Validators.required, Validators.minLength(7)]]
    });
  }

  ngOnInit(): void {
    // Component initialization
  }

  async searchRentals(): Promise<void> {
    if (this.searchForm.invalid) return;

    const customerId = this.searchForm.get('customerId')?.value;
    this.isLoading.set(true);
    this.searchAttempted.set(true);

    try {
      const rentalHistory = await this.apiService.getRentalHistory(customerId).toPromise();
      
      const mappedRentals: Rental[] = rentalHistory?.map((rental: any) => ({
        id: rental.id,
        customerId: rental.customerId,
        customerName: rental.customerName || 'Unknown',
        carId: rental.carId,
        carBrand: rental.car?.brand || 'Unknown',
        carModel: rental.car?.model || 'Unknown',
        startDate: new Date(rental.startDate),
        endDate: new Date(rental.endDate),
        status: rental.status,
        totalDays: this.calculateDays(new Date(rental.startDate), new Date(rental.endDate)),
        locationName: rental.location?.name || 'Unknown Location'
      })) || [];

      this.rentals.set(mappedRentals);

      if (mappedRentals.length === 0) {
        this.snackBar.open('No rentals found for this customer', 'Close', { duration: 3000 });
      }

    } catch (error) {
      console.error('Error searching rentals:', error);
      this.snackBar.open('Error searching rentals. Please try again.', 'Close', { duration: 5000 });
      this.rentals.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  canModify(rental: Rental): boolean {
    const today = new Date();
    return rental.status === 'Reserved' && rental.startDate > today;
  }

  canCancel(rental: Rental): boolean {
    return ['Reserved', 'Confirmed'].includes(rental.status);
  }

  async modifyRental(rental: Rental): Promise<void> {
    // Implementation for rental modification dialog would go here
    this.snackBar.open('Rental modification feature coming soon', 'Close', { duration: 3000 });
  }

  async cancelRental(rental: Rental): Promise<void> {
    const confirmed = confirm(`Are you sure you want to cancel rental #${rental.id}?`);
    if (!confirmed) return;

    try {
      await this.apiService.cancelRental(rental.id, rental.customerId).toPromise();
      
      // Update the rental status locally
      const updatedRentals = this.rentals().map(r => 
        r.id === rental.id ? { ...r, status: 'Cancelled' } : r
      );
      this.rentals.set(updatedRentals);

      this.snackBar.open('Rental cancelled successfully', 'Close', { 
        duration: 3000,
        panelClass: 'success-snackbar'
      });

    } catch (error) {
      console.error('Error cancelling rental:', error);
      this.snackBar.open('Error cancelling rental. Please try again.', 'Close', { 
        duration: 5000,
        panelClass: 'error-snackbar'
      });
    }
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  }

  private calculateDays(startDate: Date, endDate: Date): number {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}