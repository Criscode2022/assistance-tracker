---
title: Testing · visión
---

# Testing · visión

Presencia tiene **tres capas** de prueba más un workflow de **GitHub Actions**. Todas corren sin Neon real: el cliente de Auth/Data API se mockea y el e2e siembra `localStorage`.

| Capa | Runner | Qué cubre | Comando |
|------|--------|-----------|---------|
| Unitario | Jasmine + Karma (ChromeHeadlessCI) | Servicios, guards, mapper, páginas | `npm run test:ci` |
| Integración | Jasmine + Karma (`*.integration.spec.ts`) | Rutas + guards, persistencia localStorage | `npm run test:integration` |
| E2E | Playwright (Chromium en CI) | Shell, dashboard, log, cursos, settings | `npm run e2e:ci` |

CI (`.github/workflows/test.yml`):

1. Job **unit-and-integration-tests** — `npm ci`, Chrome, `test:ci`, `test:integration`.
2. Job **e2e-tests** — instala Chromium y lanza `e2e:ci` (el `webServer` arranca `ng serve --port 8100`).

No hace falta un proyecto Neon en Actions. `CloudSyncService` habla con un `NeonService` falso; el e2e trabaja **offline-first**.

Siguientes documentos: [unitarios](./13-testing-unit.md) · [integración](./14-testing-integration.md) · [e2e](./15-testing-e2e.md) · [CI](./16-testing-ci.md).
