import { TestBed } from '@angular/core/testing';
import { NavController } from '@ionic/angular';
import { AuthFlowNavigationService } from './auth-flow-navigation.service';
import { AppModeService } from './app-mode.service';
import { NeonService } from './neon.service';
import { clearBrowserStorage } from '../../testing/fixtures';
import { createMockNeonService } from '../../testing/mocks';

describe('AuthFlowNavigationService', () => {
  let service: AuthFlowNavigationService;
  let appMode: AppModeService;
  let neon: jasmine.SpyObj<NeonService>;
  let nav: jasmine.SpyObj<NavController>;

  beforeEach(() => {
    clearBrowserStorage();
    neon = createMockNeonService(null);
    nav = jasmine.createSpyObj('NavController', ['navigateRoot']);
    nav.navigateRoot.and.returnValue(Promise.resolve(true));

    TestBed.configureTestingModule({
      providers: [
        AuthFlowNavigationService,
        AppModeService,
        { provide: NeonService, useValue: neon },
        { provide: NavController, useValue: nav },
      ],
    });

    service = TestBed.inject(AuthFlowNavigationService);
    appMode = TestBed.inject(AppModeService);
  });

  afterEach(() => {
    clearBrowserStorage();
  });

  it('should clear online intent and return to dashboard when offline', async () => {
    appMode.setOnlineIntent();
    await service.exitToDashboard();
    expect(appMode.hasOnlineIntent()).toBeFalse();
    expect(appMode.isOffline()).toBeTrue();
    expect(nav.navigateRoot).toHaveBeenCalledWith('/dashboard');
  });

  it('should disable stale online mode without session to avoid auth guard loop', async () => {
    appMode.enableOnlineMode();
    neon.getSession.and.returnValue(Promise.resolve(null));

    await service.exitToDashboard();

    expect(appMode.isOffline()).toBeTrue();
    expect(neon.signOut).toHaveBeenCalled();
    expect(nav.navigateRoot).toHaveBeenCalledWith('/dashboard');
  });

  it('should keep online mode when a session exists', async () => {
    appMode.enableOnlineMode();
    neon.getSession.and.returnValue(Promise.resolve({ user: { id: 'u1' } }));

    await service.exitToDashboard();

    expect(appMode.isOnline()).toBeTrue();
    expect(nav.navigateRoot).toHaveBeenCalledWith('/dashboard');
  });
});
