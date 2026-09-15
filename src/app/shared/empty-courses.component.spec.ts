import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { CREATE_COURSE_NAV, EMPTY_COURSES_COPY, SIGN_IN_NAV } from '../constants/empty-courses';
import { AppModeService } from '../services/app-mode.service';
import { CourseImportService } from '../services/course-import.service';
import { EmptyCoursesComponent } from './empty-courses.component';
import { accessible } from '../../testing/accessible';
import { clearBrowserStorage } from '../../testing/fixtures';

@Component({
  selector: 'app-empty-courses-host',
  template: '<app-empty-courses (create)="opened = true"></app-empty-courses>',
  standalone: false,
})
class EmptyCoursesHostComponent {
  opened = false;
}

describe('EmptyCoursesComponent', () => {
  let courseImport: jasmine.SpyObj<CourseImportService>;

  beforeEach(async () => {
    clearBrowserStorage();
    courseImport = jasmine.createSpyObj('CourseImportService', ['importFromInputEvent']);

    await TestBed.configureTestingModule({
      declarations: [EmptyCoursesComponent, EmptyCoursesHostComponent],
      imports: [IonicModule.forRoot(), TranslateModule.forRoot()],
      providers: [
        provideRouter([]),
        AppModeService,
        { provide: CourseImportService, useValue: courseImport },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    clearBrowserStorage();
  });

  it('renders the shared copy keys', () => {
    const fixture = TestBed.createComponent(EmptyCoursesComponent);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain(EMPTY_COURSES_COPY.titleKey);
    expect(text).toContain(EMPTY_COURSES_COPY.hintKey);
    expect(text).toContain(EMPTY_COURSES_COPY.actionKey);
    expect(text).toContain(EMPTY_COURSES_COPY.importKey);
    expect(text).toContain(EMPTY_COURSES_COPY.signInHintKey);
    expect(text).toContain(EMPTY_COURSES_COPY.signInKey);
  });

  it('navigates to the create-course form when no listener is bound', () => {
    const fixture = TestBed.createComponent(EmptyCoursesComponent);
    const router = TestBed.inject(Router);
    const navSpy = spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    fixture.detectChanges();

    accessible(fixture.componentInstance).onCreate();

    expect(navSpy).toHaveBeenCalledWith([CREATE_COURSE_NAV.path], {
      queryParams: { [CREATE_COURSE_NAV.queryParam]: CREATE_COURSE_NAV.queryValue },
    });
  });

  it('emits create instead of navigating when a parent handles it', () => {
    const fixture = TestBed.createComponent(EmptyCoursesHostComponent);
    const router = TestBed.inject(Router);
    const navSpy = spyOn(router, 'navigate');
    fixture.detectChanges();

    const child = fixture.debugElement.children[0].componentInstance as EmptyCoursesComponent;
    accessible(child).onCreate();

    expect(fixture.componentInstance.opened).toBeTrue();
    expect(navSpy).not.toHaveBeenCalled();
  });

  it('opens the hidden file picker when import is tapped', () => {
    const fixture = TestBed.createComponent(EmptyCoursesComponent);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = spyOn(input, 'click');

    accessible(fixture.componentInstance).onImport();

    expect(clickSpy).toHaveBeenCalled();
  });

  it('delegates selected files to the import service', () => {
    const fixture = TestBed.createComponent(EmptyCoursesComponent);
    const event = { target: { files: [], value: 'x' } } as unknown as Event;

    accessible(fixture.componentInstance).onFileSelected(event);

    expect(courseImport.importFromInputEvent).toHaveBeenCalledWith(event);
  });

  it('sends the user to sign-in with online intent', () => {
    const fixture = TestBed.createComponent(EmptyCoursesComponent);
    const router = TestBed.inject(Router);
    const appMode = TestBed.inject(AppModeService);
    const navSpy = spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    spyOn(appMode, 'setOnlineIntent').and.callThrough();
    fixture.detectChanges();

    accessible(fixture.componentInstance).onSignIn();

    expect(appMode.setOnlineIntent).toHaveBeenCalled();
    expect(navSpy).toHaveBeenCalledWith([SIGN_IN_NAV.path], {
      queryParams: { [SIGN_IN_NAV.queryParam]: SIGN_IN_NAV.queryValue },
    });
  });

  it('hides the sign-in prompt when the user is already online', () => {
    TestBed.inject(AppModeService).enableOnlineMode();
    const fixture = TestBed.createComponent(EmptyCoursesComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.empty-state-signin')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain(EMPTY_COURSES_COPY.signInKey);
  });
});
