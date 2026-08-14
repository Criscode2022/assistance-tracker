import { TestBed } from '@angular/core/testing';
import { AttendanceService } from './services/attendance.service';
import { LanguageService } from './services/language.service';
import {
  clearBrowserStorage,
  createMockCourse,
} from '../testing/fixtures';
import { createMockLanguageService } from '../testing/mocks';

describe('Attendance persistence integration', () => {
  function makeService(): AttendanceService {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        AttendanceService,
        { provide: LanguageService, useValue: createMockLanguageService('es') },
      ],
    });
    return TestBed.inject(AttendanceService);
  }

  beforeEach(() => {
    clearBrowserStorage();
  });

  afterEach(() => {
    clearBrowserStorage();
  });

  it('rehydrates courses, records and selection from localStorage', () => {
    const first = makeService();
    const course = createMockCourse({ id: 'persist-1', name: 'Sistemas' });
    first.saveCourse(course);
    first.setDayRecord('2026-05-05', { status: 'present' }, course.id);
    first.setDayRecord(
      '2026-05-06',
      { status: 'late', entryTime: '09:30', exitTime: '14:00' },
      course.id,
    );

    const reloaded = makeService();
    expect(reloaded.getCourse('persist-1')?.name).toBe('Sistemas');
    expect(reloaded.selectedCourseId).toBe('persist-1');
    expect(reloaded.getDayRecord('2026-05-05', 'persist-1').status).toBe('present');
    expect(reloaded.getDayRecord('2026-05-06', 'persist-1').status).toBe('late');
  });

  it('keeps month stats stable across a reload', () => {
    const first = makeService();
    const course = createMockCourse({ id: 'stats-1', hoursPerDay: 5, startTime: '09:00' });
    first.saveCourse(course);
    first.setDayRecord('2026-05-05', { status: 'present' }, course.id);
    first.setDayRecord(
      '2026-05-06',
      { status: 'late', entryTime: '09:30', exitTime: '14:00' },
      course.id,
    );
    const before = first.getMonthStats('2026-05', course.id);

    const after = makeService().getMonthStats('2026-05', course.id);
    expect(after.presentDays).toBe(before.presentDays);
    expect(after.lateDays).toBe(before.lateDays);
    expect(after.totalHoursAttended).toBe(before.totalHoursAttended);
    expect(after.totalLostMinutes).toBe(before.totalLostMinutes);
  });
});
