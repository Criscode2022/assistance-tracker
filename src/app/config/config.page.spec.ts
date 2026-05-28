import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, IonicModule, NavController, ToastController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { ConfigPage } from './config.page';
import { NotificationService } from '../services/notification.service';
import { AttendanceService } from '../services/attendance.service';
import { AppModeService } from '../services/app-mode.service';
import { ThemeService } from '../services/theme.service';
import { LanguageService } from '../services/language.service';
import { NeonService } from '../services/neon.service';
import { AuthFlowNavigationService } from '../services/auth-flow-navigation.service';
import { clearBrowserStorage } from '../../testing/fixtures';
import { createMockLanguageService, createMockNeonService } from '../../testing/mocks';

describe('ConfigPage', () => {
  let component: ConfigPage;
  let fixture: ComponentFixture<ConfigPage>;
  let theme: ThemeService;
  let authFlowNav: jasmine.SpyObj<AuthFlowNavigationService>;

  beforeEach(async () => {
    clearBrowserStorage();
    document.documentElement.classList.remove('dark', 'ion-palette-dark');

    await TestBed.configureTestingModule({
      declarations: [ConfigPage],
      imports: [IonicModule.forRoot(), TranslateModule.forRoot(), FormsModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        NotificationService,
        AttendanceService,
        AppModeService,
        ThemeService,
        { provide: LanguageService, useValue: createMockLanguageService() },
        { provide: NeonService, useValue: createMockNeonService() },
        { provide: NavController, useValue: jasmine.createSpyObj('NavController', ['navigateRoot']) },
        {
          provide: AuthFlowNavigationService,
          useValue: jasmine.createSpyObj('AuthFlowNavigationService', ['exitToDashboard']),
        },
        { provide: Router, useValue: { url: '/config', navigate: jasmine.createSpy('navigate'), navigateByUrl: jasmine.createSpy('navigateByUrl') } },
        { provide: AlertController, useValue: jasmine.createSpyObj('AlertController', ['create']) },
        { provide: ToastController, useValue: jasmine.createSpyObj('ToastController', ['create']) },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfigPage);
    component = fixture.componentInstance;
    theme = TestBed.inject(ThemeService);
    authFlowNav = TestBed.inject(AuthFlowNavigationService) as jasmine.SpyObj<AuthFlowNavigationService>;
    fixture.detectChanges();
  });

  afterEach(() => {
    clearBrowserStorage();
    document.documentElement.classList.remove('dark', 'ion-palette-dark');
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should sync dark mode from theme service on enter', () => {
    theme.setDark(true);
    component.ionViewWillEnter();
    expect(component.darkMode).toBeTrue();
  });

  it('should toggle dark mode via handler', () => {
    component.darkMode = false;
    component.onDarkModeChange({ detail: { checked: true } } as CustomEvent);
    expect(component.darkMode).toBeTrue();
    expect(theme.isDark).toBeTrue();
  });

  it('should change language', () => {
    const lang = TestBed.inject(LanguageService) as jasmine.SpyObj<LanguageService>;
    component.onLanguageChange({ detail: { value: 'en' } } as CustomEvent);
    expect(lang.setLanguage).toHaveBeenCalledWith('en');
    expect(component.currentLang).toBe('en');
  });

  it('should expose notification permission helpers', () => {
    expect(typeof component.notifSupported).toBe('boolean');
    expect(typeof component.permissionGranted).toBe('boolean');
  });

  it('should exit auth flow to dashboard on back', () => {
    component.goBack();
    expect(authFlowNav.exitToDashboard).toHaveBeenCalled();
  });
});
