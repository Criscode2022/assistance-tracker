---
title: Superficie API Neon
---

# Superficie API (Neon Auth + Data)

No hay Nest propio. El cliente habla con Neon a través de `@neondatabase/neon-js`.

## En producción (same-origin)

| Prefijo | Destino (Netlify rewrite 200) |
|---------|-------------------------------|
| `/__neon-auth/*` | Neon Auth (`*.neonauth.*.aws.neon.tech/neondb/auth`) |
| `/__neon-data/*` | Neon Data API REST v1 (`*.apirest.*.aws.neon.tech/neondb/rest/v1`) |

Así la cookie de sesión es first-party en `asistenciacurso.netlify.app` y sobrevive en PWA iOS.

## En desarrollo

`environment.ts` apunta a las URLs absolutas de Neon (sin proxy).

## Operaciones de producto

El sync (`CloudSyncService`) sube y baja:

- Cursos del usuario autenticado
- Registros de asistencia (`DayRecord` por fecha)

Tras registro, los datos locales se suben. Tras login, la nube **reemplaza** lo local del dispositivo (documentado en el README).

## Por qué no hay `/api` Nest

El dominio es un único cliente PWA. Auth + persistencia cubiertas por Neon Auth/Data API evitan un segundo servicio que desplegar. Task Cloud necesita Nest porque el contrato (PIN, bulk tasks, ownership) es custom.
