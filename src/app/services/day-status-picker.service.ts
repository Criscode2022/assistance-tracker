import { Injectable } from '@angular/core';
import { ActionSheetController, AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { DayEntry, DayRecord } from '../models/attendance.model';
import { AttendanceService } from './attendance.service';

@Injectable({ providedIn: 'root' })
export class DayStatusPickerService {
  constructor(
    private readonly svc: AttendanceService,
    private readonly actionSheet: ActionSheetController,
    private readonly alertCtrl: AlertController,
    private readonly translate: TranslateService,
  ) {}

  public async open(day: DayEntry, courseId?: string | null): Promise<boolean> {
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
            this.saveDayRecord(day.date, { status: 'present' }, courseId);
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
            this.saveDayRecord(day.date, { status: 'absent' }, courseId);
            refreshAfterSheet = true;
          },
        },
        {
          text: this.translate.instant('LOG.CANCELLED_OPTION'),
          icon: 'ban-outline',
          handler: () => {
            this.saveDayRecord(day.date, { status: 'cancelled' }, courseId);
            refreshAfterSheet = true;
          },
        },
        {
          text: this.translate.instant('COMMON.UNLOGGED'),
          icon: 'remove-circle-outline',
          handler: () => {
            this.saveDayRecord(day.date, { status: 'unlogged' }, courseId);
            refreshAfterSheet = true;
          },
        },
        { text: this.translate.instant('COMMON.CANCEL'), role: 'cancel' },
      ],
    });

    await sheet.present();
    await sheet.onDidDismiss();

    if (openLatePicker) {
      return this.askForTimes(day, courseId);
    }
    return refreshAfterSheet;
  }

  private saveDayRecord(
    date: string,
    record: DayRecord,
    courseId?: string | null,
  ): void {
    this.svc.setDayRecord(date, record, courseId ?? undefined);
  }

  private async askForTimes(
    day: DayEntry,
    courseId?: string | null,
  ): Promise<boolean> {
    const course = courseId ? this.svc.getCourse(courseId) : null;

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
            this.saveDayRecord(day.date, { status: 'late' }, courseId);
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
            }, courseId);
            refreshAfterAlert = true;
          },
        },
      ],
    });

    await alert.present();
    await alert.onDidDismiss();
    return refreshAfterAlert;
  }
}
