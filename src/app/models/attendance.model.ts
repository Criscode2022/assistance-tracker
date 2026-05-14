export type AttendanceStatus = 'present' | 'absent' | 'late' | 'unlogged';

export interface DayEntry {
  date: string;
  dateLabel: string;
  dayLabel: string;
  status: AttendanceStatus;
  isToday: boolean;
  isFuture: boolean;
}

export interface MonthStats {
  month: string;
  monthLabel: string;
  totalWorkingDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  unloggedDays: number;
  attendancePercent: number;
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
  startDate: string;  // YYYY-MM-DD
  endDate: string;    // YYYY-MM-DD
  hoursPerDay: number;
  maxAbsences: number;
  maxTardiness: number;
  minAttendancePercent: number;
}
