import { Injectable, signal, effect, inject } from '@angular/core';

export interface Theme {
  name: string;
  displayName: string;
  isDark: boolean;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    success: string;
    warning: string;
    error: string;
  };
}

const themes: Record<string, Theme> = {
  light: {
    name: 'light',
    displayName: 'Light Theme',
    isDark: false,
    colors: {
      primary: '#1976d2',
      secondary: '#424242',
      accent: '#82b1ff',
      background: '#fafafa',
      surface: '#ffffff',
      text: '#212121',
      textSecondary: '#757575',
      border: '#e0e0e0',
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336'
    }
  },
  dark: {
    name: 'dark',
    displayName: 'Dark Theme',
    isDark: true,
    colors: {
      primary: '#90caf9',
      secondary: '#f5f5f5',
      accent: '#7c4dff',
      background: '#121212',
      surface: '#1e1e1e',
      text: '#ffffff',
      textSecondary: '#b3b3b3',
      border: '#333333',
      success: '#66bb6a',
      warning: '#ffb74d',
      error: '#ef5350'
    }
  },
  blue: {
    name: 'blue',
    displayName: 'Blue Theme',
    isDark: false,
    colors: {
      primary: '#2196f3',
      secondary: '#03dac6',
      accent: '#ff4081',
      background: '#f3f7ff',
      surface: '#ffffff',
      text: '#1a237e',
      textSecondary: '#5c6bc0',
      border: '#bbdefb',
      success: '#00c853',
      warning: '#ffc107',
      error: '#f44336'
    }
  },
  green: {
    name: 'green',
    displayName: 'Green Theme',
    isDark: false,
    colors: {
      primary: '#4caf50',
      secondary: '#8bc34a',
      accent: '#ffeb3b',
      background: '#f1f8e9',
      surface: '#ffffff',
      text: '#1b5e20',
      textSecondary: '#388e3c',
      border: '#c8e6c9',
      success: '#66bb6a',
      warning: '#ff9800',
      error: '#f44336'
    }
  }
};

/**
 * Theme management service for the Car Rental application.
 * Handles theme switching, persistence, and system preference detection.
 */
@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly STORAGE_KEY = 'car-rental-theme';
  private readonly document = inject(Document);

  // Reactive signals for theme state management
  currentTheme = signal<Theme>(themes['light']);
  availableThemes = signal<Theme[]>(Object.values(themes));
  isSystemDarkMode = signal<boolean>(false);

  constructor() {
    this.initializeTheme();
    this.setupSystemThemeDetection();
    this.setupThemeEffect();
  }

  /**
   * Initializes the theme based on saved preferences or system settings.
   */
  private initializeTheme(): void {
    try {
      const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.isSystemDarkMode.set(systemPrefersDark);

      const savedTheme = localStorage.getItem(this.STORAGE_KEY);
      
      if (savedTheme && themes[savedTheme]) {
        this.setTheme(savedTheme);
      } else if (systemPrefersDark) {
        this.setTheme('dark');
      } else {
        this.setTheme('light');
      }
    } catch (error) {
      console.warn('Error initializing theme:', error);
      this.setTheme('light');
    }
  }

  /**
   * Sets up detection for system theme preference changes.
   */
  private setupSystemThemeDetection(): void {
    try {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      mediaQuery.addEventListener('change', (e) => {
        this.isSystemDarkMode.set(e.matches);
        
        const savedTheme = localStorage.getItem(this.STORAGE_KEY);
        if (!savedTheme) {
          this.setTheme(e.matches ? 'dark' : 'light');
        }
      });
    } catch (error) {
      console.warn('Error setting up system theme detection:', error);
    }
  }

  /**
   * Configures reactive effects for theme changes.
   */
  private setupThemeEffect(): void {
    effect(() => {
      const theme = this.currentTheme();
      this.applyThemeToDOM(theme);
      this.updateBodyClasses(theme);
    });
  }

  /**
   * Changes the current theme.
   * @param themeName - The name of the theme to apply
   */
  setTheme(themeName: string): void {
    if (!themes[themeName]) {
      console.warn(`Theme '${themeName}' not found`);
      return;
    }

    const theme = themes[themeName];
    this.currentTheme.set(theme);

    try {
      localStorage.setItem(this.STORAGE_KEY, themeName);
    } catch (error) {
      console.warn('Error saving theme preference:', error);
    }
  }

  /**
   * Toggles between light and dark themes.
   */
  toggleDarkMode(): void {
    const current = this.currentTheme();
    const newTheme = current.isDark ? 'light' : 'dark';
    this.setTheme(newTheme);
  }

  /**
   * Applies CSS custom properties to the DOM for the current theme.
   */
  private applyThemeToDOM(theme: Theme): void {
    const root = this.document.documentElement;
    
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });

    // Additional CSS variables for enhanced theming
    root.style.setProperty('--shadow-light', 
      theme.isDark 
        ? '0 2px 4px rgba(255, 255, 255, 0.1)' 
        : '0 2px 4px rgba(0, 0, 0, 0.1)'
    );

    root.style.setProperty('--shadow-medium', 
      theme.isDark 
        ? '0 4px 8px rgba(255, 255, 255, 0.15)' 
        : '0 4px 8px rgba(0, 0, 0, 0.15)'
    );

    root.style.setProperty('--shadow-heavy', 
      theme.isDark 
        ? '0 8px 16px rgba(255, 255, 255, 0.2)' 
        : '0 8px 16px rgba(0, 0, 0, 0.2)'
    );

    root.style.setProperty('--overlay-backdrop', 
      theme.isDark 
        ? 'rgba(0, 0, 0, 0.7)' 
        : 'rgba(0, 0, 0, 0.5)'
    );

    root.style.setProperty('--gradient-primary',
      `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.accent})`
    );

    root.style.setProperty('--gradient-background',
      theme.isDark
        ? 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
        : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
    );
  }

  /**
   * Updates body CSS classes for theme compatibility with Material Design.
   */
  private updateBodyClasses(theme: Theme): void {
    const body = this.document.body;
    
    body.classList.remove('light-theme', 'dark-theme');
    body.classList.add(theme.isDark ? 'dark-theme' : 'light-theme');
    
    body.classList.remove(...Object.keys(themes).map(name => `theme-${name}`));
    body.classList.add(`theme-${theme.name}`);
  }

  /**
   * Gets the currently active theme.
   */
  getCurrentTheme(): Theme {
    return this.currentTheme();
  }

  /**
   * Gets all available themes.
   */
  getAvailableThemes(): Theme[] {
    return this.availableThemes();
  }

  /**
   * Checks if the current theme is a dark theme.
   */
  isDarkTheme(): boolean {
    return this.currentTheme().isDark;
  }

  /**
   * Gets the primary color of the current theme.
   */
  getPrimaryColor(): string {
    return this.currentTheme().colors.primary;
  }

  /**
   * Retrieves a CSS custom property value for the current theme.
   */
  getCSSVariable(property: string): string {
    return getComputedStyle(this.document.documentElement)
      .getPropertyValue(`--color-${property}`)
      .trim();
  }

  /**
   * Resets the theme to match system preferences.
   */
  resetToSystemTheme(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.setTheme(this.isSystemDarkMode() ? 'dark' : 'light');
  }

  /**
   * Validates whether a theme name is valid.
   */
  isValidTheme(themeName: string): boolean {
    return themeName in themes;
  }

  /**
   * Gets theme usage statistics for analytics purposes.
   */
  getThemeStats(): { currentTheme: string; systemDark: boolean; hasCustomPreference: boolean } {
    return {
      currentTheme: this.currentTheme().name,
      systemDark: this.isSystemDarkMode(),
      hasCustomPreference: !!localStorage.getItem(this.STORAGE_KEY)
    };
  }
}