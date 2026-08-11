# OpenSpec Specification: fix-core-attendance-flow

## Feature Definition
Implementar y alinear la lógica de negocio del backend FastAPI para cumplir al 100% con los requerimientos funcionales RF-03, RF-04, RF-05 y RF-06 de la RSG N.° 326-2017-MINEDU.

## Detailed Requirements

### 1. Consolidación de Asistencia (HU-03 / RF-03)
- Al invocar `POST /api/v1/biometric-imports/{id}/confirmation`:
  - Cada fila resuelta con `staff_member_id` genera una marcación.
  - La hora de ingreso estándar es `08:00:00`. Entrada > `08:00:00` genera `status = "late"` con `late_minutes = (hora_entrada - 08:00)`. Entrada <= `08:00:00` genera `status = "present"` con `late_minutes = 0`.
  - La llamada invoca `attendance_service.upsert_day()`.

### 2. Detección de Inconsistencias (HU-04 / RF-04)
- `inconsistency_service.analyze(marks)` debe recibir todas las marcaciones registradas del período.
- Reglas a ejecutar en `inconsistency_rules.py`:
  1. `duplicate`: Marcación idéntica (misma persona, misma fecha, mismo tipo) registrada más de una vez.
  2. `incomplete`: Registrada solo entrada sin salida en el mismo día.
  3. `out_of_shift`: Marcación antes de 06:00 AM o después de 18:00 PM.
- Endpoints `POST /api/v1/inconsistencies/{id}/review` y `POST /api/v1/inconsistencies/{id}/correction`:
  - Actualizar el estado de la inconsistencia en el almacén de inconsistencias de `inconsistency_service`.

### 3. Justificaciones y Sustentos (HU-05 / RF-05)
- Endpoint `POST /api/v1/justifications`:
  - Recibe `support_file: UploadFile`.
  - Si se proporciona un archivo, lee los bytes (`await support_file.read()`) y los guarda en `/root/control-asistencia-ugel-maestria/backend/uploads/justifications/{filename}`.
  - Valida que el `reason_code` o tipo pertenezca a la leyenda oficial: `J` (Justificada), `LS` (Licencia Sin Goce), `LG` (Licencia Con Goce), `P` (Permiso Sin Goce), `H` (Huelga), `F` (Feriado).
  - Al crearse, invoca `attendance_service.apply_justification_range()` para actualizar las fechas comprendidas.

### 4. Consolidación Mensual del Personal Activo (HU-06 / RF-06)
- `attendance_service.list_month(month, year)` y `report_service.annex_03(month, year)`:
  - Consultan la lista total de personal activo (`staff_member_service.list(is_active="Y")`).
  - Para cada docente/auxiliar activo, generan la vista completa de los días laborables del mes.
  - Si un día hábil (Lunes a Viernes) no posee marcación biométrica ni justificación registrada, se marca automáticamente como `absent` (`I/L` - Inasistencia injustificada).

## Validation Criteria
- Suite de pruebas unitarias en `pytest` cubriendo:
  1. `test_biometric_import_consolidation`
  2. `test_inconsistencies_detection_and_review`
  3. `test_justification_file_saved_and_range_applied`
  4. `test_annex_03_includes_all_active_staff_with_absences`
