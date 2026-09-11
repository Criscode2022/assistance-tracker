import { ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { NavController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { AttendanceService } from '../services/attendance.service';
import { LanguageService } from '../services/language.service';
import { Course, CoursePeriod, MonthStats } from '../models/attendance.model';

@Component({
  selector: 'app-dashboard',
  templateUrl: 'dashboard.page.html',
  styleUrls: ['dashboard.page.scss'],
  standalone: false,
})
export class DashboardPage implements OnDestroy {
  stats!: MonthStats;
  courses: Course[] = [];
  selectedCourseId: string | null = null;
  selectedPeriod = '';
  availablePeriods: CoursePeriod[] = [];

  readonly CIRC = 251.33;

  private langSub?: Subscription;
  private dataSub?: Subscription;

  constructor(
    public svc: AttendanceService,
    private nav: NavController,
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

  onCourseChange(): void {
    this.svc.selectedCourseId = this.selectedCourseId;
    this.refreshPeriods();
    this.loadStats();
  }

  onPeriodChange(): void {
    this.svc.setSelectedPeriodKey(
      this.selectedPeriod,
      this.selectedCourseId ?? undefined
    );
    this.loadStats();
  }

  loadStats(): void {
    this.stats = this.svc.getPeriodStats(
      this.selectedPeriod,
      this.selectedCourseId ?? undefined
    );
  }

  get progressArc(): number {
    return (Math.min(100, this.stats.attendancePercent) / 100) * this.CIRC;
  }

  get ringColor(): string {
    const colors: Record<string, string> = {
      ok: '#b8ebe4',
      warning: '#f5d9a8',
      failed: '#f5c4c4',
    };
    return colors[this.stats?.overallStatus ?? 'ok'];
  }

  get heroGradient(): string {
    const g: Record<string, string> = {
      ok:      'linear-gradient(145deg, #145854 0%, #1a6b65 40%, #2d9d94 100%)',
      warning: 'linear-gradient(145deg, #7a4a12 0%, #b45309 55%, #d4955c 100%)',
      failed:  'linear-gradient(145deg, #8b2e2e 0%, #b83c3c 55%, #d46a6a 100%)',
    };
    return g[this.stats?.overallStatus ?? 'ok'];
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

  get attendanceBarColor(): string {
    if (this.stats.elapsedWorkingDays === 0) return 'medium';
    if (this.stats.attendancePercent < this.stats.minAttendancePercent) return 'danger';
    if (this.stats.attendancePercent < this.stats.minAttendancePercent + 5) return 'warning';
    return 'success';
  }

  get statusKey(): string {
    if (this.stats.overallStatus === 'failed') return 'DASHBOARD.STATUS_FAILED';
    if (this.stats.overallStatus === 'warning') return 'DASHBOARD.STATUS_WARNING';
    return 'DASHBOARD.STATUS_OK';
  }

  get statusIcon(): string {
    if (this.stats.overallStatus === 'failed') return 'close-circle';
    if (this.stats.overallStatus === 'warning') return 'warning';
    return 'checkmark-circle';
  }

  get courseName(): string {
    return this.svc.getCourse(this.selectedCourseId ?? '')?.name ?? '';
  }

  periodLabelFor(period: CoursePeriod): string {
    return period.label;
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
      : 0;
  }

  openConfig(): void {
    this.nav.navigateForward('/config');
  }
}
