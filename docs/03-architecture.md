---
title: Arquitectura
---

# Arquitectura

## Diagrama lógico

```
Browser / PWA Ionic (Angular 21)
    │  offline: localStorage
    │  online + sesión: Neon JS client
    ▼
Same-origin  /__neon-auth/*  y  /__neon-data/*
    │  (Netlify reverse proxy)
    ▼
Neon Auth  +  Neon Data API  ──►  Postgres (proyecto wild-breeze-65639945)
```

## Capas

1. **Cliente** — Tabs Ionic: Dashboard, Log, Historial, Cursos. Settings y Auth fuera de la tab bar. Servicios: `AttendanceService`, `NeonService`, `CloudSyncService`, `AppModeService`.
2. **Offline** — `courses_v1` + `attendance_v3` en `localStorage`, con migraciones desde `attendance_v2`.
3. **Nube** — `@neondatabase/neon-js`: Auth (email/password) y Data API. No hay Nest propio: el BaaS de Neon es la API.
4. **Deploy** — Netlify sirve `www/` y reescribe `/__neon-auth/*` y `/__neon-data/*` al host Neon para cookie first-party.

## Principios

- Offline primero; sync opt-in.
- Sesión first-party (ITP / PWA iOS).
- Sin analytics ni tracking.
- Secretos de Neon no van al bundle más allá de las URLs públicas de Auth/Data (en prod, paths same-origin).
