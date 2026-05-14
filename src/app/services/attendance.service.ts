import { Injectable } from '@angular/core';
import { AttendanceStatus, Course, DayEntry, MonthStats } from '../models/attendance.model';

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  private courses: Course[] = [];
  private records: Record<string, Record<string, AttendanceStatus>> = {};
  private _selectedCourseId: string | null = null;

  constructor() {
    this.load();
  }

  // ── Persistence ────────────────────────────────────────────────────────────

  private load(): void {
    try {
      const rawCourses = localStorage.getItem('courses_v1');
      this.courses = rawCourses ? JSON.parse(rawCourses) : [];

      const rawRecords = localStorage.getItem('attendance_v2');
      this.records = rawRecords ? JSON.parse(rawRecords) : {};

      // Migrate records from v1 (before multi-course support)
      const oldRaw = localStorage.getItem('attendance_records_v1');
      if (oldRaw && !rawRecords) {
        this.records['__legacy__'] = JSON.parse(oldRaw);
        this.saveRecords();
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
    localStorage.setItem('attendance_v2', JSON.stringify(this.records));
  }

  // ── Courses ─────────────────────────────────────────────────────────────────

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
      if (!this._selectedCourseId) {
        this.selectedCourseId = course.id;
      }
    }
    this.saveCourses();
  }

  deleteCourse(id: string): void {
    this.courses = this.courses.filter((c) => c.id !== id);
    delete this.records[id];
    if (this._selectedCourseId === id) {
      this.selectedCourseId = this.courses[0]?.id ?? null;
    }
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
    return this._selectedCourseId ? this.getCourse(this._selectedCourseId) : null;
  }

  // ── Records ──────────────────────────────────────────────────────────────────

  setRecord(date: string, status: AttendanceStatus, courseId?: string): void {
    const cid = courseId ?? this._selectedCourseId ?? '__default__';
    if (!this.records[cid]) this.records[cid] = {};
    if (status === 'unlogged') {
      delete this.records[cid][date];
    } else {
      this.records[cid][date] = status;
    }
    this.saveRecords();
  }

  getRecord(date: string, courseId?: string): AttendanceStatus {
    const cid = courseId ?? this._selectedCourseId ?? '__default__';
    return this.records[cid]?.[date] ?? 'unlogged';
  }

  // ── Date helpers ─────────────────────────────────────────────────────────────

  // Uses local calendar date, avoiding UTC-offset drift from toISOString()
  private localDateStr(d: Date): string {
    return (
      `${d.getFullYear()}-` +
      `${String(d.getMonth() + 1).padStart(2, '0')}-` +
      `${String(d.getDate()).padStart(2, '0')}`
    );
  }

  getCurrentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  getTodayString(): string {
    return this.localDateStr(new Date());
  }

  // Returns Mon–Fri days in the month, clipped to optional [startDate, endDate]
  getWorkingDaysInMonth(month: string, startDate?: string, endDate?: string): string[] {
    const [year, m] = month.split('-').map(Number);
    const days: string[] = [];
    const cursor = new Date(year, m - 1, 1);
    while (cursor.getMonth() === m - 1) {
      const dow = cursor.getDay();
      if (dow !== 0 && dow !== 6) {
        const ds = this.localDateStr(cursor);
        if ((!startDate || ds >= startDate) && (!endDate || ds <= endDate)) {
          days.push(ds);
        }
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
      return {
        date,
        dateLabel: d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }),
        dayLabel: d.toLocaleDateString('es-MX', { weekday: 'long' }),
        status: this.getRecord(date, cid ?? undefined),
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

    let presentDays = 0;
    let absentDays = 0;
    let lateDays = 0;
    let unloggedDays = 0;

    for (const day of workingDays) {
      if (day > today) continue;
      const status = this.getRecord(day, cid ?? undefined);
      if (status === 'present') presentDays++;
      else if (status === 'absent') absentDays++;
      else if (status === 'late') lateDays++;
      else unloggedDays++;
    }

    // Unlogged past days treated as present (benefit of doubt)
    const attendedDays = presentDays + lateDays + unloggedDays;
    const attendancePercent =
      totalWorkingDays > 0
        ? Math.round((attendedDays / totalWorkingDays) * 100)
        : 100;

    const absencesRemaining = Math.max(0, maxAbsences - absentDays);
    const latenessRemaining = Math.max(0, maxTardiness - lateDays);

    const failed =
      absentDays > maxAbsences ||
      lateDays > maxTardiness ||
      attendancePercent < minAttendancePercent;

    const warning =
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
      presentDays,
      absentDays,
      lateDays,
      unloggedDays,
      attendancePercent,
      absencesRemaining,
      latenessRemaining,
      maxAbsences,
      maxTardiness,
      minAttendancePercent,
      hoursPerDay,
      overallStatus: failed ? 'failed' : warning ? 'warning' : 'ok',
    };
  }

  // All months between course start and end, most recent first
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
