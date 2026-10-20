---
title: Retos y resultados
---

# Retos y aprendizajes

## Cookie de sesión en PWA iOS

Safari ITP bloquea cookies third-party. El login “funcionaba” en desktop y se perdía al “Añadir a pantalla de inicio”. Solución: reverse proxy same-origin + no fallar si `getSession()` tarda un tick.

## Convergencia local ↔ nube

Tras login, la nube **sustituye** lo local (documentado). Tras registro, se sube lo que ya había en el móvil. Evita merges silenciosos de dos calendarios distintos.

## Cálculo de % vs sensación del usuario

El % usa horas (tardanza resta minutos), no solo días. Hay que explicarlo en el dashboard (chip de minutos perdidos) para que “estuve pero llegué tarde” no parezca un bug.

## Periodos mes vs módulo

Cursos que no coinciden con el mes natural (módulos) obligaron a `periodMode` y a un selector de periodo compartido entre tabs.

# Resultados

- PWA en [asistenciacurso.netlify.app](https://asistenciacurso.netlify.app), instalable, usable 100% offline.
- Dashboard, log, historial y cursos con i18n ES/EN y tema claro/oscuro.
- Sync opt-in con Neon Auth + Data API y cookie first-party.
- e2e Playwright + tests de servicios; Capacitor preparado (`com.presencia.app`).
- Código abierto como referencia Angular/Ionic + Neon + Netlify (complemento de Task Cloud: Nest + Vercel).
