import { Injectable } from '@angular/core';
import {
  AttendanceStatus,
  Course,
  DayEntry,
  DayRecord,
  MonthStats,
} from '../models/attendance.model';

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  // Records keyed by courseId → date → DayRecord
  private records: Record<string, Record<string, DayRecord>> = {};
  private courses: Course[] = [];
  private _selectedCourseId: string | null = null;

  constructor() {
    this.load();
  }

  // ── Persistence ─────────────────────────────────────────────────────────────

  private load(): void {
    try {
      const rawCourses = localStorage.getItem('courses_v1');
      this.courses = rawCourses ? JSON.parse(rawCourses) : [];

      // v3: DayRecord objects.  Migrate from v2 (plain status strings) if needed.
      const rawV3 = localStorage.getItem('attendance_v3');
      if (rawV3) {
        this.records = JSON.parse(rawV3);
      } else {
        const rawV2 = localStorage.getItem('attendance_v2');
        if (rawV2) {
          const v2: Record<string, Record<string, unknown>> = JSON.parse(rawV2);
          for (const cid of Object.keys(v2)) {
            this.records[cid] = {};
            for (const date of Object.keys(v2[cid])) {
              const val = v2[cid][date];
              this.records[cid][date] =
                typeof val === 'string'
                  ? { status: val as AttendanceStatus }
                  : (val as DayRecord);
            }
          }
          this.saveRecords();
        }
      }

      const saved = localStorage.getItem('selected_course_id');
      this._selectedCourseId =
        saved && this.courses.find((c) => c.id === saved)
          ? saved
          : (this.courses[0]?.id ?? null);
    } catch {
      this.courses = [];
      this.records = {};
      this._selectedCourseId = null;
    }
  }

  private saveCourses(): void {
    localStorage.setItem('courses_v1', JSON.stringify(this.courses));
  }

  private saveRecords(): void {
    localStorage.setItem('attendance_v3', JSON.stringify(this.records));
  }

  // ── Courses ──────────────────────────────────────────────────────────────────

  getCourses(): Course[] {
    return [...this.courses];
  }

  getCourse(id: string): Course | null {
    return this.courses.find((c) => c.id === id) ?? null;
  }

  saveCourse(course: Course): void {
    const idx = this.courses.findIndex((c) => c.id === course.id);
    if (idx >= 0) {
      this.courses[idx] = course;
    } else {
      this.courses.push(course);
      if (!this._selectedCourseId) this.selectedCourseId = course.id;
    }
    this.saveCourses();
  }

  deleteCourse(id: string): void {
    this.courses = this.courses.filter((c) => c.id !== id);
    delete this.records[id];
    if (this._selectedCourseId === id)
      this.selectedCourseId = this.courses[0]?.id ?? null;
    this.saveCourses();
    this.saveRecords();
  }

  generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  get selectedCourseId(): string | null {
    return this._selectedCourseId;
  }

  set selectedCourseId(id: string | null) {
    this._selectedCourseId = id;
    localStorage.setItem('selected_course_id', id ?? '');
  }

  getSelectedCourse(): Course | null {
    return this._selectedCourseId
      ? this.getCourse(this._selectedCourseId)
      : null;
  }

  // ── Records ──────────────────────────────────────────────────────────────────

  setDayRecord(date: string, record: DayRecord, courseId?: string): void {
    const cid = courseId ?? this._selectedCourseId ?? '__default__';
    if (!this.records[cid]) this.records[cid] = {};
    if (record.status === 'unlogged') {
      delete this.records[cid][date];
    } else {
      this.records[cid][date] = record;
    }
    this.saveRecords();
  }

  getDayRecord(date: string, courseId?: string): DayRecord {
    const cid = courseId ?? this._selectedCourseId ?? '__default__';
    return this.records[cid]?.[date] ?? { status: 'unlogged' };
  }

  // ── Date helpers ─────────────────────────────────────────────────────────────

  private localDateStr(d: Date): string {
    return (
      `${d.getFullYear()}-` +
      `${String(d.getMonth() + 1).padStart(2, '0')}-` +
      `${String(d.getDate()).padStart(2, '0')}`
    );
  }

  private toMinutes(t: string): number {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  }

  private hoursFromRecord(record: DayRecord, hoursPerDay: number): number {
    if (record.status === 'absent') return 0;
    if (record.status !== 'late' || !record.entryTime || !record.exitTime)
      return hoursPerDay;
    return Math.max(
      0,
      (this.toMinutes(record.exitTime) - this.toMinutes(record.entryTime)) / 60
    );
  }

  private lostMinsFromRecord(record: DayRecord, courseStartTime?: string): number {
    if (record.status !== 'late' || !record.entryTime || !courseStartTime) return 0;
    return Math.max(0, this.toMinutes(record.entryTime) - this.toMinutes(courseStartTime));
  }

  getCurrentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  getTodayString(): string {
    return this.localDateStr(new Date());
  }

  calcDefaultExitTime(course: Course | null): string {
    if (!course?.startTime) return '14:00';
    const totalMins = this.toMinutes(course.startTime) + course.hoursPerDay * 60;
    return (
      `${String(Math.floor(totalMins / 60)).padStart(2, '0')}:` +
      `${String(totalMins % 60).padStart(2, '0')}`
    );
  }

  getWorkingDaysInMonth(month: string, startDate?: string, endDate?: string): string[] {
    const [year, m] = month.split('-').map(Number);
    const days: string[] = [];
    const cursor = new Date(year, m - 1, 1);
    while (cursor.getMonth() === m - 1) {
      const dow = cursor.getDay();
      if (dow !== 0 && dow !== 6) {
        const ds = this.localDateStr(cursor);
        if ((!startDate || ds >= startDate) && (!endDate || ds <= endDate))
          days.push(ds);
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    return days;
  }

  getDayEntriesForMonth(month: string, courseId?: string): DayEntry[] {
    const cid = courseId ?? this._selectedCourseId ?? null;
    const course = cid ? this.getCourse(cid) : null;
    const today = this.getTodayString();
    const workingDays = this.getWorkingDaysInMonth(
      month,
      course?.startDate,
      course?.endDate
    );
    return workingDays.map((date) => {
      const d = new Date(date + 'T12:00:00');
      const record = this.getDayRecord(date, cid ?? undefined);
      return {
        date,
        dateLabel: d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }),
        dayLabel: d.toLocaleDateString('es-MX', { weekday: 'long' }),
        status: record.status,
        entryTime: record.entryTime,
        exitTime: record.exitTime,
        hoursAttended: this.hoursFromRecord(record, course?.hoursPerDay ?? 5),
        lostMinutes: this.lostMinsFromRecord(record, course?.startTime),
        isToday: date === today,
        isFuture: date > today,
      };
    });
  }

  getMonthStats(month: string, courseId?: string): MonthStats {
    const cid = courseId ?? this._selectedCourseId ?? null;
    const course = cid ? this.getCourse(cid) : null;

    const maxAbsences = course?.maxAbsences ?? 3;
    const maxTardiness = course?.maxTardiness ?? 7;
    const minAttendancePercent = course?.minAttendancePercent ?? 75;
    const hoursPerDay = course?.hoursPerDay ?? 5;

    const today = this.getTodayString();
    const workingDays = this.getWorkingDaysInMonth(
      month,
      course?.startDate,
      course?.endDate
    );
    const totalWorkingDays = workingDays.length;
    const elapsedWorkingDays = workingDays.filter((d) => d <= today).length;

    let presentDays = 0, absentDays = 0, lateDays = 0, unloggedDays = 0;
    let totalHoursAttended = 0, totalLostMinutes = 0;

    for (const day of workingDays) {
      if (day > today) continue;
      const record = this.getDayRecord(day, cid ?? undefined);
      switch (record.status) {
        case 'present':
          presentDays++;
          totalHoursAttended += hoursPerDay;
          break;
        case 'absent':
          absentDays++;
          break;
        case 'late':
          lateDays++;
          totalHoursAttended += this.hoursFromRecord(record, hoursPerDay);
          totalLostMinutes += this.lostMinsFromRecord(record, course?.startTime);
          break;
        default:
          unloggedDays++;
          // Unlogged days are not counted as attended
      }
    }

    const expectedHoursToDate = elapsedWorkingDays * hoursPerDay;
    // Future months (no elapsed days) show 0%, not 100%
    const attendancePercent =
      expectedHoursToDate > 0
        ? Math.min(100, Math.round((totalHoursAttended / expectedHoursToDate) * 100))
        : 0;

    const absencesRemaining = Math.max(0, maxAbsences - absentDays);
    const latenessRemaining = Math.max(0, maxTardiness - lateDays);

    // Only flag failed/warning when there are actual elapsed days to evaluate
    const failed =
      elapsedWorkingDays > 0 &&
      (absentDays > maxAbsences ||
        lateDays > maxTardiness ||
        attendancePercent < minAttendancePercent);

    const warning =
      elapsedWorkingDays > 0 &&
      !failed &&
      (absencesRemaining <= 1 ||
        latenessRemaining <= 2 ||
        attendancePercent < minAttendancePercent + 5);

    const monthLabel = new Date(month + '-15').toLocaleDateString('es-MX', {
      month: 'long',
      year: 'numeric',
    });

    return {
      month,
      monthLabel: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1),
      totalWorkingDays,
      elapsedWorkingDays,
      presentDays,
      absentDays,
      lateDays,
      unloggedDays,
      attendancePercent,
      totalHoursAttended: Math.round(totalHoursAttended * 10) / 10,
      expectedHoursToDate,
      totalLostMinutes,
      absencesRemaining,
      latenessRemaining,
      maxAbsences,
      maxTardiness,
      minAttendancePercent,
      hoursPerDay,
      overallStatus: failed ? 'failed' : warning ? 'warning' : 'ok',
    };
  }

  getMonthsForCourse(courseId?: string): string[] {
    const cid = courseId ?? this._selectedCourseId ?? null;
    const course = cid ? this.getCourse(cid) : null;
    if (!course) return [this.getCurrentMonth()];

    const [sy, sm] = course.startDate.substring(0, 7).split('-').map(Number);
    const [ey, em] = course.endDate.substring(0, 7).split('-').map(Number);
    const months: string[] = [];
    let y = sy, mo = sm;
    while (y < ey || (y === ey && mo <= em)) {
      months.push(`${y}-${String(mo).padStart(2, '0')}`);
      mo++;
      if (mo > 12) { mo = 1; y++; }
    }
    return months.reverse();
  }
}
