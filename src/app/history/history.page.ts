import { ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { AttendanceService } from '../services/attendance.service';
import { LanguageService } from '../services/language.service';
import { Course, MonthStats } from '../models/attendance.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-history',
  templateUrl: 'history.page.html',
  styleUrls: ['history.page.scss'],
  standalone: false,
})
export class HistoryPage implements OnDestroy {
  monthStatsList: MonthStats[] = [];
  courses: Course[] = [];
  selectedCourseId: string | null = null;

  private langSub?: Subscription;
  private dataSub?: Subscription;

  constructor(
    private svc: AttendanceService,
    private lang: LanguageService,
    private cdr: ChangeDetectorRef,
  ) {
    this.langSub = this.lang.onLangChange().subscribe(() => this.refreshView());
    this.dataSub = this.svc.dataChanged$.subscribe(() => this.refreshView());
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
    this.dataSub?.unsubscribe();
  }

  ionViewWillEnter(): void {
    this.refreshView();
  }

  private refreshView(): void {
    this.courses = this.svc.getCourses();
    this.selectedCourseId = this.svc.selectedCourseId;
    this.load();
    this.cdr.detectChanges();
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

  statusColor(s: MonthStats): string {
    return s.overallStatus === 'failed' ? 'danger' : s.overallStatus === 'warning' ? 'warning' : 'success';
  }

  statusIcon(s: MonthStats): string {
    return s.overallStatus === 'failed' ? 'close-circle' : s.overallStatus === 'warning' ? 'warning' : 'checkmark-circle';
  }
}
