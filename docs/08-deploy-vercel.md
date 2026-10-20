---
title: Deploy Netlify
---

# Deploy en Netlify

## Idea

- Build Angular → `www/`
- Catch-all SPA: `/*` → `/index.html` 200
- Proxy Neon **antes** del catch-all para Auth y Data API

## Config (`netlify.toml`)

```toml
[build]
  publish = "www"
  command = "npm run build -- --configuration production"

[[redirects]]
  from = "/__neon-auth/*"
  to = "https://<endpoint-neon-auth>/neondb/auth/:splat"
  status = 200
  force = true

[[redirects]]
  from = "/__neon-data/*"
  to = "https://<endpoint-neon-data>/neondb/rest/v1/:splat"
  status = 200
  force = true

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## Variables

En producción las URLs de Auth/Data van **same-origin** (`environment.prod.ts`). El proyecto Neon (`wild-breeze-65639945`) se configura en el dashboard de Neon; no hay `DATABASE_URL` en el cliente.

## Smoke

1. Abrir [https://asistenciacurso.netlify.app](https://asistenciacurso.netlify.app)
2. Crear un curso y marcar un día **sin** cuenta (offline).
3. Activar modo online → registro/login → comprobar que el curso reaparece en otro navegador.

## Local

```bash
npm install
ionic serve   # :8100
```

Sin cuenta Neon, el modo offline cubre todo el producto excepto sync.
