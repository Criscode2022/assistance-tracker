---
title: Modelo de datos
---

# Modelo de datos

## Offline (`localStorage`)

| Clave | Contenido |
|-------|-----------|
| `courses_v1` | `Course[]` |
| `attendance_v3` | Mapa curso → fecha → `DayRecord` |
| `selected_course_id` | Curso activo |
| (legado) `attendance_v2` | Migrado al arrancar |

## Tipos (`attendance.model.ts`)

### `Course`
`id`, `name`, `startDate` / `endDate`, `startTime`, `hoursPerDay`, `maxAbsences`, `maxTardiness`, `minAttendancePercent`, `periodMode` (`month` \| `module`), `modules?`.

### `DayRecord`
`status`: `present` \| `absent` \| `late` \| `unlogged` \| `cancelled`.  
Si `late`: `entryTime` / `exitTime` (`HH:mm`).

### `MonthStats` (derivado)
Días laborables, presentes/faltas/tardanzas, `%` = horas asistidas / horas esperadas a fecha, minutos perdidos, `overallStatus`: `ok` \| `warning` \| `failed`.

## Cálculo de asistencia

- Días laborables: lun–vie en el rango del curso (o del módulo).
- Impuntualidad resta minutos (entrada/salida vs horario).
- Clase cancelada no cuenta como falta ni como hora esperada.

## Nube

Neon Data API persiste cursos y registros ligados al `user.id` de Neon Auth. El cliente no expone SQL; el contrato es el Data API REST.
