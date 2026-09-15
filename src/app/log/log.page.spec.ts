import { CUSTOM_ELEMENTS_SCHEMA, ChangeDetectorRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActionSheetController, AlertController, IonicModule } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { LogPage } from './log.page';
import { AttendanceService } from '../services/attendance.service';
import { LanguageService } from '../services/language.service';
import { accessible } from '../../testing/accessible';
import { clearBrowserStorage, createMockCourse } from '../../testing/fixtures';
import { createMockLanguageService, createMockTranslateService } from '../../testing/mocks';

describe('LogPage', () => {
  let component: any;
  let fixture: ComponentFixture<LogPage>;
  let svc: AttendanceService;

  beforeEach(async () => {
    clearBrowserStorage();
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date('2026-05-15T12:00:00'));

    await TestBed.configureTestingModule({
      declarations: [LogPage],
      imports: [IonicModule.forRoot(), TranslateModule.forRoot()],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        AttendanceService,
        { provide: TranslateService, useValue: createMockTranslateService() },
        { provide: LanguageService, useValue: createMockLanguageService() },
        { provide: ActionSheetController, useValue: jasmine.createSpyObj('ActionSheetController', ['create']) },
        { provide: AlertController, useValue: jasmine.createSpyObj('AlertController', ['create']) },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LogPage);
    component = accessible(fixture.componentInstance);
    svc = TestBed.inject(AttendanceService);
    spyOn((component as unknown as { cdr: ChangeDetectorRef }).cdr, 'detectChanges');
  });

  afterEach(() => {
    fixture.destroy();
    jasmine.clock().uninstall();
    svc.clearAllData();
    clearBrowserStorage();
  });

  it('should load day entries for the current month', () => {
    const course = createMockCourse({ startDate: '2026-05-01', endDate: '2026-05-31' });
    svc.saveCourse(course);
    svc.setDayRecord('2026-05-05', { status: 'present' }, course.id);
    component.ionViewWillEnter();

    const day = component.days.find((d: { date: string; status: string; isFuture?: boolean }) => d.date === '2026-05-05');
    expect(day?.status).toBe('present');
    expect(component.periodLabel).toContain('2026-05');
  });

  it('should not open status picker for future days', async () => {
    const actionSheet = TestBed.inject(ActionSheetController) as jasmine.SpyObj<ActionSheetController>;
    const course = createMockCourse({ startDate: '2026-05-01', endDate: '2026-05-31' });
    svc.saveCourse(course);
    component.ionViewWillEnter();

    const future = component.days.find((d: { date: string; status: string; isFuture?: boolean }) => d.isFuture);
    expect(future).toBeTruthy();

    await component.openStatusPicker(future!);
    expect(actionSheet.create).not.toHaveBeenCalled();
  });

  it('should map status icons and colors', () => {
    expect(component.statusIcon({ status: 'present' } as never)).toBe('checkmark-circle');
    expect(component.statusIcon({ status: 'absent' } as never)).toBe('close-circle');
    expect(component.statusColor({ status: 'late' } as never)).toBe('warning');
    expect(component.statusLabelKey({ status: 'unlogged' } as never)).toBe('COMMON.UNLOGGED');
    expect(component.statusIcon({ status: 'cancelled' } as never)).toBe('ban');
  });

  it('should refresh day list when attendance record changes', () => {
    const course = createMockCourse({ startDate: '2026-05-01', endDate: '2026-05-31' });
    svc.saveCourse(course);
    svc.setDayRecord('2026-05-05', { status: 'present' }, course.id);
    component.ionViewWillEnter();
    expect(component.days.find((d: { date: string; status: string; isFuture?: boolean }) => d.date === '2026-05-05')?.status).toBe('present');

    svc.setDayRecord('2026-05-05', { status: 'absent' }, course.id);
    component.onPeriodChange();
    expect(component.days.find((d: { date: string; status: string; isFuture?: boolean }) => d.date === '2026-05-05')?.status).toBe('absent');
  });

  it('should reload days after course change', () => {
    const a = createMockCourse({ id: 'a', startDate: '2026-05-01', endDate: '2026-05-31' });
    const b = createMockCourse({ id: 'b', name: 'B', startDate: '2026-05-01', endDate: '2026-05-31' });
    svc.saveCourse(a);
    svc.saveCourse(b);
    svc.setDayRecord('2026-05-05', { status: 'absent' }, 'a');
    svc.setDayRecord('2026-05-05', { status: 'present' }, 'b');

    component.ionViewWillEnter();
    component.selectedCourseId = 'b';
    component.onCourseChange();

    const day = component.days.find((d: { date: string; status: string; isFuture?: boolean }) => d.date === '2026-05-05');
    expect(day?.status).toBe('present');
  });

  it('should format fractional hours', () => {
    expect(component.formatHours(1)).toBe('1h');
    expect(component.formatHours(1.25)).toBe('1h 15min');
  });

  it('should refresh day status after action sheet dismisses', async () => {
    const course = createMockCourse({ startDate: '2026-05-01', endDate: '2026-05-31' });
    svc.saveCourse(course);
    component.ionViewWillEnter();

    const target = component.days.find((d: { date: string; status: string; isFuture?: boolean }) => d.date === '2026-05-05');
    expect(target?.status).toBe('unlogged');

    spyOn(window, 'requestAnimationFrame').and.callFake((fn: FrameRequestCallback) => {
      fn(0);
      return 1;
    });

    const actionSheet = TestBed.inject(ActionSheetController) as jasmine.SpyObj<ActionSheetController>;
    actionSheet.create.and.callFake(async (opts: { buttons: { icon?: string; handler?: () => void }[] }) => {
      const presentBtn = opts.buttons.find((b) => b.icon === 'checkmark-circle-outline');
      return {
        present: async () => {
          presentBtn?.handler?.();
        },
        onDidDismiss: async () => ({}),
      } as unknown as HTMLIonActionSheetElement;
    });

    await component.openStatusPicker(target!);
    expect(component.days.find((d: { date: string; status: string; isFuture?: boolean }) => d.date === '2026-05-05')?.status).toBe('present');
  });

  it('should quick toggle between present and absent', () => {
    const course = createMockCourse({ startDate: '2026-05-01', endDate: '2026-05-31' });
    svc.saveCourse(course);
    component.ionViewWillEnter();

    spyOn(window, 'requestAnimationFrame').and.callFake((fn: FrameRequestCallback) => {
      fn(0);
      return 1;
    });

    const date = '2026-05-05';
    component.quickToggle(component.days.find((d: { date: string; status: string; isFuture?: boolean }) => d.date === date)!);
    expect(component.days.find((d: { date: string; status: string; isFuture?: boolean }) => d.date === date)?.status).toBe('present');

    component.quickToggle(component.days.find((d: { date: string; status: string; isFuture?: boolean }) => d.date === date)!);
    expect(component.days.find((d: { date: string; status: string; isFuture?: boolean }) => d.date === date)?.status).toBe('absent');
  });

  it('should keep the selected month after changing a day status', () => {
    jasmine.clock().mockDate(new Date('2026-06-15T12:00:00'));
    const course = createMockCourse({ startDate: '2026-05-01', endDate: '2026-06-30' });
    svc.saveCourse(course);
    component.ionViewWillEnter();
    expect(component.selectedPeriod).toBe('2026-06');

    spyOn(window, 'requestAnimationFrame').and.callFake((fn: FrameRequestCallback) => {
      fn(0);
      return 1;
    });

    component.selectedPeriod = '2026-05';
    component.onPeriodChange();
    expect(
      (component.days as Array<{ date: string; status: string }>).some((d) =>
        d.date.startsWith('2026-05'),
      ),
    ).toBeTrue();

    const mayDay = (component.days as Array<{ date: string; status: string; isFuture?: boolean }>).find(
      (d) => d.date === '2026-05-05',
    )!;
    component.quickToggle(mayDay);

    expect(component.selectedPeriod).toBe('2026-05');
    expect(
      (component.days as Array<{ date: string; status: string }>).find((d) => d.date === '2026-05-05')
        ?.status,
    ).toBe('present');
  });
});
