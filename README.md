# CHIQUISTRUKIS — scaffold con TEC-D01…D12

Todos los PBI técnicos del Tema 5 (§5.7) tienen **evidencia** en el repo (`docs/backlog_tec.md`).

| TEC | Qué hay |
|-----|---------|
| D01 | Capas frontend/backend/database/infra |
| D02 | SQL 10 tablas + seed |
| D03 | Login, bcrypt, sesión Redis, mapa access |
| D04 | OpenAPI + routers + apiClient front |
| D05 | Wizard import draft/confirm/cancel |
| D06 | Reglas inconsistencias + stub IA |
| D07 | Justificaciones + support path |
| D08 | attendance_day service |
| D09 | Annex 03/04 JSON |
| D10 | Dashboard indicators |
| D11 | audit_service |
| D12 | institution en reportes + seed |

## Demo local

```bash
# Redis aparte
cd infra/redis && docker compose up -d

cd ../../backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# Login demo: director.demo / Demo12345
```

Persistencia Oracle: ejecutar `database/01_schema` + `02_seed` y cablear repositorios (hoy demo en memoria + Redis sesión).

Mockups: sube HTML a `disenos_base/`.
