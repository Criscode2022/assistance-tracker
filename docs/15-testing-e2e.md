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

## Maestro

Además de Playwright, `.maestro/` tiene 5 flujos de [Maestro](https://maestro.dev) que usan la app en Chromium como una persona, en español y offline: sin sembrar `localStorage`, crean el curso desde el formulario. Los IDs del catálogo van en el comentario de cada flujo.

| Flujo | Comprueba |
|-------|-----------|
| `smoke.yaml` | Resumen, Registro, Historial y Cursos abren con su estado vacío |
| `course-validation.yaml` | El formulario nombra cada campo obligatorio al salir de él, no guarda incompleto y rechaza un fin anterior al inicio (C-020 a C-023, C-030) |
| `courses.yaml` | Un curso se crea, queda seleccionado en todas las pestañas y se borra tras confirmar; Cancelar lo conserva (C-002, C-006, G-014) |
| `log-attendance.yaml` | Pulsar un día en Registro abre la hoja de estados, y el estado elegido se ve en el día |
| `settings.yaml` | El idioma cambia la app entera, pestañas incluidas, y se recuerda (CA-004) |

El curso cubre de 2026 a 2030, así que el mes en curso siempre tiene días hábiles. Las fechas se escriben como MMDDYYYY: chromedriver las teclea en orden estadounidense aunque el campo muestre dd/mm/aaaa.

```yaml
- tapOn:
    id: "ng\\.form\\d+\\.startDate"
- inputText: ${START}
- tapOn:
    id: "ng\\.form\\d+\\.endDate"
- inputText: ${END}
```

Maestro no puede hacer scroll dentro de `ion-content`, así que lo que queda bajo el pliegue de una página (el final de Configuración) se queda fuera de estos flujos.

```bash
npm start                # en :4200
maestro test .maestro/   # los 5 flujos
```

Los agentes tienen además el servidor MCP de Maestro (`maestro` en `.mcp.json`), que arranca `scripts/maestro-mcp.mjs`: inspecciona la pantalla, corre un flujo y ayuda a escribir los nuevos. El script busca Java y el CLI, porque Maestro no arranca sin `JAVA_HOME`.

Los flujos de Maestro no están en CI, que sigue corriendo Playwright. Comprobado el 18 de noviembre de 2026: los 5 pasan en local.
