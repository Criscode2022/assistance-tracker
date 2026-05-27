import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActionSheetController, AlertController } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LogPage } from './log.page';
import { AttendanceService } from '../services/attendance.service';
import { LanguageService } from '../services/language.service';
import { clearBrowserStorage, createMockCourse } from '../../testing/fixtures';
import { createMockLanguageService, createMockTranslateService } from '../../testing/mocks';

describe('LogPage', () => {
  let component: LogPage;
  let svc: AttendanceService;

  beforeEach(() => {
    clearBrowserStorage();
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date('2026-05-15T12:00:00'));

    TestBed.configureTestingModule({
      declarations: [LogPage],
      imports: [TranslateModule.forRoot()],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        AttendanceService,
        { provide: TranslateService, useValue: createMockTranslateService() },
        { provide: LanguageService, useValue: createMockLanguageService() },
        { provide: ActionSheetController, useValue: jasmine.createSpyObj('ActionSheetController', ['create']) },
        { provide: AlertController, useValue: jasmine.createSpyObj('AlertController', ['create']) },
      ],
    });

    component = TestBed.createComponent(LogPage).componentInstance;
    svc = TestBed.inject(AttendanceService);
  });

  afterEach(() => {
    jasmine.clock().uninstall();
    svc.clearAllData();
    clearBrowserStorage();
  });

  it('should load day entries for the current month', () => {
    const course = createMockCourse();
    svc.saveCourse(course);
    svc.setDayRecord('2026-05-05', { status: 'present' }, course.id);
    component.ionViewWillEnter();

    const day = component.days.find((d) => d.date === '2026-05-05');
    expect(day?.status).toBe('present');
    expect(component.monthLabel).toContain('2026-05');
  });

  it('should not open status picker for future days', async () => {
    const actionSheet = TestBed.inject(ActionSheetController) as jasmine.SpyObj<ActionSheetController>;
    component.ionViewWillEnter();
    const future = component.days.find((d) => d.isFuture);
    expect(future).toBeTruthy();

    await component.openStatusPicker(future!);
    expect(actionSheet.create).not.toHaveBeenCalled();
  });

  it('should map status icons and colors', () => {
    expect(component.statusIcon({ status: 'present' } as never)).toBe('checkmark-circle');
    expect(component.statusIcon({ status: 'absent' } as never)).toBe('close-circle');
    expect(component.statusColor({ status: 'late' } as never)).toBe('warning');
    expect(component.statusLabelKey({ status: 'unlogged' } as never)).toBe('COMMON.UNLOGGED');
  });

  it('should reload days after course change', () => {
    const a = createMockCourse({ id: 'a' });
    const b = createMockCourse({ id: 'b', name: 'B' });
    svc.saveCourse(a);
    svc.saveCourse(b);
    svc.setDayRecord('2026-05-05', { status: 'absent' }, 'a');
    svc.setDayRecord('2026-05-05', { status: 'present' }, 'b');

    component.ionViewWillEnter();
    component.selectedCourseId = 'b';
    component.onCourseChange();

    const day = component.days.find((d) => d.date === '2026-05-05');
    expect(day?.status).toBe('present');
  });

  it('should format fractional hours', () => {
    expect(component.formatHours(1)).toBe('1h');
    expect(component.formatHours(1.25)).toBe('1h 15min');
  });
});
