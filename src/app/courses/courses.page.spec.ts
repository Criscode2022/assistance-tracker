import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ActionSheetController, AlertController, IonicModule, ToastController } from '@ionic/angular';
import { AppModeService } from '../services/app-mode.service';
import { SharedModule } from '../shared/shared.module';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CoursesPage } from './courses.page';
import { AttendanceService } from '../services/attendance.service';
import { LanguageService } from '../services/language.service';
import { clearBrowserStorage, createMockCourse } from '../../testing/fixtures';
import { createMockLanguageService, createMockTranslateService } from '../../testing/mocks';

describe('CoursesPage', () => {
  let component: CoursesPage;
  let fixture: ComponentFixture<CoursesPage>;
  let svc: AttendanceService;

  beforeEach(async () => {
    clearBrowserStorage();

    await TestBed.configureTestingModule({
      declarations: [CoursesPage],
      imports: [
        IonicModule.forRoot(),
        TranslateModule.forRoot(),
        FormsModule,
        SharedModule,
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        AttendanceService,
        AppModeService,
        { provide: TranslateService, useValue: createMockTranslateService() },
        { provide: LanguageService, useValue: createMockLanguageService() },
        {
          provide: AlertController,
          useValue: jasmine.createSpyObj('AlertController', ['create']),
        },
        {
          provide: ActionSheetController,
          useValue: jasmine.createSpyObj('ActionSheetController', ['create']),
        },
        {
          provide: ToastController,
          useValue: jasmine.createSpyObj('ToastController', ['create']),
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CoursesPage);
    component = fixture.componentInstance;
    svc = TestBed.inject(AttendanceService);
  });

  afterEach(() => {
    svc.clearAllData();
    clearBrowserStorage();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should validate form only when required fields are set', () => {
    component.form = {
      name: '',
      startDate: '2026-05-01',
      endDate: '2026-05-31',
      startTime: '09:00',
      hoursPerDay: 5,
      maxAbsences: 3,
      maxTardiness: 7,
      minAttendancePercent: 75,
    };
    expect(component.isFormValid()).toBeFalse();

    component.form.name = 'Curso de prueba';
    expect(component.isFormValid()).toBeTrue();
  });

  it('should reject end date before start date', () => {
    component.form.name = 'Curso';
    component.form.startDate = '2026-05-20';
    component.form.endDate = '2026-05-01';
    expect(component.isFormValid()).toBeFalse();
  });

  it('should save a new course from the form', () => {
    component.form.name = 'Nuevo curso';
    component.form.startDate = '2026-05-01';
    component.form.endDate = '2026-05-31';
    component.saveForm();

    expect(component.showForm).toBeFalse();
    expect(svc.getCourses().length).toBe(1);
    expect(svc.getCourses()[0].name).toBe('Nuevo curso');
  });

  it('should toggle selection in select mode', () => {
    const course = createMockCourse();
    svc.saveCourse(course);
    component.ionViewWillEnter();

    component.enterSelectMode();
    component.toggleSelectId(course.id);
    expect(component.isSelected(course.id)).toBeTrue();
    expect(component.selectedCount).toBe(1);

    component.toggleSelectId(course.id);
    expect(component.isSelected(course.id)).toBeFalse();
  });

  it('should build actions label with selection count', () => {
    svc.saveCourse(createMockCourse({ id: 'c1' }));
    svc.saveCourse(createMockCourse({ id: 'c2', name: 'Otro curso' }));
    component.ionViewWillEnter();
    component.enterSelectMode();
    component.toggleSelectId('c1');
    component.toggleSelectId('c2');

    expect(component.selectedCount).toBe(2);
    expect(component.actionsLabel).toBe('Actions (2)');
  });

  it('should select active course when not in select mode', () => {
    const course = createMockCourse();
    svc.saveCourse(course);
    component.selectCourse(course.id);
    expect(svc.selectedCourseId).toBe(course.id);
  });

  it('should compute calcExitTime from form', () => {
    component.form.startTime = '10:00';
    component.form.hoursPerDay = 3;
    expect(component.calcExitTime).toBe('13:00');
  });
});
