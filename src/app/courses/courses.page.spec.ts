import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { convertToParamMap, provideRouter, ActivatedRoute } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

import { ActionSheetController, AlertController, IonicModule, ToastController } from '@ionic/angular';

import { AppModeService } from '../services/app-mode.service';

import { SharedModule } from '../shared/shared.module';

import { TranslateModule, TranslateService } from '@ngx-translate/core';

import { CoursesPage } from './courses.page';

import { AttendanceService } from '../services/attendance.service';

import { LanguageService } from '../services/language.service';

import { Course } from '../models/attendance.model';

import {

  clearBrowserStorage,

  createCourseFormModel,

  createMockCourse,

} from '../../testing/fixtures';

import { createMockLanguageService, createMockTranslateService } from '../../testing/mocks';



/** Access protected members from unit tests. */

type CoursesPageTestable = CoursesPage & {

  showForm: boolean;

  editingId: string | null;

  fieldErrors(field: string): { kind: string; message?: string }[];

  openNew(): void;

  openEdit(course: Course): void;

  saveForm(): void;

  selectCourse(id: string): void;

  enterSelectMode(): void;

  selectMode(): boolean;

  toggleSelectId(id: string): void;

  isSelected(id: string): boolean;

};

function page(component: CoursesPage): CoursesPageTestable {
  return component as unknown as CoursesPageTestable;
}



describe('CoursesPage', () => {

  let component: CoursesPage;

  let fixture: ComponentFixture<CoursesPage>;

  let svc: AttendanceService;
  let queryParamMap$: BehaviorSubject<ReturnType<typeof convertToParamMap>>;



  beforeEach(async () => {

    clearBrowserStorage();

    queryParamMap$ = new BehaviorSubject(convertToParamMap({}));

    await TestBed.configureTestingModule({

      declarations: [CoursesPage],

      imports: [IonicModule.forRoot(), TranslateModule.forRoot(), SharedModule],

      schemas: [CUSTOM_ELEMENTS_SCHEMA],

      providers: [

        AttendanceService,

        AppModeService,

        { provide: TranslateService, useValue: createMockTranslateService() },

        { provide: LanguageService, useValue: createMockLanguageService() },

        {

          provide: AlertController,

          useValue: jasmine.createSpyObj('AlertController', ['create']),

        },

        {

          provide: ActionSheetController,

          useValue: jasmine.createSpyObj('ActionSheetController', ['create']),

        },

        {

          provide: ToastController,

          useValue: jasmine.createSpyObj('ToastController', ['create']),

        },

        provideRouter([]),

        {

          provide: ActivatedRoute,

          useValue: { queryParamMap: queryParamMap$ },

        },

      ],

    }).compileComponents();



    fixture = TestBed.createComponent(CoursesPage);

    component = fixture.componentInstance;

    svc = TestBed.inject(AttendanceService);

  });



  afterEach(() => {

    svc.clearAllData();

    clearBrowserStorage();

  });



  it('should create with an empty signal form model', () => {

    expect(component).toBeTruthy();

    expect(component.courseForm).toBeTruthy();

    expect(component.courseModel()).toEqual(

      jasmine.objectContaining({

        name: '',

        startTime: '09:00',

        hoursPerDay: 5,

      }),

    );

  });



  it('should open the new-course form from the shared create query param', () => {

    expect(page(component).showForm).toBeFalse();

    queryParamMap$.next(convertToParamMap({ create: '1' }));

    expect(page(component).showForm).toBeTrue();

  });



  describe('signal form validation (isValidForm)', () => {

    it('should be invalid when name is empty', () => {

      component.courseModel.set(createCourseFormModel({ name: '' }));

      expect(component.isValidForm()).toBeFalse();

      expect(component.courseForm.name().invalid()).toBeTrue();

    });



    it('should be invalid when name is only whitespace', () => {

      component.courseModel.set(createCourseFormModel({ name: '   ' }));

      expect(component.isValidForm()).toBeFalse();

    });



    it('should be valid when all validated fields pass', () => {

      component.courseModel.set(createCourseFormModel());

      expect(component.isValidForm()).toBeTrue();

    });



    it('should be invalid when end date is before start date', () => {

      component.courseModel.set(

        createCourseFormModel({

          startDate: '2026-05-20',

          endDate: '2026-05-01',

        }),

      );

      expect(component.isValidForm()).toBeFalse();

      expect(component.courseForm.endDate().invalid()).toBeTrue();

    });



    it('should be invalid when hours per day is out of range', () => {

      component.courseModel.set(createCourseFormModel({ hoursPerDay: 0 }));

      expect(component.isValidForm()).toBeFalse();



      component.courseModel.set(createCourseFormModel({ hoursPerDay: 13 }));

      expect(component.isValidForm()).toBeFalse();

    });



    it('should sync model and validity when updating via courseForm', () => {

      component.courseModel.set(createCourseFormModel({ name: '' }));

      expect(component.isValidForm()).toBeFalse();



      component.courseForm.name().value.set('Curso de prueba');

      expect(component.courseModel().name).toBe('Curso de prueba');

      expect(component.isValidForm()).toBeTrue();

    });

  });



  describe('inline errors', () => {

    it('should hide errors until submit attempt', () => {

      component.courseModel.set(createCourseFormModel({ name: '' }));

      expect(component.shouldShowErrors('name')).toBeFalse();



      component.formSubmitted.set(true);

      expect(component.shouldShowErrors('name')).toBeTrue();

    });



    it('should expose i18n error keys for invalid end date range', () => {

      component.courseModel.set(

        createCourseFormModel({

          startDate: '2026-05-20',

          endDate: '2026-05-01',

        }),

      );

      component.formSubmitted.set(true);



      const errors = page(component).fieldErrors('endDate');

      expect(errors.some((e) => e.kind === 'dateRange')).toBeTrue();

      expect(errors[0]?.message).toBe('COURSES.ERRORS.END_BEFORE_START');

    });



    it('should show inline errors when module dates fall outside course range', () => {

      const modId = 'mod-test';

      component.courseModel.set(

        createCourseFormModel({

          startDate: '2026-05-01',

          endDate: '2026-05-31',

          periodMode: 'module',

          modules: [

            {

              id: modId,

              name: 'Module A',

              startDate: '2026-04-01',

              endDate: '2026-06-15',

            },

          ],

        }),

      );

      component.formSubmitted.set(true);



      const startErrors = component.moduleFieldErrors(modId, 'startDate');

      const endErrors = component.moduleFieldErrors(modId, 'endDate');



      expect(startErrors.some((e) => e.kind === 'beforeCourse')).toBeTrue();

      expect(endErrors.some((e) => e.kind === 'afterCourse')).toBeTrue();

      expect(component.shouldShowModuleFieldErrors(modId, 'startDate')).toBeTrue();

      expect(component.shouldShowModuleFieldErrors(modId, 'endDate')).toBeTrue();

    });

  });



  describe('saveForm', () => {

    it('should not save when the signal form is invalid', () => {

      page(component).showForm = true;

      component.courseModel.set(createCourseFormModel({ name: '' }));



      page(component).saveForm();



      expect(svc.getCourses().length).toBe(0);

      expect(page(component).showForm).toBeTrue();

      expect(component.formSubmitted()).toBeTrue();

    });



    it('should save a new course when the signal form is valid', () => {

      page(component).showForm = true;

      component.courseModel.set(createCourseFormModel({ name: 'Nuevo curso' }));



      page(component).saveForm();



      expect(page(component).showForm).toBeFalse();

      expect(component.formSubmitted()).toBeFalse();

      expect(svc.getCourses().length).toBe(1);

      expect(svc.getCourses()[0].name).toBe('Nuevo curso');

    });

  });



  describe('form lifecycle', () => {

    it('should reset courseModel when opening a new course', () => {

      component.courseModel.set(createCourseFormModel({ name: 'Viejo' }));

      page(component).openNew();



      expect(component.courseModel().name).toBe('');

      expect(component.isValidForm()).toBeFalse();

      expect(component.formSubmitted()).toBeFalse();

    });



    it('should patch courseModel when editing a course', () => {

      const course = createMockCourse({ name: 'Editar este' });

      page(component).openEdit(course);



      expect(component.courseModel().name).toBe('Editar este');

      expect(component.isValidForm()).toBeTrue();

      expect(page(component).editingId).toBe(course.id);

    });

  });



  it('should compute calcExitTime from courseModel', () => {

    component.courseModel.set(

      createCourseFormModel({

        startTime: '10:00',

        hoursPerDay: 3,

      }),

    );

    expect(component.calcExitTime()).toBe('13:00');

  });



  it('should toggle selection in select mode', () => {

    const course = createMockCourse();

    svc.saveCourse(course);

    component.ionViewWillEnter();



    page(component).enterSelectMode();

    expect(page(component).selectMode()).toBeTrue();



    page(component).toggleSelectId(course.id);

    expect(page(component).isSelected(course.id)).toBeTrue();

    expect(component.selectedCount).toBe(1);



    page(component).toggleSelectId(course.id);

    expect(page(component).isSelected(course.id)).toBeFalse();

  });



  it('should build actions label with selection count', () => {

    svc.saveCourse(createMockCourse({ id: 'c1' }));

    svc.saveCourse(createMockCourse({ id: 'c2', name: 'Otro curso' }));

    component.ionViewWillEnter();

    page(component).enterSelectMode();

    page(component).toggleSelectId('c1');

    page(component).toggleSelectId('c2');



    expect(component.selectedCount).toBe(2);

    expect(component.actionsLabel).toBe('Actions (2)');

  });



  it('should select active course when not in select mode', () => {

    const course = createMockCourse();

    svc.saveCourse(course);

    page(component).selectCourse(course.id);

    expect(svc.selectedCourseId).toBe(course.id);

  });



  describe('tablet layout', () => {

    it('should reflect wide viewport in tabletLayout signal', () => {

      const mql = {

        matches: true,

        addEventListener: jasmine.createSpy('addEventListener'),

        removeEventListener: jasmine.createSpy('removeEventListener'),

      };

      spyOn(window, 'matchMedia').and.returnValue(mql as unknown as MediaQueryList);



      const tabletFixture = TestBed.createComponent(CoursesPage);

      const tabletPage = tabletFixture.componentInstance;



      expect(tabletPage.tabletLayout()).toBeTrue();

    });

  });

});


