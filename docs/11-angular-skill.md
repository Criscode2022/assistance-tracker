---
title: Skill Angular
---

# Angular en Presencia

App **Angular 21.2 + Ionic 8 + TypeScript 5.9 + Zone**. Formularios con **Signal Forms** (`@angular/forms/signals`), como indica el README. No hay skill Angular publicada en este repo (a diferencia de Task Cloud, que versiona `.claude/skills/angular`).

## Qué se aplica

| Práctica | Dónde |
|----------|--------|
| Signal Forms | Alta/edición de curso y validación (mín. %, fechas, horas) |
| Standalone / módulos Ionic | Tabs y páginas; shell Ionic |
| ngx-translate | ES / EN |
| Service worker | PWA + notificaciones |
| Tests | Karma unit + Playwright e2e |

## Techo Ionic 8 (igual que Task Cloud)

| API moderna | Por qué no se fuerza | Qué hay |
|-------------|----------------------|---------|
| **Zoneless** | Ionic 8 pide `zone.js` | `zone.js` ~0.15 |
| **`[formField]` en `ion-*`** | Los controles Ionic no implementan `FormValueControl` | Signal Forms en validación; `ion-*` escribe el modelo |
| **View Transitions del Router Angular** | Navegación por `ion-tabs` / `ion-router-outlet` | Transiciones Ionic |
| **SSR** | PWA + `localStorage` + Capacitor | SPA en Netlify |

La revisión de Task Cloud (Angular 22 + `httpResource`) no se copia aquí: Presencia no tiene Nest que leer con `httpResource`; el cliente Neon JS cubre Auth/Data.
