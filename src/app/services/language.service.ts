import { Injectable } from '@angular/core';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';

export type AppLanguage = 'es' | 'en';

const LANG_KEY = 'app_lang_v1';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  constructor(private translate: TranslateService) {
    this.translate.setDefaultLang('es');
    this.translate.use(this.getStored());
  }

  get current(): AppLanguage {
    return (this.translate.currentLang as AppLanguage) || 'es';
  }

  get localeId(): string {
    return this.current === 'en' ? 'en-US' : 'es-MX';
  }

  onLangChange(): Observable<LangChangeEvent> {
    return this.translate.onLangChange;
  }

  setLanguage(lang: AppLanguage): void {
    localStorage.setItem(LANG_KEY, lang);
    this.translate.use(lang);
  }

  formatMonthYear(month: string): string {
    const label = new Date(month + '-15').toLocaleDateString(this.localeId, {
      month: 'long',
      year: 'numeric',
    });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  formatShortDate(dateStr: string): string {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString(this.localeId, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  private getStored(): AppLanguage {
    const stored = localStorage.getItem(LANG_KEY);
    return stored === 'en' ? 'en' : 'es';
  }
}
