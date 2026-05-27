import { EventEmitter } from '@angular/core';
import { LangChangeEvent } from '@ngx-translate/core';
import { of } from 'rxjs';
import { AppLanguage, LanguageService } from '../app/services/language.service';
import { NeonService } from '../app/services/neon.service';

export function createMockTranslateService() {
  const onLangChange = new EventEmitter<{ lang: string }>();
  const mock = jasmine.createSpyObj(
    'TranslateService',
    ['setDefaultLang', 'use', 'instant', 'get'],
    {
      currentLang: 'es',
      defaultLang: 'es',
      onLangChange,
    },
  );
  mock.use.and.callFake((lang: string) => {
    mock.currentLang = lang;
    return mock;
  });
  mock.instant.and.callFake((key: string, params?: Record<string, string>) => {
    if (key === 'COURSES.ACTIONS_COUNT' && params?.['count']) {
      return `Actions (${params['count']})`;
    }
    if (key === 'COURSES.ACTIONS') return 'Actions';
    return key;
  });
  mock.get.and.callFake((key: string | string[]) => of(key));
  return mock;
}

export function createMockLanguageService(lang: AppLanguage = 'es'): jasmine.SpyObj<LanguageService> {
  const mock = jasmine.createSpyObj<LanguageService>(
    'LanguageService',
    ['setLanguage', 'formatMonthYear', 'formatShortDate', 'onLangChange'],
    { current: lang, localeId: lang === 'en' ? 'en-US' : 'es-MX' },
  );
  const langChange$ = new EventEmitter<LangChangeEvent>();
  mock.onLangChange.and.returnValue(langChange$.asObservable());
  mock.formatMonthYear.and.callFake((month: string) => `Month ${month}`);
  mock.formatShortDate.and.callFake((date: string) => date);
  return mock;
}

export type NeonQueryResult = { data: unknown; error: unknown };

/** Chainable Supabase-style client mock for CloudSyncService tests. */
export function createMockNeonClient(
  tableHandlers: Record<string, () => Promise<NeonQueryResult>> = {},
) {
  const buildChain = (table: string) => {
    const resolve =
      tableHandlers[table] ?? (() => Promise.resolve({ data: [], error: null }));
    const terminal = new Set(['maybeSingle', 'order']);
    const chain: Record<string, jasmine.Spy> & {
      then?: (onFulfilled: (v: NeonQueryResult) => unknown) => Promise<unknown>;
    } = {};
    const thenable = () => {
      chain.then = (onFulfilled) => resolve().then(onFulfilled);
      return chain;
    };
    for (const method of ['select', 'upsert', 'delete', 'eq', 'order', 'maybeSingle']) {
      chain[method] = jasmine.createSpy(method).and.callFake(() =>
        terminal.has(method) ? resolve() : thenable(),
      );
    }
    return thenable();
  };

  return { from: jasmine.createSpy('from').and.callFake((table: string) => buildChain(table)) };
}

export function createMockNeonService(
  session: unknown = null,
  client: ReturnType<typeof createMockNeonClient> = createMockNeonClient(),
) {
  const mock = jasmine.createSpyObj<NeonService>(
    'NeonService',
    ['getSession', 'getUser', 'signUp', 'signIn', 'signOut', 'getAuthErrorMessage'],
    { client },
  );
  mock.getSession.and.returnValue(Promise.resolve(session));
  mock.getUser.and.returnValue(Promise.resolve(null));
  mock.signOut.and.returnValue(Promise.resolve({ error: null }));
  mock.getAuthErrorMessage.and.returnValue('Error');
  return mock;
}