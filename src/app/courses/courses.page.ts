import {
  ChangeDetectorRef,
  Component,
  ViewChild,
  ElementRef,
  OnDestroy,
  computed,
  signal,
} from '@angular/core';
import { ActionSheetButton, ActionSheetController, AlertController, ToastController } from '@ionic/angular';
import {
  form,
  max,
  min,
  required,
  validate,
  type SchemaPathTree,
} from '@angular/forms/signals';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { AttendanceService } from '../services/attendance.service';
import { LanguageService } from '../services/language.service';
import { Course, CourseModule, DayRecord, PeriodMode } from '../models/attendance.model';

export interface CourseExport {
  version: 1 | 2;
  exported: string;
  courses: Course[];
  records: Record<string, Record<string, DayRecord>>;
}

/** Form model shape (no id — assigned on save). */
export interface CourseFormModel {
  name: string;
  startDate: string;
  endDate: string;
  startTime: string;
  hoursPerDay: number;
  maxAbsences: number;
  maxTardiness: number;
  minAttendancePercent: number;
  periodMode: PeriodMode;
  modules: CourseModule[];
}

type ModuleField = 'name' | 'startDate' | 'endDate';

interface ModuleFieldError {
  kind: string;
  message: string;
  params?: Record<string, string>;
}

type CourseFormField = keyof CourseFormModel;

/** Fields with validators — used for canSave and inline errors. */
const VALIDATED_COURSE_FIELDS = [
  'name',
  'startDate',
  'endDate',
  'hoursPerDay',
  'maxAbsences',
  'maxTardiness',
  'minAttendancePercent',
  'periodMode',
] as const satisfies readonly CourseFormField[];

const courseFormSchema = (schemaPath: SchemaPathTree<CourseFormModel>) => {
  validate(schemaPath.name, (ctx) => {
    if (!ctx.value().trim()) {
      return { kind: 'required', message: 'COURSES.ERRORS.NAME_REQUIRED' };
    }
    return null;
  });
  required(schemaPath.startDate, { message: 'COURSES.ERRORS.START_DATE_REQUIRED' });
  required(schemaPath.endDate, { message: 'COURSES.ERRORS.END_DATE_REQUIRED' });

  validate(schemaPath.endDate, (ctx) => {
    const end = ctx.value();
    const start = ctx.valueOf(schemaPath.startDate);
    if (start && end && end < start) {
      return { kind: 'dateRange', message: 'COURSES.ERRORS.END_BEFORE_START' };
    }
    return null;
  });

  min(schemaPath.hoursPerDay, 1, { message: 'COURSES.ERRORS.HOURS_MIN' });
  max(schemaPath.hoursPerDay, 12, { message: 'COURSES.ERRORS.HOURS_MAX' });
  min(schemaPath.maxAbsences, 0, { message: 'COURSES.ERRORS.MAX_ABSENCES_MIN' });
  min(schemaPath.maxTardiness, 0, { message: 'COURSES.ERRORS.MAX_TARDINESS_MIN' });
  min(schemaPath.minAttendancePercent, 1, { message: 'COURSES.ERRORS.MIN_ATTENDANCE_MIN' });
  max(schemaPath.minAttendancePercent, 100, { message: 'COURSES.ERRORS.MIN_ATTENDANCE_MAX' });

  validate(schemaPath.periodMode, (ctx) => {
    if (ctx.value() === 'module') {
      const modules = ctx.valueOf(schemaPath.modules);
      if (!modules.length) {
        return { kind: 'modulesRequired', message: 'COURSES.ERRORS.MODULES_REQUIRED' };
      }
      for (const mod of modules) {
        if (!mod.name.trim()) {
          return { kind: 'moduleName', message: 'COURSES.ERRORS.MODULE_NAME_REQUIRED' };
        }
        if (!mod.startDate || !mod.endDate) {
          return { kind: 'moduleDates', message: 'COURSES.ERRORS.MODULE_DATES_REQUIRED' };
        }
        if (mod.endDate < mod.startDate) {
          return { kind: 'moduleRange', message: 'COURSES.ERRORS.MODULE_END_BEFORE_START' };
        }
      }
      const start = ctx.valueOf(schemaPath.startDate);
      const end = ctx.valueOf(schemaPath.endDate);
      if (start && end) {
        for (const mod of modules) {
          if (mod.startDate < start || mod.endDate > end) {
            return { kind: 'moduleBounds', message: 'COURSES.ERRORS.MODULE_OUT_OF_RANGE' };
          }
        }
      }
    }
    return null;
  });
};

@Component({
  selector: 'app-courses',
  templateUrl: 'courses.page.html',
  styleUrls: ['courses.page.scss'],
  standalone: false,
})
export class CoursesPage implements OnDestroy {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  protected courses: Course[] = [];
  protected showForm = false;
  protected editingId: string | null = null;

  readonly courseModel = signal<CourseFormModel>(this.blankForm());

  readonly courseForm = form(this.courseModel, courseFormSchema);

  readonly isValidForm = computed(() =>
    VALIDATED_COURSE_FIELDS.every((field) => this.fieldState(field).valid()),
  );

  readonly calcExitTime = computed(() => {
    const { startTime, hoursPerDay } = this.courseModel();
    if (!startTime || !hoursPerDay) return '';
    const [h, m] = startTime.split(':').map(Number);
    const total = h * 60 + m + Number(hoursPerDay) * 60;
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
  });

  readonly limitsSectionKey = computed(() =>
    this.courseModel().periodMode === 'module'
      ? 'COURSES.PERIOD_LIMITS'
      : 'COURSES.MONTHLY_LIMITS',
  );

  readonly showModules = computed(() => this.courseModel().periodMode === 'module');

  readonly formSubmitted = signal(false);

  private readonly moduleFieldTouched = new Set<string>();

  protected selectMode = signal(false);
  protected selectedIds = new Set<string>();
  readonly tabletLayout = signal(false);

  private langSub?: Subscription;
  private dataSub?: Subscription;
  private tabletMql?: MediaQueryList;
  private readonly onTabletLayoutChange = (e: MediaQueryListEvent) => {
    this.tabletLayout.set(e.matches);
  };

  get selectedCount(): number {
    return this.selectedIds.size;
  }

  get actionsLabel(): string {
    const count = this.selectedCount;
    return count > 0
      ? this.translate.instant('COURSES.ACTIONS_COUNT', { count })
      : this.translate.instant('COURSES.ACTIONS');
  }

  constructor(
    public svc: AttendanceService,
    private alert: AlertController,
    private actionSheet: ActionSheetController,
    private toast: ToastController,
    private translate: TranslateService,
    private lang: LanguageService,
    private cdr: ChangeDetectorRef,
  ) {
    this.langSub = this.lang.onLangChange().subscribe(() => this.refreshCourses());
    this.dataSub = this.svc.dataChanged$.subscribe(() => this.refreshCourses());

    this.tabletMql = window.matchMedia('(min-width: 768px)');
    this.tabletLayout.set(this.tabletMql.matches);
    this.tabletMql.addEventListener('change', this.onTabletLayoutChange);
  }

  ionViewWillEnter(): void {
    this.refreshCourses();
    this.exitSelectMode();
    this.tabletLayout.set(this.tabletMql?.matches ?? false);
  }

  private refreshCourses(): void {
    this.courses = this.svc.getCourses();
    requestAnimationFrame(() => this.cdr.detectChanges());
  }

  private blankForm(): CourseFormModel {
    return {
      name: '',
      startDate: '',
      endDate: '',
      startTime: '09:00',
      hoursPerDay: 5,
      maxAbsences: 3,
      maxTardiness: 7,
      minAttendancePercent: 75,
      periodMode: 'month',
      modules: [],
    };
  }

  protected setPeriodMode(mode: PeriodMode): void {
    const current = this.courseModel();
    if (current.periodMode === mode) return;
    const modules =
      mode === 'module' && !current.modules.length
        ? [this.defaultModule(current.startDate, current.endDate)]
        : current.modules;
    this.courseModel.set({ ...current, periodMode: mode, modules });
  }

  protected addModule(): void {
    const current = this.courseModel();
    this.courseModel.set({
      ...current,
      modules: [...current.modules, this.defaultModule(current.startDate, current.endDate)],
    });
  }

  protected removeModule(id: string): void {
    const current = this.courseModel();
    this.courseModel.set({
      ...current,
      modules: current.modules.filter((m) => m.id !== id),
    });
  }

  protected updateModule(id: string, patch: Partial<CourseModule>): void {
    const current = this.courseModel();
    const mod = current.modules.find((m) => m.id === id);
    if (!mod) return;

    for (const key of Object.keys(patch) as ModuleField[]) {
      this.moduleFieldTouched.add(`${id}:${key}`);
      Object.assign(mod, { [key]: patch[key as keyof CourseModule] });
    }

    // Shallow copy so the signal updates without replacing module row objects.
    this.courseModel.set({ ...current, modules: current.modules });
  }

  trackModuleById(_index: number, mod: CourseModule): string {
    return mod.id;
  }

  shouldShowModuleFieldErrors(moduleId: string, field: ModuleField): boolean {
    return (
      (this.moduleFieldTouched.has(`${moduleId}:${field}`) || this.formSubmitted()) &&
      this.moduleFieldErrors(moduleId, field).length > 0
    );
  }

  moduleFieldErrors(moduleId: string, field: ModuleField): ModuleFieldError[] {
    const data = this.courseModel();
    if (data.periodMode !== 'module') return [];

    const mod = data.modules.find((m) => m.id === moduleId);
    if (!mod) return [];

    const errors: ModuleFieldError[] = [];
    const courseStart = data.startDate;
    const courseEnd = data.endDate;

    if (field === 'name' && !mod.name.trim()) {
      errors.push({ kind: 'required', message: 'COURSES.ERRORS.MODULE_NAME_REQUIRED' });
    }

    if (field === 'startDate') {
      if (!mod.startDate) {
        errors.push({ kind: 'required', message: 'COURSES.ERRORS.MODULE_START_REQUIRED' });
      } else {
        if (courseStart && mod.startDate < courseStart) {
          errors.push({
            kind: 'beforeCourse',
            message: 'COURSES.ERRORS.MODULE_DATE_BEFORE_COURSE',
            params: { date: this.lang.formatShortDate(courseStart) },
          });
        }
        if (courseEnd && mod.startDate > courseEnd) {
          errors.push({
            kind: 'afterCourse',
            message: 'COURSES.ERRORS.MODULE_DATE_AFTER_COURSE',
            params: { date: this.lang.formatShortDate(courseEnd) },
          });
        }
        if (mod.endDate && mod.startDate > mod.endDate) {
          errors.push({ kind: 'range', message: 'COURSES.ERRORS.MODULE_END_BEFORE_START' });
        }
      }
    }

    if (field === 'endDate') {
      if (!mod.endDate) {
        errors.push({ kind: 'required', message: 'COURSES.ERRORS.MODULE_END_REQUIRED' });
      } else {
        if (courseStart && mod.endDate < courseStart) {
          errors.push({
            kind: 'beforeCourse',
            message: 'COURSES.ERRORS.MODULE_DATE_BEFORE_COURSE',
            params: { date: this.lang.formatShortDate(courseStart) },
          });
        }
        if (courseEnd && mod.endDate > courseEnd) {
          errors.push({
            kind: 'afterCourse',
            message: 'COURSES.ERRORS.MODULE_DATE_AFTER_COURSE',
            params: { date: this.lang.formatShortDate(courseEnd) },
          });
        }
        if (mod.startDate && mod.endDate < mod.startDate) {
          errors.push({ kind: 'range', message: 'COURSES.ERRORS.MODULE_END_BEFORE_START' });
        }
      }
    }

    return errors;
  }

  periodModeSectionErrors(): ModuleFieldError[] {
    return this.fieldErrors('periodMode')
      .filter((e) => e.kind === 'modulesRequired')
      .map((e) => ({
        kind: e.kind,
        message: e.message ?? 'COURSES.ERRORS.MODULES_REQUIRED',
      }));
  }

  private defaultModule(startDate = '', endDate = ''): CourseModule {
    return {
      id: this.svc.generateId(),
      name: '',
      startDate,
      endDate,
    };
  }

  private resetCourseModel(): void {
    this.courseModel.set(this.blankForm());
    this.formSubmitted.set(false);
    this.moduleFieldTouched.clear();
  }

  private fieldState(field: CourseFormField) {
    return this.courseForm[field]();
  }

  /** Show inline errors after touch, edit, or a save attempt. */
  shouldShowErrors(field: CourseFormField): boolean {
    const state = this.fieldState(field);
    return (
      (state.touched() || state.dirty() || this.formSubmitted()) && state.invalid()
    );
  }

 protected fieldErrors(field: CourseFormField) {
    return this.fieldState(field).errors();
  }

 protected openNew(): void {
    this.editingId = null;
    this.resetCourseModel();
    this.showForm = true;
  }

 protected openEdit(course: Course): void {
    this.editingId = course.id;
    const normalized = this.svc.normalizeCourse(course);
    this.courseModel.set({
      name: normalized.name,
      startDate: normalized.startDate,
      endDate: normalized.endDate,
      startTime: normalized.startTime ?? '09:00',
      hoursPerDay: normalized.hoursPerDay,
      maxAbsences: normalized.maxAbsences,
      maxTardiness: normalized.maxTardiness,
      minAttendancePercent: normalized.minAttendancePercent,
      periodMode: normalized.periodMode ?? 'month',
      modules: normalized.modules ?? [],
    });
    this.formSubmitted.set(false);
    this.moduleFieldTouched.clear();
    this.showForm = true;
  }

  protected cancelForm(): void {
    this.showForm = false;
    this.editingId = null;
    this.formSubmitted.set(false);
    this.moduleFieldTouched.clear();
  }

  protected saveForm(): void {
    this.formSubmitted.set(true);
    if (!this.isValidForm()) return;
    this.formSubmitted.set(false);
    const data = this.courseModel();
    const course: Course = {
      id: this.editingId ?? this.svc.generateId(),
      name: data.name.trim(),
      startDate: data.startDate,
      endDate: data.endDate,
      startTime: data.startTime || '09:00',
      hoursPerDay: Number(data.hoursPerDay),
      maxAbsences: Number(data.maxAbsences),
      maxTardiness: Number(data.maxTardiness),
      minAttendancePercent: Number(data.minAttendancePercent),
      periodMode: data.periodMode,
      modules: data.periodMode === 'module' ? data.modules : [],
    };
    this.svc.saveCourse(course);
    this.courses = this.svc.getCourses();
    this.showForm = false;
    this.editingId = null;
  }

 protected selectCourse(id: string): void {
    if (this.selectMode()) {
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
    await al.onDidDismiss();
    this.refreshCourses();
  }

  protected enterSelectMode(): void {
  this.selectMode.set(true);
  this.selectedIds.clear();
  }

  protected exitSelectMode(): void {
    this.selectMode.set(false);
    this.selectedIds.clear();
  }

  protected toggleSelectId(id: string): void {
    if (this.selectedIds.has(id)) {
      this.selectedIds.delete(id);
    } else {
      this.selectedIds.add(id);
    }
  }

  protected isSelected(id: string): boolean {
    return this.selectedIds.has(id);
  }

  protected async openSelectionActions(): Promise<void> {
    if (this.selectedCount === 0) return;

    const buttons: ActionSheetButton[] = [];

    if (this.selectedCount === 1) {
      const course = this.courses.find((c) => this.selectedIds.has(c.id))!;
      buttons.push({
        text: this.translate.instant('COMMON.EDIT'),
        icon: 'pencil-outline',
        handler: () => {
          setTimeout(() => {
            this.exitSelectMode();
            this.openEdit(course);
          }, 300);
        },
      });
    }

    buttons.push(
      {
        text: this.translate.instant('COMMON.EXPORT'),
        icon: 'share-outline',
        handler: () => this.exportSelected(),
      },
      {
        text: this.translate.instant('COMMON.DELETE'),
        icon: 'trash-outline',
        role: 'destructive',
        handler: () => {
          setTimeout(() => void this.confirmDeleteSelected(), 300);
        },
      },
      {
        text: this.translate.instant('COMMON.CANCEL'),
        icon: 'close-outline',
        role: 'cancel',
      },
    );

    const sheet = await this.actionSheet.create({
      header: this.translate.instant('COURSES.ACTIONS_HEADER', { count: this.selectedCount }),
      cssClass: 'modern-action-sheet',
      buttons,
    });
    await sheet.present();
  }

  private async confirmDeleteSelected(): Promise<void> {
    const count = this.selectedCount;
    const names = this.courses
      .filter((c) => this.selectedIds.has(c.id))
      .map((c) => c.name);

    const al = await this.alert.create({
      header: this.translate.instant('COURSES.DELETE_BULK_HEADER'),
      message:
        count === 1
          ? this.translate.instant('COURSES.DELETE_MSG', { name: names[0] })
          : this.translate.instant('COURSES.DELETE_BULK_MSG', { count }),
      cssClass: 'danger-alert',
      buttons: [
        { text: this.translate.instant('COMMON.CANCEL'), role: 'cancel' },
        {
          text: this.translate.instant('COMMON.DELETE'),
          role: 'destructive',
          cssClass: 'alert-btn-danger',
          handler: () => this.deleteSelected(),
        },
      ],
    });
    await al.present();
    await al.onDidDismiss();
    this.refreshCourses();
  }

  private deleteSelected(): void {
    for (const id of [...this.selectedIds]) {
      this.svc.deleteCourse(id);
    }
    this.courses = this.svc.getCourses();
    this.exitSelectMode();
  }

 private exportSelected(): void {
    const ids = [...this.selectedIds];
    this.exportCourseIds(ids);
    this.exitSelectMode();
  }

 protected exportSingle(course: Course): void {
    this.exportCourseIds([course.id]);
  }

  private exportCourseIds(ids: string[]): void {
    const courses = this.courses.filter((c) => ids.includes(c.id));
    const records: Record<string, Record<string, DayRecord>> = {};
    for (const id of ids) {
      records[id] = this.svc.getRecordsForCourse(id);
    }
    const data: CourseExport = {
      version: 2,
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

 protected triggerImport(): void {
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
              this.svc.importCourseData(this.normalizeImportedCourse(course), recs);
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
    await al.onDidDismiss();
    this.refreshCourses();
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

  protected periodModeLabel(course: Course): string {
    return course.periodMode === 'module'
      ? this.translate.instant('COURSES.PERIOD_MODE_MODULE')
      : this.translate.instant('COURSES.PERIOD_MODE_MONTH');
  }

  private async showToast(message: string, color: string): Promise<void> {
    const t = await this.toast.create({ message, color, duration: 2500, position: 'bottom' });
    await t.present();
  }

 protected dateRangeLabel(course: Course): string {
    const fmt = (ds: string) => this.lang.formatShortDate(ds);
    return `${fmt(course.startDate)} → ${fmt(course.endDate)}`;
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
    this.dataSub?.unsubscribe();
    this.tabletMql?.removeEventListener('change', this.onTabletLayoutChange);
  }
}
