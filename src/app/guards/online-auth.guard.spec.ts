import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { OnlineAuthGuard } from './online-auth.guard';
import { AppModeService } from '../services/app-mode.service';
import { NeonService } from '../services/neon.service';
import { clearBrowserStorage } from '../../testing/fixtures';
import { createMockNeonService } from '../../testing/mocks';

describe('OnlineAuthGuard', () => {
  let guard: OnlineAuthGuard;
  let router: Router;
  let appMode: AppModeService;
  let neon: jasmine.SpyObj<NeonService>;

  beforeEach(() => {
    clearBrowserStorage();
    neon = createMockNeonService(null);

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        OnlineAuthGuard,
        AppModeService,
        { provide: NeonService, useValue: neon },
      ],
    });

    guard = TestBed.inject(OnlineAuthGuard);
    router = TestBed.inject(Router);
    appMode = TestBed.inject(AppModeService);
  });

  afterEach(() => {
    clearBrowserStorage();
  });

  it('should allow access when app is offline', async () => {
    const result = await guard.canActivate();
    expect(result).toBeTrue();
  });

  it('should allow access when online and session exists', async () => {
    appMode.enableOnlineMode();
    neon.getSession.and.returnValue(Promise.resolve({ user: { id: '1' } }));

    const result = await guard.canActivate();
    expect(result).toBeTrue();
  });

  it('should redirect to auth when online without session', async () => {
    appMode.enableOnlineMode();
    neon.getSession.and.returnValue(Promise.resolve(null));

    const result = await guard.canActivate();
    expect(result instanceof UrlTree).toBeTrue();
    expect(router.serializeUrl(result as UrlTree)).toBe('/auth');
  });
});
