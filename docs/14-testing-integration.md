---
title: Testing · integración
---

# Testing · integración

Comando: `npm run test:integration`.  
Karma solo incluye `**/*.integration.spec.ts`. En CI corre **después** de los unitarios.

No hay Nest ni Postgres. La integración aquí es **el cableado real** de Angular: router + guards, y dos instancias de `AttendanceService` que se hablan a través de `localStorage`.

## Rutas y guards (`src/app/app.routes.integration.spec.ts`)

Se monta un `provideRouter` que espeja `AppRoutingModule`. `NeonService` está mockeado.

```ts
it('should block root when online without session and send user to auth', async () => {
  appMode.enableOnlineMode();
  neon.getSession.and.returnValue(Promise.resolve(null));

  const result = await TestBed.runInInjectionContext(() =>
    TestBed.inject(OnlineAuthGuard).canActivate(),
  );

  expect(router.serializeUrl(result as never)).toBe('/auth');
});

it('should keep authenticated online users off auth route', async () => {
  appMode.enableOnlineMode();
  neon.getSession.and.returnValue(Promise.resolve({ user: { id: 'u1' } }));

  const result = await TestBed.runInInjectionContext(() =>
    TestBed.inject(GuestAuthGuard).canActivate(),
  );

  expect(router.serializeUrl(result as never)).toBe('/');
});
```

Offline, `/` sigue abierto: el producto es usable al 100 % sin cuenta.

## Persistencia (`src/app/attendance.integration.spec.ts`)

Una instancia guarda curso + registros. Se destruye el `TestBed` y se crea otra: tiene que leer `courses_v1` / `attendance_v3` / `selected_course_id`.

```ts
const first = makeService();
first.saveCourse(course);
first.setDayRecord('2026-05-05', { status: 'present' }, course.id);

const reloaded = makeService();
expect(reloaded.getCourse('persist-1')?.name).toBe('Sistemas');
expect(reloaded.getDayRecord('2026-05-05', 'persist-1').status).toBe('present');
```

El segundo caso compara `getMonthStats` **antes y después** del reload (presentes, impuntualidades, horas, minutos perdidos). Si el cálculo o la serialización se desalinean, falla aquí y no en un e2e lento.
