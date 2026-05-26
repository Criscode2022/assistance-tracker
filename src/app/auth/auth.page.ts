import { Component, OnInit } from '@angular/core';
import { NavController, ToastController } from '@ionic/angular';
import { AttendanceService } from '../services/attendance.service';
import { AppModeService } from '../services/app-mode.service';
import { CloudSyncService } from '../services/cloud-sync.service';
import { NeonService } from '../services/neon.service';

type AuthTab = 'signin' | 'signup';

@Component({
  selector: 'app-auth',
  templateUrl: 'auth.page.html',
  styleUrls: ['auth.page.scss'],
  standalone: false,
})
export class AuthPage implements OnInit {
  tab: AuthTab = 'signup';
  email = '';
  password = '';
  name = '';
  loading = false;
  hasOfflineData = false;

  constructor(
    private nav: NavController,
    private toast: ToastController,
    private neon: NeonService,
    private appMode: AppModeService,
    private cloudSync: CloudSyncService,
    private attendance: AttendanceService,
  ) {}

  ngOnInit(): void {
    this.hasOfflineData = this.attendance.hasLocalData();
    if (this.hasOfflineData) {
      this.tab = 'signup';
    }
  }

  goBack(): void {
    this.appMode.clearOnlineIntent();
    this.nav.navigateBack('/config');
  }

  setTab(tab: AuthTab): void {
    this.tab = tab;
  }

  async submit(): Promise<void> {
    if (this.loading) return;
    this.loading = true;

    try {
      if (this.tab === 'signup') {
        await this.handleSignUp();
      } else {
        await this.handleSignIn();
      }
    } catch (err) {
      await this.showToast(this.neon.getAuthErrorMessage(err), 'danger');
    } finally {
      this.loading = false;
    }
  }

  private async handleSignUp(): Promise<void> {
    const displayName = this.name.trim() || this.email.split('@')[0] || 'Usuario';
    const result = await this.neon.signUp(this.email.trim(), this.password, displayName);

    if (result.error) {
      await this.showToast(this.neon.getAuthErrorMessage(result.error), 'danger');
      return;
    }

    if (this.hasOfflineData) {
      try {
        const stats = await this.cloudSync.uploadLocalData();
        await this.showToast(
          `Cuenta creada. ${stats.courses} curso(s) y ${stats.records} registro(s) subidos.`,
          'success',
        );
      } catch (uploadErr) {
        const msg =
          uploadErr instanceof Error ? uploadErr.message : 'Error al subir datos';
        await this.showToast(`Cuenta creada, pero falló la subida: ${msg}`, 'warning');
      }
    } else {
      await this.showToast('Cuenta creada correctamente', 'success');
    }

    this.appMode.enableOnlineMode();
    this.nav.navigateRoot('/');
  }

  private async handleSignIn(): Promise<void> {
    const result = await this.neon.signIn(this.email.trim(), this.password);

    if (result.error) {
      await this.showToast(this.neon.getAuthErrorMessage(result.error), 'danger');
      return;
    }

    try {
      await this.cloudSync.downloadFromCloud();
      await this.showToast('Sesión iniciada. Datos sincronizados desde la nube.', 'success');
    } catch (syncErr) {
      const msg = syncErr instanceof Error ? syncErr.message : 'Error de sincronización';
      await this.showToast(`Sesión iniciada, pero falló la sincronización: ${msg}`, 'warning');
    }

    this.appMode.enableOnlineMode();
    this.nav.navigateRoot('/');
  }

  private async showToast(message: string, color: string): Promise<void> {
    const t = await this.toast.create({ message, duration: 3500, color, position: 'top' });
    await t.present();
  }
}
