import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { ThemeSelectorComponent } from './theme-selector.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    ThemeSelectorComponent
  ],
  template: `
    <mat-toolbar color="primary" class="app-header">
      <div class="header-container">
        <!-- Logo y Título -->
        <div class="header-brand" routerLink="/home">
          <mat-icon class="brand-icon">directions_car</mat-icon>
          <span class="brand-title">🚗 Car Rental Pro</span>
        </div>

        <!-- Navegación Principal -->
        <nav class="header-nav">
          <button mat-button 
                  routerLink="/home" 
                  routerLinkActive="active-link"
                  class="nav-button">
            <mat-icon>home</mat-icon>
            Inicio
          </button>

          <button mat-button 
                  routerLink="/customer" 
                  routerLinkActive="active-link"
                  class="nav-button">
            <mat-icon>person_add</mat-icon>
            Registro
          </button>

          <button mat-button 
                  routerLink="/rental" 
                  routerLinkActive="active-link"
                  class="nav-button">
            <mat-icon>car_rental</mat-icon>
            Reservar
          </button>

          <button mat-button 
                  routerLink="/statistics" 
                  routerLinkActive="active-link"
                  class="nav-button">
            <mat-icon>analytics</mat-icon>
            Estadísticas
          </button>
        </nav>

        <!-- Controles del Usuario -->
        <div class="header-controls">
          <!-- Selector de Tema -->
          <app-theme-selector></app-theme-selector>

          <!-- Menú móvil -->
          <button mat-icon-button 
                  [matMenuTriggerFor]="mobileMenu" 
                  class="mobile-menu-button">
            <mat-icon>menu</mat-icon>
          </button>

          <mat-menu #mobileMenu="matMenu" class="mobile-menu">
            <button mat-menu-item routerLink="/home">
              <mat-icon>home</mat-icon>
              <span>Inicio</span>
            </button>
            <button mat-menu-item routerLink="/customer">
              <mat-icon>person_add</mat-icon>
              <span>Registro Cliente</span>
            </button>
            <button mat-menu-item routerLink="/rental">
              <mat-icon>car_rental</mat-icon>
              <span>Nueva Reserva</span>
            </button>
            <button mat-menu-item routerLink="/statistics">
              <mat-icon>analytics</mat-icon>
              <span>Estadísticas</span>
            </button>
          </mat-menu>
        </div>
      </div>
    </mat-toolbar>
  `,
  styles: [`
    .app-header {
      position: sticky;
      top: 0;
      z-index: 1000;
      box-shadow: var(--shadow-medium);
      background: var(--gradient-primary) !important;
    }

    .header-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
    }

    .header-brand {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      text-decoration: none;
      color: inherit;
      transition: all 0.3s ease;
    }

    .header-brand:hover {
      opacity: 0.8;
      transform: scale(1.05);
    }

    .brand-icon {
      font-size: 2rem;
      height: 2rem;
      width: 2rem;
      animation: rotate 10s linear infinite;
    }

    @keyframes rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .brand-title {
      font-size: 1.5rem;
      font-weight: 600;
      margin-left: 0.5rem;
      background: linear-gradient(45deg, #fff, #e3f2fd);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .header-nav {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .nav-button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 25px;
      transition: all 0.3s ease;
      color: rgba(255, 255, 255, 0.9);
      position: relative;
      overflow: hidden;
    }

    .nav-button::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
      transition: left 0.5s;
    }

    .nav-button:hover::before {
      left: 100%;
    }

    .nav-button:hover {
      background-color: rgba(255, 255, 255, 0.1);
      color: white;
      transform: translateY(-2px);
      box-shadow: var(--shadow-light);
    }

    .nav-button.active-link {
      background-color: rgba(255, 255, 255, 0.2);
      color: white;
      font-weight: 600;
      box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
    }

    .nav-button mat-icon {
      font-size: 1.2rem;
      height: 1.2rem;
      width: 1.2rem;
    }

    .header-controls {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .mobile-menu-button {
      display: none;
      color: white;
      transition: all 0.3s ease;
    }

    .mobile-menu-button:hover {
      background-color: rgba(255, 255, 255, 0.1);
      transform: scale(1.1);
    }

    .mobile-menu {
      min-width: 200px;
    }

    .mobile-menu button {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      width: 100%;
      transition: all 0.2s ease;
    }

    .mobile-menu button:hover {
      background-color: var(--color-primary);
      color: var(--color-surface);
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .header-nav {
        display: none;
      }

      .mobile-menu-button {
        display: flex;
      }

      .brand-title {
        font-size: 1.2rem;
      }

      .header-container {
        padding: 0 0.5rem;
      }
    }

    @media (max-width: 480px) {
      .brand-title {
        display: none;
      }

      .brand-icon {
        font-size: 1.5rem;
        height: 1.5rem;
        width: 1.5rem;
      }
    }

    /* Tema oscuro personalizado para header */
    :host-context(.dark-theme) .app-header {
      background: linear-gradient(135deg, #1a237e 0%, #283593 100%) !important;
    }

    :host-context(.theme-blue) .app-header {
      background: linear-gradient(135deg, #1976d2 0%, #42a5f5 100%) !important;
    }

    :host-context(.theme-green) .app-header {
      background: linear-gradient(135deg, #388e3c 0%, #66bb6a 100%) !important;
    }

    /* Animaciones de entrada */
    .header-container {
      animation: slideDown 0.5s ease-out;
    }

    @keyframes slideDown {
      from {
        transform: translateY(-100%);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }

    /* Efectos de glassmorphism en modo oscuro */
    :host-context(.dark-theme) .app-header {
      backdrop-filter: blur(10px);
      background: rgba(26, 35, 126, 0.9) !important;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    /* Efecto de pulsación para iconos */
    .nav-button mat-icon, .brand-icon {
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.8; }
      100% { opacity: 1; }
    }

    /* Hover effect más suave para mobile */
    @media (max-width: 768px) {
      .nav-button:hover {
        transform: none;
        box-shadow: none;
      }
    }
  `]
})
export class HeaderComponent {
  // Este componente maneja la navegación principal con theming avanzado
  // Demuestra integración de múltiples servicios y responsive design
}