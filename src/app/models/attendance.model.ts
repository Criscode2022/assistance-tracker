export type AttendanceStatus = 'present' | 'absent' | 'late' | 'unlogged';

export interface AttendanceRecord {
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
}

export interface DayEntry {
  date: string;
  dateLabel: string;
  dayLabel: string;
  status: AttendanceStatus;
  isToday: boolean;
  isFuture: boolean;
}

export interface MonthStats {
  month: string;       // YYYY-MM
  monthLabel: string;
  totalWorkingDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  unloggedDays: number;
  attendancePercent: number;
  absencesRemaining: number;
  latenessRemaining: number;
  overallStatus: 'ok' | 'warning' | 'failed';
}
