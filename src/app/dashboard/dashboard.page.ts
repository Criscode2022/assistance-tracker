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
  selectedMonth: string = '';
  availableMonths: string[] = [];

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
    const current = this.svc.getCurrentMonth();
    this.selectedMonth = this.availableMonths.includes(current)
      ? current
      : (this.availableMonths[0] ?? current);
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

  get attendanceColor(): string {
    if (this.stats.attendancePercent < this.stats.minAttendancePercent) return 'danger';
    if (this.stats.attendancePercent < this.stats.minAttendancePercent + 5) return 'warning';
    return 'success';
  }

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

  get statusText(): string {
    if (this.stats.overallStatus === 'failed') return 'En riesgo de reprobar';
    if (this.stats.overallStatus === 'warning') return 'Atención requerida';
    return 'Vas bien';
  }

  get statusIcon(): string {
    if (this.stats.overallStatus === 'failed') return 'close-circle';
    if (this.stats.overallStatus === 'warning') return 'warning';
    return 'checkmark-circle';
  }

  get hoursAttended(): number {
    return (this.stats.presentDays + this.stats.lateDays) * this.stats.hoursPerDay;
  }

  get hoursTotal(): number {
    return this.stats.totalWorkingDays * this.stats.hoursPerDay;
  }

  monthLabel(m: string): string {
    const label = new Date(m + '-15').toLocaleDateString('es-MX', {
      month: 'long',
      year: 'numeric',
    });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }
}
