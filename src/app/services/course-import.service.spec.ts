import { TestBed } from '@angular/core/testing';
import { AlertController, AlertOptions, ToastController } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { CourseExport } from '../models/attendance.model';
import { AttendanceService } from './attendance.service';
import { CourseImportService } from './course-import.service';
import { LanguageService } from './language.service';
import { clearBrowserStorage, createMockCourse } from '../../testing/fixtures';
import { createMockLanguageService, createMockTranslateService } from '../../testing/mocks';

describe('CourseImportService', () => {
  let service: CourseImportService;
  let attendance: AttendanceService;
  let alertCtrl: jasmine.SpyObj<AlertController>;
  let toastCtrl: jasmine.SpyObj<ToastController>;
  let importHandler: (() => void) | undefined;
  let toastPresent: jasmine.Spy;

  function jsonFile(contents: string): File {
    return new File([contents], 'cursos.json', { type: 'application/json' });
  }

  beforeEach(() => {
    clearBrowserStorage();
    importHandler = undefined;
    toastPresent = jasmine.createSpy('present').and.resolveTo();

    alertCtrl = jasmine.createSpyObj('AlertController', ['create']);
    alertCtrl.create.and.callFake(async (opts?: AlertOptions) => {
      const buttons = opts?.buttons ?? [];
      const confirm = buttons.find((button) => typeof button !== 'string' && button.role !== 'cancel');
      importHandler = typeof confirm === 'object' ? confirm.handler as (() => void) | undefined : undefined;
      return {
        present: () => Promise.resolve(),
        onDidDismiss: () => Promise.resolve({}),
      } as never;
    });

    toastCtrl = jasmine.createSpyObj('ToastController', ['create']);
    toastCtrl.create.and.callFake(async (opts: { message: string }) => ({
      message: opts.message,
      present: toastPresent,
    }) as never);

    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot()],
      providers: [
        CourseImportService,
        AttendanceService,
        { provide: LanguageService, useValue: createMockLanguageService() },
        { provide: TranslateService, useValue: createMockTranslateService() },
        { provide: AlertController, useValue: alertCtrl },
        { provide: ToastController, useValue: toastCtrl },
      ],
    });

    service = TestBed.inject(CourseImportService);
    attendance = TestBed.inject(AttendanceService);
  });

  afterEach(() => {
    attendance.clearAllData();
    clearBrowserStorage();
  });

  it('ignores a missing file', async () => {
    await service.importFromFile(undefined);
    expect(alertCtrl.create).not.toHaveBeenCalled();
    expect(toastCtrl.create).not.toHaveBeenCalled();
  });

  it('toasts when the file is not JSON', async () => {
    await service.importFromFile(jsonFile('not json'));
    expect(toastCtrl.create).toHaveBeenCalledWith(
      jasmine.objectContaining({ message: 'COURSES.FILE_JSON_ERROR', color: 'danger' }),
    );
    expect(alertCtrl.create).not.toHaveBeenCalled();
  });

  it('toasts when the payload is not a course export', async () => {
    await service.importFromFile(jsonFile(JSON.stringify({ version: 9, courses: [] })));
    expect(toastCtrl.create).toHaveBeenCalledWith(
      jasmine.objectContaining({ message: 'COURSES.FILE_FORMAT_ERROR', color: 'danger' }),
    );
  });

  it('imports confirmed courses and their records', async () => {
    const course = createMockCourse({ id: 'imported-1', name: 'Importado', periodMode: undefined });
    const payload: CourseExport = {
      version: 2,
      exported: '2026-09-11T00:00:00.000Z',
      courses: [course],
      records: {
        'imported-1': { '2026-05-04': { status: 'present' } },
      },
    };

    await service.importFromFile(jsonFile(JSON.stringify(payload)));
    expect(alertCtrl.create).toHaveBeenCalled();
    expect(attendance.getCourses().length).toBe(0);

    importHandler?.();

    const imported = attendance.getCourses()[0];
    expect(imported.name).toBe('Importado');
    expect(imported.periodMode).toBe('month');
    expect(attendance.getRecordsForCourse('imported-1')['2026-05-04'].status).toBe('present');
    expect(toastCtrl.create).toHaveBeenCalledWith(
      jasmine.objectContaining({ message: 'COURSES.IMPORT_SUCCESS_ONE', color: 'success' }),
    );
  });

  it('resets the file input before importing', async () => {
    const input = { files: [jsonFile('not json')], value: 'keep-me' } as unknown as HTMLInputElement;
    await service.importFromInputEvent({ target: input } as unknown as Event);
    expect(input.value).toBe('');
    expect(toastCtrl.create).toHaveBeenCalled();
  });
});
