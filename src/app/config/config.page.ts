import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NavController, AlertController, ToastController } from '@ionic/angular';
import { NotificationService, NotificationSettings } from '../services/notification.service';
import { AttendanceService } from '../services/attendance.service';
import { AppModeService } from '../services/app-mode.service';
import { NeonService, AuthUser } from '../services/neon.service';

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
  onlineMode = false;
  onlineUser: AuthUser | null = null;
  switchingMode = false;

  constructor(
    private nav: NavController,
    private router: Router,
    private notifSvc: NotificationService,
    private attendanceSvc: AttendanceService,
    private alertCtrl: AlertController,
    private appMode: AppModeService,
    private neon: NeonService,
    private toast: ToastController,
  ) {}

  async ionViewWillEnter(): Promise<void> {
    this.settings = this.notifSvc.getSettings();
    this.permissionStatus = this.notifSvc.getPermission();
    this.testSent = false;
    this.onlineMode = this.appMode.isOnline() || this.appMode.hasOnlineIntent();
    this.onlineUser = this.appMode.isOnline() ? await this.neon.getUser() : null;
  }

  get onlineActive(): boolean {
    return this.appMode.isOnline();
  }

  get onlinePending(): boolean {
    return this.appMode.hasOnlineIntent();
  }

  goToAuth(): void {
    this.appMode.setOnlineIntent();
    this.onlineMode = true;
    void this.router.navigate(['/auth']);
  }

  async onOnlineModeChange(event: CustomEvent): Promise<void> {
    const enabled = event.detail.checked;

    if (enabled) {
      this.appMode.setOnlineIntent();
      const session = await this.neon.getSession();
      if (session) {
        this.appMode.enableOnlineMode();
        this.onlineMode = true;
        this.onlineUser = await this.neon.getUser();
        await this.showToast('Modo en línea activado', 'success');
      } else {
        this.goToAuth();
      }
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Volver al modo sin conexión',
      message:
        'Dejarás de sincronizar con la nube. Tus datos locales se conservarán en este dispositivo.',
      buttons: [
        { text: 'Cancelar', role: 'cancel', handler: () => { this.onlineMode = true; } },
        {
          text: 'Desactivar',
          handler: () => void this.disableOnlineMode(),
        },
      ],
    });
    await alert.present();
  }

  private async disableOnlineMode(): Promise<void> {
    this.switchingMode = true;
    try {
      await this.neon.signOut();
      this.appMode.disableOnlineMode();
      this.onlineMode = false;
      this.onlineUser = null;
      await this.showToast('Modo sin conexión activado', 'medium');
    } finally {
      this.switchingMode = false;
    }
  }

  async signOutOnline(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Cerrar sesión',
      message: 'Se cerrará tu sesión en la nube. Tus datos locales se mantendrán.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Cerrar sesión',
          handler: () => void this.disableOnlineMode(),
        },
      ],
    });
    await alert.present();
  }

  private async showToast(message: string, color: string): Promise<void> {
    const t = await this.toast.create({ message, duration: 2500, color, position: 'top' });
    await t.present();
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
