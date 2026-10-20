---
title: Producto y features
---

# Producto y features

## Problema

Llevar faltas y retrasos en Excel, WhatsApp o la memoria falla cuando hay varios cursos, un mínimo de asistencia y tardanzas que restan minutos. Las apps de campus suelen exigir cuenta institucional. Hacía falta un registro preciso, usable en el móvil, **sin red**, y con sync opcional a una cuenta personal.

## Solución

PWA instalable (Presencia) con dashboard de salud del curso, log diario, historial por periodo y CRUD de cursos. Offline-first en `localStorage`. Si el usuario activa el modo online, Neon Auth (email/password + verificación) y Data API sincronizan cursos y registros.

## Características

### Dashboard
Anillo de % de asistencia (verde / ámbar / rojo / gris), tarjetas de faltas y tardanzas frente al máximo, horas asistidas y minutos perdidos.

### Log diario
Cada día laborable del periodo es una card. Tap → action sheet (presente, impuntual con horas, falta, cancelada, sin registrar). Swipe para toggle rápido presente/falta.

### Historial
Resumen mes a mes o por módulos: %, ratio de días, horas.

### Cursos
Alta/edición de horario, horas/día, máximos, % mínimo, modo mes o módulos. Import/export JSON.

### Ajustes
Tema, idioma, notificaciones (recordatorio diario y alerta de %), modo online/offline, borrar todo.

### Offline-first
Sin red, el registro diario no se bloquea. La nube es continuidad entre dispositivos, no el camino crítico de cada tap.

### i18n
Inglés y español, fechas según locale.
