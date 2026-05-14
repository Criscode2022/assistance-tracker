import { Component } from '@angular/core';
import { AttendanceService } from '../services/attendance.service';
import { Course, MonthStats } from '../models/attendance.model';

@Component({
  selector: 'app-history',
  templateUrl: 'history.page.html',
  styleUrls: ['history.page.scss'],
  standalone: false,
})
export class HistoryPage {
  monthStatsList: MonthStats[] = [];
  courses: Course[] = [];
  selectedCourseId: string | null = null;

  constructor(private svc: AttendanceService) {}

  ionViewWillEnter(): void {
    this.courses = this.svc.getCourses();
    this.selectedCourseId = this.svc.selectedCourseId;
    this.load();
  }

  onCourseChange(): void {
    this.svc.selectedCourseId = this.selectedCourseId;
    this.load();
  }

  load(): void {
    const months = this.svc.getMonthsForCourse(this.selectedCourseId ?? undefined);
    this.monthStatsList = months.map((m) =>
      this.svc.getMonthStats(m, this.selectedCourseId ?? undefined)
    );
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
