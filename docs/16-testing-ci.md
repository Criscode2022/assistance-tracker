---
title: Testing · GitHub Actions
---

# Testing · GitHub Actions

Workflow: `.github/workflows/test.yml`. Se dispara en `push` y `pull_request`.

## Job `unit-and-integration-tests`

```yaml
- name: Setup Chrome
  uses: browser-actions/setup-chrome@v1
- name: Install dependencies
  run: npm ci --include=optional
- name: Run unit tests
  run: npm run test:ci
  env:
    CHROME_BIN: chrome
    CI: true
- name: Run integration tests
  run: npm run test:integration
  env:
    CHROME_BIN: chrome
    CI: true
```

`ChromeHeadlessCI` (en `karma.conf.js`) añade `--no-sandbox` y `--disable-dev-shm-usage` para el runner de Ubuntu. `CI=true` elige ese launcher.

## Job `e2e-tests`

```yaml
- name: Install Playwright browser
  run: npm run e2e:install
- name: Run E2E tests
  run: npm run e2e:ci
  env:
    CI: true
```

Chromium se instala en el runner; no se sube al repo. `retries: 2` y un solo worker solo en CI (`playwright.config.ts`). Reporter `github` para anotaciones en el PR.

## Por qué no hay errores de entorno

| Riesgo | Mitigación |
|--------|------------|
| Neon Auth / Data API no están en Actions | `createMockNeonService` en unit/integración; e2e 100 % localStorage |
| Chrome headless en Ubuntu | `browser-actions/setup-chrome` + flags CI + `CHROME_BIN` |
| `ng serve` tarda | `webServer.timeout: 120000` |
| Lockfile desfasado | `npm ci --include=optional` |
| Fechas / i18n flaky | `timezoneId: Europe/Madrid`, `locale: es-ES`, reloj de Jasmine en 2026-05-15 |

Si un e2e rojo es de Ionic, el primer sitio a mirar es el helper `gotoTab` (espera `ion-tab-bar`) y si la semilla se aplicó **antes** del primer `goto`.
