import { ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { NavController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { AttendanceService } from '../services/attendance.service';
import { LanguageService } from '../services/language.service';
import { Course, CoursePeriod, DayEntry, MonthStats } from '../models/attendance.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: 'dashboard.page.html',
  styleUrls: ['dashboard.page.scss'],
  standalone: false,
})
export class DashboardPage implements OnDestroy {
  protected stats!: MonthStats;
  protected courses: Course[] = [];
  protected selectedCourseId: string | null = null;
  protected selectedPeriod = '';
  protected availablePeriods: CoursePeriod[] = [];
  protected days: DayEntry[] = [];

  protected readonly CIRC = 251.33;

  private readonly langSub: Subscription;
  private readonly dataSub: Subscription;

  constructor(
    private readonly svc: AttendanceService,
    private readonly nav: NavController,
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
    this.refreshPeriods();
    this.loadStats();
    this.cdr.detectChanges();
  }

  private refreshPeriods(): void {
    this.availablePeriods = this.svc.getPeriodsForCourse(
      this.selectedCourseId ?? undefined
    );
    this.selectedPeriod = this.svc.getSelectedPeriodKey(
      this.selectedCourseId ?? undefined
    );
  }

  protected onCourseChange(): void {
    this.svc.selectedCourseId = this.selectedCourseId;
    this.refreshPeriods();
    this.loadStats();
  }

  protected onPeriodChange(): void {
    this.svc.setSelectedPeriodKey(
      this.selectedPeriod,
      this.selectedCourseId ?? undefined
    );
    this.loadStats();
  }

  private loadStats(): void {
    this.stats = this.svc.getPeriodStats(
      this.selectedPeriod,
      this.selectedCourseId ?? undefined
    );
    this.days = this.selectedPeriod
      ? this.svc.getDayEntriesForPeriod(
          this.selectedPeriod,
          this.selectedCourseId ?? undefined
        )
      : [];
  }

  protected get progressArc(): number {
    return (Math.min(100, this.stats.attendancePercent) / 100) * this.CIRC;
  }

  protected get ringColor(): string {
    const colors: Record<string, string> = {
      ok: '#b8ebe4',
      warning: '#f5d9a8',
      failed: '#f5c4c4',
    };
    return colors[this.stats?.overallStatus ?? 'ok'];
  }

  protected get heroGradient(): string {
    const g: Record<string, string> = {
      ok:      'linear-gradient(145deg, #145854 0%, #1a6b65 40%, #2d9d94 100%)',
      warning: 'linear-gradient(145deg, #7a4a12 0%, #b45309 55%, #d4955c 100%)',
      failed:  'linear-gradient(145deg, #8b2e2e 0%, #b83c3c 55%, #d46a6a 100%)',
    };
    return g[this.stats?.overallStatus ?? 'ok'];
  }

  protected get absencesColor(): string {
    if (this.stats.absentDays > this.stats.maxAbsences) return 'danger';
    if (this.stats.absencesRemaining <= 1) return 'warning';
    return 'success';
  }

  protected get latenessColor(): string {
    if (this.stats.lateDays > this.stats.maxTardiness) return 'danger';
    if (this.stats.latenessRemaining <= 2) return 'warning';
    return 'success';
  }

  protected get attendanceBarColor(): string {
    if (this.stats.elapsedWorkingDays === 0) return 'medium';
    if (this.stats.attendancePercent < this.stats.minAttendancePercent) return 'danger';
    if (this.stats.attendancePercent < this.stats.minAttendancePercent + 5) return 'warning';
    return 'success';
  }

  protected get statusKey(): string {
    if (this.stats.overallStatus === 'failed') return 'DASHBOARD.STATUS_FAILED';
    if (this.stats.overallStatus === 'warning') return 'DASHBOARD.STATUS_WARNING';
    return 'DASHBOARD.STATUS_OK';
  }

  protected get statusIcon(): string {
    if (this.stats.overallStatus === 'failed') return 'close-circle';
    if (this.stats.overallStatus === 'warning') return 'warning';
    return 'checkmark-circle';
  }

  protected get courseName(): string {
    return this.svc.getCourse(this.selectedCourseId ?? '')?.name ?? '';
  }

  protected periodLabelFor(period: CoursePeriod): string {
    return period.label;
  }

  protected formatHours(h: number): string {
    const hrs = Math.floor(h);
    const mins = Math.round((h - hrs) * 60);
    return mins === 0 ? `${hrs}h` : hrs > 0 ? `${hrs}h ${mins}min` : `${mins}min`;
  }

  protected get absencesBarValue(): number {
    return this.stats.maxAbsences > 0
      ? Math.min(1, this.stats.absentDays / this.stats.maxAbsences)
      : 0;
  }

  protected get latenessBarValue(): number {
    return this.stats.maxTardiness > 0
      ? Math.min(1, this.stats.lateDays / this.stats.maxTardiness)
      : 0;
  }

  protected get hoursBarValue(): number {
    return this.stats.expectedHoursToDate > 0
      ? Math.min(1, this.stats.totalHoursAttended / this.stats.expectedHoursToDate)
      : 0;
  }

  protected openConfig(): void {
    this.nav.navigateForward('/config');
  }

  protected openLog(): void {
    this.nav.navigateRoot('/log');
  }

  protected weekdayColumn(day: DayEntry): number {
    const dow = new Date(day.date + 'T12:00:00').getDay();
    return dow === 0 ? 7 : dow;
  }

  protected dayNumber(day: DayEntry): string {
    return day.date.slice(8, 10);
  }

  protected get weekdayLabels(): string[] {
    return [1, 2, 3, 4, 5].map((dow) => {
      const d = new Date(`2026-06-0${dow}T12:00:00`);
      return d.toLocaleDateString(this.lang.localeId, { weekday: 'short' });
    });
  }
}
