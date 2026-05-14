import { Component, OnInit } from '@angular/core';
import { AttendanceService } from '../services/attendance.service';
import { MonthStats } from '../models/attendance.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: 'dashboard.page.html',
  styleUrls: ['dashboard.page.scss'],
  standalone: false,
})
export class DashboardPage implements OnInit {
  stats!: MonthStats;

  constructor(public svc: AttendanceService) {}

  ngOnInit(): void {
    this.loadStats();
  }

  ionViewWillEnter(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.stats = this.svc.getMonthStats(this.svc.getCurrentMonth());
  }

  get attendanceColor(): string {
    if (this.stats.attendancePercent < this.svc.MIN_ATTENDANCE_PERCENT) return 'danger';
    if (this.stats.attendancePercent < 80) return 'warning';
    return 'success';
  }

  get absencesColor(): string {
    if (this.stats.absentDays > this.svc.MAX_ABSENCES) return 'danger';
    if (this.stats.absencesRemaining <= 1) return 'warning';
    return 'success';
  }

  get latenessColor(): string {
    if (this.stats.lateDays > this.svc.MAX_TARDINESS) return 'danger';
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
    return (this.stats.presentDays + this.stats.lateDays) * this.svc.HOURS_PER_DAY;
  }

  get hoursTotal(): number {
    return this.stats.totalWorkingDays * this.svc.HOURS_PER_DAY;
  }
}
