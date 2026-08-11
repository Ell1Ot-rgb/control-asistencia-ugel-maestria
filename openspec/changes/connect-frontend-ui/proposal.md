# OpenSpec Proposal: connect-frontend-ui

## Executive Summary
Conectar la interfaz de usuario en React (`frontend/src/App.tsx`) con la API REST del backend FastAPI, eliminando vistas estáticas y datos harcodeados en Carga Biométrica, Justificaciones, Reportes, Asistencia y Gestión de Personal.

## Scope & Intent
- **ImportPage (Carga Biométrica)**:
  - Vincular selección de archivos CSV mediante `<input type="file">`.
  - Enviar archivo vía `FormData` a `POST /api/v1/biometric-imports`.
  - Permitir confirmar la carga (`POST /api/v1/biometric-imports/{id}/confirmation`) y anular borrador (`POST /api/v1/biometric-imports/{id}/cancellation`).

- **StaffPage (Gestión de Personal)**:
  - Formulario/modal para registrar nuevo docente/auxiliar (`POST /api/v1/staff-members`).
  - Recargar la lista automáticamente tras guardar.

- **AttendancePage y ReportsPage (Asistencia y Reportes)**:
  - Filtros reactivos por mes y año (`useState`).
  - Consumir la API real de `GET /api/v1/reports/annex-03` y `GET /api/v1/reports/annex-04`.

- **JustificationsPage (Justificaciones y Sustentos)**:
  - Formulario con campos de personal, fechas, código de norma (`J`, `LS`, `LG`, `P`, `H`, `F`), goce y archivo adjunto.
  - Envío mediante `FormData` a `POST /api/v1/justifications` y tabla de registros existentes (`GET /api/v1/justifications`).

## Acceptance Criteria
- **AC-01**: `ImportPage` sube un archivo CSV real al backend, muestra el resumen de filas procesadas y permite la confirmación/anulación de la carga.
- **AC-02**: `StaffPage` permite agregar un nuevo miembro del personal y actualizar la lista en tiempo real.
- **AC-03**: `AttendancePage` y `ReportsPage` consumen datos dinámicos según el mes/año seleccionado.
- **AC-04**: `JustificationsPage` envía la justificación junto al archivo de sustento adjunto y actualiza la lista de registros.
