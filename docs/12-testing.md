---
title: Testing · visión
---

# Testing · visión

Presencia tiene **194 tests en tres capas** más un workflow de **GitHub Actions**: 145 unitarios y 6 de integración en Karma, y 43 flujos e2e con Playwright. Todas corren sin Neon real: el cliente de Auth/Data API se mockea y el e2e siembra `localStorage`.

| Capa | Runner | Tests | Qué cubre | Comando |
|------|--------|-------|-----------|---------|
| Unitario | Jasmine + Karma (ChromeHeadlessCI) | 145 en 24 specs | Servicios, guards, mapper, páginas | `npm run test:ci` |
| Integración | Jasmine + Karma (`*.integration.spec.ts`) | 6 en 2 specs | Rutas + guards, persistencia localStorage | `npm run test:integration` |
| E2E | Playwright (Chromium en CI) | 43 en 8 ficheros | Shell, dashboard, log, cursos, settings | `npm run e2e:ci` |

`npm run test:ci` ejecuta todos los specs de Karma, integración incluida (151); `test:integration` repite solo los 6 de integración. En local, Playwright añade Pixel 7 e iPhone 14 a Chromium, así que los 43 flujos corren tres veces.

Comprobado el 20 de octubre de 2026: las tres capas pasan en local.

CI (`.github/workflows/test.yml`):

1. Job **unit-and-integration-tests** — `npm ci`, Chrome, `test:ci`, `test:integration`.
2. Job **e2e-tests** — instala Chromium y lanza `e2e:ci` (el `webServer` arranca `ng serve --port 8100`).

No hace falta un proyecto Neon en Actions. `CloudSyncService` habla con un `NeonService` falso; el e2e trabaja **offline-first**.

Siguientes documentos: [unitarios](./13-testing-unit.md) · [integración](./14-testing-integration.md) · [e2e](./15-testing-e2e.md) · [CI](./16-testing-ci.md).
