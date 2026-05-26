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
  isOnline = false;
  private sub?: Subscription;

  constructor(private appMode: AppModeService) {}

  ngOnInit(): void {
    this.isOnline = this.appMode.isOnline();
    this.sub = this.appMode.watchMode().subscribe((mode) => {
      this.isOnline = mode === 'online';
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
