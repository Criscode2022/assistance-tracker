import { TestBed } from '@angular/core/testing';
import {
  ActionSheetButton,
  ActionSheetController,
  ActionSheetOptions,
  AlertButton,
  AlertController,
  AlertOptions,
} from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { DayEntry } from '../models/attendance.model';
import { AttendanceService } from './attendance.service';
import { DayStatusPickerService } from './day-status-picker.service';
import { LanguageService } from './language.service';
import { clearBrowserStorage, createMockCourse } from '../../testing/fixtures';
import { createMockLanguageService, createMockTranslateService } from '../../testing/mocks';

function createDay(overrides: Partial<DayEntry> = {}): DayEntry {
  return {
    date: '2026-05-05',
    dateLabel: '5 may',
    dayLabel: 'Martes',
    status: 'unlogged',
    hoursAttended: 0,
    lostMinutes: 0,
    isToday: false,
    isFuture: false,
    ...overrides,
  };
}

describe('DayStatusPickerService', () => {
  let service: DayStatusPickerService;
  let svc: AttendanceService;
  let actionSheet: jasmine.SpyObj<ActionSheetController>;
  let alertCtrl: jasmine.SpyObj<AlertController>;

  beforeEach(() => {
    clearBrowserStorage();
    actionSheet = jasmine.createSpyObj('ActionSheetController', ['create']);
    alertCtrl = jasmine.createSpyObj('AlertController', ['create']);

    TestBed.configureTestingModule({
      providers: [
        DayStatusPickerService,
        AttendanceService,
        { provide: LanguageService, useValue: createMockLanguageService() },
        { provide: TranslateService, useValue: createMockTranslateService() },
        { provide: ActionSheetController, useValue: actionSheet },
        { provide: AlertController, useValue: alertCtrl },
      ],
    });

    service = TestBed.inject(DayStatusPickerService);
    svc = TestBed.inject(AttendanceService);
  });

  afterEach(() => {
    svc.clearAllData();
    clearBrowserStorage();
  });

  it('should save present after the action sheet dismisses', async () => {
    const course = createMockCourse();
    svc.saveCourse(course);

    actionSheet.create.and.callFake(async (opts?: ActionSheetOptions) => {
      const presentBtn = ((opts?.buttons ?? []) as ActionSheetButton[]).find(
        (b) => b.icon === 'checkmark-circle-outline',
      );
      return {
        present: async () => {
          presentBtn?.handler?.();
        },
        onDidDismiss: async () => ({}),
      } as unknown as HTMLIonActionSheetElement;
    });

    const changed = await service.open(createDay(), course.id);
    expect(changed).toBeTrue();
    expect(svc.getDayRecord('2026-05-05', course.id).status).toBe('present');
  });

  it('should open the late time alert after choosing late', async () => {
    const course = createMockCourse();
    svc.saveCourse(course);

    actionSheet.create.and.callFake(async (opts?: ActionSheetOptions) => {
      const lateBtn = ((opts?.buttons ?? []) as ActionSheetButton[]).find(
        (b) => b.icon === 'time-outline',
      );
      return {
        present: async () => {
          lateBtn?.handler?.();
        },
        onDidDismiss: async () => ({}),
      } as unknown as HTMLIonActionSheetElement;
    });

    alertCtrl.create.and.callFake(async (opts?: AlertOptions) => {
      const saveBtn = ((opts?.buttons ?? []) as AlertButton[]).find(
        (b) => b.cssClass === 'alert-btn-primary',
      );
      return {
        present: async () => {
          saveBtn?.handler?.({ entry: '09:15', exit: '14:00' });
        },
        onDidDismiss: async () => ({}),
      } as unknown as HTMLIonAlertElement;
    });

    const changed = await service.open(createDay(), course.id);
    expect(changed).toBeTrue();
    expect(alertCtrl.create).toHaveBeenCalled();
    expect(svc.getDayRecord('2026-05-05', course.id)).toEqual({
      status: 'late',
      entryTime: '09:15',
      exitTime: '14:00',
    });
  });
});
