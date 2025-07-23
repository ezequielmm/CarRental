import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { RentalService } from '../../core/infrastructure/http/rental.service';
import { CheckCarAvailabilityRequest, CheckCarAvailabilityResponse } from '../../core/domain/entities/rental.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSelectModule,
    MatCardModule,
    MatSnackBarModule
  ],
  template: `
    <div class="home-container">
      <mat-card class="search-card">
        <mat-card-header>
          <mat-card-title>🚗 Buscar Disponibilidad de Autos</mat-card-title>
          <mat-card-subtitle>Encuentra el auto perfecto para tu viaje</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <form [formGroup]="searchForm" (ngSubmit)="onSearch()" class="search-form">
            <div class="form-row">
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>ID del Auto</mat-label>
                <input matInput type="number" formControlName="carId" placeholder="Ej: 1">
                @if (searchForm.get('carId')?.hasError('required')) {
                  <mat-error>El ID del auto es requerido</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Ubicación</mat-label>
                <mat-select formControlName="locationId">
                  <mat-option value="1">Buenos Aires Centro</mat-option>
                  <mat-option value="2">Córdoba Centro</mat-option>
                  <mat-option value="3">Mendoza Centro</mat-option>
                  <mat-option value="4">Rosario Centro</mat-option>
                </mat-select>
                @if (searchForm.get('locationId')?.hasError('required')) {
                  <mat-error>La ubicación es requerida</mat-error>
                }
              </mat-form-field>
            </div>

            <div class="form-row">
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Fecha de Inicio</mat-label>
                <input matInput [matDatepicker]="startPicker" formControlName="startDate">
                <mat-datepicker-toggle matIconSuffix [for]="startPicker"></mat-datepicker-toggle>
                <mat-datepicker #startPicker></mat-datepicker>
                @if (searchForm.get('startDate')?.hasError('required')) {
                  <mat-error>La fecha de inicio es requerida</mat-error>
                }
              </mat-form-field>

              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Fecha de Fin</mat-label>
                <input matInput [matDatepicker]="endPicker" formControlName="endDate">
                <mat-datepicker-toggle matIconSuffix [for]="endPicker"></mat-datepicker-toggle>
                <mat-datepicker #endPicker></mat-datepicker>
                @if (searchForm.get('endDate')?.hasError('required')) {
                  <mat-error>La fecha de fin es requerida</mat-error>
                }
              </mat-form-field>
            </div>

            <div class="form-actions">
              <button mat-raised-button color="primary" type="submit" [disabled]="searchForm.invalid || isLoading()">
                @if (isLoading()) {
                  🔄 Buscando...
                } @else {
                  🔍 Buscar Disponibilidad
                }
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      @if (availabilityResult()) {
        <mat-card class="result-card">
          <mat-card-header>
            <mat-card-title>📋 Resultado de Búsqueda</mat-card-title>
          </mat-card-header>
          
          <mat-card-content>
            @if (availabilityResult()?.isAvailable) {
              <div class="success-result">
                <h3>✅ ¡Auto Disponible!</h3>
                <p><strong>Modelo:</strong> {{ availabilityResult()?.carBrand }} {{ availabilityResult()?.carModel }}</p>
                <p><strong>Tipo:</strong> {{ availabilityResult()?.carType }}</p>
                <p><strong>Ubicación:</strong> {{ availabilityResult()?.locationName }}</p>
                
                <button mat-raised-button color="accent" (click)="proceedToReservation()">
                  📝 Continuar con Reserva
                </button>
              </div>
            } @else {
              <div class="error-result">
                <h3>❌ Auto No Disponible</h3>
                @if (availabilityResult()?.errorMessage) {
                  <p><strong>Razón:</strong> {{ availabilityResult()?.errorMessage }}</p>
                }
                
                @if (availabilityResult()?.conflictingRentals && availabilityResult()?.conflictingRentals.length > 0) {
                  <h4>🗓️ Reservas en Conflicto:</h4>
                  <ul>
                    @for (rental of availabilityResult()?.conflictingRentals; track rental.rentalId) {
                      <li>
                        Reserva #{{ rental.rentalId }}: 
                        {{ rental.startDate | date:'short' }} - {{ rental.endDate | date:'short' }}
                        ({{ rental.status }})
                      </li>
                    }
                  </ul>
                }
              </div>
            }
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .home-container {
      max-width: 800px;
      margin: 2rem auto;
      padding: 1rem;
    }

    .search-card, .result-card {
      margin-bottom: 2rem;
    }

    .search-form {
      padding: 1rem 0;
    }

    .form-row {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .form-field {
      flex: 1;
    }

    .form-actions {
      text-align: center;
      margin-top: 2rem;
    }

    .success-result {
      background-color: #e8f5e8;
      padding: 1rem;
      border-radius: 8px;
      border-left: 4px solid #4caf50;
    }

    .error-result {
      background-color: #ffeaa7;
      padding: 1rem;
      border-radius: 8px;
      border-left: 4px solid #ff9800;
    }

    .success-result h3 {
      color: #2e7d32;
      margin-top: 0;
    }

    .error-result h3 {
      color: #f57c00;
      margin-top: 0;
    }

    @media (max-width: 600px) {
      .form-row {
        flex-direction: column;
        gap: 0;
      }
    }
  `]
})
export class HomeComponent {
  searchForm: FormGroup;
  isLoading = signal(false);
  availabilityResult = signal<CheckCarAvailabilityResponse | null>(null);

  constructor(
    private fb: FormBuilder,
    private rentalService: RentalService,
    private snackBar: MatSnackBar
  ) {
    this.searchForm = this.fb.group({
      carId: [1, [Validators.required, Validators.min(1)]],
      locationId: [1, [Validators.required]],
      startDate: [new Date(), [Validators.required]],
      endDate: [new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), [Validators.required]] // +7 días por defecto
    });
  }

  onSearch(): void {
    if (this.searchForm.valid) {
      this.isLoading.set(true);
      this.availabilityResult.set(null);

      const formValue = this.searchForm.value;
      const request: CheckCarAvailabilityRequest = {
        carId: formValue.carId,
        locationId: formValue.locationId,
        startDate: formValue.startDate,
        endDate: formValue.endDate
      };

      this.rentalService.checkCarAvailability(request).subscribe({
        next: (result) => {
          this.availabilityResult.set(result);
          this.isLoading.set(false);
          
          if (result.isAvailable) {
            this.snackBar.open('✅ ¡Auto disponible encontrado!', 'Cerrar', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
          } else {
            this.snackBar.open('❌ Auto no disponible para las fechas seleccionadas', 'Cerrar', {
              duration: 5000,
              panelClass: ['warning-snackbar']
            });
          }
        },
        error: (error) => {
          console.error('Error checking availability:', error);
          this.isLoading.set(false);
          this.snackBar.open('❌ Error al buscar disponibilidad. Intente nuevamente.', 'Cerrar', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }

  proceedToReservation(): void {
    // TODO: Implementar navegación a formulario de reserva
    this.snackBar.open('🚧 Funcionalidad en desarrollo - Formulario de reserva próximamente!', 'OK', {
      duration: 4000,
      panelClass: ['info-snackbar']
    });
  }
}
