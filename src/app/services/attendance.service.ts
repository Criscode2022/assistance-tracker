import { Injectable } from '@angular/core';
import { AttendanceStatus, DayEntry, MonthStats } from '../models/attendance.model';

@Injectable({ providedIn: 'root' })
export class AttendanceService {
  readonly MAX_ABSENCES = 3;
  readonly MAX_TARDINESS = 7;
  readonly MIN_ATTENDANCE_PERCENT = 75;
  readonly HOURS_PER_DAY = 5;

  private readonly STORAGE_KEY = 'attendance_records_v1';
  private records = new Map<string, AttendanceStatus>();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const parsed: Record<string, AttendanceStatus> = JSON.parse(raw);
        this.records = new Map(Object.entries(parsed));
      }
    } catch {
      this.records = new Map();
    }
  }

  private saveToStorage(): void {
    const obj: Record<string, AttendanceStatus> = {};
    this.records.forEach((val, key) => (obj[key] = val));
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(obj));
  }

  setRecord(date: string, status: AttendanceStatus): void {
    if (status === 'unlogged') {
      this.records.delete(date);
    } else {
      this.records.set(date, status);
    }
    this.saveToStorage();
  }

  getRecord(date: string): AttendanceStatus {
    return this.records.get(date) ?? 'unlogged';
  }

  getCurrentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  getTodayString(): string {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }

  getWorkingDaysInMonth(month: string): string[] {
    const [year, m] = month.split('-').map(Number);
    const days: string[] = [];
    const cursor = new Date(year, m - 1, 1);
    while (cursor.getMonth() === m - 1) {
      const dow = cursor.getDay();
      if (dow !== 0 && dow !== 6) {
        days.push(cursor.toISOString().split('T')[0]);
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    return days;
  }

  getDayEntriesForMonth(month: string): DayEntry[] {
    const today = this.getTodayString();
    const workingDays = this.getWorkingDaysInMonth(month);
    return workingDays.map((date) => {
      const d = new Date(date + 'T12:00:00');
      return {
        date,
        dateLabel: d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }),
        dayLabel: d.toLocaleDateString('es-MX', { weekday: 'long' }),
        status: this.getRecord(date),
        isToday: date === today,
        isFuture: date > today,
      };
    });
  }

  getMonthStats(month: string): MonthStats {
    const today = this.getTodayString();
    const workingDays = this.getWorkingDaysInMonth(month);
    const totalWorkingDays = workingDays.length;

    let presentDays = 0;
    let absentDays = 0;
    let lateDays = 0;
    let unloggedDays = 0;

    for (const day of workingDays) {
      if (day > today) continue; // skip future days for stats
      const status = this.getRecord(day);
      if (status === 'present') presentDays++;
      else if (status === 'absent') absentDays++;
      else if (status === 'late') lateDays++;
      else unloggedDays++;
    }

    const elapsedDays = presentDays + absentDays + lateDays + unloggedDays;

    // Attendance = (attended days) / total working days in month * 100
    // Unlogged past days count as present (benefit of doubt)
    const attendedDays = presentDays + lateDays + unloggedDays;
    const attendancePercent =
      totalWorkingDays > 0
        ? Math.round((attendedDays / totalWorkingDays) * 100)
        : 100;

    const absencesRemaining = Math.max(0, this.MAX_ABSENCES - absentDays);
    const latenessRemaining = Math.max(0, this.MAX_TARDINESS - lateDays);

    const failed =
      absentDays > this.MAX_ABSENCES ||
      lateDays > this.MAX_TARDINESS ||
      attendancePercent < this.MIN_ATTENDANCE_PERCENT;

    const warning =
      !failed &&
      (absencesRemaining <= 1 ||
        latenessRemaining <= 2 ||
        attendancePercent < 80);

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
      overallStatus: failed ? 'failed' : warning ? 'warning' : 'ok',
    };
  }

  getAvailableMonths(): string[] {
    const months = new Set<string>();
    this.records.forEach((_, date) => months.add(date.substring(0, 7)));
    months.add(this.getCurrentMonth());
    return Array.from(months).sort().reverse();
  }
}
