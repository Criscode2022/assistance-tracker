import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TranslateModule } from '@ngx-translate/core';
import { HistoryPage } from './history.page';
import { AttendanceService } from '../services/attendance.service';
import { LanguageService } from '../services/language.service';
import { clearBrowserStorage, createMockCourse } from '../../testing/fixtures';
import { createMockLanguageService } from '../../testing/mocks';

describe('HistoryPage', () => {
  let component: HistoryPage;
  let svc: AttendanceService;

  beforeEach(() => {
    clearBrowserStorage();
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date('2026-05-15T12:00:00'));

    TestBed.configureTestingModule({
      declarations: [HistoryPage],
      imports: [TranslateModule.forRoot()],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        AttendanceService,
        { provide: LanguageService, useValue: createMockLanguageService() },
      ],
    });

    component = TestBed.createComponent(HistoryPage).componentInstance;
    svc = TestBed.inject(AttendanceService);
  });

  afterEach(() => {
    jasmine.clock().uninstall();
    svc.clearAllData();
    clearBrowserStorage();
  });

  it('should build month stats list for each course month', () => {
    const course = createMockCourse({
      startDate: '2026-04-01',
      endDate: '2026-06-30',
    });
    svc.saveCourse(course);
    svc.setDayRecord('2026-05-05', { status: 'present' }, course.id);
    component.ionViewWillEnter();

    expect(component.monthStatsList.length).toBe(3);
    expect(component.monthStatsList.every((s) => s.monthLabel.startsWith('Month'))).toBeTrue();
  });

  it('should reload when course changes', () => {
    const a = createMockCourse({
      id: 'a',
      startDate: '2026-03-01',
      endDate: '2026-05-31',
    });
    const b = createMockCourse({
      id: 'b',
      name: 'Otro',
      startDate: '2026-04-01',
      endDate: '2026-04-30',
    });
    svc.saveCourse(a);
    svc.saveCourse(b);
    component.ionViewWillEnter();

    expect(component.monthStatsList.length).toBe(3);
    component.selectedCourseId = 'b';
    component.onCourseChange();

    expect(component.monthStatsList.length).toBe(1);
    expect(component.monthStatsList[0].month).toBe('2026-04');
  });

  it('should map status color and icon', () => {
    expect(component.statusColor({ overallStatus: 'ok' } as never)).toBe('success');
    expect(component.statusColor({ overallStatus: 'warning' } as never)).toBe('warning');
    expect(component.statusIcon({ overallStatus: 'failed' } as never)).toBe('close-circle');
  });
});
