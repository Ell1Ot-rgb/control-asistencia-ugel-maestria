"""CHIQUISTRUKIS API — TEC-D01/D04 entrypoint. Redis: infra/redis (aparte)."""

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import (
    attendance,
    auth,
    biometric_imports,
    dashboard,
    inconsistencies,
    justifications,
    reports,
    staff_members,
)

app = FastAPI(title="CHIQUISTRUKIS API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5173",
        "http://localhost:5173",
        "http://127.0.0.1:5174",
        "http://localhost:5174",
        "http://127.0.0.1:5175",
        "http://localhost:5175",
    ],
    allow_origin_regex=r"http://(127\.0\.0\.1|localhost):\d+",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(staff_members.router)
app.include_router(biometric_imports.router)
app.include_router(inconsistencies.router)
app.include_router(attendance.router)
app.include_router(justifications.router)
app.include_router(reports.router)
app.include_router(dashboard.router)


@app.get("/api/v1/health")
def health():
    return {"status": "ok", "service": "chiquistrukis-api", "tec": "D01-D12 scaffold"}


def seed_demo_data():
    try:
        from datetime import date
        from app.services.biometric_import_service import biometric_import_service
        from app.services.report_service import report_service

        if biometric_import_service.list(month=7, year=2026):
            return

        staff_dnis = ['45678912', '71234567', '40112233']
        dat_lines = []

        for day in range(1, 32):
            dt = date(2026, 7, day)
            if dt.weekday() >= 5:
                continue

            date_str = dt.isoformat()
            if day in [7, 21]:
                entry_time = '08:15:00'
            else:
                entry_time = '07:50:00'
            dat_lines.append(f"{staff_dnis[0]}	{date_str} {entry_time}	1	1	0	0")
            dat_lines.append(f"{staff_dnis[0]}	{date_str} 15:00:00	0	1	0	0")

            if day in [3, 14, 24]:
                entry_time = '08:20:00'
            else:
                entry_time = '07:52:00'
            dat_lines.append(f"{staff_dnis[1]}	{date_str} {entry_time}	1	1	0	0")
            dat_lines.append(f"{staff_dnis[1]}	{date_str} 15:05:00	0	1	0	0")

            if day in [10]:
                entry_time = '08:10:00'
            elif day in [17]:
                continue
            else:
                entry_time = '07:45:00'
            dat_lines.append(f"{staff_dnis[2]}	{date_str} {entry_time}	1	1	0	0")
            dat_lines.append(f"{staff_dnis[2]}	{date_str} 15:00:00	0	1	0	0")

        content = chr(10).join(dat_lines).encode("utf-8")
        draft = biometric_import_service.create_draft_from_csv('ATTLOG_JULIO_2026.dat', content)
        biometric_import_service.confirm(draft['id'])
        report_service.consolidate_monthly_attendance(7, 2026)
    except Exception as exc:
        print('Seed error:', exc)

@app.on_event("startup")
def on_startup():
    # Demo data is opt-in so tests and normal deployments remain deterministic.
    if os.getenv("CHIQUISTRUKIS_SEED_DEMO_DATA") == "1":
        seed_demo_data()

