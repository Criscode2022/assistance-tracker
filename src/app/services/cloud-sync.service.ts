import { Injectable } from '@angular/core';
import { AttendanceService } from './attendance.service';
import { AppModeService } from './app-mode.service';
import { NeonService } from './neon.service';
import { Course, CourseModule, DayRecord, PeriodMode } from '../models/attendance.model';

interface DbCourse {
  id: string;
  user_id: string;
  name: string;
  start_date: string;
  end_date: string;
  start_time: string;
  hours_per_day: number;
  max_absences: number;
  max_tardiness: number;
  min_attendance_percent: number;
  period_mode?: string;
  modules?: CourseModule[] | string;
}

interface DbRecord {
  user_id: string;
  course_id: string;
  record_date: string;
  status: string;
  entry_time: string | null;
  exit_time: string | null;
}

interface DbPreferences {
  selected_course_id: string | null;
}

@Injectable({ providedIn: 'root' })
export class CloudSyncService {
  private syncTimer: ReturnType<typeof setTimeout> | null = null;
  private syncing = false;

  constructor(
    private attendance: AttendanceService,
    private appMode: AppModeService,
    private neon: NeonService,
  ) {
    this.attendance.setSyncCallback(() => this.schedulePush());
  }

  /** Upload all local courses and records — used only on account creation. */
  async uploadLocalData(userId?: string): Promise<{ courses: number; records: number }> {
    const resolvedUserId = await this.requireUserId(userId);
    const courses = this.attendance.getCourses();
    let recordCount = 0;

    if (courses.length) {
      const dbCourses = courses.map((c) => this.toDbCourse(c, resolvedUserId));
      const { error: courseErr } = await this.neon.client.from('courses').insert(dbCourses);
      if (courseErr) throw new Error(courseErr.message);
    }

    for (const course of courses) {
      const records = this.attendance.getRecordsForCourse(course.id);
      const rows = Object.entries(records)
        .filter(([, r]) => r.status !== 'unlogged')
        .map(([date, record]) => {
          recordCount++;
          return this.toDbRecord(course.id, date, record, resolvedUserId);
        });

      if (rows.length) {
        const { error } = await this.neon.client.from('attendance_records').insert(rows);
        if (error) throw new Error(error.message);
      }
    }

    const selectedId = this.attendance.selectedCourseId;
    if (selectedId) {
      const { error } = await this.neon.client.from('user_preferences').insert({
        user_id: resolvedUserId,
        selected_course_id: selectedId,
      });
      if (error) throw new Error(error.message);
    }

    return { courses: courses.length, records: recordCount };
  }

  /** Fetch cloud data and replace local store — used on login. */
  async downloadFromCloud(): Promise<void> {
    const session = await this.neon.getSession();
    if (!session) throw new Error('No active session');

    const { data: courses, error: courseErr } = await this.neon.client
      .from('courses')
      .select('*')
      .order('created_at', { ascending: true });

    if (courseErr) throw new Error(courseErr.message);

    const { data: records, error: recErr } = await this.neon.client
      .from('attendance_records')
      .select('*');

    if (recErr) throw new Error(recErr.message);

    const { data: prefs } = await this.neon.client
      .from('user_preferences')
      .select('selected_course_id')
      .maybeSingle();

    const mappedCourses = (courses ?? []).map((c: DbCourse) => this.fromDbCourse(c));
    const mappedRecords: Record<string, Record<string, DayRecord>> = {};

    for (const row of records ?? []) {
      const r = row as DbRecord;
      if (!mappedRecords[r.course_id]) mappedRecords[r.course_id] = {};
      mappedRecords[r.course_id][r.record_date] = this.fromDbRecord(r);
    }

    this.attendance.replaceAllData(
      mappedCourses,
      mappedRecords,
      (prefs as DbPreferences | null)?.selected_course_id ?? null,
      true,
    );
  }

  private schedulePush(): void {
    if (!this.appMode.isOnline()) return;
    if (this.syncTimer) clearTimeout(this.syncTimer);
    this.syncTimer = setTimeout(() => void this.pushChanges(), 400);
  }

  private async pushChanges(): Promise<void> {
    if (!this.appMode.isOnline() || this.syncing) return;
    const user = await this.neon.getUser();
    if (!user) return;

    this.syncing = true;
    try {
      const courses = this.attendance.getCourses();
      const localIds = courses.map((c) => c.id);

      const { data: cloudCourses } = await this.neon.client.from('courses').select('id');
      for (const row of cloudCourses ?? []) {
        const id = (row as { id: string }).id;
        if (!localIds.includes(id)) {
          await this.neon.client.from('courses').delete().eq('id', id);
        }
      }

      const userId = user.id;

      if (courses.length) {
        await this.neon.client
          .from('courses')
          .upsert(courses.map((c) => this.toDbCourse(c, userId)));
      }

      for (const course of courses) {
        const records = this.attendance.getRecordsForCourse(course.id);
        const activeDates = new Set(
          Object.entries(records)
            .filter(([, r]) => r.status !== 'unlogged')
            .map(([date]) => date),
        );

        const { data: cloudRecords } = await this.neon.client
          .from('attendance_records')
          .select('record_date')
          .eq('course_id', course.id);

        for (const row of cloudRecords ?? []) {
          const date = (row as { record_date: string }).record_date;
          if (!activeDates.has(date)) {
            await this.neon.client
              .from('attendance_records')
              .delete()
              .eq('course_id', course.id)
              .eq('record_date', date);
          }
        }

        const rows = Object.entries(records)
          .filter(([, r]) => r.status !== 'unlogged')
          .map(([date, record]) => this.toDbRecord(course.id, date, record, userId));

        if (rows.length) {
          await this.neon.client.from('attendance_records').upsert(rows);
        }
      }

      const selectedId = this.attendance.selectedCourseId;
      if (selectedId) {
        await this.neon.client.from('user_preferences').upsert({
          user_id: userId,
          selected_course_id: selectedId,
        });
      }
    } catch {
      // Silent fail — local data remains authoritative
    } finally {
      this.syncing = false;
    }
  }

  private async requireUserId(explicitUserId?: string): Promise<string> {
    if (explicitUserId) return explicitUserId;

    const user = await this.neon.getUser();
    if (!user?.id) throw new Error('Not authenticated');
    return user.id;
  }

  private toDbCourse(c: Course, userId: string): DbCourse {
    const periodMode: PeriodMode = c.periodMode ?? 'month';
    return {
      id: c.id,
      user_id: userId,
      name: c.name,
      start_date: c.startDate,
      end_date: c.endDate,
      start_time: c.startTime,
      hours_per_day: c.hoursPerDay,
      max_absences: c.maxAbsences,
      max_tardiness: c.maxTardiness,
      min_attendance_percent: c.minAttendancePercent,
      period_mode: periodMode,
      modules: periodMode === 'module' ? (c.modules ?? []) : [],
    };
  }

  private fromDbCourse(c: DbCourse): Course {
    const periodMode: PeriodMode = c.period_mode === 'module' ? 'module' : 'month';
    const modules = this.parseModules(c.modules);
    return {
      id: c.id,
      name: c.name,
      startDate: c.start_date,
      endDate: c.end_date,
      startTime: c.start_time,
      hoursPerDay: Number(c.hours_per_day),
      maxAbsences: c.max_absences,
      maxTardiness: c.max_tardiness,
      minAttendancePercent: Number(c.min_attendance_percent),
      periodMode,
      modules: periodMode === 'module' ? modules : [],
    };
  }

  private parseModules(raw: CourseModule[] | string | undefined): CourseModule[] {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw) as CourseModule[];
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  }

  private toDbRecord(courseId: string, date: string, record: DayRecord, userId: string): DbRecord {
    return {
      user_id: userId,
      course_id: courseId,
      record_date: date,
      status: record.status,
      entry_time: record.entryTime ?? null,
      exit_time: record.exitTime ?? null,
    };
  }

  private fromDbRecord(r: DbRecord): DayRecord {
    const rec: DayRecord = { status: r.status as DayRecord['status'] };
    if (r.entry_time) rec.entryTime = r.entry_time;
    if (r.exit_time) rec.exitTime = r.exit_time;
    return rec;
  }
}
