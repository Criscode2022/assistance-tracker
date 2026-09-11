import { ChangeDetectorRef, Component, NgZone, OnDestroy } from '@angular/core';
import { ActionSheetController, AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { AttendanceService } from '../services/attendance.service';
import { LanguageService } from '../services/language.service';
import { Course, CoursePeriod, DayEntry, DayRecord } from '../models/attendance.model';

@Component({
  selector: 'app-log',
  templateUrl: 'log.page.html',
  styleUrls: ['log.page.scss'],
  standalone: false,
})
export class LogPage implements OnDestroy {
  days: DayEntry[] = [];
  courses: Course[] = [];
  selectedCourseId: string | null = null;
  selectedPeriod = '';
  availablePeriods: CoursePeriod[] = [];

  private langSub?: Subscription;
  private dataSub?: Subscription;

  constructor(
    private svc: AttendanceService,
    private actionSheet: ActionSheetController,
    private alertCtrl: AlertController,
    private translate: TranslateService,
    private lang: LanguageService,
    private ngZone: NgZone,
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

  onCourseChange(): void {
    this.svc.selectedCourseId = this.selectedCourseId;
    this.refreshPeriods();
    this.loadDays();
  }

  onPeriodChange(): void {
    this.svc.setSelectedPeriodKey(
      this.selectedPeriod,
      this.selectedCourseId ?? undefined
    );
    this.loadDays();
  }

  loadDays(): void {
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

  trackByDate(_index: number, day: DayEntry): string {
    return `${day.date}:${day.status}:${day.entryTime ?? ''}:${day.exitTime ?? ''}`;
  }

  periodLabelFor(period: CoursePeriod): string {
    return period.label;
  }

  get periodLabel(): string {
    return this.availablePeriods.find((p) => p.key === this.selectedPeriod)?.label ?? '';
  }

  private saveDayRecord(date: string, record: DayRecord): void {
    this.svc.setDayRecord(date, record, this.selectedCourseId ?? undefined);
  }

  quickToggle(day: DayEntry): void {
    if (day.isFuture) return;
    const newStatus = day.status === 'present' ? 'absent' : 'present';
    this.saveDayRecord(day.date, { status: newStatus });
    this.refreshAfterEdit();
  }

  async openStatusPicker(day: DayEntry): Promise<void> {
    if (day.isFuture) return;

    let refreshAfterSheet = false;
    let openLatePicker = false;

    const sheet = await this.actionSheet.create({
      header: `${day.dayLabel}, ${day.dateLabel}`,
      cssClass: 'modern-action-sheet',
      buttons: [
        {
          text: this.translate.instant('COMMON.PRESENT'),
          icon: 'checkmark-circle-outline',
          handler: () => {
            this.saveDayRecord(day.date, { status: 'present' });
            refreshAfterSheet = true;
          },
        },
        {
          text: this.translate.instant('LOG.LATE_OPTION'),
          icon: 'time-outline',
          handler: () => {
            openLatePicker = true;
          },
        },
        {
          text: this.translate.instant('COMMON.ABSENT'),
          icon: 'close-circle-outline',
          role: 'destructive',
          handler: () => {
            this.saveDayRecord(day.date, { status: 'absent' });
            refreshAfterSheet = true;
          },
        },
        {
          text: this.translate.instant('LOG.CANCELLED_OPTION'),
          icon: 'ban-outline',
          handler: () => {
            this.saveDayRecord(day.date, { status: 'cancelled' });
            refreshAfterSheet = true;
          },
        },
        {
          text: this.translate.instant('COMMON.UNLOGGED'),
          icon: 'remove-circle-outline',
          handler: () => {
            this.saveDayRecord(day.date, { status: 'unlogged' });
            refreshAfterSheet = true;
          },
        },
        { text: this.translate.instant('COMMON.CANCEL'), role: 'cancel' },
      ],
    });

    await sheet.present();
    await sheet.onDidDismiss();

    if (openLatePicker) {
      await this.askForTimes(day);
    } else if (refreshAfterSheet) {
      this.refreshAfterEdit();
    }
  }

  private async askForTimes(day: DayEntry): Promise<void> {
    const course = this.selectedCourseId
      ? this.svc.getCourse(this.selectedCourseId)
      : null;

    const defaultEntry = day.entryTime ?? course?.startTime ?? '09:00';
    const defaultExit =
      day.exitTime ?? this.svc.calcDefaultExitTime(course);

    let refreshAfterAlert = false;

    const alert = await this.alertCtrl.create({
      header: this.translate.instant('LOG.DAY_SCHEDULE'),
      subHeader: `${day.dayLabel}, ${day.dateLabel}`,
      cssClass: 'time-alert',
      inputs: [
        {
          name: 'entry',
          type: 'time',
          label: this.translate.instant('LOG.ENTRY_TIME'),
          value: defaultEntry,
        },
        {
          name: 'exit',
          type: 'time',
          label: this.translate.instant('LOG.EXIT_TIME'),
          value: defaultExit,
        },
      ],
      buttons: [
        {
          text: this.translate.instant('LOG.NO_SCHEDULE_BTN'),
          cssClass: 'alert-btn-neutral',
          handler: () => {
            this.saveDayRecord(day.date, { status: 'late' });
            refreshAfterAlert = true;
          },
        },
        { text: this.translate.instant('COMMON.CANCEL'), role: 'cancel' },
        {
          text: this.translate.instant('COMMON.SAVE'),
          cssClass: 'alert-btn-primary',
          handler: (data: { entry: string; exit: string }) => {
            this.saveDayRecord(day.date, {
              status: 'late',
              entryTime: data.entry,
              exitTime: data.exit,
            });
            refreshAfterAlert = true;
          },
        },
      ],
    });

    await alert.present();
    await alert.onDidDismiss();
    if (refreshAfterAlert) {
      this.refreshAfterEdit();
    }
  }

  formatHours(h: number): string {
    const hrs = Math.floor(h);
    const mins = Math.round((h - hrs) * 60);
    if (mins === 0) return `${hrs}h`;
    return hrs > 0 ? `${hrs}h ${mins}min` : `${mins}min`;
  }

  statusIcon(day: DayEntry): string {
    switch (day.status) {
      case 'present':   return 'checkmark-circle';
      case 'absent':    return 'close-circle';
      case 'late':      return 'time';
      case 'cancelled': return 'ban';
      default:          return 'ellipse-outline';
    }
  }

  statusColor(day: DayEntry): string {
    switch (day.status) {
      case 'present':   return 'success';
      case 'absent':    return 'danger';
      case 'late':      return 'warning';
      case 'cancelled': return 'medium';
      default:          return 'medium';
    }
  }

  statusLabelKey(day: DayEntry): string {
    switch (day.status) {
      case 'present':   return 'COMMON.PRESENT';
      case 'absent':    return 'COMMON.ABSENT';
      case 'late':      return 'COMMON.LATE';
      case 'cancelled': return 'COMMON.CANCELLED';
      default:          return 'COMMON.UNLOGGED';
    }
  }
}
