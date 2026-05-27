import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { OnlineIndicatorComponent } from './online-indicator.component';
import { AppModeService } from '../services/app-mode.service';
import { clearBrowserStorage } from '../../testing/fixtures';

describe('OnlineIndicatorComponent', () => {
  let fixture: ComponentFixture<OnlineIndicatorComponent>;
  let appMode: AppModeService;

  beforeEach(async () => {
    clearBrowserStorage();
    await TestBed.configureTestingModule({
      declarations: [OnlineIndicatorComponent],
      imports: [IonicModule.forRoot(), TranslateModule.forRoot()],
      providers: [AppModeService],
    }).compileComponents();

    fixture = TestBed.createComponent(OnlineIndicatorComponent);
    appMode = TestBed.inject(AppModeService);
    fixture.detectChanges();
  });

  afterEach(() => clearBrowserStorage());

  it('should show offline by default', () => {
    expect(fixture.componentInstance.isOnline).toBeFalse();
  });

  it('should reflect online mode changes', () => {
    appMode.enableOnlineMode();
    expect(fixture.componentInstance.isOnline).toBeTrue();

    appMode.disableOnlineMode();
    expect(fixture.componentInstance.isOnline).toBeFalse();
  });
});
