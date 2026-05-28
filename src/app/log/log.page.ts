import { ChangeDetectorRef, Component, NgZone, OnDestroy } from '@angular/core';
import { ActionSheetController, AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { AttendanceService } from '../services/attendance.service';
import { LanguageService } from '../services/language.service';
import { Course, DayEntry, DayRecord } from '../models/attendance.model';

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
  selectedMonth = '';
  availableMonths: string[] = [];

  private langSub?: Subscription;

  constructor(
    private svc: AttendanceService,
    private actionSheet: ActionSheetController,
    private alertCtrl: AlertController,
    private translate: TranslateService,
    private lang: LanguageService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
  ) {
    this.langSub = this.lang.onLangChange().subscribe(() => this.loadDays());
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
  }

  ionViewWillEnter(): void {
    this.courses = this.svc.getCourses();
    this.selectedCourseId = this.svc.selectedCourseId;
    this.refreshMonths();
    this.loadDays();
  }

  private refreshMonths(): void {
    this.availableMonths = this.svc.getMonthsForCourse(
      this.selectedCourseId ?? undefined
    );
    const cur = this.svc.getCurrentMonth();
    this.selectedMonth = this.availableMonths.includes(cur)
      ? cur
      : (this.availableMonths[0] ?? cur);
  }

  onCourseChange(): void {
    this.svc.selectedCourseId = this.selectedCourseId;
    this.refreshMonths();
    this.loadDays();
  }

  onMonthChange(): void {
    this.loadDays();
  }

  loadDays(): void {
    this.ngZone.run(() => {
      this.days = this.svc.getDayEntriesForMonth(
        this.selectedMonth,
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

  monthLabelFor(m: string): string {
    return this.lang.formatMonthYear(m);
  }

  get monthLabel(): string {
    return this.selectedMonth ? this.monthLabelFor(this.selectedMonth) : '';
  }

  private saveDayRecord(date: string, record: DayRecord): void {
    this.svc.setDayRecord(date, record, this.selectedCourseId ?? undefined);
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
      case 'present': return 'checkmark-circle';
      case 'absent':  return 'close-circle';
      case 'late':    return 'time';
      default:        return 'ellipse-outline';
    }
  }

  statusColor(day: DayEntry): string {
    switch (day.status) {
      case 'present': return 'success';
      case 'absent':  return 'danger';
      case 'late':    return 'warning';
      default:        return 'medium';
    }
  }

  statusLabelKey(day: DayEntry): string {
    switch (day.status) {
      case 'present': return 'COMMON.PRESENT';
      case 'absent':  return 'COMMON.ABSENT';
      case 'late':    return 'COMMON.LATE';
      default:        return 'COMMON.UNLOGGED';
    }
  }
}
