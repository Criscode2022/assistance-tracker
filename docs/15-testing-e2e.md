---
title: Testing · e2e
---

# Testing · e2e

Playwright en la raíz. Config: `playwright.config.ts`. Specs: `e2e/*.spec.ts`. Helpers: `e2e/helpers/`. Catálogo de casos: `e2e/E2E-TEST-CATALOG.md`.

```bash
npm run e2e:ci
```

En CI, Playwright arranca Angular solo:

```ts
webServer: {
  command: 'npm run start -- --port 8100',
  url: 'http://localhost:8100',
  reuseExistingServer: !process.env.CI,
  timeout: 120_000,
}
```

`locale: 'es-ES'` y `timezoneId: 'Europe/Madrid'` — el copy y los días laborables tienen que coincidir con los fixtures.

## Semilla de `localStorage`

```ts
export async function seedLocalStorage(page: Page, data: SeedData): Promise<void> {
  await page.addInitScript((payload) => {
    localStorage.clear();
    if (payload.courses) localStorage.setItem('courses_v1', JSON.stringify(payload.courses));
    if (payload.records) localStorage.setItem('attendance_v3', JSON.stringify(payload.records));
    if (payload.selectedCourseId !== undefined) {
      localStorage.setItem('selected_course_id', payload.selectedCourseId);
    }
  }, data);
}
```

`addInitScript` corre **antes** de que Angular hidrate. Si siembras después del `goto`, el servicio ya leyó storage vacío.

## Specs reales

```ts
test('G-001: app loads and shows tab bar', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('ion-tab-bar')).toBeVisible();
  await expectTabBar(page, 'es');
});

test('D-001: loads stats for selected course', async ({ page }) => {
  const course = makeCourse({ name: 'Dashboard Stats Course' });
  await seedLocalStorage(page, {
    courses: [course],
    selectedCourseId: course.id,
    records: { [course.id]: { '2026-06-02': { status: 'present' } } },
  });
  await gotoTab(page, 'dashboard');
  await expect(page.locator('.course-name')).toHaveText('Dashboard Stats Course');
  await expect(page.locator('.ring-wrap')).toBeVisible();
});
```

Los tabs se pulsan con `getByRole('tab', { name: 'Resumen' | 'Registro' | … })` — Ionic sí expone `role="tab"` en esta app.

La PWA pinta dashboard, log, historial y cursos **offline**. No se afirma login/sync Neon en CI (eso requeriría secretos y correo verificado).
