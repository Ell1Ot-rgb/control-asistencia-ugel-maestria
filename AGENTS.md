# AGENTS — CHIQUISTRUKIS

Sistema Web de Control de Asistencia Biométrica (MVP académico).

## Stack

React + TypeScript → API REST (FastAPI) → Python → Oracle  
Redis (sesión/caché) como **servicio aparte** (`infra/redis`)  
IA solo sugiere inconsistencias (sin escritura automática)

## Idioma (SB-04)

- Código, API, base de datos: **inglés**
- UI, documentación, commits: **español**

## Capas → carpetas

| Capa | Carpeta | Agente |
|------|---------|--------|
| Presentación | `frontend/` | frontend_react |
| API + lógica | `backend/` | backend_api |
| Datos Oracle | `database/` | oracle_dba |
| Redis (aparte) | `infra/redis/` | ops local / architect |
| Documentación | `docs/` | architect |
| Pruebas | `backend/tests/`, `frontend/src/tests/` | qa_tester |

## Reglas de negocio fijas

1. `attendance_day` = fuente de verdad (mes calculado).
2. Import: `draft` → `confirmed` | `cancelled`.
3. Wizard: orden del archivo, verde/rojo, período, finalizar → Asistencia.
4. Anular import si archivo/mes incorrecto.
5. Bearer en Redis; login devuelve `access`.
6. API `/api/v1/...` en inglés.
7. Auditoría en mutaciones.
8. Reportes desde `attendance_day` + `institution`.
9. IA solo sugiere; humano confirma.
10. Sin secretos en el repo.

## Redis

Levantar **antes** del backend: `cd infra/redis && docker compose up -d`.  
Backend solo consume `REDIS_URL`; no inicia Redis.

## Diseños base

Mockups HTML de referencia en `disenos_base/` (subidos por el equipo).
El agente frontend_react debe alinear pantallas a esos HTML y a los skills UI/wizard.

## Multiagente

Un escritor por carpeta. `security_reviewer` solo lectura.
