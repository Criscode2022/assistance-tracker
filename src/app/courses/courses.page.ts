import { Component } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { AttendanceService } from '../services/attendance.service';
import { Course } from '../models/attendance.model';

@Component({
  selector: 'app-courses',
  templateUrl: 'courses.page.html',
  styleUrls: ['courses.page.scss'],
  standalone: false,
})
export class CoursesPage {
  courses: Course[] = [];
  showForm = false;
  editingId: string | null = null;

  form: Omit<Course, 'id'> = this.blankForm();

  constructor(
    public svc: AttendanceService,
    private alert: AlertController
  ) {}

  ionViewWillEnter(): void {
    this.courses = this.svc.getCourses();
  }

  private blankForm(): Omit<Course, 'id'> {
    return {
      name: '',
      startDate: '',
      endDate: '',
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
    if (!this.form.name.trim() || !this.form.startDate || !this.form.endDate) return;
    if (this.form.endDate < this.form.startDate) return;

    const course: Course = {
      id: this.editingId ?? this.svc.generateId(),
      ...this.form,
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
    this.svc.selectedCourseId = id;
  }

  async confirmDelete(course: Course): Promise<void> {
    const al = await this.alert.create({
      header: 'Eliminar curso',
      message: `¿Eliminar "<strong>${course.name}</strong>"? Se perderán todos sus registros.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.svc.deleteCourse(course.id);
            this.courses = this.svc.getCourses();
          },
        },
      ],
    });
    await al.present();
  }

  dateRangeLabel(course: Course): string {
    const fmt = (ds: string) =>
      new Date(ds + 'T12:00:00').toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    return `${fmt(course.startDate)} — ${fmt(course.endDate)}`;
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
