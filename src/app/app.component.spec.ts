import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AppComponent } from './app.component';
import { AppModeService } from './services/app-mode.service';
import { CloudSyncService } from './services/cloud-sync.service';
import { NeonService } from './services/neon.service';
import { AttendanceService } from './services/attendance.service';
import { clearBrowserStorage } from '../testing/fixtures';
import { createMockLanguageService, createMockNeonService } from '../testing/mocks';
import { LanguageService } from './services/language.service';

describe('AppComponent', () => {
  let neon: jasmine.SpyObj<NeonService>;
  let router: { url: string; navigateByUrl: jasmine.Spy };

  beforeEach(async () => {
    clearBrowserStorage();
    neon = createMockNeonService(null);
    router = { url: '/dashboard', navigateByUrl: jasmine.createSpy('navigateByUrl') };

    await TestBed.configureTestingModule({
      declarations: [AppComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        AppModeService,
        AttendanceService,
        CloudSyncService,
        { provide: LanguageService, useValue: createMockLanguageService() },
        { provide: NeonService, useValue: neon },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    clearBrowserStorage();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should not redirect when offline', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    await fixture.componentInstance.ngOnInit();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('should redirect to auth when online without session', async () => {
    TestBed.inject(AppModeService).enableOnlineMode();
    neon.getSession.and.returnValue(Promise.resolve(null));

    const fixture = TestBed.createComponent(AppComponent);
    await fixture.componentInstance.ngOnInit();

    expect(router.navigateByUrl).toHaveBeenCalledWith('/auth');
  });

  it('should stay on page when online with session', async () => {
    TestBed.inject(AppModeService).enableOnlineMode();
    neon.getSession.and.returnValue(Promise.resolve({ user: { id: '1' } }));

    const fixture = TestBed.createComponent(AppComponent);
    await fixture.componentInstance.ngOnInit();

    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });
});
