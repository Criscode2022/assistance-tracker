import type { Course, DayRecord } from '../../src/app/models/attendance.model';

export interface SeedData {
  courses?: Course[];
  records?: Record<string, Record<string, DayRecord>>;
  selectedCourseId?: string;
  lang?: 'es' | 'en';
  theme?: 'light' | 'dark';
  appMode?: 'online' | 'offline';
  onlineIntent?: boolean;
}

export async function seedLocalStorage(page: import('@playwright/test').Page, data: SeedData): Promise<void> {
  await page.addInitScript((payload) => {
    if ((window as unknown as { __e2e_seeded?: boolean }).__e2e_seeded) return;
    (window as unknown as { __e2e_seeded?: boolean }).__e2e_seeded = true;

    localStorage.clear();
    if (payload.courses) localStorage.setItem('courses_v1', JSON.stringify(payload.courses));
    if (payload.records) localStorage.setItem('attendance_v3', JSON.stringify(payload.records));
    if (payload.selectedCourseId !== undefined) {
      localStorage.setItem('selected_course_id', payload.selectedCourseId);
    }
    if (payload.lang) localStorage.setItem('app_lang_v1', payload.lang);
    if (payload.theme) localStorage.setItem('theme', payload.theme);
    if (payload.appMode) localStorage.setItem('app_mode_v1', payload.appMode);
    if (payload.onlineIntent) localStorage.setItem('online_mode_intent_v1', 'true');
  }, data);
}

export function makeCourse(overrides: Partial<Course> = {}): Course {
  return {
    id: 'course-e2e-1',
    name: 'Programación de sistemas',
    startDate: '2026-06-01',
    endDate: '2026-06-30',
    startTime: '09:00',
    hoursPerDay: 5,
    maxAbsences: 3,
    maxTardiness: 7,
    minAttendancePercent: 75,
    ...overrides,
  };
}
