import { Component, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { AttendanceService } from '../services/attendance.service';
import { LanguageService } from '../services/language.service';
import { Course, DayRecord } from '../models/attendance.model';

export interface CourseExport {
  version: 1;
  exported: string;
  courses: Course[];
  records: Record<string, Record<string, DayRecord>>;
}

@Component({
  selector: 'app-courses',
  templateUrl: 'courses.page.html',
  styleUrls: ['courses.page.scss'],
  standalone: false,
})
export class CoursesPage implements OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  courses: Course[] = [];
  showForm = false;
  editingId: string | null = null;

  form: Omit<Course, 'id'> = this.blankForm();

  selectMode = false;
  selectedIds = new Set<string>();

  private langSub?: Subscription;

  constructor(
    public svc: AttendanceService,
    private alert: AlertController,
    private toast: ToastController,
    private translate: TranslateService,
    private lang: LanguageService,
  ) {
    this.langSub = this.lang.onLangChange().subscribe(() => {
      this.courses = this.svc.getCourses();
    });
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
  }

  ionViewWillEnter(): void {
    this.courses = this.svc.getCourses();
    this.exitSelectMode();
  }

  private blankForm(): Omit<Course, 'id'> {
    return {
      name: '',
      startDate: '',
      endDate: '',
      startTime: '09:00',
      hoursPerDay: 5,
      maxAbsences: 3,
      maxTardiness: 7,
      minAttendancePercent: 75,
    };
  }

  openNew(): void {
    this.editingId = null;
    this.form = this.blankForm();
    this.showForm = true;
  }

  openEdit(course: Course): void {
    this.editingId = course.id;
    this.form = {
      name: course.name,
      startDate: course.startDate,
      endDate: course.endDate,
      startTime: course.startTime ?? '09:00',
      hoursPerDay: course.hoursPerDay,
      maxAbsences: course.maxAbsences,
      maxTardiness: course.maxTardiness,
      minAttendancePercent: course.minAttendancePercent,
    };
    this.showForm = true;
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingId = null;
  }

  saveForm(): void {
    if (!this.isFormValid()) return;
    const course: Course = {
      id: this.editingId ?? this.svc.generateId(),
      name: this.form.name.trim(),
      startDate: this.form.startDate,
      endDate: this.form.endDate,
      startTime: this.form.startTime || '09:00',
      hoursPerDay: Number(this.form.hoursPerDay),
      maxAbsences: Number(this.form.maxAbsences),
      maxTardiness: Number(this.form.maxTardiness),
      minAttendancePercent: Number(this.form.minAttendancePercent),
    };
    this.svc.saveCourse(course);
    this.courses = this.svc.getCourses();
    this.showForm = false;
    this.editingId = null;
  }

  selectCourse(id: string): void {
    if (this.selectMode) {
      this.toggleSelectId(id);
    } else {
      this.svc.selectedCourseId = id;
    }
  }

  async confirmDelete(course: Course): Promise<void> {
    const al = await this.alert.create({
      header: this.translate.instant('COURSES.DELETE_HEADER'),
      message: this.translate.instant('COURSES.DELETE_MSG', { name: course.name }),
      cssClass: 'danger-alert',
      buttons: [
        { text: this.translate.instant('COMMON.CANCEL'), role: 'cancel' },
        {
          text: this.translate.instant('COMMON.DELETE'),
          role: 'destructive',
          cssClass: 'alert-btn-danger',
          handler: () => {
            this.svc.deleteCourse(course.id);
            this.courses = this.svc.getCourses();
          },
        },
      ],
    });
    await al.present();
  }

  enterSelectMode(): void {
    this.selectMode = true;
    this.selectedIds.clear();
  }

  exitSelectMode(): void {
    this.selectMode = false;
    this.selectedIds.clear();
  }

  toggleSelectId(id: string): void {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
  }

  isSelected(id: string): boolean {
    return this.selectedIds.has(id);
  }

  get selectedCount(): number {
    return this.selectedIds.size;
  }

  get exportLabel(): string {
    const countSuffix = this.selectedCount > 0 ? ` (${this.selectedCount})` : '';
    return this.translate.instant('COURSES.EXPORT_COUNT', { count: countSuffix });
  }

  exportSelected(): void {
    const ids = [...this.selectedIds];
    this.exportCourseIds(ids);
    this.exitSelectMode();
  }

  exportSingle(course: Course): void {
    this.exportCourseIds([course.id]);
  }

  private exportCourseIds(ids: string[]): void {
    const courses = this.courses.filter((c) => ids.includes(c.id));
    const records: Record<string, Record<string, DayRecord>> = {};
    for (const id of ids) {
      records[id] = this.svc.getRecordsForCourse(id);
    }
    const data: CourseExport = {
      version: 1,
      exported: new Date().toISOString(),
      courses,
      records,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const label =
      courses.length === 1
        ? courses[0].name.replace(/\s+/g, '_').toLowerCase()
        : `presencia_cursos_${courses.length}`;
    const a = document.createElement('a');
    a.href = url;
    a.download = `${label}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  triggerImport(): void {
    this.fileInput.nativeElement.value = '';
    this.fileInput.nativeElement.click();
  }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    let raw: string;
    try {
      raw = await file.text();
    } catch {
      await this.showToast(this.translate.instant('COURSES.FILE_READ_ERROR'), 'danger');
      return;
    }

    let data: unknown;
    try {
      data = JSON.parse(raw);
    } catch {
      await this.showToast(this.translate.instant('COURSES.FILE_JSON_ERROR'), 'danger');
      return;
    }

    if (!this.isValidExport(data)) {
      await this.showToast(this.translate.instant('COURSES.FILE_FORMAT_ERROR'), 'danger');
      return;
    }

    const exportData = data as CourseExport;
    const count = exportData.courses.length;

    const al = await this.alert.create({
      header: this.translate.instant('COURSES.IMPORT_HEADER'),
      message: count === 1
        ? this.translate.instant('COURSES.IMPORT_MSG_ONE')
        : this.translate.instant('COURSES.IMPORT_MSG_MANY', { count }),
      buttons: [
        { text: this.translate.instant('COMMON.CANCEL'), role: 'cancel' },
        {
          text: this.translate.instant('COMMON.IMPORT'),
          handler: () => {
            for (const course of exportData.courses) {
              const recs = exportData.records[course.id] ?? {};
              this.svc.importCourseData(course, recs);
            }
            this.courses = this.svc.getCourses();
            this.showToast(
              count === 1
                ? this.translate.instant('COURSES.IMPORT_SUCCESS_ONE')
                : this.translate.instant('COURSES.IMPORT_SUCCESS_MANY', { count }),
              'success'
            );
          },
        },
      ],
    });
    await al.present();
  }

  private isValidExport(data: unknown): boolean {
    if (typeof data !== 'object' || data === null) return false;
    const d = data as Record<string, unknown>;
    return (
      d['version'] === 1 &&
      Array.isArray(d['courses']) &&
      typeof d['records'] === 'object'
    );
  }

  private async showToast(message: string, color: string): Promise<void> {
    const t = await this.toast.create({ message, color, duration: 2500, position: 'bottom' });
    await t.present();
  }

  dateRangeLabel(course: Course): string {
    const fmt = (ds: string) => this.lang.formatShortDate(ds);
    return `${fmt(course.startDate)} → ${fmt(course.endDate)}`;
  }

  get calcExitTime(): string {
    if (!this.form.startTime || !this.form.hoursPerDay) return '';
    const [h, m] = this.form.startTime.split(':').map(Number);
    const total = h * 60 + m + Number(this.form.hoursPerDay) * 60;
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  }

  isFormValid(): boolean {
    return (
      !!this.form.name.trim() &&
      !!this.form.startDate &&
      !!this.form.endDate &&
      this.form.endDate >= this.form.startDate
    );
  }
}
