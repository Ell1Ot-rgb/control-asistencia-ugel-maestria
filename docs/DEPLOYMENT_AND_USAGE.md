# CHIQUISTRUKIS Deployment and User Guide

This guide is the shortest reliable path from a fresh clone to a working local demo. It also explains the current persistence model, daily workflows, validation commands, and the production boundary.

## Quick path: fresh clone

### 1. Install prerequisites

| Tool | Minimum | Purpose |
|---|---:|---|
| Git | 2.40+ | Clone and version the repository |
| Python | 3.11+ | FastAPI backend and tests |
| Node.js | 20+ | Vite frontend and Playwright scripts |
| npm | 10+ | Frontend dependencies |
| Docker | 24+ | Optional Redis service |
| Oracle Client/SQL*Plus | Optional | Database scripts; not required for the demo store |

### 2. Clone and enter the repository

```bash
git clone https://github.com/Ell1Ot-rgb/control-asistencia-ugel-maestria.git
cd control-asistencia-ugel-maestria
```

### 3. Start Redis (recommended)

The backend can use Redis for sessions. Start the repository-provided service:

```bash
cd infra/redis
docker compose up -d
cd ../..
```

If Docker is unavailable, the demo can use the configured in-memory session fallback. Do not use that fallback for a multi-process deployment.

### 4. Install and start the backend

```bash
cd backend
python -m venv .venv

# Linux/macOS
source .venv/bin/activate

# Windows PowerShell
# .\.venv\Scripts\Activate.ps1

python -m pip install --upgrade pip
pip install -r requirements.txt
cp .env.example .env  # Windows: copy .env.example .env
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Keep this terminal open. Verify the API from another terminal:

```bash
curl http://127.0.0.1:8000/api/v1/health
```

Expected response:

```json
{"status":"ok","service":"chiquistrukis-api","tec":"D01-D12 scaffold"}
```

### 5. Install and start the frontend

```bash
cd frontend
npm install
npm run dev
```

Open <http://127.0.0.1:5173> and use:

```text
Username: director.demo
Password: Demo12345
```

The Vite proxy sends relative `/api` requests to `http://127.0.0.1:8000`. Do not hard-code a backend URL in React code.

## Codespaces and remote browsers

For a Codespace or tunnel, bind Vite to all interfaces:

```bash
cd frontend
npm run dev -- --host 0.0.0.0
```

The existing `frontend/vite.config.ts` already proxies `/api` to the local backend. Expose the frontend port through Codespaces or your tunnel provider; expose the backend only when the environment requires it.

## Configuration

The backend reads `.env` through `backend/app/core/config.py`. Keep real credentials out of Git. The important settings are:

| Setting | Demo default | Guidance |
|---|---|---|
| `APP_ENV` | `development` | Use a deployment-specific value outside local development |
| `APP_DEBUG` | `true` | Set `false` for shared environments |
| `REDIS_URL` | `redis://127.0.0.1:6379/0` | Use a reachable protected Redis instance |
| `APP_USE_DEMO_STORE` | `true` | Current runtime uses in-memory business data |
| `APP_ALLOW_MEMORY_SESSION` | `true` | Convenience fallback only; disable for multi-worker production |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | Adjust to the organization security policy |
| `ORACLE_USER/PASSWORD/DSN` | empty | Reserved for the repository/database integration boundary |

The frontend uses relative API paths by default. If a deployment needs a different origin, configure the Vite proxy or an equivalent reverse proxy rather than embedding secrets or machine-local addresses in source code.

## Current persistence boundary

The application currently runs as a demo/MVP:

- Staff, biometric imports, attendance days, justifications, inconsistencies, and audit records live in process memory.
- Backend restarts reseed the demo state and discard runtime edits.
- Redis stores sessions when available; memory session fallback is optional.
- Oracle DDL, seed, and checks exist under `database/`, but the active demo services are not yet wired to Oracle repositories.
- Do not claim durable attendance persistence until repository adapters and migration behavior are implemented and tested.

## User workflows

### Login and navigation

1. Open the frontend URL.
2. Sign in with the demo credentials or an approved account.
3. Use the top navigation on small screens or the sidebar on desktop:
   - **Dashboard**: indicators for active staff, imports, attendance, and tardiness.
   - **Personal**: staff registration, update, search, and deactivation.
   - **Carga biométrica**: import review and confirmation.
   - **Asistencia**: editable Anexo 03 daily grid.
   - **Justificaciones**: license/permission records and support files.
   - **Reportes**: Anexo 04 summary and official Excel download.

### Import CSV or ATTLOG `.dat`

1. Open **Carga biométrica**.
2. Select a `.csv` or supported ATTLOG `.dat` file.
3. Inspect the draft rows and match/unmatched DNI values.
4. Correct draft rows or auto-register approved new staff.
5. Confirm the import only after the preview is correct.
6. Verify the resulting attendance in **Asistencia** and **Reportes**.

Confirmation is the point where accepted biometric rows impact attendance. Cancelling a draft does not apply it.

### Edit Anexo 03 before export

1. Open **Asistencia**.
2. Select month and year.
3. Edit a day status or late-minute value in the row for the staff member.
4. Use status `none` to remove a temporary override.
5. Save the change and verify the confirmation message.
6. Generate the official Excel workbook.

The correction is kept in memory and is used by both Anexo 03 and Anexo 04 until the backend restarts.

### Create a justification

1. Open **Justificaciones**.
2. Select the staff member and date range.
3. Select the RSG N.° 326 code and remuneration flag.
4. Enter the reason and optionally attach a PDF/image.
5. Submit the form.
6. Verify the record and the affected attendance/report totals.

The browser submits this operation as `multipart/form-data`; API clients must do the same when attaching a file.

### Generate reports

1. Open **Reportes**.
2. Select month and year.
3. Refresh the Anexo 04 consolidated view.
4. Review totals, staff rows, tardiness, justifications, and suggested discount.
5. Click **Exportar Excel Oficial (.xlsx)**.
6. Open the workbook and verify the `ASISTENCIA` and `REPORTE CONSOLIDADO` sheets, formulas, validations, styles, and editable values.

## API smoke examples

### Login

```bash
curl -sS -X POST http://127.0.0.1:8000/api/v1/auth/sessions \
  -H 'Content-Type: application/json' \
  -d '{"username":"director.demo","password":"Demo12345"}'
```

Copy the returned token and send it as `Authorization: Bearer <token>` to protected endpoints.

### Read dashboard indicators

```bash
curl -sS 'http://127.0.0.1:8000/api/v1/dashboard/indicators?month=7&year=2026' \
  -H 'Authorization: Bearer <token>'
```

### Upload a biometric file

```bash
curl -sS -X POST http://127.0.0.1:8000/api/v1/biometric-imports \
  -H 'Authorization: Bearer <token>' \
  -F 'file=@/path/to/marcas.csv'
```

### Export official Excel

```bash
curl -L -o asistencia-2026-07.xlsx \
  'http://127.0.0.1:8000/api/v1/reports/official-excel?month=7&year=2026' \
  -H 'Authorization: Bearer <token>'
```

## Verification checklist

Run these commands after a fresh clone or before sharing a deployment:

```bash
# Backend
cd backend
pytest -q

# Frontend
cd ../frontend
npm run lint
npm run typecheck
npm run build
npm run test:e2e
```

The Playwright scripts expect the backend and Vite server to be running and use the demo credentials. They are browser smoke tests, not a substitute for backend unit tests.

For a visual audit, capture the six main routes at desktop and mobile widths and confirm:

- `document.documentElement.scrollWidth === document.documentElement.clientWidth`.
- No browser console errors or page errors occur.
- Mobile tables remain horizontally scrollable inside their cards.
- KPI labels, values, and trends occupy separate readable lines.
- The desktop sidebar and mobile navigation both expose every route.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Frontend shows network errors | Backend is not listening on port 8000 | Start Uvicorn and check `/api/v1/health` |
| Browser redirects to login | Token expired or backend returned 401 | Sign in again; inspect the backend logs |
| CORS error | Frontend is not using the Vite proxy | Use relative `/api` URLs and restart Vite |
| Redis connection warning | Redis is not running | Start `infra/redis`, or explicitly enable memory session fallback for local-only use |
| Data disappears after restart | Demo stores are in memory | Reseed for local demo; implement Oracle repositories for durable data |
| Excel download fails | Template/dependency missing | Confirm the XLSX template exists and `openpyxl` is installed |
| `.dat` import rejected | File is not an accepted ATTLOG shape | Verify tab-delimited columns and timestamp/DNI values |
| Mobile table looks clipped | Table is wider than the viewport | Scroll inside the table card; do not remove the responsive wrapper |
| Port already in use | Another Uvicorn/Vite process owns the port | Stop it or choose a different port and update the proxy |

## Deployment safety

- Never commit `.env`, Oracle passwords, Redis credentials, uploaded support files, or demo data exports containing personal information.
- Place TLS, authentication hardening, rate limiting, and secret management at the deployment boundary before exposing the service publicly.
- Use one shared Redis instance for multiple backend workers; do not rely on process-memory sessions in a scaled deployment.
- Preserve the idempotent database scripts. Do not fix a setup problem with `DROP TABLE`, `DROP USER`, or destructive seed cleanup.
- Back up durable database data before schema changes.
- Treat the current in-memory demo mode as non-production until Oracle repository integration is complete.

## Next step for production

Implement and test repository adapters for the entities listed in `database/README.md`, then switch `APP_USE_DEMO_STORE` only after persistence, migrations, authorization, backups, and multi-worker session behavior have been verified in a staging environment.
