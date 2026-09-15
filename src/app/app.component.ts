import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AppModeService } from './services/app-mode.service';
import { CloudSyncService } from './services/cloud-sync.service';
import { NeonService } from './services/neon.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  constructor(
    private readonly appMode: AppModeService,
    private readonly neon: NeonService,
    private readonly router: Router,
    // Ensures cloud sync hooks are registered at startup
    private readonly _cloudSync: CloudSyncService,
  ) {}

  public async ngOnInit(): Promise<void> {
    if (!this.appMode.isOnline()) return;

    const session = await this.neon.getSession();
    const url = this.router.url;
    const onAuthFlowPage = url === '/auth' || url.startsWith('/config');
    if (!session && !onAuthFlowPage) {
      await this.router.navigateByUrl('/auth');
    }
  }
}
