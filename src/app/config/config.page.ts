import { ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { NavController, AlertController, ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService, NotificationSettings } from '../services/notification.service';
import { AttendanceService } from '../services/attendance.service';
import { AppModeService } from '../services/app-mode.service';
import { NeonService, AuthUser } from '../services/neon.service';
import { AppLanguage, LanguageService } from '../services/language.service';
import { ThemeService } from '../services/theme.service';
import { AuthFlowNavigationService } from '../services/auth-flow-navigation.service';

@Component({
  selector: 'app-config',
  templateUrl: 'config.page.html',
  styleUrls: ['config.page.scss'],
  standalone: false,
})
export class ConfigPage {
  protected settings: NotificationSettings;
  protected permissionStatus: NotificationPermission | 'unsupported' = 'unsupported';
  protected testSent = false;
  protected onlineMode = false;
  protected onlineUser: AuthUser | null = null;
  protected switchingMode = false;
  protected currentLang: AppLanguage = 'es';
  protected darkMode = false;

  constructor(
    private readonly nav: NavController,
    private readonly router: Router,
    private readonly notifSvc: NotificationService,
    private readonly attendanceSvc: AttendanceService,
    private readonly alertCtrl: AlertController,
    private readonly appMode: AppModeService,
    private readonly neon: NeonService,
    private readonly toast: ToastController,
    private readonly translate: TranslateService,
    private readonly lang: LanguageService,
    private readonly theme: ThemeService,
    private readonly authFlowNav: AuthFlowNavigationService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.settings = this.notifSvc.getSettings();
    this.permissionStatus = this.notifSvc.getPermission();
  }

  public ionViewWillEnter(): void {
    this.settings = this.notifSvc.getSettings();
    this.permissionStatus = this.notifSvc.getPermission();
    this.testSent = false;
    this.onlineMode = this.appMode.isOnline() || this.appMode.hasOnlineIntent();
    this.currentLang = this.lang.current;
    this.darkMode = this.theme.isDark;
    void this.loadOnlineUser();
  }

  protected onDarkModeChange(event: CustomEvent): void {
    this.theme.onToggleChange(!!event.detail.checked);
    this.darkMode = this.theme.isDark;
  }

  private async loadOnlineUser(): Promise<void> {
    this.onlineUser = this.appMode.isOnline() ? await this.neon.getUser() : null;
    this.cdr.detectChanges();
  }

  protected get onlineActive(): boolean {
    return this.appMode.isOnline();
  }

  protected get onlinePending(): boolean {
    return this.appMode.hasOnlineIntent();
  }

  protected onLanguageChange(event: CustomEvent): void {
    const value = event.detail.value as AppLanguage;
    this.currentLang = value;
    this.lang.setLanguage(value);
  }

  protected goToAuth(): void {
    this.appMode.setOnlineIntent();
    this.onlineMode = true;
    void this.router.navigate(['/auth']);
  }

  protected async onOnlineModeChange(event: CustomEvent): Promise<void> {
    const enabled = event.detail.checked;

    if (enabled) {
      this.appMode.setOnlineIntent();
      const session = await this.neon.getSession();
      if (session) {
        this.appMode.enableOnlineMode();
        this.onlineMode = true;
        this.onlineUser = await this.neon.getUser();
        this.cdr.detectChanges();
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
      this.cdr.detectChanges();
      await this.showToast(this.translate.instant('ONLINE.DISABLED'), 'medium');
    } finally {
      this.switchingMode = false;
      this.cdr.detectChanges();
    }
  }

  protected async signOutOnline(): Promise<void> {
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

  protected goBack(): void {
    void this.authFlowNav.exitToDashboard();
  }

  protected get notifSupported(): boolean {
    return this.notifSvc.isSupported();
  }

  protected get permissionGranted(): boolean {
    return this.permissionStatus === 'granted';
  }

  protected get permissionDenied(): boolean {
    return this.permissionStatus === 'denied';
  }

  protected onSettingChange(): void {
    this.notifSvc.saveSettings(this.settings);
  }

  protected async requestPermission(): Promise<void> {
    const result = await this.notifSvc.requestPermission();
    this.permissionStatus = result;
    if (result === 'granted') {
      this.notifSvc.saveSettings(this.settings);
    }
  }

  protected async sendTestNotification(): Promise<void> {
    if (this.permissionStatus !== 'granted') {
      await this.requestPermission();
    }
    if (this.permissionStatus !== 'granted') return;

    await this.notifSvc.showTestNotification();
    this.testSent = true;
    setTimeout(() => (this.testSent = false), 3000);
  }

  protected async confirmDeleteAll(): Promise<void> {
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
