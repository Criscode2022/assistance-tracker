import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import {
  AttendanceStatus,
  Course,
  CourseModule,
  CoursePeriod,
  DayEntry,
  DayRecord,
  MonthStats,
  PeriodMode,
} from '../models/attendance.model';
import { LanguageService } from './language.service';

const SELECTED_PERIOD_KEY = 'selected_period_v1';

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  // Records keyed by courseId → date → DayRecord
  private records: Record<string, Record<string, DayRecord>> = {};
  private courses: Course[] = [];
  private _selectedCourseId: string | null = null;
  private syncCallback: (() => void) | null = null;
  private suppressSync = false;
  private readonly dataChangedSubject = new Subject<void>();
  readonly dataChanged$ = this.dataChangedSubject.asObservable();

  constructor(private readonly lang: LanguageService) {
    this.load();
  }

  setSyncCallback(cb: () => void): void {
    this.syncCallback = cb;
  }

  private notifyChange(): void {
    this.dataChangedSubject.next();
    if (!this.suppressSync) this.syncCallback?.();
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
    this.notifyChange();
  }

  private saveRecords(): void {
    localStorage.setItem('attendance_v3', JSON.stringify(this.records));
    this.notifyChange();
  }

  // ── Courses ──────────────────────────────────────────────────────────────────

  getCourses(): Course[] {
    return [...this.courses];
  }

  getCourse(id: string): Course | null {
    return this.courses.find((c) => c.id === id) ?? null;
  }

  saveCourse(course: Course): void {
    const normalized = this.normalizeCourse(course);
    const idx = this.courses.findIndex((c) => c.id === normalized.id);
    if (idx >= 0) {
      this.courses[idx] = normalized;
    } else {
      this.courses.push(normalized);
      if (!this._selectedCourseId) this.selectedCourseId = normalized.id;
    }
    this.saveCourses();
  }

  deleteCourse(id: string): void {
    this.courses = this.courses.filter((c) => c.id !== id);
    delete this.records[id];
    this.clearSelectedPeriodKey(id);
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
    this.notifyChange();
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

  getRecordsForCourse(courseId: string): Record<string, DayRecord> {
    return { ...(this.records[courseId] ?? {}) };
  }

  importCourseData(course: Course, records: Record<string, DayRecord>): void {
    const existing = this.courses.find((c) => c.id === course.id);
    if (!existing) {
      this.courses.push(course);
      if (!this._selectedCourseId) this.selectedCourseId = course.id;
    } else {
      this.courses[this.courses.indexOf(existing)] = course;
    }
    this.records[course.id] = records;
    this.saveCourses();
    this.saveRecords();
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
    if (record.status === 'absent' || record.status === 'cancelled') return 0;
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
    return this.getWorkingDaysInRange(startDate, endDate, month);
  }

  getWorkingDaysInRange(
    startDate?: string,
    endDate?: string,
    month?: string,
  ): string[] {
    const [year, m] = (month ?? startDate?.substring(0, 7) ?? this.getCurrentMonth())
      .split('-')
      .map(Number);
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

  normalizeCourse(course: Course): Course {
    const periodMode: PeriodMode = course.periodMode ?? 'month';
    return {
      ...course,
      periodMode,
      modules: periodMode === 'module' ? (course.modules ?? []) : [],
    };
  }

  getPeriodMode(courseId?: string): PeriodMode {
    const course = this.resolveCourse(courseId);
    return course?.periodMode ?? 'month';
  }

  getPeriodsForCourse(courseId?: string): CoursePeriod[] {
    const course = this.resolveCourse(courseId);
    if (!course) {
      const cur = this.getCurrentMonth();
      return [{
        key: cur,
        label: this.lang.formatMonthYear(cur),
        startDate: `${cur}-01`,
        endDate: `${cur}-31`,
      }];
    }

    if (course.periodMode === 'module' && course.modules?.length) {
      return [...course.modules]
        .sort((a, b) => a.startDate.localeCompare(b.startDate))
        .map((mod) => ({
          key: mod.id,
          label: mod.name,
          startDate: mod.startDate,
          endDate: mod.endDate,
        }))
        .reverse();
    }

    return this.getCalendarMonthsForCourse(course).map((month) => ({
      key: month,
      label: this.lang.formatMonthYear(month),
      startDate: `${month}-01`,
      endDate: this.lastDayOfMonth(month),
    }));
  }

  getCurrentPeriodKey(courseId?: string): string {
    const periods = this.getPeriodsForCourse(courseId);
    const today = this.getTodayString();
    const current = periods.find(
      (p) => today >= p.startDate && today <= p.endDate,
    );
    return current?.key ?? periods[0]?.key ?? this.getCurrentMonth();
  }

  /**
   * Period the user last picked for this course in the current browser session.
   * Falls back to the current calendar period when nothing valid is stored.
   */
  getSelectedPeriodKey(courseId?: string): string {
    const cid = courseId ?? this._selectedCourseId ?? undefined;
    const periods = this.getPeriodsForCourse(cid);
    const stored = cid ? this.readPeriodMap()[cid] : undefined;
    if (stored && periods.some((p) => p.key === stored)) {
      return stored;
    }
    const current = this.getCurrentPeriodKey(cid);
    return periods.some((p) => p.key === current)
      ? current
      : (periods[0]?.key ?? current);
  }

  setSelectedPeriodKey(periodKey: string, courseId?: string): void {
    const cid = courseId ?? this._selectedCourseId;
    if (!cid || !periodKey) return;
    const map = this.readPeriodMap();
    map[cid] = periodKey;
    this.writePeriodMap(map);
  }

  private clearSelectedPeriodKey(courseId?: string): void {
    if (!courseId) {
      sessionStorage.removeItem(SELECTED_PERIOD_KEY);
      return;
    }
    const map = this.readPeriodMap();
    if (!(courseId in map)) return;
    delete map[courseId];
    this.writePeriodMap(map);
  }

  private readPeriodMap(): Record<string, string> {
    try {
      const raw = sessionStorage.getItem(SELECTED_PERIOD_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw) as unknown;
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        return {};
      }
      return parsed as Record<string, string>;
    } catch {
      return {};
    }
  }

  private writePeriodMap(map: Record<string, string>): void {
    sessionStorage.setItem(SELECTED_PERIOD_KEY, JSON.stringify(map));
  }

  getPeriodLabel(periodKey: string, courseId?: string): string {
    const period = this.getPeriodsForCourse(courseId).find((p) => p.key === periodKey);
    if (period) return period.label;
    return periodKey.includes('-') ? this.lang.formatMonthYear(periodKey) : periodKey;
  }

  private resolveCourse(courseId?: string): Course | null {
    const cid = courseId ?? this._selectedCourseId ?? null;
    const course = cid ? this.getCourse(cid) : null;
    return course ? this.normalizeCourse(course) : null;
  }

  private getCalendarMonthsForCourse(course: Course): string[] {
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

  private lastDayOfMonth(month: string): string {
    const [year, m] = month.split('-').map(Number);
    const last = new Date(year, m, 0).getDate();
    return `${month}-${String(last).padStart(2, '0')}`;
  }

  private resolvePeriodBounds(
    periodKey: string,
    course: Course | null,
  ): { startDate?: string; endDate?: string; month?: string } {
    if (!course) return { month: periodKey };

    if (course.periodMode === 'module') {
      const mod = course.modules?.find((m) => m.id === periodKey);
      if (mod) {
        return { startDate: mod.startDate, endDate: mod.endDate };
      }
    }

    const month = periodKey.includes('-') ? periodKey : this.getCurrentMonth();
    return {
      month,
      startDate: course.startDate,
      endDate: course.endDate,
    };
  }

  getDayEntriesForMonth(month: string, courseId?: string): DayEntry[] {
    return this.getDayEntriesForPeriod(month, courseId);
  }

  getDayEntriesForPeriod(periodKey: string, courseId?: string): DayEntry[] {
    const cid = courseId ?? this._selectedCourseId ?? null;
    const course = this.resolveCourse(cid ?? undefined);
    const today = this.getTodayString();
    const bounds = this.resolvePeriodBounds(periodKey, course);
    const workingDays = bounds.month
      ? this.getWorkingDaysInMonth(bounds.month, bounds.startDate, bounds.endDate)
      : this.getWorkingDaysInRange(bounds.startDate, bounds.endDate);
    return workingDays.map((date) => {
      const d = new Date(date + 'T12:00:00');
      const locale = this.lang.localeId;
      const record = this.getDayRecord(date, cid ?? undefined);
      return {
        date,
        dateLabel: d.toLocaleDateString(locale, { day: 'numeric', month: 'short' }),
        dayLabel: d.toLocaleDateString(locale, { weekday: 'long' }),
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
    return this.getPeriodStats(month, courseId);
  }

  getPeriodStats(periodKey: string, courseId?: string): MonthStats {
    const cid = courseId ?? this._selectedCourseId ?? null;
    const course = this.resolveCourse(cid ?? undefined);

    const maxAbsences = course?.maxAbsences ?? 3;
    const maxTardiness = course?.maxTardiness ?? 7;
    const minAttendancePercent = course?.minAttendancePercent ?? 75;
    const hoursPerDay = course?.hoursPerDay ?? 5;

    const today = this.getTodayString();
    const bounds = this.resolvePeriodBounds(periodKey, course);
    const workingDays = bounds.month
      ? this.getWorkingDaysInMonth(bounds.month, bounds.startDate, bounds.endDate)
      : this.getWorkingDaysInRange(bounds.startDate, bounds.endDate);
    const totalWorkingDays = workingDays.length;
    const elapsedWorkingDays = workingDays.filter((d) => d <= today).length;

    let presentDays = 0, absentDays = 0, lateDays = 0, unloggedDays = 0, cancelledDays = 0;
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
        case 'cancelled':
          // Cancelled days are excluded from the working-day denominator
          cancelledDays++;
          break;
        default:
          unloggedDays++;
      }
    }

    // Cancelled days don't count toward expected hours — remove them from the denominator
    const effectiveElapsedDays = elapsedWorkingDays - cancelledDays;
    const expectedHoursToDate = effectiveElapsedDays * hoursPerDay;
    // Future months (no elapsed days) show 0%, not 100%
    const attendancePercent =
      expectedHoursToDate > 0
        ? Math.min(100, Math.round((totalHoursAttended / expectedHoursToDate) * 100))
        : 0;

    const absencesRemaining = Math.max(0, maxAbsences - absentDays);
    const latenessRemaining = Math.max(0, maxTardiness - lateDays);

    // Only flag failed/warning when there are actual effective elapsed days to evaluate
    const failed =
      effectiveElapsedDays > 0 &&
      (absentDays > maxAbsences ||
        lateDays > maxTardiness ||
        attendancePercent < minAttendancePercent);

    const warning =
      effectiveElapsedDays > 0 &&
      !failed &&
      (absencesRemaining <= 1 ||
        latenessRemaining <= 2 ||
        attendancePercent < minAttendancePercent + 5);

    const monthLabel = this.getPeriodLabel(periodKey, cid ?? undefined);

    return {
      month: periodKey,
      monthLabel,
      totalWorkingDays,
      elapsedWorkingDays: effectiveElapsedDays,
      presentDays,
      absentDays,
      lateDays,
      unloggedDays,
      cancelledDays,
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

  /** Replace all local data (used when syncing from cloud on login). */
  replaceAllData(
    courses: Course[],
    records: Record<string, Record<string, DayRecord>>,
    selectedCourseId: string | null,
    skipSync = false,
  ): void {
    this.suppressSync = skipSync;
    this.courses = [...courses];
    this.records = { ...records };
    this._selectedCourseId =
      selectedCourseId && this.courses.find((c) => c.id === selectedCourseId)
        ? selectedCourseId
        : (this.courses[0]?.id ?? null);
    localStorage.setItem('courses_v1', JSON.stringify(this.courses));
    localStorage.setItem('attendance_v3', JSON.stringify(this.records));
    localStorage.setItem('selected_course_id', this._selectedCourseId ?? '');
    this.suppressSync = false;
    this.dataChangedSubject.next();
  }

  hasLocalData(): boolean {
    return this.courses.length > 0;
  }

  clearAllData(): void {
    this.courses = [];
    this.records = {};
    this._selectedCourseId = null;
    localStorage.removeItem('courses_v1');
    localStorage.removeItem('attendance_v3');
    localStorage.removeItem('attendance_v2');
    localStorage.removeItem('attendance_v1');
    localStorage.removeItem('selected_course_id');
    localStorage.removeItem('notification_settings_v1');
    this.clearSelectedPeriodKey();
    this.notifyChange();
  }

  getMonthsForCourse(courseId?: string): string[] {
    return this.getPeriodsForCourse(courseId).map((p) => p.key);
  }
}
