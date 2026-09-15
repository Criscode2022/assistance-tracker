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
  protected monthStatsList: MonthStats[] = [];
  protected courses: Course[] = [];
  protected selectedCourseId: string | null = null;

  private readonly langSub: Subscription;
  private readonly dataSub: Subscription;

  constructor(
    private readonly svc: AttendanceService,
    private readonly lang: LanguageService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.langSub = this.lang.onLangChange().subscribe(() => this.refreshView());
    this.dataSub = this.svc.dataChanged$.subscribe(() => this.refreshView());
  }

  public ngOnDestroy(): void {
    this.langSub.unsubscribe();
    this.dataSub.unsubscribe();
  }

  public ionViewWillEnter(): void {
    this.refreshView();
  }

  private refreshView(): void {
    this.courses = this.svc.getCourses();
    this.selectedCourseId = this.svc.selectedCourseId;
    this.load();
    this.cdr.detectChanges();
  }

  protected onCourseChange(): void {
    this.svc.selectedCourseId = this.selectedCourseId;
    this.load();
  }

  private load(): void {
    const periods = this.svc.getPeriodsForCourse(this.selectedCourseId ?? undefined);
    this.monthStatsList = periods.map((p) =>
      this.svc.getPeriodStats(p.key, this.selectedCourseId ?? undefined)
    );
  }

  protected statusColor(s: MonthStats): string {
    return s.overallStatus === 'failed' ? 'danger' : s.overallStatus === 'warning' ? 'warning' : 'success';
  }

  protected statusIcon(s: MonthStats): string {
    return s.overallStatus === 'failed' ? 'close-circle' : s.overallStatus === 'warning' ? 'warning' : 'checkmark-circle';
  }
}
