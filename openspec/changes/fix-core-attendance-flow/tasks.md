# OpenSpec Tasks: fix-core-attendance-flow

## Tasks

- [x] 1. Configurar contexto SDD e inicializar propuesta y especificación
- [x] 2. Implementar motor de inconsistencias determinista en `inconsistency_rules.py` y conectar `inconsistency_service` con marcaciones reales
- [x] 3. Implementar persistencia física de archivos de sustento en `justifications.py` y validar códigos oficiales de la RSG N.° 326-2017-MINEDU
- [x] 4. Implementar consolidación mensual para el 100% del personal activo en `attendance_service.py` y `report_service.py`
- [x] 5. Ejecutar suite de pruebas unitarias en TDD (`pytest`) para validar todos los flujos ajustados
