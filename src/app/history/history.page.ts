import { Component } from '@angular/core';
import { AttendanceService } from '../services/attendance.service';
import { MonthStats } from '../models/attendance.model';

@Component({
  selector: 'app-history',
  templateUrl: 'history.page.html',
  styleUrls: ['history.page.scss'],
  standalone: false,
})
export class HistoryPage {
  monthStatsList: MonthStats[] = [];

  constructor(private svc: AttendanceService) {}

  ionViewWillEnter(): void {
    this.load();
  }

  load(): void {
    const months = this.svc.getAvailableMonths();
    this.monthStatsList = months.map((m) => this.svc.getMonthStats(m));
  }

  statusColor(stats: MonthStats): string {
    if (stats.overallStatus === 'failed') return 'danger';
    if (stats.overallStatus === 'warning') return 'warning';
    return 'success';
  }

  statusIcon(stats: MonthStats): string {
    if (stats.overallStatus === 'failed') return 'close-circle';
    if (stats.overallStatus === 'warning') return 'warning';
    return 'checkmark-circle';
  }
}
