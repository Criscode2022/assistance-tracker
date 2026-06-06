export type AttendanceStatus = 'present' | 'absent' | 'late' | 'unlogged' | 'cancelled';

export interface DayRecord {
  status: AttendanceStatus;
  entryTime?: string; // HH:mm — only for 'late'
  exitTime?: string;  // HH:mm — only for 'late'
}

export interface DayEntry {
  date: string;
  dateLabel: string;
  dayLabel: string;
  status: AttendanceStatus;
  entryTime?: string;
  exitTime?: string;
  hoursAttended: number;
  lostMinutes: number;
  isToday: boolean;
  isFuture: boolean;
}

export interface MonthStats {
  month: string;
  monthLabel: string;
  totalWorkingDays: number;
  elapsedWorkingDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  unloggedDays: number;
  cancelledDays: number;
  attendancePercent: number;      // hours attended / expected hours to date
  totalHoursAttended: number;
  expectedHoursToDate: number;
  totalLostMinutes: number;
  absencesRemaining: number;
  latenessRemaining: number;
  maxAbsences: number;
  maxTardiness: number;
  minAttendancePercent: number;
  hoursPerDay: number;
  overallStatus: 'ok' | 'warning' | 'failed';
}

export interface Course {
  id: string;
  name: string;
  startDate: string;   // YYYY-MM-DD
  endDate: string;     // YYYY-MM-DD
  startTime: string;   // HH:mm  e.g. "09:00"
  hoursPerDay: number;
  maxAbsences: number;
  maxTardiness: number;
  minAttendancePercent: number;
}
