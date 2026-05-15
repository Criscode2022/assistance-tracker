import { Component, ViewChild, ElementRef } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { AttendanceService } from '../services/attendance.service';
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
export class CoursesPage {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  courses: Course[] = [];
  showForm = false;
  editingId: string | null = null;

  form: Omit<Course, 'id'> = this.blankForm();

  // ── Select / export mode ─────────────────────────────────────────────────────
  selectMode = false;
  selectedIds = new Set<string>();

  constructor(
    public svc: AttendanceService,
    private alert: AlertController,
    private toast: ToastController,
  ) {}

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
      header: 'Eliminar curso',
      message: `¿Eliminar "<strong>${course.name}</strong>"? Se perderán todos sus registros de asistencia.`,
      cssClass: 'danger-alert',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Eliminar',
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

  // ── Select mode ──────────────────────────────────────────────────────────────

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

  // ── Export ───────────────────────────────────────────────────────────────────

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

  // ── Import ───────────────────────────────────────────────────────────────────

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
      await this.showToast('No se pudo leer el archivo.', 'danger');
      return;
    }

    let data: unknown;
    try {
      data = JSON.parse(raw);
    } catch {
      await this.showToast('El archivo no es un JSON válido.', 'danger');
      return;
    }

    if (!this.isValidExport(data)) {
      await this.showToast('El archivo no tiene el formato esperado.', 'danger');
      return;
    }

    const exportData = data as CourseExport;
    const count = exportData.courses.length;

    const al = await this.alert.create({
      header: 'Importar cursos',
      message: `Se importar${count === 1 ? 'á 1 curso' : `án ${count} cursos`} con sus registros. Los cursos con el mismo ID se sobreescribirán.`,
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Importar',
          handler: () => {
            for (const course of exportData.courses) {
              const recs = exportData.records[course.id] ?? {};
              this.svc.importCourseData(course, recs);
            }
            this.courses = this.svc.getCourses();
            this.showToast(
              `${count === 1 ? '1 curso importado' : `${count} cursos importados`} correctamente.`,
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

  // ── Helpers ───────────────────────────────────────────────────────────────────

  dateRangeLabel(course: Course): string {
    const fmt = (ds: string) =>
      new Date(ds + 'T12:00:00').toLocaleDateString('es-MX', {
        day: 'numeric', month: 'short', year: 'numeric',
      });
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
