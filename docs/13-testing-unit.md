---
title: Testing · unitarios
---

# Testing · unitarios

Los unitarios instancian la clase **sin** HTTP a Neon. Runner: Jasmine + Karma (`npm run test:ci`). Hay fixtures compartidas en `src/testing/`.

## Asistencia (`src/app/services/attendance.service.spec.ts`)

`AttendanceService` persiste cursos en `courses_v1` y registros en `attendance_v3`. El reloj se fija al 15 de mayo de 2026 para que los días futuros sean deterministas.

```ts
it('should calculate late hours from entry and exit times', () => {
  const course = createMockCourse({ hoursPerDay: 5, startTime: '09:00' });
  svc.saveCourse(course);
  svc.setDayRecord(
    '2026-05-05',
    { status: 'late', entryTime: '09:30', exitTime: '14:00' },
    course.id,
  );

  const stats = svc.getMonthStats('2026-05', course.id);
  expect(stats.lateDays).toBe(1);
  expect(stats.totalHoursAttended).toBe(4.5);
  expect(stats.totalLostMinutes).toBe(30);
});
```

También se afirma `overallStatus === 'failed'` al superar `maxAbsences`, la migración `attendance_v2` → `v3` y los periodos por módulo.

## Modo online (`src/app/services/app-mode.service.spec.ts`)

```ts
it('should default to offline mode', () => {
  expect(service.isOffline()).toBeTrue();
  expect(service.hasOnlineIntent()).toBeFalse();
});
```

`enableOnlineMode()` escribe `app_mode_v1=online` y limpia el intent. Un `TestBed.resetTestingModule()` comprueba que el modo se rehidrata.

## Errores de auth (`src/app/utils/auth-error.mapper.spec.ts`)

Neon no expone un contrato único. El mapper acepta `code`, `status`, `message` o `body`:

```ts
expect(getAuthErrorKey({ code: 'invalid_credentials' })).toBe(
  'AUTH.ERRORS.INVALID_CREDENTIALS',
);
expect(getAuthErrorKey({ status: 401 })).toBe('AUTH.ERRORS.INVALID_CREDENTIALS');
expect(getAuthErrorKey(null)).toBe('AUTH.ERRORS.GENERIC');
```

## URLs de Neon (`src/app/services/neon.service.spec.ts`)

En producción las URLs son same-origin (`/__neon-auth`) para que la cookie sobreviva en iOS/PWA. En local son absolutas.

```ts
expect(service['resolveUrl']('/__neon-auth')).toBe(
  `${window.location.origin}/__neon-auth`,
);
expect(service['resolveUrl']('https://ep-example.neonauth.aws.neon.tech/neondb/auth'))
  .toBe('https://ep-example.neonauth.aws.neon.tech/neondb/auth');
```

## Sync (`src/app/services/cloud-sync.service.spec.ts`)

`createMockNeonService` sustituye `client.from('courses' | 'attendance_records')`. Se afirma upload (incluye `cancelled`, excluye `unlogged`), download al storage local y que **no** hay push si `isOffline()`.

## Guard (`src/app/guards/online-auth.guard.spec.ts`)

Offline → `true`. Online sin sesión → `UrlTree` a `/auth`. Online con sesión → `true`.
