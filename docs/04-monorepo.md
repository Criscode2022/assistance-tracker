---
title: Estructura del proyecto
---

# Estructura (app única)

Presencia **no** es un monorepo Turborepo: un solo paquete Angular/Ionic, equivalente a `apps/web` de Task Cloud.

| Path | Rol |
|------|-----|
| `src/app/dashboard` | Tab: anillo y métricas |
| `src/app/log` | Tab: días del periodo |
| `src/app/history` | Tab: resumen por mes/módulo |
| `src/app/courses` | Tab: CRUD e import/export |
| `src/app/auth` | Sign-in / sign-up |
| `src/app/config` | Ajustes (fuera de tabs) |
| `src/app/services` | Datos, sync, tema, i18n, notificaciones |
| `src/app/models/attendance.model.ts` | Course, DayRecord, MonthStats |
| `src/environments` | URLs Neon (prod: `/__neon-auth`, `/__neon-data`) |
| `netlify.toml` | Build, proxy Neon, SPA fallback |
| `capacitor.config.ts` | `com.presencia.app` |

## Scripts

| Script | Descripción |
|--------|-------------|
| `npm start` / `ionic serve` | Dev en `:8100` |
| `npm run build` | Producción → `www/` |
| `npm run test:ci` | Karma headless |
| `npm run e2e:ci` | Playwright |

Package manager: npm. Node ≥ 20. Angular CLI 21.
