import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
    
    // Mock localStorage
    let store: { [key: string]: string } = {};
    const mockLocalStorage = {
      getItem: (key: string): string | null => {
        return key in store ? store[key] : null;
      },
      setItem: (key: string, value: string) => {
        store[key] = `${value}`;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      }
    };
    
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage
    });

    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(), // deprecated
        removeListener: jest.fn(), // deprecated
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Theme Management', () => {
    it('should set theme correctly', () => {
      service.setTheme('dark');
      expect(service.getCurrentTheme().name).toBe('dark');
      expect(service.getCurrentTheme().isDark).toBe(true);
    });

    it('should persist theme in localStorage', () => {
      service.setTheme('blue');
      expect(localStorage.getItem('car-rental-theme')).toBe('blue');
    });

    it('should load theme from localStorage on init', () => {
      localStorage.setItem('car-rental-theme', 'green');
      // Recreate service to test initialization
      service = TestBed.inject(ThemeService);
      expect(service.getCurrentTheme().name).toBe('green');
    });

    it('should toggle between light and dark themes', () => {
      service.setTheme('light');
      expect(service.isDarkTheme()).toBe(false);
      
      service.toggleDarkMode();
      expect(service.isDarkTheme()).toBe(true);
      
      service.toggleDarkMode();
      expect(service.isDarkTheme()).toBe(false);
    });

    it('should validate theme names correctly', () => {
      expect(service.isValidTheme('light')).toBe(true);
      expect(service.isValidTheme('dark')).toBe(true);
      expect(service.isValidTheme('invalid')).toBe(false);
    });

    it('should handle invalid theme names gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      service.setTheme('invalid-theme');
      
      // Should not change current theme
      expect(service.getCurrentTheme().name).toBe('light');
      expect(consoleSpy).toHaveBeenCalledWith("Tema 'invalid-theme' no encontrado");
      
      consoleSpy.mockRestore();
    });
  });

  describe('Theme Properties', () => {
    it('should return correct primary color', () => {
      service.setTheme('light');
      expect(service.getPrimaryColor()).toBe('#1976d2');
      
      service.setTheme('dark');
      expect(service.getPrimaryColor()).toBe('#90caf9');
    });

    it('should return all available themes', () => {
      const themes = service.getAvailableThemes();
      expect(themes.length).toBe(4);
      expect(themes.map(t => t.name)).toEqual(['light', 'dark', 'blue', 'green']);
    });

    it('should return correct theme stats', () => {
      service.setTheme('blue');
      const stats = service.getThemeStats();
      
      expect(stats.currentTheme).toBe('blue');
      expect(stats.systemDark).toBe(false);
      expect(stats.hasCustomPreference).toBe(true);
    });
  });

  describe('System Theme Detection', () => {
    it('should detect system dark mode preference', () => {
      // Mock system dark mode preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-color-scheme: dark)',
          media: query,
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        })),
      });

      // Recreate service to test system detection
      service = TestBed.inject(ThemeService);
      expect(service.isSystemDarkMode()).toBe(true);
    });

    it('should reset to system theme', () => {
      // Set a custom theme first
      service.setTheme('blue');
      expect(service.getCurrentTheme().name).toBe('blue');
      
      // Reset to system theme
      service.resetToSystemTheme();
      expect(localStorage.getItem('car-rental-theme')).toBeNull();
    });
  });

  describe('CSS Variable Management', () => {
    it('should apply theme colors to DOM', () => {
      const mockDocumentElement = {
        style: {
          setProperty: jest.fn()
        }
      };

      Object.defineProperty(document, 'documentElement', {
        value: mockDocumentElement,
        writable: true
      });

      service.setTheme('dark');

      // Verify that setProperty was called with theme colors
      expect(mockDocumentElement.style.setProperty).toHaveBeenCalledWith(
        '--color-primary', '#90caf9'
      );
      expect(mockDocumentElement.style.setProperty).toHaveBeenCalledWith(
        '--color-background', '#121212'
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle localStorage errors gracefully', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Mock localStorage to throw error
      Object.defineProperty(window, 'localStorage', {
        value: {
          setItem: () => { throw new Error('Storage quota exceeded'); },
          getItem: () => null,
          removeItem: () => {}
        }
      });

      service.setTheme('dark');
      expect(consoleSpy).toHaveBeenCalledWith('Error al guardar tema:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });

    it('should initialize with default theme on error', () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Mock localStorage to throw error on getItem
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: () => { throw new Error('Storage not available'); },
          setItem: jest.fn(),
          removeItem: jest.fn()
        }
      });

      // Recreate service to test error handling during initialization
      service = TestBed.inject(ThemeService);
      expect(service.getCurrentTheme().name).toBe('light');
      expect(consoleSpy).toHaveBeenCalledWith('Error al inicializar tema:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('Accessibility and UX', () => {
    it('should provide correct display names for themes', () => {
      const themes = service.getAvailableThemes();
      
      expect(themes.find(t => t.name === 'light')?.displayName).toBe('Tema Claro');
      expect(themes.find(t => t.name === 'dark')?.displayName).toBe('Tema Oscuro');
      expect(themes.find(t => t.name === 'blue')?.displayName).toBe('Tema Azul');
      expect(themes.find(t => t.name === 'green')?.displayName).toBe('Tema Verde');
    });

    it('should maintain theme consistency across properties', () => {
      service.setTheme('blue');
      const theme = service.getCurrentTheme();
      
      expect(theme.name).toBe('blue');
      expect(theme.displayName).toBe('Tema Azul');
      expect(theme.isDark).toBe(false);
      expect(theme.colors.primary).toBe('#2196f3');
    });
  });

  describe('Performance', () => {
    it('should not recreate theme objects unnecessarily', () => {
      const theme1 = service.getCurrentTheme();
      const theme2 = service.getCurrentTheme();
      
      // Should return same reference for performance
      expect(theme1).toBe(theme2);
    });

    it('should batch DOM updates efficiently', () => {
      const setPropertySpy = jest.fn();
      Object.defineProperty(document, 'documentElement', {
        value: { style: { setProperty: setPropertySpy } },
        writable: true
      });

      service.setTheme('green');

      // Should call setProperty for each color variable
      expect(setPropertySpy).toHaveBeenCalledTimes(expect.any(Number));
      expect(setPropertySpy.mock.calls.length).toBeGreaterThan(10);
    });
  });
});