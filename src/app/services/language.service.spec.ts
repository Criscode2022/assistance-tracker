import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from './language.service';
import { clearBrowserStorage } from '../../testing/fixtures';
import { createMockTranslateService } from '../../testing/mocks';

describe('LanguageService', () => {
  let service: LanguageService;
  let translate: jasmine.SpyObj<TranslateService>;

  beforeEach(() => {
    clearBrowserStorage();
    translate = createMockTranslateService();

    TestBed.configureTestingModule({
      providers: [
        LanguageService,
        { provide: TranslateService, useValue: translate },
      ],
    });
    service = TestBed.inject(LanguageService);
  });

  afterEach(() => {
    clearBrowserStorage();
  });

  it('should initialize translate with stored language', () => {
    expect(translate.setDefaultLang).toHaveBeenCalledWith('es');
    expect(translate.use).toHaveBeenCalled();
  });

  it('should use English when stored', () => {
    localStorage.setItem('app_lang_v1', 'en');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        LanguageService,
        { provide: TranslateService, useValue: translate },
      ],
    });
    TestBed.inject(LanguageService);
    expect(translate.use).toHaveBeenCalledWith('en');
  });

  it('should set language and persist', () => {
    service.setLanguage('en');
    expect(translate.use).toHaveBeenCalledWith('en');
    expect(localStorage.getItem('app_lang_v1')).toBe('en');
  });

  it('should expose locale id based on current language', () => {
    expect(service.localeId).toBe('es-MX');
    service.setLanguage('en');
    expect(translate.use).toHaveBeenCalledWith('en');
    Object.defineProperty(translate, 'currentLang', { get: () => 'en', configurable: true });
    expect(service.localeId).toBe('en-US');
  });

  it('should format month label with capitalized first letter', () => {
    const label = service.formatMonthYear('2026-05');
    expect(label.charAt(0)).toBe(label.charAt(0).toUpperCase());
    expect(label.length).toBeGreaterThan(3);
  });
});
