import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';
import { clearBrowserStorage } from '../../testing/fixtures';

describe('ThemeService', () => {
  let service: ThemeService;
  let themeMeta: HTMLMetaElement;

  beforeEach(() => {
    clearBrowserStorage();
    document.documentElement.classList.remove('dark', 'ion-palette-dark');
    themeMeta = document.createElement('meta');
    themeMeta.setAttribute('name', 'theme-color');
    themeMeta.setAttribute('content', '#1a6b65');
    document.head.appendChild(themeMeta);

    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeService);
  });

  afterEach(() => {
    clearBrowserStorage();
    document.documentElement.classList.remove('dark', 'ion-palette-dark');
    themeMeta.remove();
  });

  it('should default to light theme', () => {
    expect(service.isDark).toBeFalse();
    expect(service.preference).toBe('light');
  });

  it('should enable dark theme and persist preference', () => {
    service.setDark(true);
    expect(service.isDark).toBeTrue();
    expect(service.preference).toBe('dark');
    expect(localStorage.getItem('app_theme_v1')).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBeTrue();
    expect(document.documentElement.classList.contains('ion-palette-dark')).toBeTrue();
  });

  it('should disable dark theme via toggle handler', () => {
    service.setDark(true);
    service.onToggleChange(false);
    expect(service.isDark).toBeFalse();
    expect(localStorage.getItem('app_theme_v1')).toBe('light');
  });

  it('should update theme-color meta when switching', () => {
    service.setDark(true);
    expect(themeMeta.getAttribute('content')).toBe('#0e1413');
    service.setDark(false);
    expect(themeMeta.getAttribute('content')).toBe('#1a6b65');
  });

  it('should restore dark theme from storage on init', () => {
    localStorage.setItem('app_theme_v1', 'dark');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const reloaded = TestBed.inject(ThemeService);
    expect(reloaded.isDark).toBeTrue();
  });
});
