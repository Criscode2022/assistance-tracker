import { TestBed } from '@angular/core/testing';
import { AppModeService } from './app-mode.service';
import { clearBrowserStorage } from '../../testing/fixtures';

describe('AppModeService', () => {
  let service: AppModeService;

  beforeEach(() => {
    clearBrowserStorage();
    TestBed.configureTestingModule({});
    service = TestBed.inject(AppModeService);
  });

  afterEach(() => {
    clearBrowserStorage();
  });

  it('should default to offline mode', () => {
    expect(service.isOffline()).toBeTrue();
    expect(service.isOnline()).toBeFalse();
    expect(service.hasOnlineIntent()).toBeFalse();
  });

  it('should set and clear online intent', () => {
    service.setOnlineIntent();
    expect(service.hasOnlineIntent()).toBeTrue();
    service.clearOnlineIntent();
    expect(service.hasOnlineIntent()).toBeFalse();
  });

  it('should enable online mode and clear intent', (done) => {
    const emissions: string[] = [];
    service.watchMode().subscribe((mode) => emissions.push(mode));

    service.setOnlineIntent();
    service.enableOnlineMode();

    expect(service.isOnline()).toBeTrue();
    expect(service.hasOnlineIntent()).toBeFalse();
    expect(localStorage.getItem('app_mode_v1')).toBe('online');
    expect(emissions).toContain('online');
    done();
  });

  it('should disable online mode', () => {
    service.enableOnlineMode();
    service.disableOnlineMode();
    expect(service.isOffline()).toBeTrue();
    expect(localStorage.getItem('app_mode_v1')).toBe('offline');
  });

  it('should restore online mode from storage', () => {
    localStorage.setItem('app_mode_v1', 'online');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const reloaded = TestBed.inject(AppModeService);
    expect(reloaded.isOnline()).toBeTrue();
  });
});
