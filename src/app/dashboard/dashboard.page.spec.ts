import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NavController } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { DashboardPage } from './dashboard.page';
import { AttendanceService } from '../services/attendance.service';
import { LanguageService } from '../services/language.service';
import { clearBrowserStorage, createMockCourse } from '../../testing/fixtures';
import { createMockLanguageService } from '../../testing/mocks';

describe('DashboardPage', () => {
  let component: DashboardPage;
  let fixture: ComponentFixture<DashboardPage>;
  let svc: AttendanceService;

  beforeEach(() => {
    clearBrowserStorage();
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date('2026-05-15T12:00:00'));

    TestBed.configureTestingModule({
      declarations: [DashboardPage],
      imports: [TranslateModule.forRoot()],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        AttendanceService,
        { provide: LanguageService, useValue: createMockLanguageService() },
        { provide: NavController, useValue: jasmine.createSpyObj('NavController', ['navigateForward', 'navigateRoot']) },
      ],
    });

    fixture = TestBed.createComponent(DashboardPage);
    component = fixture.componentInstance;
    svc = TestBed.inject(AttendanceService);
  });

  afterEach(() => {
    jasmine.clock().uninstall();
    svc.clearAllData();
    clearBrowserStorage();
  });

  it('should load stats for the selected course and month', () => {
    const course = createMockCourse();
    svc.saveCourse(course);
    svc.setDayRecord('2026-05-05', { status: 'present' }, course.id);
    component.ionViewWillEnter();

    expect(component.courses.length).toBe(1);
    expect(component.stats.presentDays).toBe(1);
    expect(component.courseName).toBe(course.name);
  });

  it('should refresh stats when course changes', () => {
    const a = createMockCourse({ id: 'a', name: 'Curso A' });
    const b = createMockCourse({ id: 'b', name: 'Curso B' });
    svc.saveCourse(a);
    svc.saveCourse(b);
    svc.setDayRecord('2026-05-05', { status: 'absent' }, 'a');
    svc.setDayRecord('2026-05-05', { status: 'present' }, 'b');

    component.ionViewWillEnter();
    component.selectedCourseId = 'b';
    component.onCourseChange();

    expect(component.stats.presentDays).toBe(1);
    expect(component.stats.absentDays).toBe(0);
  });

  it('should compute progress arc from attendance percent', () => {
    const course = createMockCourse();
    svc.saveCourse(course);
    component.ionViewWillEnter();
    const expected = (component.stats.attendancePercent / 100) * component.CIRC;
    expect(component.progressArc).toBeCloseTo(expected, 2);
  });

  it('should map ring color and hero gradient by status', () => {
    const course = createMockCourse({ maxAbsences: 0 });
    svc.saveCourse(course);
    svc.setDayRecord('2026-05-05', { status: 'absent' }, course.id);
    svc.setDayRecord('2026-05-06', { status: 'absent' }, course.id);
    component.ionViewWillEnter();

    expect(component.stats.overallStatus).toBe('failed');
    expect(component.ringColor).toBe('#f5c4c4');
    expect(component.heroGradient).toContain('#8b2e2e');
    expect(component.statusKey).toBe('DASHBOARD.STATUS_FAILED');
    expect(component.statusIcon).toBe('close-circle');
  });

  it('should format hours for display', () => {
    expect(component.formatHours(5)).toBe('5h');
    expect(component.formatHours(2.5)).toBe('2h 30min');
    expect(component.formatHours(0.5)).toBe('30min');
  });

  it('should navigate to config', () => {
    const nav = TestBed.inject(NavController) as jasmine.SpyObj<NavController>;
    component.openConfig();
    expect(nav.navigateForward).toHaveBeenCalledWith('/config');
  });

  it('should load working days for the selected period', () => {
    const course = createMockCourse();
    svc.saveCourse(course);
    svc.setDayRecord('2026-05-05', { status: 'present' }, course.id);
    component.ionViewWillEnter();

    expect(component.days.length).toBeGreaterThan(0);
    expect(component.days.some((d) => d.date === '2026-05-05' && d.status === 'present')).toBeTrue();
  });

  it('should map weekday columns from Monday to Friday', () => {
    expect(component.weekdayColumn({ date: '2026-05-04' } as never)).toBe(1);
    expect(component.weekdayColumn({ date: '2026-05-08' } as never)).toBe(5);
  });

  it('should navigate to the log from the period board', () => {
    const nav = TestBed.inject(NavController) as jasmine.SpyObj<NavController>;
    component.openLog();
    expect(nav.navigateRoot).toHaveBeenCalledWith('/log');
  });
});
