import { Injectable } from '@angular/core';

export interface NotificationSettings {
  dailyReminder: boolean;
  dailyReminderTime: string;
  weeklySummary: boolean;
  absenceAlert: boolean;
  tardinessAlert: boolean;
  attendanceAlert: boolean;
}

const STORAGE_KEY = 'notification_settings_v1';

const DEFAULTS: NotificationSettings = {
  dailyReminder: false,
  dailyReminderTime: '08:00',
  weeklySummary: false,
  absenceAlert: true,
  tardinessAlert: true,
  attendanceAlert: true,
};

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private settings: NotificationSettings = { ...DEFAULTS };
  private dailyCheckInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.loadSettings();
    this.scheduleChecks();
  }

  // ── Settings ────────────────────────────────────────────────────────────────

  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  saveSettings(s: NotificationSettings): void {
    this.settings = { ...s };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    this.scheduleChecks();
  }

  private loadSettings(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) this.settings = { ...DEFAULTS, ...JSON.parse(raw) };
    } catch {
      this.settings = { ...DEFAULTS };
    }
  }

  // ── Permission ───────────────────────────────────────────────────────────────

  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  getPermission(): NotificationPermission | 'unsupported' {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission;
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) return 'denied';
    return Notification.requestPermission();
  }

  // ── Show notification ────────────────────────────────────────────────────────

  async showNotification(title: string, body: string): Promise<void> {
    if (!this.isSupported() || Notification.permission !== 'granted') return;

    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.getRegistration();
        if (reg) {
          await reg.showNotification(title, {
            body,
            icon: 'assets/icon/icon-192.png',
            badge: 'assets/icon/icon-96.png',
          });
          return;
        }
      }
    } catch {
      // fall through to basic Notification
    }

    new Notification(title, {
      body,
      icon: 'assets/icon/icon-192.png',
    });
  }

  async showTestNotification(): Promise<void> {
    const perm = await this.requestPermission();
    if (perm !== 'granted') return;
    await this.showNotification(
      'Presencia — Prueba',
      'Las notificaciones funcionan correctamente.'
    );
  }

  // ── Scheduled checks (runs while app is open) ───────────────────────────────

  private scheduleChecks(): void {
    if (this.dailyCheckInterval !== null) {
      clearInterval(this.dailyCheckInterval);
      this.dailyCheckInterval = null;
    }
    if (!this.isSupported() || Notification.permission !== 'granted') return;
    if (!this.settings.dailyReminder && !this.settings.weeklySummary) return;

    this.dailyCheckInterval = setInterval(() => this.runChecks(), 60_000);
  }

  private runChecks(): void {
    const now = new Date();
    const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    if (this.settings.dailyReminder && hhmm === this.settings.dailyReminderTime) {
      const day = now.getDay();
      if (day >= 1 && day <= 5) {
        this.showNotification('Presencia — Recordatorio', 'Recuerda registrar tu asistencia de hoy.');
      }
    }

    if (this.settings.weeklySummary && now.getDay() === 5 && hhmm === '17:00') {
      this.showNotification('Presencia — Resumen semanal', 'Revisa el resumen de asistencia de esta semana.');
    }
  }

  // Called by AttendanceService hooks

  async notifyAbsenceLimit(remaining: number): Promise<void> {
    if (!this.settings.absenceAlert) return;
    await this.showNotification(
      'Presencia — Alerta de faltas',
      remaining <= 0
        ? 'Has alcanzado el límite de faltas del mes.'
        : `Solo te queda ${remaining} falta${remaining === 1 ? '' : 's'} permitida${remaining === 1 ? '' : 's'} este mes.`
    );
  }

  async notifyTardinessLimit(remaining: number): Promise<void> {
    if (!this.settings.tardinessAlert) return;
    await this.showNotification(
      'Presencia — Alerta de impuntualidades',
      remaining <= 0
        ? 'Has alcanzado el límite de impuntualidades del mes.'
        : `Solo te quedan ${remaining} impuntualidad${remaining === 1 ? '' : 'es'} permitida${remaining === 1 ? '' : 's'} este mes.`
    );
  }

  async notifyAttendanceWarning(percent: number, minPercent: number): Promise<void> {
    if (!this.settings.attendanceAlert) return;
    await this.showNotification(
      'Presencia — Asistencia baja',
      `Tu asistencia es del ${Math.round(percent)}%, por debajo del mínimo requerido (${minPercent}%).`
    );
  }
}
