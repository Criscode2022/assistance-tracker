import { Component, ElementRef, EventEmitter, OnDestroy, Output, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CREATE_COURSE_NAV, EMPTY_COURSES_COPY, SIGN_IN_NAV } from '../constants/empty-courses';
import { AppModeService } from '../services/app-mode.service';
import { CourseImportService } from '../services/course-import.service';

@Component({
  selector: 'app-empty-courses',
  templateUrl: './empty-courses.component.html',
  styleUrls: ['./empty-courses.component.scss'],
  standalone: false,
})
export class EmptyCoursesComponent implements OnDestroy {
  readonly copy = EMPTY_COURSES_COPY;
  showSignIn = true;

  @ViewChild('fileInput') fileInput?: ElementRef<HTMLInputElement>;
  @Output() create = new EventEmitter<void>();

  private readonly modeSub: Subscription;

  constructor(
    private router: Router,
    private appMode: AppModeService,
    private courseImport: CourseImportService,
  ) {
    this.showSignIn = !this.appMode.isOnline();
    this.modeSub = this.appMode.watchMode().subscribe((mode) => {
      this.showSignIn = mode !== 'online';
    });
  }

  ngOnDestroy(): void {
    this.modeSub.unsubscribe();
  }

  onCreate(): void {
    if (this.create.observed) {
      this.create.emit();
      return;
    }
    void this.router.navigate([CREATE_COURSE_NAV.path], {
      queryParams: { [CREATE_COURSE_NAV.queryParam]: CREATE_COURSE_NAV.queryValue },
    });
  }

  onImport(): void {
    const input = this.fileInput?.nativeElement;
    if (!input) return;
    input.value = '';
    input.click();
  }

  onFileSelected(event: Event): void {
    void this.courseImport.importFromInputEvent(event);
  }

  onSignIn(): void {
    this.appMode.setOnlineIntent();
    void this.router.navigate([SIGN_IN_NAV.path], {
      queryParams: { [SIGN_IN_NAV.queryParam]: SIGN_IN_NAV.queryValue },
    });
  }
}
