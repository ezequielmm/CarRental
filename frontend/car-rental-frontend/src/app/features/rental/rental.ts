import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-rental',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <div class="rental-container">
      <mat-card class="info-card">
        <mat-card-header>
          <mat-card-title>🚗 Nueva Reserva de Vehículo</mat-card-title>
          <mat-card-subtitle>Gestión completa de reservas - Próximamente</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <div class="content-section">
            <mat-icon class="feature-icon">construction</mat-icon>
            <h3>🚧 En Desarrollo</h3>
            <p>Esta funcionalidad estará disponible muy pronto con las siguientes características:</p>
            
            <ul>
              <li>✅ Formulario completo de reserva</li>
              <li>✅ Selección de vehículo y fechas</li>
              <li>✅ Validación en tiempo real</li>
              <li>✅ Integración con backend</li>
              <li>✅ Confirmación automática</li>
            </ul>
          </div>
        </mat-card-content>
        
        <mat-card-actions>
          <button mat-raised-button color="primary" routerLink="/home">
            <mat-icon>arrow_back</mat-icon>
            Volver a Inicio
          </button>
        </mat-card-actions>
      </mat-card>
    </div>
  `,
  styles: [`
    .rental-container {
      max-width: 600px;
      margin: 2rem auto;
      padding: 1rem;
    }

    .content-section {
      text-align: center;
      padding: 2rem;
    }

    .feature-icon {
      font-size: 4rem;
      height: 4rem;
      width: 4rem;
      color: #ff9800;
      margin-bottom: 1rem;
    }

    h3 {
      color: #ff9800;
      margin: 1rem 0;
    }

    ul {
      text-align: left;
      max-width: 400px;
      margin: 2rem auto;
    }

    li {
      margin: 0.5rem 0;
      color: #666;
    }
  `]
})
export class RentalComponent {
  // Componente placeholder para reservas
  // Se implementará completamente en la siguiente fase
}
