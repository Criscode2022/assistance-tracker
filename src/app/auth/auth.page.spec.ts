import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { IonicModule, NavController, ToastController } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AuthPage } from './auth.page';
import { AttendanceService } from '../services/attendance.service';
import { AppModeService } from '../services/app-mode.service';
import { CloudSyncService } from '../services/cloud-sync.service';
import { NeonService } from '../services/neon.service';
import { AuthFlowNavigationService } from '../services/auth-flow-navigation.service';
import { LanguageService } from '../services/language.service';
import { clearBrowserStorage, createMockCourse } from '../../testing/fixtures';
import { createMockLanguageService, createMockNeonService, createMockTranslateService } from '../../testing/mocks';

describe('AuthPage', () => {
  let component: AuthPage;
  let fixture: ComponentFixture<AuthPage>;
  let attendance: AttendanceService;
  let authFlowNav: jasmine.SpyObj<AuthFlowNavigationService>;
  let queryParams: Record<string, string>;

  beforeEach(async () => {
    clearBrowserStorage();
    queryParams = {};

    await TestBed.configureTestingModule({
      declarations: [AuthPage],
      imports: [IonicModule.forRoot(), TranslateModule.forRoot()],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        AttendanceService,
        AppModeService,
        CloudSyncService,
        { provide: LanguageService, useValue: createMockLanguageService() },
        { provide: NeonService, useValue: createMockNeonService() },
        { provide: TranslateService, useValue: createMockTranslateService() },
        { provide: NavController, useValue: jasmine.createSpyObj('NavController', ['navigateRoot']) },
        { provide: ToastController, useValue: jasmine.createSpyObj('ToastController', ['create']) },
        {
          provide: AuthFlowNavigationService,
          useValue: jasmine.createSpyObj('AuthFlowNavigationService', ['exitToDashboard']),
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => queryParams[key] ?? null,
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AuthPage);
    component = fixture.componentInstance;
    attendance = TestBed.inject(AttendanceService);
    authFlowNav = TestBed.inject(AuthFlowNavigationService) as jasmine.SpyObj<AuthFlowNavigationService>;
  });

  afterEach(() => {
    attendance.clearAllData();
    clearBrowserStorage();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default to signup when local offline data exists', () => {
    attendance.saveCourse(createMockCourse());
    component.ngOnInit();
    expect(component.hasOfflineData).toBeTrue();
    expect(component.tab).toBe('signup');
  });

  it('should default to signup tab when no local data', () => {
    component.ngOnInit();
    expect(component.hasOfflineData).toBeFalse();
    expect(component.tab).toBe('signup');
  });

  it('should switch auth tab', () => {
    component.setTab('signin');
    expect(component.tab).toBe('signin');
  });

  it('should exit auth flow to dashboard on back', () => {
    component.goBack();
    expect(authFlowNav.exitToDashboard).toHaveBeenCalled();
  });

  it('should open the sign-in tab from the query param', () => {
    queryParams['tab'] = 'signin';
    component.ngOnInit();
    expect(component.tab).toBe('signin');
  });

  it('should prefer tab=signin over the local-data signup default', () => {
    attendance.saveCourse(createMockCourse());
    queryParams['tab'] = 'signin';
    component.ngOnInit();
    expect(component.hasOfflineData).toBeTrue();
    expect(component.tab).toBe('signin');
  });
});
