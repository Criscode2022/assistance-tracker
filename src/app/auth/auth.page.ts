import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NavController, ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { AttendanceService } from '../services/attendance.service';
import { AppModeService } from '../services/app-mode.service';
import { CloudSyncService } from '../services/cloud-sync.service';
import { NeonService } from '../services/neon.service';
import { AuthFlowNavigationService } from '../services/auth-flow-navigation.service';

type AuthTab = 'signin' | 'signup';

@Component({
  selector: 'app-auth',
  templateUrl: 'auth.page.html',
  styleUrls: ['auth.page.scss'],
  standalone: false,
})
export class AuthPage implements OnInit {
  protected tab: AuthTab = 'signup';
  protected email = '';
  protected password = '';
  protected name = '';
  protected loading = false;
  protected hasOfflineData = false;

  constructor(
    private readonly nav: NavController,
    private readonly toast: ToastController,
    private readonly neon: NeonService,
    private readonly appMode: AppModeService,
    private readonly cloudSync: CloudSyncService,
    private readonly attendance: AttendanceService,
    private readonly translate: TranslateService,
    private readonly authFlowNav: AuthFlowNavigationService,
    private readonly cdr: ChangeDetectorRef,
    private readonly route: ActivatedRoute,
  ) {}

  public ngOnInit(): void {
    this.hasOfflineData = this.attendance.hasLocalData();
    const requestedTab = this.route.snapshot.queryParamMap.get('tab');
    if (requestedTab === 'signin' || requestedTab === 'signup') {
      this.tab = requestedTab;
      return;
    }
    if (this.hasOfflineData) {
      this.tab = 'signup';
    }
  }

  protected goBack(): void {
    void this.authFlowNav.exitToDashboard();
  }

  protected setTab(tab: AuthTab): void {
    this.tab = tab;
  }

  protected async submit(): Promise<void> {
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
      this.cdr.detectChanges();
    }
  }

  private async handleSignUp(): Promise<void> {
    const displayName =
      this.name.trim() ||
      this.email.split('@')[0] ||
      this.translate.instant('COMMON.USER');
    const result = await this.neon.signUp(this.email.trim(), this.password, displayName);

    if (result.error) {
      await this.showToast(this.neon.getAuthErrorMessage(result.error), 'danger');
      return;
    }

    if (this.hasOfflineData) {
      try {
        const userId = result.data?.user?.id;
        const stats = await this.cloudSync.uploadLocalData(userId);
        await this.showToast(
          this.translate.instant('AUTH.ACCOUNT_CREATED_UPLOAD', {
            courses: stats.courses,
            records: stats.records,
          }),
          'success',
        );
      } catch (uploadErr) {
        const msg =
          uploadErr instanceof Error
            ? uploadErr.message
            : this.translate.instant('AUTH.UPLOAD_ERROR');
        await this.showToast(
          this.translate.instant('AUTH.ACCOUNT_CREATED_UPLOAD_FAIL', { msg }),
          'warning',
        );
      }
    } else {
      await this.showToast(this.translate.instant('AUTH.ACCOUNT_CREATED'), 'success');
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
      await this.showToast(this.translate.instant('AUTH.SIGNIN_OK'), 'success');
    } catch (syncErr) {
      const msg =
        syncErr instanceof Error
          ? syncErr.message
          : this.translate.instant('AUTH.SYNC_ERROR');
      await this.showToast(
        this.translate.instant('AUTH.SIGNIN_SYNC_FAIL', { msg }),
        'warning',
      );
    }

    this.appMode.enableOnlineMode();
    this.nav.navigateRoot('/');
  }

  private async showToast(message: string, color: string): Promise<void> {
    const t = await this.toast.create({ message, duration: 3500, color, position: 'top' });
    await t.present();
  }
}
