import { TestBed } from '@angular/core/testing';
import { AttendanceService } from './attendance.service';
import { LanguageService } from './language.service';
import {
  clearBrowserStorage,
  createMockCourse,
  createMockDayRecord,
  seedCoursesStorage,
  seedRecordsStorage,
} from '../../testing/fixtures';
import { createMockLanguageService } from '../../testing/mocks';

describe('AttendanceService', () => {
  let svc: AttendanceService;
  let mockLang: jasmine.SpyObj<LanguageService>;

  beforeEach(() => {
    clearBrowserStorage();
    mockLang = createMockLanguageService('es');

    TestBed.configureTestingModule({
      providers: [
        AttendanceService,
        { provide: LanguageService, useValue: mockLang },
      ],
    });

    svc = TestBed.inject(AttendanceService);
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date('2026-05-15T12:00:00'));
  });

  afterEach(() => {
    jasmine.clock().uninstall();
    svc.clearAllData();
    clearBrowserStorage();
  });

  it('should start with no courses', () => {
    expect(svc.getCourses()).toEqual([]);
    expect(svc.getSelectedCourse()).toBeNull();
  });

  it('should save and retrieve a course', () => {
    const course = createMockCourse();
    svc.saveCourse(course);
    expect(svc.getCourse(course.id)?.name).toBe(course.name);
    expect(svc.selectedCourseId).toBe(course.id);
  });

  it('should delete a course and its records', () => {
    const course = createMockCourse();
    svc.saveCourse(course);
    svc.setDayRecord('2026-05-05', { status: 'present' }, course.id);
    svc.deleteCourse(course.id);

    expect(svc.getCourse(course.id)).toBeNull();
    expect(svc.getRecordsForCourse(course.id)).toEqual({});
    expect(svc.getCourses()).toEqual([]);
  });

  it('should set and clear day records', () => {
    const course = createMockCourse();
    svc.saveCourse(course);
    svc.setDayRecord('2026-05-05', { status: 'present' }, course.id);
    expect(svc.getDayRecord('2026-05-05', course.id).status).toBe('present');

    svc.setDayRecord('2026-05-05', { status: 'unlogged' }, course.id);
    expect(svc.getDayRecord('2026-05-05', course.id).status).toBe('unlogged');
  });

  it('should calculate late hours from entry and exit times', () => {
    const course = createMockCourse({ hoursPerDay: 5, startTime: '09:00' });
    svc.saveCourse(course);
    svc.setDayRecord(
      '2026-05-05',
      { status: 'late', entryTime: '09:30', exitTime: '14:00' },
      course.id,
    );

    const stats = svc.getMonthStats('2026-05', course.id);
    expect(stats.lateDays).toBe(1);
    expect(stats.totalHoursAttended).toBe(4.5);
    expect(stats.totalLostMinutes).toBe(30);
  });

  it('should compute month stats with failed status when limits exceeded', () => {
    const course = createMockCourse({ maxAbsences: 1 });
    svc.saveCourse(course);
    svc.setDayRecord('2026-05-05', { status: 'absent' }, course.id);
    svc.setDayRecord('2026-05-06', { status: 'absent' }, course.id);

    const stats = svc.getMonthStats('2026-05', course.id);
    expect(stats.absentDays).toBe(2);
    expect(stats.overallStatus).toBe('failed');
    expect(stats.absencesRemaining).toBe(0);
  });

  it('should compute warning status when close to limits', () => {
    const course = createMockCourse({ maxAbsences: 3 });
    svc.saveCourse(course);
    const absentDays = new Set(['2026-05-05', '2026-05-06']);
    for (const day of svc.getWorkingDaysInMonth('2026-05', course.startDate, course.endDate)) {
      if (day > '2026-05-15') continue;
      svc.setDayRecord(
        day,
        { status: absentDays.has(day) ? 'absent' : 'present' },
        course.id,
      );
    }

    const stats = svc.getMonthStats('2026-05', course.id);
    expect(stats.overallStatus).toBe('warning');
    expect(stats.absencesRemaining).toBe(1);
  });

  it('should exclude future days from elapsed stats', () => {
    const course = createMockCourse();
    svc.saveCourse(course);
    const entries = svc.getDayEntriesForMonth('2026-05', course.id);
    const future = entries.find((e) => e.date === '2026-05-20');
    expect(future?.isFuture).toBeTrue();
  });

  it('should import course data', () => {
    const course = createMockCourse({ id: 'imported-1' });
    svc.importCourseData(course, {
      '2026-05-05': { status: 'present' },
    });
    expect(svc.getCourse('imported-1')).toBeTruthy();
    expect(svc.getDayRecord('2026-05-05', 'imported-1').status).toBe('present');
  });

  it('should replace all data for cloud sync', () => {
    const course = createMockCourse({ id: 'cloud-1' });
    const callback = jasmine.createSpy('sync');
    svc.setSyncCallback(callback);

    svc.replaceAllData(
      [course],
      { 'cloud-1': { '2026-05-05': { status: 'present' } } },
      'cloud-1',
      true,
    );

    expect(svc.getCourses().length).toBe(1);
    expect(callback).not.toHaveBeenCalled();
  });

  it('should notify sync callback on changes', () => {
    const callback = jasmine.createSpy('sync');
    svc.setSyncCallback(callback);
    svc.saveCourse(createMockCourse());
    expect(callback).toHaveBeenCalled();
  });

  it('should migrate v2 attendance storage on load', () => {
    clearBrowserStorage();
    seedCoursesStorage([createMockCourse()]);
    localStorage.setItem(
      'attendance_v2',
      JSON.stringify({ 'course-1': { '2026-05-05': 'present' } }),
    );

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        AttendanceService,
        { provide: LanguageService, useValue: mockLang },
      ],
    });
    const reloaded = TestBed.inject(AttendanceService);
    expect(reloaded.getDayRecord('2026-05-05', 'course-1').status).toBe('present');
    expect(localStorage.getItem('attendance_v3')).toBeTruthy();
  });

  it('should list months for a course range', () => {
    const course = createMockCourse({
      startDate: '2026-04-10',
      endDate: '2026-06-15',
    });
    svc.saveCourse(course);
    const months = svc.getMonthsForCourse(course.id);
    expect(months).toEqual(['2026-06', '2026-05', '2026-04']);
  });

  it('should list custom modules as periods', () => {
    const course = createMockCourse({
      periodMode: 'module',
      modules: [
        { id: 'mod-1', name: 'Module A', startDate: '2026-05-01', endDate: '2026-05-15' },
        { id: 'mod-2', name: 'Module B', startDate: '2026-05-16', endDate: '2026-05-31' },
      ],
    });
    svc.saveCourse(course);

    const periods = svc.getPeriodsForCourse(course.id);
    expect(periods.map((p) => p.key)).toEqual(['mod-2', 'mod-1']);
    expect(periods[0].label).toBe('Module B');
  });

  it('should compute stats within a module date range', () => {
    const course = createMockCourse({
      periodMode: 'module',
      maxAbsences: 1,
      modules: [
        { id: 'mod-1', name: 'Module A', startDate: '2026-05-01', endDate: '2026-05-15' },
        { id: 'mod-2', name: 'Module B', startDate: '2026-05-16', endDate: '2026-05-31' },
      ],
    });
    svc.saveCourse(course);
    svc.setDayRecord('2026-05-05', { status: 'absent' }, course.id);
    svc.setDayRecord('2026-05-06', { status: 'absent' }, course.id);

    const mod1 = svc.getPeriodStats('mod-1', course.id);
    expect(mod1.absentDays).toBe(2);
    expect(mod1.overallStatus).toBe('failed');

    jasmine.clock().mockDate(new Date('2026-05-25T12:00:00'));
    svc.setDayRecord('2026-05-20', { status: 'absent' }, course.id);
    const mod2 = svc.getPeriodStats('mod-2', course.id);
    expect(mod2.absentDays).toBe(1);
    expect(mod2.absencesRemaining).toBe(0);
  });

  it('should default imported courses to month period mode', () => {
    const course = createMockCourse({ periodMode: undefined, modules: undefined });
    const normalized = svc.normalizeCourse(course);
    expect(normalized.periodMode).toBe('month');
    expect(normalized.modules).toEqual([]);
  });

  it('should calc default exit time from course schedule', () => {
    const course = createMockCourse({ startTime: '08:00', hoursPerDay: 4 });
    expect(svc.calcDefaultExitTime(course)).toBe('12:00');
    expect(svc.calcDefaultExitTime(null)).toBe('14:00');
  });

  it('should clear all local data', () => {
    svc.saveCourse(createMockCourse());
    svc.clearAllData();
    expect(svc.hasLocalData()).toBeFalse();
    expect(localStorage.getItem('courses_v1')).toBeNull();
  });

  it('should remember the selected period for the browser session', () => {
    const course = createMockCourse({ startDate: '2026-05-01', endDate: '2026-06-30' });
    svc.saveCourse(course);

    expect(svc.getSelectedPeriodKey(course.id)).toBe('2026-05');

    svc.setSelectedPeriodKey('2026-06', course.id);
    expect(svc.getSelectedPeriodKey(course.id)).toBe('2026-06');
    expect(sessionStorage.getItem('selected_period_v1')).toContain('2026-06');
  });

  it('should ignore a stored period that is no longer valid for the course', () => {
    const course = createMockCourse({ startDate: '2026-05-01', endDate: '2026-05-31' });
    svc.saveCourse(course);
    svc.setSelectedPeriodKey('2026-06', course.id);

    expect(svc.getSelectedPeriodKey(course.id)).toBe('2026-05');
  });

  it('should clear stored periods when local data is wiped', () => {
    const course = createMockCourse({ startDate: '2026-05-01', endDate: '2026-06-30' });
    svc.saveCourse(course);
    svc.setSelectedPeriodKey('2026-06', course.id);

    svc.clearAllData();
    expect(sessionStorage.getItem('selected_period_v1')).toBeNull();
  });
});
