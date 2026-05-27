import { Injectable } from '@angular/core';

const THEME_KEY = 'app_theme_v1';

export type ThemePreference = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  constructor() {
    this.applyFromStorage();
  }

  get isDark(): boolean {
    return document.documentElement.classList.contains('dark');
  }

  get preference(): ThemePreference {
    return this.isDark ? 'dark' : 'light';
  }

  setDark(enabled: boolean): void {
    localStorage.setItem(THEME_KEY, enabled ? 'dark' : 'light');
    this.apply(enabled);
  }

  onToggleChange(enabled: boolean): void {
    this.setDark(enabled);
  }

  private applyFromStorage(): void {
    this.apply(localStorage.getItem(THEME_KEY) === 'dark');
  }

  private apply(dark: boolean): void {
    document.documentElement.classList.toggle('dark', dark);
    document.documentElement.classList.toggle('ion-palette-dark', dark);

    const meta = document.querySelector('meta[name="theme-color"]');
    meta?.setAttribute('content', dark ? '#0e1413' : '#1a6b65');
  }
}
