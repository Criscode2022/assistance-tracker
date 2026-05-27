import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { importProvidersFrom } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { createMockLanguageService, createMockTranslateService } from './mocks';
import { LanguageService } from '../app/services/language.service';

export function provideIonicTesting() {
  return importProvidersFrom(IonicModule.forRoot());
}

export function provideTranslateTesting() {
  return [
    TranslateModule.forRoot(),
    { provide: LanguageService, useFactory: () => createMockLanguageService() },
  ];
}

export function provideDefaultTestProviders(extraRoutes: Parameters<typeof provideRouter>[0] = []) {
  return [
    provideRouter(extraRoutes),
    provideHttpClient(),
    provideHttpClientTesting(),
    provideNoopAnimations(),
    provideIonicTesting(),
    ...provideTranslateTesting(),
  ];
}

export { createMockTranslateService, createMockLanguageService };
