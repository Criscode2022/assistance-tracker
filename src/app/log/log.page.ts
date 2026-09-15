import { ChangeDetectorRef, Component, NgZone, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { AttendanceService } from '../services/attendance.service';
import { DayStatusPickerService } from '../services/day-status-picker.service';
import { LanguageService } from '../services/language.service';
import { Course, CoursePeriod, DayEntry } from '../models/attendance.model';

@Component({
  selector: 'app-log',
  templateUrl: 'log.page.html',
  styleUrls: ['log.page.scss'],
  standalone: false,
})
export class LogPage implements OnDestroy {
  protected days: DayEntry[] = [];
  protected courses: Course[] = [];
  protected selectedCourseId: string | null = null;
  protected selectedPeriod = '';
  protected availablePeriods: CoursePeriod[] = [];

  private readonly langSub: Subscription;
  private readonly dataSub: Subscription;

  constructor(
    private readonly svc: AttendanceService,
    private readonly statusPicker: DayStatusPickerService,
    private readonly lang: LanguageService,
    private readonly ngZone: NgZone,
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
    this.loadDays();
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
    this.loadDays();
  }

  protected onPeriodChange(): void {
    this.svc.setSelectedPeriodKey(
      this.selectedPeriod,
      this.selectedCourseId ?? undefined
    );
    this.loadDays();
  }

  private loadDays(): void {
    this.ngZone.run(() => {
      this.days = this.svc.getDayEntriesForPeriod(
        this.selectedPeriod,
        this.selectedCourseId ?? undefined
      );
    });
  }

  /** Run after Ionic overlays close; they block paint until dismissed. */
  private refreshAfterEdit(): void {
    this.loadDays();
    requestAnimationFrame(() => {
      this.ngZone.run(() => this.cdr.detectChanges());
    });
  }

  protected trackByDate(_index: number, day: DayEntry): string {
    return `${day.date}:${day.status}:${day.entryTime ?? ''}:${day.exitTime ?? ''}`;
  }

  protected periodLabelFor(period: CoursePeriod): string {
    return period.label;
  }

  protected get periodLabel(): string {
    return this.availablePeriods.find((p) => p.key === this.selectedPeriod)?.label ?? '';
  }

  protected quickToggle(day: DayEntry): void {
    if (day.isFuture) return;
    const newStatus = day.status === 'present' ? 'absent' : 'present';
    this.svc.setDayRecord(day.date, { status: newStatus }, this.selectedCourseId ?? undefined);
    this.refreshAfterEdit();
  }

  protected async openStatusPicker(day: DayEntry): Promise<void> {
    if (day.isFuture) return;
    const changed = await this.statusPicker.open(day, this.selectedCourseId);
    if (changed) {
      this.refreshAfterEdit();
    }
  }

  protected formatHours(h: number): string {
    const hrs = Math.floor(h);
    const mins = Math.round((h - hrs) * 60);
    if (mins === 0) return `${hrs}h`;
    return hrs > 0 ? `${hrs}h ${mins}min` : `${mins}min`;
  }

  protected statusIcon(day: DayEntry): string {
    switch (day.status) {
      case 'present':   return 'checkmark-circle';
      case 'absent':    return 'close-circle';
      case 'late':      return 'time';
      case 'cancelled': return 'ban';
      default:          return 'ellipse-outline';
    }
  }

  protected statusColor(day: DayEntry): string {
    switch (day.status) {
      case 'present':   return 'success';
      case 'absent':    return 'danger';
      case 'late':      return 'warning';
      case 'cancelled': return 'medium';
      default:          return 'medium';
    }
  }

  protected statusLabelKey(day: DayEntry): string {
    switch (day.status) {
      case 'present':   return 'COMMON.PRESENT';
      case 'absent':    return 'COMMON.ABSENT';
      case 'late':      return 'COMMON.LATE';
      case 'cancelled': return 'COMMON.CANCELLED';
      default:          return 'COMMON.UNLOGGED';
    }
  }
}
