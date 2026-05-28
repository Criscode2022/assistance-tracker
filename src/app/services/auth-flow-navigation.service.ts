import { Injectable } from '@angular/core';
import { NavController } from '@ionic/angular';
import { AppModeService } from './app-mode.service';
import { NeonService } from './neon.service';

/** Leaves config/auth without trapping the user in an online-mode auth redirect loop. */
@Injectable({ providedIn: 'root' })
export class AuthFlowNavigationService {
  constructor(
    private nav: NavController,
    private appMode: AppModeService,
    private neon: NeonService,
  ) {}

  async exitToDashboard(): Promise<void> {
    this.appMode.clearOnlineIntent();
    if (this.appMode.isOnline()) {
      const session = await this.neon.getSession();
      if (!session) {
        await this.neon.signOut();
        this.appMode.disableOnlineMode();
      }
    }
    await this.nav.navigateRoot('/dashboard');
  }
}
