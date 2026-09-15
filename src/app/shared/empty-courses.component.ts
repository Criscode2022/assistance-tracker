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
  protected readonly copy = EMPTY_COURSES_COPY;
  protected showSignIn = true;

  @ViewChild('fileInput') private fileInput?: ElementRef<HTMLInputElement>;
  @Output() readonly create = new EventEmitter<void>();

  private readonly modeSub: Subscription;

  constructor(
    private readonly router: Router,
    private readonly appMode: AppModeService,
    private readonly courseImport: CourseImportService,
  ) {
    this.showSignIn = !this.appMode.isOnline();
    this.modeSub = this.appMode.watchMode().subscribe((mode) => {
      this.showSignIn = mode !== 'online';
    });
  }

  public ngOnDestroy(): void {
    this.modeSub.unsubscribe();
  }

  protected onCreate(): void {
    if (this.create.observed) {
      this.create.emit();
      return;
    }
    void this.router.navigate([CREATE_COURSE_NAV.path], {
      queryParams: { [CREATE_COURSE_NAV.queryParam]: CREATE_COURSE_NAV.queryValue },
    });
  }

  protected onImport(): void {
    const input = this.fileInput?.nativeElement;
    if (!input) return;
    input.value = '';
    input.click();
  }

  protected onFileSelected(event: Event): void {
    void this.courseImport.importFromInputEvent(event);
  }

  protected onSignIn(): void {
    this.appMode.setOnlineIntent();
    void this.router.navigate([SIGN_IN_NAV.path], {
      queryParams: { [SIGN_IN_NAV.queryParam]: SIGN_IN_NAV.queryValue },
    });
  }
}
