---
title: Decisiones de producto y tech
---

# Decisiones

## Neon Auth/Data en lugar de Nest propio

Un segundo servicio (como Task Cloud) no aportaba contrato custom: email, sesión y filas por usuario caben en Neon Auth + Data API. Menos ops, un solo deploy estático.

## Proxy Netlify same-origin

Sin proxy, la cookie de Auth es third-party y iOS/PWA la tiran. El rewrite `/__neon-*` es una decisión de producto (sesión persistente), no cosmética.

## Offline primero, sync opt-in

El registro del día no puede depender de cobertura en el aula. `localStorage` es la fuente en el dispositivo; la nube es continuidad.

## `localStorage` en vez de Ionic Storage

El modelo cabe en JSON versionado (`v1`/`v3`). Ionic Storage habría añadido un adapter sin ganar queries. Se documentan migraciones explícitas.

## Signal Forms en Angular 21, Zone por Ionic

Formularios de curso y auth usan `@angular/forms/signals`. Ionic 8 sigue pidiendo Zone; no se fuerza zoneless.

## Netlify, no Vercel

SPA + redirects + proxy encajan en `netlify.toml` sin función serverless. Task Cloud necesita Vercel por Nest; aquí no.
