import { Course, DayRecord } from '../app/models/attendance.model';

export function clearBrowserStorage(): void {
  localStorage.clear();
  sessionStorage.clear();
}

export function createMockCourse(overrides: Partial<Course> = {}): Course {
  return {
    id: 'course-1',
    name: 'Programación de sistemas',
    startDate: '2026-05-01',
    endDate: '2026-05-31',
    startTime: '09:00',
    hoursPerDay: 5,
    maxAbsences: 3,
    maxTardiness: 7,
    minAttendancePercent: 75,
    ...overrides,
  };
}

export function createMockDayRecord(overrides: Partial<DayRecord> = {}): DayRecord {
  return {
    status: 'present',
    ...overrides,
  };
}

export function seedCoursesStorage(courses: Course[], selectedId?: string): void {
  localStorage.setItem('courses_v1', JSON.stringify(courses));
  if (selectedId !== undefined) {
    localStorage.setItem('selected_course_id', selectedId);
  }
}

export function seedRecordsStorage(
  records: Record<string, Record<string, DayRecord>>,
): void {
  localStorage.setItem('attendance_v3', JSON.stringify(records));
}
