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
    private appMode: AppModeService,
    private neon: NeonService,
    private router: Router,
    // Ensures cloud sync hooks are registered at startup
    private _cloudSync: CloudSyncService,
  ) {}

  async ngOnInit(): Promise<void> {
    if (!this.appMode.isOnline()) return;

    const session = await this.neon.getSession();
    if (!session && this.router.url !== '/auth') {
      await this.router.navigateByUrl('/auth');
    }
  }
}
