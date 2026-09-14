import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { AppModeService } from '../services/app-mode.service';

@Component({
  selector: 'app-online-indicator',
  templateUrl: './online-indicator.component.html',
  styleUrls: ['./online-indicator.component.scss'],
  standalone: false,
})
export class OnlineIndicatorComponent implements OnInit, OnDestroy {
  protected isOnline = false;
  private sub?: Subscription;

  constructor(private readonly appMode: AppModeService) {}

  public ngOnInit(): void {
    this.isOnline = this.appMode.isOnline();
    this.sub = this.appMode.watchMode().subscribe((mode) => {
      this.isOnline = mode === 'online';
    });
  }

  public ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
