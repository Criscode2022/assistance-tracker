import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { CREATE_COURSE_NAV, EMPTY_COURSES_COPY } from '../constants/empty-courses';
import { EmptyCoursesComponent } from './empty-courses.component';

@Component({
  selector: 'app-empty-courses-host',
  template: '<app-empty-courses (create)="opened = true"></app-empty-courses>',
  standalone: false,
})
class EmptyCoursesHostComponent {
  opened = false;
}

describe('EmptyCoursesComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EmptyCoursesComponent, EmptyCoursesHostComponent],
      imports: [IonicModule.forRoot(), TranslateModule.forRoot()],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renders the shared copy keys', () => {
    const fixture = TestBed.createComponent(EmptyCoursesComponent);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain(EMPTY_COURSES_COPY.titleKey);
    expect(text).toContain(EMPTY_COURSES_COPY.hintKey);
    expect(text).toContain(EMPTY_COURSES_COPY.actionKey);
  });

  it('navigates to the create-course form when no listener is bound', () => {
    const fixture = TestBed.createComponent(EmptyCoursesComponent);
    const router = TestBed.inject(Router);
    const navSpy = spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));
    fixture.detectChanges();

    fixture.componentInstance.onCreate();

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
    child.onCreate();

    expect(fixture.componentInstance.opened).toBeTrue();
    expect(navSpy).not.toHaveBeenCalled();
  });
});
