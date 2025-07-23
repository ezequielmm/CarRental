import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    RouterModule
  ],
  template: `
    <div class="statistics-container">
      <mat-card class="info-card">
        <mat-card-header>
          <mat-card-title>📊 Estadísticas y Reportes</mat-card-title>
          <mat-card-subtitle>Dashboard completo de análisis - Próximamente</mat-card-subtitle>
        </mat-card-header>
        
        <mat-card-content>
          <div class="content-section">
            <mat-icon class="feature-icon">analytics</mat-icon>
            <h3>📈 Dashboard Avanzado</h3>
            <p>Las estadísticas estarán disponibles muy pronto con:</p>
            
            <div class="features-grid">
              <div class="feature-item">
                <mat-icon>trending_up</mat-icon>
                <h4>Tipo de Auto Más Alquilado</h4>
                <p>Análisis con porcentaje de utilización</p>
              </div>
              
              <div class="feature-item">
                <mat-icon>leaderboard</mat-icon>
                <h4>Ranking Top 3 Autos</h4>
                <p>Por rango de fechas seleccionado</p>
              </div>
              
              <div class="feature-item">
                <mat-icon>dashboard</mat-icon>
                <h4>Dashboard Completo</h4>
                <p>Rankings por marca, modelo y tipo</p>
              </div>
              
              <div class="feature-item">
                <mat-icon>show_chart</mat-icon>
                <h4>Gráficos Diarios</h4>
                <p>Cancelaciones, alquileres y disponibilidad</p>
              </div>
            </div>
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
    .statistics-container {
      max-width: 800px;
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
      color: #2196f3;
      margin-bottom: 1rem;
    }

    h3 {
      color: #2196f3;
      margin: 1rem 0;
    }

    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-top: 2rem;
    }

    .feature-item {
      background: #f5f5f5;
      padding: 1.5rem;
      border-radius: 8px;
      text-align: center;
    }

    .feature-item mat-icon {
      color: #2196f3;
      font-size: 2rem;
      height: 2rem;
      width: 2rem;
      margin-bottom: 1rem;
    }

    .feature-item h4 {
      color: #333;
      margin: 0.5rem 0;
    }

    .feature-item p {
      color: #666;
      font-size: 0.9rem;
      margin: 0;
    }

    @media (max-width: 600px) {
      .features-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class StatisticsComponent {
  // Componente placeholder para estadísticas
  // Se implementará con gráficos y métricas avanzadas
}
