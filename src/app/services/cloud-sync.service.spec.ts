import { TestBed } from '@angular/core/testing';
import { CloudSyncService } from './cloud-sync.service';
import { AttendanceService } from './attendance.service';
import { AppModeService } from './app-mode.service';
import { NeonService } from './neon.service';
import { LanguageService } from './language.service';
import { clearBrowserStorage, createMockCourse } from '../../testing/fixtures';
import {
  createMockLanguageService,
  createMockNeonClient,
  createMockNeonService,
} from '../../testing/mocks';

describe('CloudSyncService', () => {
  let sync: CloudSyncService;
  let attendance: AttendanceService;
  let appMode: AppModeService;
  let neon: jasmine.SpyObj<NeonService>;

  beforeEach(() => {
    clearBrowserStorage();
    jasmine.clock().install();

    neon = createMockNeonService(
      { user: { id: 'user-1' } },
      createMockNeonClient({
        courses: () => Promise.resolve({ data: [], error: null }),
        attendance_records: () => Promise.resolve({ data: [], error: null }),
        user_preferences: () =>
          Promise.resolve({ data: { selected_course_id: null }, error: null }),
      }),
    );

    TestBed.configureTestingModule({
      providers: [
        CloudSyncService,
        AttendanceService,
        AppModeService,
        { provide: NeonService, useValue: neon },
        { provide: LanguageService, useValue: createMockLanguageService() },
      ],
    });

    sync = TestBed.inject(CloudSyncService);
    attendance = TestBed.inject(AttendanceService);
    appMode = TestBed.inject(AppModeService);
  });

  afterEach(() => {
    jasmine.clock().uninstall();
    attendance.clearAllData();
    clearBrowserStorage();
  });

  it('should upload local courses and records', async () => {
    const course = createMockCourse({ id: 'up-1' });
    attendance.saveCourse(course);
    attendance.setDayRecord('2026-05-05', { status: 'present' }, course.id);

    const result = await sync.uploadLocalData();

    expect(result.courses).toBe(1);
    expect(result.records).toBe(1);
    expect(neon.client.from).toHaveBeenCalledWith('courses');
    expect(neon.client.from).toHaveBeenCalledWith('attendance_records');
  });

  it('should upload cancelled attendance records', async () => {
    const course = createMockCourse({ id: 'up-2' });
    attendance.saveCourse(course);
    attendance.setDayRecord('2026-05-06', { status: 'cancelled' }, course.id);
    attendance.setDayRecord('2026-05-07', { status: 'unlogged' }, course.id);

    const result = await sync.uploadLocalData();

    expect(result.records).toBe(1);
  });

  it('should download cloud data into attendance storage', async () => {
    const downloadNeon = createMockNeonService(
      { user: { id: 'user-1' } },
      createMockNeonClient({
        courses: () =>
          Promise.resolve({
            data: [
              {
                id: 'cloud-1',
                name: 'Cloud course',
                start_date: '2026-05-01',
                end_date: '2026-05-31',
                start_time: '09:00',
                hours_per_day: 5,
                max_absences: 3,
                max_tardiness: 7,
                min_attendance_percent: 75,
              },
            ],
            error: null,
          }),
        attendance_records: () =>
          Promise.resolve({
            data: [
              {
                course_id: 'cloud-1',
                record_date: '2026-05-05',
                status: 'present',
                entry_time: null,
                exit_time: null,
              },
            ],
            error: null,
          }),
        user_preferences: () =>
          Promise.resolve({ data: { selected_course_id: 'cloud-1' }, error: null }),
      }),
    );
    const downloadSync = new CloudSyncService(
      attendance,
      appMode,
      downloadNeon as unknown as NeonService,
    );

    await downloadSync.downloadFromCloud();

    expect(attendance.getCourse('cloud-1')?.name).toBe('Cloud course');
    expect(attendance.getDayRecord('2026-05-05', 'cloud-1').status).toBe('present');
    expect(attendance.selectedCourseId).toBe('cloud-1');
  });

  it('should not push to cloud while offline', () => {
    appMode.disableOnlineMode();
    const fromCallsBefore = neon.client.from.calls.count();

    attendance.saveCourse(createMockCourse());
    jasmine.clock().tick(500);

    expect(neon.client.from.calls.count()).toBe(fromCallsBefore);
  });

  it('should map module mode courses from cloud', async () => {
    const downloadNeon = createMockNeonService(
      { user: { id: 'user-1' } },
      createMockNeonClient({
        courses: () =>
          Promise.resolve({
            data: [
              {
                id: 'cloud-mod',
                name: 'Modular course',
                start_date: '2026-05-01',
                end_date: '2026-05-31',
                start_time: '09:00',
                hours_per_day: 5,
                max_absences: 3,
                max_tardiness: 7,
                min_attendance_percent: 75,
                period_mode: 'module',
                modules: [
                  { id: 'm1', name: 'Part 1', startDate: '2026-05-01', endDate: '2026-05-15' },
                ],
              },
            ],
            error: null,
          }),
        attendance_records: () => Promise.resolve({ data: [], error: null }),
        user_preferences: () =>
          Promise.resolve({ data: { selected_course_id: 'cloud-mod' }, error: null }),
      }),
    );
    const downloadSync = new CloudSyncService(
      attendance,
      appMode,
      downloadNeon as unknown as NeonService,
    );

    await downloadSync.downloadFromCloud();

    const course = attendance.getCourse('cloud-mod');
    expect(course?.periodMode).toBe('module');
    expect(course?.modules?.length).toBe(1);
    expect(course?.modules?.[0].name).toBe('Part 1');
  });
});
