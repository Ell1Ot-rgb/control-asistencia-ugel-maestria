# OpenSpec Specification: connect-frontend-ui

## Feature Definition
Conexión reactiva del Frontend React + TypeScript (`App.tsx`) con los endpoints backend de FastAPI.

## Detailed Component Specifications

### 1. ImportPage
- Estado: `file: File | null`, `currentImport: BiometricImport | null`, `loading: boolean`, `message: string`.
- Interfaz: Input file estilizado para seleccionar CSV. Botón "Subir archivo" ejecuta `apiClient.post("/api/v1/biometric-imports", formData)`.
- Si `currentImport.status === "draft"`, muestra botón "Confirmar Carga" (`POST /api/v1/biometric-imports/{id}/confirmation`) y "Anular Carga" (`POST /api/v1/biometric-imports/{id}/cancellation`).

### 2. StaffPage
- Formulario modal / en línea para crear personal: `dni`, `last_names`, `first_names`, `job_title`, `employment_status`.
- Botón "Guardar Personal" llama a `apiClient.post("/api/v1/staff-members", body)` y recarga `GET /api/v1/staff-members`.

### 3. AttendancePage & ReportsPage
- Controles de selección de `month` (1-12) y `year` (ej. 2026).
- `AttendancePage` consume `GET /api/v1/reports/annex-03` con los parámetros seleccionados.
- `ReportsPage` consume `GET /api/v1/reports/annex-03` y `GET /api/v1/reports/annex-04`.

### 4. JustificationsPage
- Campos de formulario: `staff_member_id`, `start_date`, `end_date`, `norm_code` (select de códigos oficiales `LG`, `LS`, `P`, `J`, `H`, `F`), `with_pay`, `reason`, `support_file`.
- Envio vía `FormData` a `POST /api/v1/justifications`.
- Carga e integra la lista de justificaciones vía `GET /api/v1/justifications`.

## Validation
- `npm run build` en el directorio `frontend/` compilando sin errores de TypeScript ni sintaxis.
