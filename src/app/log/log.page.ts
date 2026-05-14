import { Component } from '@angular/core';
import { ActionSheetController, AlertController } from '@ionic/angular';
import { AttendanceService } from '../services/attendance.service';
import { Course, DayEntry } from '../models/attendance.model';

@Component({
  selector: 'app-log',
  templateUrl: 'log.page.html',
  styleUrls: ['log.page.scss'],
  standalone: false,
})
export class LogPage {
  days: DayEntry[] = [];
  courses: Course[] = [];
  selectedCourseId: string | null = null;
  selectedMonth = '';
  availableMonths: string[] = [];

  constructor(
    private svc: AttendanceService,
    private actionSheet: ActionSheetController,
    private alertCtrl: AlertController
  ) {}

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
    this.days = this.svc.getDayEntriesForMonth(
      this.selectedMonth,
      this.selectedCourseId ?? undefined
    );
  }

  monthLabelFor(m: string): string {
    const l = new Date(m + '-15').toLocaleDateString('es-MX', {
      month: 'long',
      year: 'numeric',
    });
    return l.charAt(0).toUpperCase() + l.slice(1);
  }

  get monthLabel(): string {
    return this.selectedMonth ? this.monthLabelFor(this.selectedMonth) : '';
  }

  async openStatusPicker(day: DayEntry): Promise<void> {
    if (day.isFuture) return;

    const sheet = await this.actionSheet.create({
      header: `${day.dayLabel}, ${day.dateLabel}`,
      cssClass: 'modern-action-sheet',
      buttons: [
        {
          text: 'Presente',
          icon: 'checkmark-circle-outline',
          handler: () => {
            this.svc.setDayRecord(
              day.date,
              { status: 'present' },
              this.selectedCourseId ?? undefined
            );
            this.loadDays();
          },
        },
        {
          text: 'Impuntual (tardanza)',
          icon: 'time-outline',
          handler: () => {
            // Small delay so action sheet animates out before alert opens
            setTimeout(() => this.askForTimes(day), 300);
          },
        },
        {
          text: 'Falta',
          icon: 'close-circle-outline',
          role: 'destructive',
          handler: () => {
            this.svc.setDayRecord(
              day.date,
              { status: 'absent' },
              this.selectedCourseId ?? undefined
            );
            this.loadDays();
          },
        },
        {
          text: 'Sin registrar',
          icon: 'remove-circle-outline',
          handler: () => {
            this.svc.setDayRecord(
              day.date,
              { status: 'unlogged' },
              this.selectedCourseId ?? undefined
            );
            this.loadDays();
          },
        },
        { text: 'Cancelar', role: 'cancel' },
      ],
    });
    await sheet.present();
  }

  private async askForTimes(day: DayEntry): Promise<void> {
    const course = this.selectedCourseId
      ? this.svc.getCourse(this.selectedCourseId)
      : null;

    const defaultEntry = day.entryTime ?? course?.startTime ?? '09:00';
    const defaultExit =
      day.exitTime ?? this.svc.calcDefaultExitTime(course);

    const alert = await this.alertCtrl.create({
      header: 'Horario del día',
      subHeader: `${day.dayLabel}, ${day.dateLabel}`,
      cssClass: 'time-alert',
      inputs: [
        {
          name: 'entry',
          type: 'time',
          label: 'Hora de entrada',
          value: defaultEntry,
        },
        {
          name: 'exit',
          type: 'time',
          label: 'Hora de salida',
          value: defaultExit,
        },
      ],
      buttons: [
        {
          text: 'Sin horario',
          cssClass: 'alert-btn-neutral',
          handler: () => {
            this.svc.setDayRecord(
              day.date,
              { status: 'late' },
              this.selectedCourseId ?? undefined
            );
            this.loadDays();
          },
        },
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          cssClass: 'alert-btn-primary',
          handler: (data: { entry: string; exit: string }) => {
            this.svc.setDayRecord(
              day.date,
              { status: 'late', entryTime: data.entry, exitTime: data.exit },
              this.selectedCourseId ?? undefined
            );
            this.loadDays();
          },
        },
      ],
    });
    await alert.present();
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

  statusLabel(day: DayEntry): string {
    switch (day.status) {
      case 'present': return 'Presente';
      case 'absent':  return 'Falta';
      case 'late':    return 'Impuntual';
      default:        return 'Sin registrar';
    }
  }
}
