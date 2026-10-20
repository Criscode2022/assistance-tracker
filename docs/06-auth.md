---
title: Autenticación email + Neon
---

# Modelo de autenticación

## Flujo

1. El usuario crea cuenta (nombre, email, contraseña) o inicia sesión.
2. Neon Auth (`client.auth.signUp.email` / `signIn.email`).
3. Verificación de email **antes** de poder entrar (requisito Neon Auth).
4. `getSession()` calienta la caché; en PWA iOS la cookie puede no leerse al instante — no se trata `session === null` inmediato como fallo de login.
5. Logout: `signOut()`. Los datos locales se conservan en el dispositivo.

## Seguridad

- Contraseña y tokens los gestiona Neon Auth; el bundle no guarda secretos de servidor.
- Proxy same-origin para no perder la sesión por ITP.
- Cloud sync es **opt-in** (modo online en Ajustes).

## Por qué email/password y no PIN

El caso de uso es un estudiante/profesional con cuenta recuperable entre dispositivos. Neon Auth ya ofrece email + verificación. Un PIN local no cubría “el mismo curso en el portátil y en el móvil” sin un backend custom como el de Task Cloud.
