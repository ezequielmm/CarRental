import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { ThemeService, Theme } from '../services/theme.service';

@Component({
  selector: 'app-theme-selector',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatTooltipModule,
    MatButtonToggleModule
  ],
  template: `
    <div class="theme-selector">
      <!-- Botón de alternado rápido dark/light -->
      <button mat-icon-button 
              (click)="themeService.toggleDarkMode()"
              [matTooltip]="getToggleTooltip()"
              class="theme-toggle-btn">
        <mat-icon>{{ themeService.isDarkTheme() ? 'light_mode' : 'dark_mode' }}</mat-icon>
      </button>

      <!-- Selector completo de temas -->
      <button mat-icon-button 
              [matMenuTriggerFor]="themeMenu"
              matTooltip="Seleccionar tema"
              class="theme-menu-btn">
        <mat-icon>palette</mat-icon>
      </button>

      <mat-menu #themeMenu="matMenu" class="theme-menu">
        <div class="theme-menu-header">
          <mat-icon>palette</mat-icon>
          <span>Seleccionar Tema</span>
        </div>
        
        <div class="theme-options">
          @for (theme of themeService.getAvailableThemes(); track theme.name) {
            <button mat-menu-item 
                    (click)="selectTheme(theme.name)"
                    [class.selected]="isCurrentTheme(theme.name)"
                    class="theme-option">
              
              <div class="theme-preview">
                <div class="color-preview" 
                     [style.background]="theme.colors.primary"></div>
                <div class="color-preview" 
                     [style.background]="theme.colors.secondary"></div>
                <div class="color-preview" 
                     [style.background]="theme.colors.accent"></div>
              </div>
              
              <div class="theme-info">
                <span class="theme-name">{{ theme.displayName }}</span>
                <span class="theme-type">{{ theme.isDark ? 'Oscuro' : 'Claro' }}</span>
              </div>
              
              @if (isCurrentTheme(theme.name)) {
                <mat-icon class="selected-icon">check</mat-icon>
              }
            </button>
          }
        </div>

        <div class="theme-menu-footer">
          <button mat-menu-item 
                  (click)="resetToSystem()"
                  class="system-theme-btn">
            <mat-icon>settings_suggest</mat-icon>
            <span>Usar tema del sistema</span>
          </button>
        </div>
      </mat-menu>

      <!-- Indicador de estado (opcional) -->
      <div class="theme-status" *ngIf="showStatus">
        <div class="status-dot" 
             [style.background]="themeService.getPrimaryColor()"></div>
        <span class="status-text">{{ currentThemeName }}</span>
      </div>
    </div>
  `,
  styles: [`
    .theme-selector {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .theme-toggle-btn, .theme-menu-btn {
      color: var(--color-text);
      transition: all 0.3s ease;
    }

    .theme-toggle-btn:hover, .theme-menu-btn:hover {
      background-color: var(--color-primary);
      color: var(--color-surface);
      transform: scale(1.1);
    }

    .theme-menu {
      min-width: 280px;
      max-width: 320px;
    }

    .theme-menu-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      background: var(--gradient-primary);
      color: white;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }

    .theme-options {
      padding: 0.5rem 0;
    }

    .theme-option {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem 1rem !important;
      min-height: 60px;
      position: relative;
      transition: all 0.2s ease;
    }

    .theme-option:hover {
      background-color: var(--color-primary);
      color: var(--color-surface);
    }

    .theme-option.selected {
      background-color: rgba(var(--color-primary-rgb), 0.1);
      border-left: 3px solid var(--color-primary);
    }

    .theme-preview {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .color-preview {
      width: 20px;
      height: 8px;
      border-radius: 2px;
      border: 1px solid rgba(0,0,0,0.1);
    }

    .theme-info {
      display: flex;
      flex-direction: column;
      flex: 1;
    }

    .theme-name {
      font-weight: 500;
      font-size: 0.9rem;
    }

    .theme-type {
      font-size: 0.75rem;
      opacity: 0.7;
    }

    .selected-icon {
      color: var(--color-primary);
      font-size: 1.2rem;
    }

    .theme-menu-footer {
      border-top: 1px solid var(--color-border);
      padding-top: 0.5rem;
      margin-top: 0.5rem;
    }

    .system-theme-btn {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--color-textSecondary);
      font-size: 0.85rem;
    }

    .theme-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }

    .status-text {
      font-size: 0.75rem;
      color: var(--color-textSecondary);
    }

    @keyframes pulse {
      0% { opacity: 1; }
      50% { opacity: 0.5; }
      100% { opacity: 1; }
    }

    /* Animaciones de entrada */
    .theme-option {
      transform: translateX(-10px);
      opacity: 0;
      animation: slideIn 0.3s ease forwards;
    }

    @for $i from 1 through 10 {
      .theme-option:nth-child(#{$i}) {
        animation-delay: #{($i - 1) * 0.1}s;
      }
    }

    @keyframes slideIn {
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .theme-selector {
        gap: 0.25rem;
      }
      
      .theme-status {
        display: none;
      }
    }
  `]
})
export class ThemeSelectorComponent {
  themeService = inject(ThemeService);
  showStatus = false; // Se puede activar para mostrar estado actual

  get currentThemeName(): string {
    return this.themeService.getCurrentTheme().displayName;
  }

  selectTheme(themeName: string): void {
    this.themeService.setTheme(themeName);
    this.announceThemeChange(themeName);
  }

  isCurrentTheme(themeName: string): boolean {
    return this.themeService.getCurrentTheme().name === themeName;
  }

  resetToSystem(): void {
    this.themeService.resetToSystemTheme();
    this.announceThemeChange('sistema');
  }

  getToggleTooltip(): string {
    return this.themeService.isDarkTheme() 
      ? 'Cambiar a tema claro' 
      : 'Cambiar a tema oscuro';
  }

  private announceThemeChange(themeName: string): void {
    // Crear anuncio para accesibilidad
    const announcement = `Tema cambiado a ${themeName}`;
    
    // Anuncio visual temporal (opcional)
    this.showThemeChangeNotification(announcement);
  }

  private showThemeChangeNotification(message: string): void {
    // Crear notificación temporal
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: var(--color-primary);
      color: var(--color-surface);
      padding: 0.5rem 1rem;
      border-radius: 6px;
      font-size: 0.85rem;
      z-index: 10000;
      animation: fadeInOut 2s ease forwards;
    `;

    // Agregar animación CSS
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeInOut {
        0% { opacity: 0; transform: translateY(20px); }
        20% { opacity: 1; transform: translateY(0); }
        80% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(-20px); }
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(notification);

    // Remover después de la animación
    setTimeout(() => {
      document.body.removeChild(notification);
      document.head.removeChild(style);
    }, 2000);
  }

  // Método para obtener estadísticas del tema (útil para analytics)
  getThemeStats(): any {
    return this.themeService.getThemeStats();
  }

  // Método para componentes padre que quieren reaccionar a cambios
  onThemeChange(): Theme {
    return this.themeService.getCurrentTheme();
  }
}