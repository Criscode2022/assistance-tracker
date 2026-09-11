import { Injectable } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Course, CourseExport } from '../models/attendance.model';
import { AttendanceService } from './attendance.service';

@Injectable({ providedIn: 'root' })
export class CourseImportService {
  constructor(
    private svc: AttendanceService,
    private toast: ToastController,
    private translate: TranslateService,
    private alert: AlertController,
  ) {}

  async importFromInputEvent(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    await this.importFromFile(file);
  }

  async importFromFile(file: File | undefined): Promise<void> {
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
              this.svc.importCourseData(this.normalizeImportedCourse(course), recs);
            }
            void this.showToast(
              count === 1
                ? this.translate.instant('COURSES.IMPORT_SUCCESS_ONE')
                : this.translate.instant('COURSES.IMPORT_SUCCESS_MANY', { count }),
              'success',
            );
          },
        },
      ],
    });
    await al.present();
    await al.onDidDismiss();
  }

  private isValidExport(data: unknown): boolean {
    if (typeof data !== 'object' || data === null) return false;
    const d = data as Record<string, unknown>;
    return (
      (d['version'] === 1 || d['version'] === 2) &&
      Array.isArray(d['courses']) &&
      typeof d['records'] === 'object'
    );
  }

  private normalizeImportedCourse(course: Course): Course {
    return this.svc.normalizeCourse({
      ...course,
      periodMode: course.periodMode ?? 'month',
      modules: course.modules ?? [],
    });
  }

  private async showToast(message: string, color: string): Promise<void> {
    const t = await this.toast.create({ message, color, duration: 2500, position: 'bottom' });
    await t.present();
  }
}
