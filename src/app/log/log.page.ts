import { Component, OnInit } from '@angular/core';
import { ActionSheetController } from '@ionic/angular';
import { AttendanceService } from '../services/attendance.service';
import { AttendanceStatus, DayEntry } from '../models/attendance.model';

@Component({
  selector: 'app-log',
  templateUrl: 'log.page.html',
  styleUrls: ['log.page.scss'],
  standalone: false,
})
export class LogPage implements OnInit {
  days: DayEntry[] = [];
  currentMonth!: string;

  constructor(
    private svc: AttendanceService,
    private actionSheet: ActionSheetController
  ) {}

  ngOnInit(): void {
    this.currentMonth = this.svc.getCurrentMonth();
    this.loadDays();
  }

  ionViewWillEnter(): void {
    this.loadDays();
  }

  loadDays(): void {
    this.days = this.svc.getDayEntriesForMonth(this.currentMonth);
  }

  get monthLabel(): string {
    const d = new Date(this.currentMonth + '-15');
    const label = d.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  async openStatusPicker(day: DayEntry): Promise<void> {
    if (day.isFuture) return;

    const sheet = await this.actionSheet.create({
      header: `${day.dayLabel}, ${day.dateLabel}`,
      buttons: [
        {
          text: 'Presente',
          icon: 'checkmark-circle-outline',
          handler: () => this.setStatus(day.date, 'present'),
        },
        {
          text: 'Impuntual (tardanza)',
          icon: 'time-outline',
          handler: () => this.setStatus(day.date, 'late'),
        },
        {
          text: 'Falta',
          icon: 'close-circle-outline',
          role: 'destructive',
          handler: () => this.setStatus(day.date, 'absent'),
        },
        {
          text: 'Sin registrar',
          icon: 'remove-circle-outline',
          handler: () => this.setStatus(day.date, 'unlogged'),
        },
        {
          text: 'Cancelar',
          role: 'cancel',
        },
      ],
    });
    await sheet.present();
  }

  private setStatus(date: string, status: AttendanceStatus): void {
    this.svc.setRecord(date, status);
    this.loadDays();
  }

  statusIcon(status: AttendanceStatus): string {
    switch (status) {
      case 'present': return 'checkmark-circle';
      case 'absent':  return 'close-circle';
      case 'late':    return 'time';
      default:        return 'ellipse-outline';
    }
  }

  statusColor(status: AttendanceStatus): string {
    switch (status) {
      case 'present': return 'success';
      case 'absent':  return 'danger';
      case 'late':    return 'warning';
      default:        return 'medium';
    }
  }

  statusLabel(status: AttendanceStatus): string {
    switch (status) {
      case 'present': return 'Presente';
      case 'absent':  return 'Falta';
      case 'late':    return 'Impuntual';
      default:        return 'Sin registrar';
    }
  }
}
