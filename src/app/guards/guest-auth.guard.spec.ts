import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { GuestAuthGuard } from './guest-auth.guard';
import { AppModeService } from '../services/app-mode.service';
import { NeonService } from '../services/neon.service';
import { clearBrowserStorage } from '../../testing/fixtures';
import { createMockNeonService } from '../../testing/mocks';

describe('GuestAuthGuard', () => {
  let guard: GuestAuthGuard;
  let router: Router;
  let appMode: AppModeService;
  let neon: jasmine.SpyObj<NeonService>;

  beforeEach(() => {
    clearBrowserStorage();
    neon = createMockNeonService(null);

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        GuestAuthGuard,
        AppModeService,
        { provide: NeonService, useValue: neon },
      ],
    });

    guard = TestBed.inject(GuestAuthGuard);
    router = TestBed.inject(Router);
    appMode = TestBed.inject(AppModeService);
  });

  afterEach(() => {
    clearBrowserStorage();
  });

  it('should allow guests without a session', async () => {
    const result = await guard.canActivate();
    expect(result).toBeTrue();
  });

  it('should redirect authenticated online users away from auth', async () => {
    appMode.enableOnlineMode();
    neon.getSession.and.returnValue(Promise.resolve({ user: { id: '1' } }));

    const result = await guard.canActivate();
    expect(result instanceof UrlTree).toBeTrue();
    expect(router.serializeUrl(result as UrlTree)).toBe('/');
  });

  it('should allow session when app is offline', async () => {
    neon.getSession.and.returnValue(Promise.resolve({ user: { id: '1' } }));

    const result = await guard.canActivate();
    expect(result).toBeTrue();
  });
});
