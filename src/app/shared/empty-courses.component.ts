import { Component, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';
import { CREATE_COURSE_NAV, EMPTY_COURSES_COPY } from '../constants/empty-courses';

@Component({
  selector: 'app-empty-courses',
  templateUrl: './empty-courses.component.html',
  styleUrls: ['./empty-courses.component.scss'],
  standalone: false,
})
export class EmptyCoursesComponent {
  readonly copy = EMPTY_COURSES_COPY;

  @Output() create = new EventEmitter<void>();

  constructor(private router: Router) {}

  onCreate(): void {
    if (this.create.observed) {
      this.create.emit();
      return;
    }
    void this.router.navigate([CREATE_COURSE_NAV.path], {
      queryParams: { [CREATE_COURSE_NAV.queryParam]: CREATE_COURSE_NAV.queryValue },
    });
  }
}
