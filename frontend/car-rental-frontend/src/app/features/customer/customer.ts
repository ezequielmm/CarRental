import { Component, signal, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { RentalService } from '../../core/infrastructure/http/rental.service';
import { CreateCustomerRequest, CreateCustomerResponse } from '../../core/domain/entities/customer.model';

@Component({
  selector: 'app-customer',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatCardModule,
    MatSnackBarModule,
    MatProgressBarModule,
    MatIconModule
  ],
  template: `
    <div class="customer-container">
      <mat-card class="registration-card">
        <mat-card-header>
          <div mat-card-avatar class="customer-avatar">
            <mat-icon>person_add</mat-icon>
          </div>
          <mat-card-title>👤 Registro de Cliente</mat-card-title>
          <mat-card-subtitle>Complete sus datos para continuar con la reserva</mat-card-subtitle>
        </mat-card-header>

        @if (isLoading()) {
          <mat-progress-bar mode="indeterminate"></mat-progress-bar>
        }
        
        <mat-card-content>
          <form [formGroup]="customerForm" (ngSubmit)="onSubmit()" class="customer-form">
            
            <!-- DNI / ID Field -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>DNI / Documento de Identidad</mat-label>
              <input matInput 
                     type="text" 
                     formControlName="id" 
                     placeholder="Ej: 12345678"
                     maxlength="10"
                     (blur)="validateId()">
              <mat-icon matSuffix>badge</mat-icon>
              
              @if (customerForm.get('id')?.hasError('required')) {
                <mat-error>El DNI es obligatorio</mat-error>
              }
              @if (customerForm.get('id')?.hasError('minlength')) {
                <mat-error>El DNI debe tener al menos 7 dígitos</mat-error>
              }
              @if (customerForm.get('id')?.hasError('maxlength')) {
                <mat-error>El DNI no puede tener más de 10 dígitos</mat-error>
              }
              @if (customerForm.get('id')?.hasError('pattern')) {
                <mat-error>El DNI solo puede contener números</mat-error>
              }
              @if (customerForm.get('id')?.hasError('invalidId')) {
                <mat-error>DNI inválido - debe ser un número válido</mat-error>
              }
            </mat-form-field>

            <!-- Nombre Completo Field -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Nombre Completo</mat-label>
              <input matInput 
                     type="text" 
                     formControlName="fullName" 
                     placeholder="Ej: Juan Carlos Pérez"
                     maxlength="100"
                     (blur)="validateName()">
              <mat-icon matSuffix>person</mat-icon>
              
              @if (customerForm.get('fullName')?.hasError('required')) {
                <mat-error>El nombre completo es obligatorio</mat-error>
              }
              @if (customerForm.get('fullName')?.hasError('minlength')) {
                <mat-error>El nombre debe tener al menos 3 caracteres</mat-error>
              }
              @if (customerForm.get('fullName')?.hasError('maxlength')) {
                <mat-error>El nombre no puede exceder 100 caracteres</mat-error>
              }
              @if (customerForm.get('fullName')?.hasError('pattern')) {
                <mat-error>El nombre solo puede contener letras y espacios</mat-error>
              }
              @if (customerForm.get('fullName')?.hasError('invalidName')) {
                <mat-error>Nombre inválido - debe contener al menos nombre y apellido</mat-error>
              }
            </mat-form-field>

            <!-- Dirección Field -->
            <mat-form-field appearance="outline" class="full-width">
              <mat-label>Dirección Completa</mat-label>
              <textarea matInput 
                        formControlName="address" 
                        placeholder="Ej: Av. Corrientes 1234, Ciudad Autónoma de Buenos Aires"
                        rows="3"
                        maxlength="200"
                        (blur)="validateAddress()"></textarea>
              <mat-icon matSuffix>home</mat-icon>
              
              @if (customerForm.get('address')?.hasError('required')) {
                <mat-error>La dirección es obligatoria</mat-error>
              }
              @if (customerForm.get('address')?.hasError('minlength')) {
                <mat-error>La dirección debe tener al menos 10 caracteres</mat-error>
              }
              @if (customerForm.get('address')?.hasError('maxlength')) {
                <mat-error>La dirección no puede exceder 200 caracteres</mat-error>
              }
              @if (customerForm.get('address')?.hasError('invalidAddress')) {
                <mat-error>Dirección inválida - debe ser una dirección completa</mat-error>
              }
            </mat-form-field>

            <!-- Form Status Indicator -->
            <div class="form-status">
              @if (customerForm.valid && !isLoading()) {
                <div class="status-valid">
                  <mat-icon>check_circle</mat-icon>
                  ✅ Formulario completado correctamente
                </div>
              } @else if (customerForm.invalid && customerForm.touched) {
                <div class="status-invalid">
                  <mat-icon>error</mat-icon>
                  ❌ Por favor, corrija los errores antes de continuar
                </div>
              }
            </div>

            <!-- Action Buttons -->
            <div class="form-actions">
              <button mat-raised-button 
                      color="primary" 
                      type="submit" 
                      [disabled]="customerForm.invalid || isLoading()"
                      class="submit-button">
                @if (isLoading()) {
                  <mat-icon>hourglass_empty</mat-icon>
                  Registrando...
                } @else {
                  <mat-icon>person_add</mat-icon>
                  Registrar Cliente
                }
              </button>

              <button mat-button 
                      type="button" 
                      (click)="resetForm()"
                      [disabled]="isLoading()"
                      class="reset-button">
                <mat-icon>refresh</mat-icon>
                Limpiar Formulario
              </button>
            </div>
          </form>
        </mat-card-content>
      </mat-card>

      <!-- Success Result Card -->
      @if (registrationResult() && registrationResult()?.isSuccess) {
        <mat-card class="success-card">
          <mat-card-content>
            <div class="success-content">
              <mat-icon class="success-icon">check_circle</mat-icon>
              <h3>🎉 ¡Cliente Registrado Exitosamente!</h3>
              <p><strong>ID de Cliente:</strong> {{ registrationResult()?.customerId }}</p>
              <p>Ya puede proceder con su reserva de vehículo.</p>
              
              <button mat-raised-button 
                      color="accent" 
                      (click)="proceedToRental()"
                      class="continue-button">
                <mat-icon>directions_car</mat-icon>
                Continuar con Reserva
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .customer-container {
      max-width: 600px;
      margin: 2rem auto;
      padding: 1rem;
    }

    .registration-card, .success-card {
      margin-bottom: 2rem;
    }

    .customer-avatar {
      background-color: #3f51b5;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .customer-form {
      padding: 1rem 0;
      max-width: 100%;
    }

    .full-width {
      width: 100%;
      margin-bottom: 1rem;
    }

    .form-status {
      margin: 1rem 0;
      padding: 1rem;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .status-valid {
      background-color: #e8f5e8;
      color: #2e7d32;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .status-invalid {
      background-color: #ffeaa7;
      color: #f57c00;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      margin-top: 2rem;
      flex-wrap: wrap;
    }

    .submit-button {
      min-width: 200px;
    }

    .reset-button {
      min-width: 180px;
    }

    .success-card {
      background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%);
      border-left: 4px solid #4caf50;
    }

    .success-content {
      text-align: center;
    }

    .success-icon {
      font-size: 48px;
      height: 48px;
      width: 48px;
      color: #4caf50;
      margin-bottom: 1rem;
    }

    .success-content h3 {
      color: #2e7d32;
      margin: 1rem 0;
    }

    .continue-button {
      margin-top: 1rem;
      min-width: 220px;
    }

    @media (max-width: 600px) {
      .form-actions {
        flex-direction: column;
        align-items: center;
      }

      .submit-button, .reset-button, .continue-button {
        width: 100%;
        max-width: 300px;
      }
    }

    /* Custom Material Theme Colors */
    ::ng-deep .mat-mdc-form-field.mat-focused .mat-mdc-form-field-focus-overlay {
      background-color: rgba(63, 81, 181, 0.12);
    }
  `]
})
export class CustomerComponent {
  customerForm: FormGroup;
  isLoading = signal(false);
  registrationResult = signal<CreateCustomerResponse | null>(null);
  
  // Output para comunicación con componente padre
  customerRegistered = output<CreateCustomerResponse>();

  constructor(
    private fb: FormBuilder,
    private rentalService: RentalService,
    private snackBar: MatSnackBar
  ) {
    this.customerForm = this.createForm();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      id: ['', [
        Validators.required,
        Validators.minLength(7),
        Validators.maxLength(10),
        Validators.pattern(/^\d+$/),
        this.customIdValidator
      ]],
      fullName: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100),
        Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/),
        this.customNameValidator
      ]],
      address: ['', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(200),
        this.customAddressValidator
      ]]
    });
  }

  // Custom Validators
  private customIdValidator = (control: AbstractControl): { [key: string]: any } | null => {
    if (!control.value) return null;
    
    const id = control.value.toString();
    const isValidLength = id.length >= 7 && id.length <= 10;
    const isNumeric = /^\d+$/.test(id);
    
    if (!isValidLength || !isNumeric) {
      return { invalidId: true };
    }
    
    return null;
  };

  private customNameValidator = (control: AbstractControl): { [key: string]: any } | null => {
    if (!control.value) return null;
    
    const name = control.value.toString().trim();
    const words = name.split(' ').filter((word: string) => word.length > 0);
    
    if (words.length < 2) {
      return { invalidName: true };
    }
    
    return null;
  };

  private customAddressValidator = (control: AbstractControl): { [key: string]: any } | null => {
    if (!control.value) return null;
    
    const address = control.value.toString().trim();
    const hasNumbers = /\d/.test(address);
    const hasLetters = /[a-zA-Z]/.test(address);
    
    if (!hasNumbers || !hasLetters || address.length < 10) {
      return { invalidAddress: true };
    }
    
    return null;
  };

  // Validation Methods
  validateId(): void {
    const idControl = this.customerForm.get('id');
    if (idControl && idControl.value) {
      idControl.markAsTouched();
      idControl.updateValueAndValidity();
    }
  }

  validateName(): void {
    const nameControl = this.customerForm.get('fullName');
    if (nameControl && nameControl.value) {
      nameControl.markAsTouched();
      nameControl.updateValueAndValidity();
    }
  }

  validateAddress(): void {
    const addressControl = this.customerForm.get('address');
    if (addressControl && addressControl.value) {
      addressControl.markAsTouched();
      addressControl.updateValueAndValidity();
    }
  }

  onSubmit(): void {
    if (this.customerForm.valid) {
      this.isLoading.set(true);
      this.registrationResult.set(null);

      const formValue = this.customerForm.value;
      const request: CreateCustomerRequest = {
        id: formValue.id,
        fullName: formValue.fullName.trim(),
        address: formValue.address.trim()
      };

      this.rentalService.registerCustomer(request).subscribe({
        next: (result) => {
          this.isLoading.set(false);
          this.registrationResult.set(result);
          
          if (result.isSuccess) {
            this.snackBar.open('🎉 ¡Cliente registrado exitosamente!', 'Cerrar', {
              duration: 5000,
              panelClass: ['success-snackbar']
            });
            
            // Emitir evento para comunicación con componente padre
            this.customerRegistered.emit(result);
          } else {
            this.snackBar.open(`❌ Error: ${result.errorMessage}`, 'Cerrar', {
              duration: 5000,
              panelClass: ['error-snackbar']
            });
          }
        },
        error: (error) => {
          console.error('Error registering customer:', error);
          this.isLoading.set(false);
          this.snackBar.open('❌ Error de conexión. Intente nuevamente.', 'Cerrar', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
    } else {
      this.markFormGroupTouched();
      this.snackBar.open('⚠️ Por favor, complete todos los campos correctamente', 'Cerrar', {
        duration: 4000,
        panelClass: ['warning-snackbar']
      });
    }
  }

  resetForm(): void {
    this.customerForm.reset();
    this.registrationResult.set(null);
    this.snackBar.open('🔄 Formulario reiniciado', 'Cerrar', {
      duration: 2000,
      panelClass: ['info-snackbar']
    });
  }

  proceedToRental(): void {
    // TODO: Implementar navegación a formulario de reserva
    this.snackBar.open('🚧 Navegación a reserva - Próximamente disponible!', 'OK', {
      duration: 4000,
      panelClass: ['info-snackbar']
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.customerForm.controls).forEach(key => {
      const control = this.customerForm.get(key);
      control?.markAsTouched();
      control?.updateValueAndValidity();
    });
  }
}
