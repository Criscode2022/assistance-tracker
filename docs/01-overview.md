---
title: Visión general
---

# Visión general · Presencia

**Presencia** (repo `assistance-tracker`) es una Progressive Web App mobile-first para llevar la asistencia de uno o varios cursos: presencia, falta, impuntualidad y clase cancelada. Funciona **offline por defecto** y sincroniza a la nube si el usuario abre sesión.

A diferencia de Task Cloud, es **una sola app Angular/Ionic** (no monorepo Nest). La nube es **Neon Auth + Data API**, expuesta same-origin vía proxy de Netlify para que la cookie de sesión sea first-party (iOS Safari / PWA instalada).

## Enlaces

- **Web:** [https://asistenciacurso.netlify.app](https://asistenciacurso.netlify.app)
- **GitHub:** [Criscode2022/assistance-tracker](https://github.com/Criscode2022/assistance-tracker)
- **Producto:** control mensual de asistencia a cursos (`package.json` name `presencia`)

## Stack

| Capa | Tecnología |
|------|------------|
| Web | Angular 21.2, Ionic 8, Capacitor 8, Tailwind 4, Signal Forms |
| Offline | `localStorage` (`courses_v1`, `attendance_v3`) |
| Nube | Neon Auth + Neon Data API (`@neondatabase/neon-js`) |
| i18n | ngx-translate ES / EN |
| Deploy | Netlify (`www/` + SPA rewrite + proxy `/__neon-*`) |
