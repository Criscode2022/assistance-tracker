import { TestBed } from '@angular/core/testing';
import { NotificationService } from './notification.service';
import { clearBrowserStorage } from '../../testing/fixtures';

describe('NotificationService', () => {
  let service: NotificationService;
  const originalNotification = window.Notification;

  beforeEach(() => {
    clearBrowserStorage();
    TestBed.configureTestingModule({});
    service = TestBed.inject(NotificationService);
  });

  afterEach(() => {
    clearBrowserStorage();
    (window as Window & { Notification?: typeof Notification }).Notification =
      originalNotification;
  });

  it('should return default settings when storage is empty', () => {
    const settings = service.getSettings();
    expect(settings.dailyReminder).toBeFalse();
    expect(settings.absenceAlert).toBeTrue();
    expect(settings.dailyReminderTime).toBe('08:00');
  });

  it('should save and load settings from localStorage', () => {
    service.saveSettings({
      dailyReminder: true,
      dailyReminderTime: '09:30',
      weeklySummary: true,
      absenceAlert: false,
      tardinessAlert: true,
      attendanceAlert: false,
    });

    const raw = localStorage.getItem('notification_settings_v1');
    expect(raw).toBeTruthy();

    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    const reloaded = TestBed.inject(NotificationService);
    expect(reloaded.getSettings().dailyReminderTime).toBe('09:30');
    expect(reloaded.getSettings().absenceAlert).toBeFalse();
  });

  it('should return permission status when notifications are supported', () => {
    if (!service.isSupported()) {
      expect(service.getPermission()).toBe('unsupported');
      return;
    }
    expect(['default', 'granted', 'denied']).toContain(service.getPermission());
  });

  it('should skip alert notifications when disabled in settings', async () => {
    service.saveSettings({
      ...service.getSettings(),
      absenceAlert: false,
      tardinessAlert: false,
      attendanceAlert: false,
    });
    const showSpy = spyOn(service, 'showNotification').and.returnValue(Promise.resolve());

    await service.notifyAbsenceLimit(1);
    await service.notifyTardinessLimit(2);
    await service.notifyAttendanceWarning(60, 75);

    expect(showSpy).not.toHaveBeenCalled();
  });
});
