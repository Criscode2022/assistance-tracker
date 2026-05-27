import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, Routes } from '@angular/router';
import { OnlineAuthGuard } from './guards/online-auth.guard';
import { GuestAuthGuard } from './guards/guest-auth.guard';
import { AppModeService } from './services/app-mode.service';
import { NeonService } from './services/neon.service';
import { clearBrowserStorage } from '../testing/fixtures';
import { createMockNeonService } from '../testing/mocks';

/** Mirrors AppRoutingModule routes for guard integration tests. */
const appRoutes: Routes = [
  {
    path: '',
    canActivate: [OnlineAuthGuard],
    children: [{ path: '', redirectTo: 'dashboard', pathMatch: 'full' }],
  },
  { path: 'config', children: [{ path: '', redirectTo: 'settings', pathMatch: 'full' }] },
  {
    path: 'auth',
    canActivate: [GuestAuthGuard],
    children: [{ path: '', redirectTo: 'login', pathMatch: 'full' }],
  },
];

describe('App routes integration', () => {
  let router: Router;
  let appMode: AppModeService;
  let neon: jasmine.SpyObj<NeonService>;

  beforeEach(() => {
    clearBrowserStorage();
    neon = createMockNeonService(null);

    TestBed.configureTestingModule({
      providers: [
        provideRouter(appRoutes),
        OnlineAuthGuard,
        GuestAuthGuard,
        AppModeService,
        { provide: NeonService, useValue: neon },
      ],
    });

    router = TestBed.inject(Router);
    appMode = TestBed.inject(AppModeService);
  });

  afterEach(() => {
    clearBrowserStorage();
  });

  it('should allow root navigation when offline', async () => {
    const allowed = await TestBed.runInInjectionContext(() =>
      TestBed.inject(OnlineAuthGuard).canActivate(),
    );
    expect(allowed).toBeTrue();
  });

  it('should block root when online without session and send user to auth', async () => {
    appMode.enableOnlineMode();
    neon.getSession.and.returnValue(Promise.resolve(null));

    const result = await TestBed.runInInjectionContext(() =>
      TestBed.inject(OnlineAuthGuard).canActivate(),
    );

    expect(router.serializeUrl(result as never)).toBe('/auth');
  });

  it('should keep authenticated online users off auth route', async () => {
    appMode.enableOnlineMode();
    neon.getSession.and.returnValue(Promise.resolve({ user: { id: 'u1' } }));

    const result = await TestBed.runInInjectionContext(() =>
      TestBed.inject(GuestAuthGuard).canActivate(),
    );

    expect(router.serializeUrl(result as never)).toBe('/');
  });

  it('should allow guests on auth route', async () => {
    const result = await TestBed.runInInjectionContext(() =>
      TestBed.inject(GuestAuthGuard).canActivate(),
    );
    expect(result).toBeTrue();
  });
});
