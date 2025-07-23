import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './shared/components/header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent],
  template: `
    <div class="app-container">
      <!-- Header de navegación -->
      <app-header></app-header>
      
      <!-- Contenido principal -->
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
      
      <!-- Footer -->
      <footer class="app-footer">
        <div class="footer-content">
          <div class="footer-section">
            <h4>🚗 Car Rental Pro</h4>
            <p>Sistema integral de alquiler de vehículos</p>
          </div>
          
          <div class="footer-section">
            <h4>Tecnologías</h4>
            <ul>
              <li>✅ .NET 9 Backend</li>
              <li>✅ Angular 19 Frontend</li>
              <li>✅ Clean Architecture</li>
              <li>✅ CQRS + DDD</li>
            </ul>
          </div>
          
          <div class="footer-section">
            <h4>Funcionalidades</h4>
            <ul>
              <li>📋 Registro de Clientes</li>
              <li>🔍 Consulta de Disponibilidad</li>
              <li>📝 Gestión de Reservas</li>
              <li>📊 Estadísticas Avanzadas</li>
            </ul>
          </div>
        </div>
        
        <div class="footer-bottom">
          <p>&copy; 2025 Car Rental Pro - Desarrollado con ❤️ usando las mejores prácticas</p>
          <p>Backend: .NET 9 | Frontend: Angular 19 | Arquitectura: Clean Architecture + CQRS + DDD</p>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    }

    .main-content {
      flex: 1;
      padding: 2rem 0;
      min-height: calc(100vh - 140px);
    }

    .app-footer {
      background: #263238;
      color: white;
      padding: 3rem 0 1rem 0;
      margin-top: auto;
    }

    .footer-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 2rem;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 2rem;
    }

    .footer-section h4 {
      color: #4fc3f7;
      margin-bottom: 1rem;
      font-size: 1.2rem;
    }

    .footer-section p {
      color: #b0bec5;
      line-height: 1.6;
      margin-bottom: 0.5rem;
    }

    .footer-section ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .footer-section li {
      color: #b0bec5;
      padding: 0.25rem 0;
      line-height: 1.5;
    }

    .footer-bottom {
      border-top: 1px solid #37474f;
      margin-top: 2rem;
      padding: 1rem 2rem;
      text-align: center;
      max-width: 1200px;
      margin-left: auto;
      margin-right: auto;
    }

    .footer-bottom p {
      color: #78909c;
      font-size: 0.9rem;
      margin: 0.5rem 0;
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .footer-content {
        grid-template-columns: 1fr;
        text-align: center;
        padding: 0 1rem;
      }

      .main-content {
        padding: 1rem 0;
      }

      .footer-bottom {
        padding: 1rem;
      }
    }

    /* Global Styles para la aplicación */
    :host {
      font-family: 'Roboto', 'Helvetica Neue', Arial, sans-serif;
    }

    /* Custom Scrollbar */
    :host ::ng-deep ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }

    :host ::ng-deep ::-webkit-scrollbar-track {
      background: #f1f1f1;
      border-radius: 4px;
    }

    :host ::ng-deep ::-webkit-scrollbar-thumb {
      background: #c1c1c1;
      border-radius: 4px;
    }

    :host ::ng-deep ::-webkit-scrollbar-thumb:hover {
      background: #a8a8a8;
    }

    /* Animaciones globales */
    :host ::ng-deep * {
      box-sizing: border-box;
    }

    :host ::ng-deep .mat-mdc-card {
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    :host ::ng-deep .mat-mdc-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }

    /* Snackbar personalizado */
    :host ::ng-deep .success-snackbar {
      background: #4caf50 !important;
      color: white !important;
    }

    :host ::ng-deep .error-snackbar {
      background: #f44336 !important;
      color: white !important;
    }

    :host ::ng-deep .warning-snackbar {
      background: #ff9800 !important;
      color: white !important;
    }

    :host ::ng-deep .info-snackbar {
      background: #2196f3 !important;
      color: white !important;
    }
  `]
})
export class AppComponent {
  title = 'Car Rental Pro - Sistema de Alquiler de Vehículos';

  constructor() {
    // Configuración inicial de la aplicación
    console.log('🚗 Car Rental Pro iniciado correctamente');
    console.log('Backend: .NET 9 | Frontend: Angular 19');
    console.log('Arquitectura: Clean Architecture + CQRS + DDD');
  }
}
