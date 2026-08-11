# OpenSpec Proposal: fix-core-attendance-flow

## Executive Summary
Alinear el comportamiento del sistema de control de asistencia biométrica con las especificaciones de la **RSG N.° 326-2017-MINEDU** y los documentos formales del proyecto (Ingeniería de Requerimientos y Modelo de Datos del Sprint 1).

## Scope & Intent
- **Persistencia e Impacto Biométrico (HU-03 / RF-03)**:
  - Al confirmar un archivo de carga biométrica (`biometric_import_service.confirm()`), generar las marcaciones individuales en `biometric_mark` e impactar la consolidación diaria en `attendance_day`.
  - Calcular minutos de tardanza (`T`) respecto a la hora oficial de ingreso (08:00 AM) y asignar estado `present` o `late`.

- **Detección e Inspección de Inconsistencias (HU-04 / RF-04)**:
  - Conectar `inconsistency_service` con las marcaciones reales importadas.
  - Detectar automáticamente: duplicados en el mismo día/tipo, marcas sin par (solo entrada o solo salida) y marcaciones fuera de turno.
  - Permitir cambiar el estado de la inconsistencia a `reviewed` y aplicar la corrección correspondiente.

- **Gestión de Justificaciones y Sustento (HU-05 / RF-05)**:
  - Guardar físicamente el archivo de sustento (`support_file`) enviado en `POST /api/v1/justifications` en el almacenamiento del sistema (`uploads/justifications/`).
  - Soportar la lista de códigos oficiales de la leyenda RSG N.° 326-2017-MINEDU: `J`, `LS`, `LG`, `P`, `H`, `F`.

- **Consolidación Mensual de Asistencia (HU-06 / RF-06)**:
  - Incluir en la lista mensual (`attendance_service.list_month()`) y reportes a **todo el personal activo**, asignando estado de inasistencia (`absent` / `I/L`) a los días laborables donde el trabajador no registró marcación ni justificación.

- **Generación de Anexo 03 y Anexo 04 (HU-07 / HU-08 / RF-07 / RF-08)**:
  - Generar exportación de reportes detallados y consolidados mensuales conforme a los campos exigidos por la norma.

## Acceptance Criteria
- **AC-01 (HU-03)**: La confirmación de una carga biométrica inserta registros en `attendance_day` para cada docente/auxiliar correspondiente.
- **AC-02 (HU-04)**: `GET /api/v1/inconsistencies` retorna la lista real de inconsistencias calculadas sobre las marcaciones existentes y permite ejecutar `review` y `correction`.
- **AC-03 (HU-05)**: El endpoint de justificaciones almacena el archivo físico adjunto en disco y registra el código oficial correspondiente (`LG`, `LS`, `P`, `J`, `H`, `F`).
- **AC-04 (HU-06)**: El consolidado mensual incluye al 100% del personal activo con DNI, marcando faltas en días hábiles sin marcaciones.

## Non-Goals
- No se creará una IA de Machine Learning externa en este sprint; la detección de inconsistencias utilizará el motor determinista de reglas (`rules/inconsistency_rules.py`) según lo especificado.
- No se modificará el esquema de autenticación ni los endpoints existentes que ya están funcionando.
