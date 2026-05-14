import { Component } from '@angular/core';
import { AttendanceService } from '../services/attendance.service';
import { Course, MonthStats } from '../models/attendance.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: 'dashboard.page.html',
  styleUrls: ['dashboard.page.scss'],
  standalone: false,
})
export class DashboardPage {
  stats!: MonthStats;
  courses: Course[] = [];
  selectedCourseId: string | null = null;
  selectedMonth = '';
  availableMonths: string[] = [];

  // SVG ring constants: r=40, circumference = 2π*40 = 251.33
  readonly CIRC = 251.33;

  constructor(public svc: AttendanceService) {}

  ionViewWillEnter(): void {
    this.courses = this.svc.getCourses();
    this.selectedCourseId = this.svc.selectedCourseId;
    this.refreshMonths();
    this.loadStats();
  }

  private refreshMonths(): void {
    this.availableMonths = this.svc.getMonthsForCourse(
      this.selectedCourseId ?? undefined
    );
    const cur = this.svc.getCurrentMonth();
    this.selectedMonth = this.availableMonths.includes(cur)
      ? cur
      : (this.availableMonths[0] ?? cur);
  }

  onCourseChange(): void {
    this.svc.selectedCourseId = this.selectedCourseId;
    this.refreshMonths();
    this.loadStats();
  }

  onMonthChange(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.stats = this.svc.getMonthStats(
      this.selectedMonth,
      this.selectedCourseId ?? undefined
    );
  }

  // ── Ring ─────────────────────────────────────────────────────────────────────

  get progressArc(): number {
    return (Math.min(100, this.stats.attendancePercent) / 100) * this.CIRC;
  }

  get ringColor(): string {
    if (this.stats.attendancePercent < this.stats.minAttendancePercent) return '#ef4444';
    if (this.stats.attendancePercent < this.stats.minAttendancePercent + 5) return '#f59e0b';
    return '#22c55e';
  }

  // ── Hero gradient ─────────────────────────────────────────────────────────────

  get heroGradient(): string {
    const g: Record<string, string> = {
      ok:      'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
      warning: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
      failed:  'linear-gradient(135deg, #dc2626 0%, #f87171 100%)',
    };
    return g[this.stats?.overallStatus ?? 'ok'];
  }

  // ── Colours ───────────────────────────────────────────────────────────────────

  get absencesColor(): string {
    if (this.stats.absentDays > this.stats.maxAbsences) return 'danger';
    if (this.stats.absencesRemaining <= 1) return 'warning';
    return 'success';
  }

  get latenessColor(): string {
    if (this.stats.lateDays > this.stats.maxTardiness) return 'danger';
    if (this.stats.latenessRemaining <= 2) return 'warning';
    return 'success';
  }

  get attendanceBarColor(): string {
    if (this.stats.attendancePercent < this.stats.minAttendancePercent) return 'danger';
    if (this.stats.attendancePercent < this.stats.minAttendancePercent + 5) return 'warning';
    return 'success';
  }

  // ── Labels ────────────────────────────────────────────────────────────────────

  get statusText(): string {
    if (this.stats.overallStatus === 'failed') return 'En riesgo';
    if (this.stats.overallStatus === 'warning') return 'Atención';
    return 'Vas bien';
  }

  get statusIcon(): string {
    if (this.stats.overallStatus === 'failed') return 'close-circle';
    if (this.stats.overallStatus === 'warning') return 'warning';
    return 'checkmark-circle';
  }

  get courseName(): string {
    return this.svc.getCourse(this.selectedCourseId ?? '')?.name ?? '';
  }

  monthLabelFor(m: string): string {
    const l = new Date(m + '-15').toLocaleDateString('es-MX', {
      month: 'long',
      year: 'numeric',
    });
    return l.charAt(0).toUpperCase() + l.slice(1);
  }

  formatHours(h: number): string {
    const hrs = Math.floor(h);
    const mins = Math.round((h - hrs) * 60);
    return mins === 0 ? `${hrs}h` : hrs > 0 ? `${hrs}h ${mins}min` : `${mins}min`;
  }

  get absencesBarValue(): number {
    return this.stats.maxAbsences > 0
      ? Math.min(1, this.stats.absentDays / this.stats.maxAbsences)
      : 0;
  }

  get latenessBarValue(): number {
    return this.stats.maxTardiness > 0
      ? Math.min(1, this.stats.lateDays / this.stats.maxTardiness)
      : 0;
  }

  get hoursBarValue(): number {
    return this.stats.expectedHoursToDate > 0
      ? Math.min(1, this.stats.totalHoursAttended / this.stats.expectedHoursToDate)
      : 1;
  }
}
