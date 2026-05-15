import { Component } from '@angular/core';
import { NavController, AlertController } from '@ionic/angular';
import { NotificationService, NotificationSettings } from '../services/notification.service';
import { AttendanceService } from '../services/attendance.service';

@Component({
  selector: 'app-config',
  templateUrl: 'config.page.html',
  styleUrls: ['config.page.scss'],
  standalone: false,
})
export class ConfigPage {
  settings!: NotificationSettings;
  permissionStatus: NotificationPermission | 'unsupported' = 'unsupported';
  testSent = false;

  constructor(
    private nav: NavController,
    private notifSvc: NotificationService,
    private attendanceSvc: AttendanceService,
    private alertCtrl: AlertController,
  ) {}

  ionViewWillEnter(): void {
    this.settings = this.notifSvc.getSettings();
    this.permissionStatus = this.notifSvc.getPermission();
    this.testSent = false;
  }

  goBack(): void {
    this.nav.back();
  }

  // ── Notifications ─────────────────────────────────────────────────────────────

  get notifSupported(): boolean {
    return this.notifSvc.isSupported();
  }

  get permissionGranted(): boolean {
    return this.permissionStatus === 'granted';
  }

  get permissionDenied(): boolean {
    return this.permissionStatus === 'denied';
  }

  get permissionDefault(): boolean {
    return this.permissionStatus === 'default';
  }

  onSettingChange(): void {
    this.notifSvc.saveSettings(this.settings);
  }

  async requestPermission(): Promise<void> {
    const result = await this.notifSvc.requestPermission();
    this.permissionStatus = result;
    if (result === 'granted') {
      this.notifSvc.saveSettings(this.settings);
    }
  }

  async sendTestNotification(): Promise<void> {
    if (this.permissionStatus !== 'granted') {
      await this.requestPermission();
    }
    if (this.permissionStatus !== 'granted') return;

    await this.notifSvc.showTestNotification();
    this.testSent = true;
    setTimeout(() => (this.testSent = false), 3000);
  }

  // ── Danger zone ───────────────────────────────────────────────────────────────

  async confirmDeleteAll(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Borrar todos los datos',
      message: 'Se eliminarán todos los cursos, registros de asistencia y configuración. Esta acción no se puede deshacer.',
      cssClass: 'danger-alert',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Borrar todo',
          role: 'destructive',
          cssClass: 'alert-btn-danger',
          handler: () => {
            this.attendanceSvc.clearAllData();
            this.settings = this.notifSvc.getSettings();
            this.nav.navigateRoot('/');
          },
        },
      ],
    });
    await alert.present();
  }
}
