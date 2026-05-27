import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { NavController, AlertController, ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService, NotificationSettings } from '../services/notification.service';
import { AttendanceService } from '../services/attendance.service';
import { AppModeService } from '../services/app-mode.service';
import { NeonService, AuthUser } from '../services/neon.service';
import { AppLanguage, LanguageService } from '../services/language.service';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-config',
  templateUrl: 'config.page.html',
  styleUrls: ['config.page.scss'],
  standalone: false,
})
export class ConfigPage {
  settings: NotificationSettings;
  permissionStatus: NotificationPermission | 'unsupported' = 'unsupported';
  testSent = false;
  onlineMode = false;
  onlineUser: AuthUser | null = null;
  switchingMode = false;
  currentLang: AppLanguage = 'es';
  darkMode = false;

  constructor(
    private nav: NavController,
    private router: Router,
    private notifSvc: NotificationService,
    private attendanceSvc: AttendanceService,
    private alertCtrl: AlertController,
    private appMode: AppModeService,
    private neon: NeonService,
    private toast: ToastController,
    private translate: TranslateService,
    private lang: LanguageService,
    private theme: ThemeService,
  ) {
    this.settings = this.notifSvc.getSettings();
    this.permissionStatus = this.notifSvc.getPermission();
  }

  ionViewWillEnter(): void {
    this.settings = this.notifSvc.getSettings();
    this.permissionStatus = this.notifSvc.getPermission();
    this.testSent = false;
    this.onlineMode = this.appMode.isOnline() || this.appMode.hasOnlineIntent();
    this.currentLang = this.lang.current;
    this.darkMode = this.theme.isDark;
    void this.loadOnlineUser();
  }

  onDarkModeChange(event: CustomEvent): void {
    this.theme.onToggleChange(!!event.detail.checked);
    this.darkMode = this.theme.isDark;
  }

  private async loadOnlineUser(): Promise<void> {
    this.onlineUser = this.appMode.isOnline() ? await this.neon.getUser() : null;
  }

  get onlineActive(): boolean {
    return this.appMode.isOnline();
  }

  get onlinePending(): boolean {
    return this.appMode.hasOnlineIntent();
  }

  onLanguageChange(event: CustomEvent): void {
    const value = event.detail.value as AppLanguage;
    this.currentLang = value;
    this.lang.setLanguage(value);
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
        await this.showToast(this.translate.instant('ONLINE.ENABLED'), 'success');
      } else {
        this.goToAuth();
      }
      return;
    }

    const alert = await this.alertCtrl.create({
      header: this.translate.instant('ONLINE.DISABLE_HEADER'),
      message: this.translate.instant('ONLINE.DISABLE_MSG'),
      buttons: [
        {
          text: this.translate.instant('COMMON.CANCEL'),
          role: 'cancel',
          handler: () => { this.onlineMode = true; },
        },
        {
          text: this.translate.instant('ONLINE.DISABLE_BTN'),
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
      await this.showToast(this.translate.instant('ONLINE.DISABLED'), 'medium');
    } finally {
      this.switchingMode = false;
    }
  }

  async signOutOnline(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('ONLINE.SIGNOUT_HEADER'),
      message: this.translate.instant('ONLINE.SIGNOUT_MSG'),
      buttons: [
        { text: this.translate.instant('COMMON.CANCEL'), role: 'cancel' },
        {
          text: this.translate.instant('ONLINE.SIGN_OUT'),
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

  async goBack(): Promise<void> {
    await this.nav.pop();
    if (this.router.url.startsWith('/config')) {
      await this.router.navigateByUrl('/dashboard');
    }
  }

  get notifSupported(): boolean {
    return this.notifSvc.isSupported();
  }

  get permissionGranted(): boolean {
    return this.permissionStatus === 'granted';
  }

  get permissionDenied(): boolean {
    return this.permissionStatus === 'denied';
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

  async confirmDeleteAll(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: this.translate.instant('CONFIG.DELETE_ALL_HEADER'),
      message: this.translate.instant('CONFIG.DELETE_ALL_MSG'),
      cssClass: 'danger-alert',
      buttons: [
        { text: this.translate.instant('COMMON.CANCEL'), role: 'cancel' },
        {
          text: this.translate.instant('CONFIG.DELETE_ALL_BTN'),
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
