"""TEC-D09 TEC-D12."""

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel

from app.api.deps import require_token
from app.services.report_service import report_service

router = APIRouter(prefix="/api/v1/reports", tags=["reports"])


@router.get("/annex-03")
def annex03(
    month: int, year: int, format: str = "json", session: dict = Depends(require_token)
):
    if format != "json":
        raise HTTPException(status_code=400, detail="Only JSON format is available")
    return report_service.annex_03(month, year)





class ConsolidateBody(BaseModel):
    month: int
    year: int


@router.post("/annex-03/consolidate")
def consolidate_annex03(body: ConsolidateBody, session: dict = Depends(require_token)):
    try:
        return report_service.consolidate_monthly_attendance(body.month, body.year)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

class AttendanceOverrideBody(BaseModel):
    month: int
    year: int
    staff_member_id: int
    attendance_date: str
    status: str
    late_minutes: int = 0
    observation: str | None = None


@router.patch("/annex-03/attendance")
def update_annex03_attendance(body: AttendanceOverrideBody, session: dict = Depends(require_token)):
    try:
        return report_service.set_attendance_override(**body.model_dump())
    except (ValueError, KeyError) as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/annex-04")
def annex04(
    month: int, year: int, format: str = "json", session: dict = Depends(require_token)
):
    if format != "json":
        raise HTTPException(status_code=400, detail="Only JSON format is available")
    return report_service.annex_04(month, year)


@router.get("/official-excel")
def official_excel(
    month: int, year: int, session: dict = Depends(require_token)
):
    excel_bytes = report_service.export_official_excel(month, year)
    filename = f"REPORTE_ASISTENCIA_UGEL_SAN_ROMAN_{month}_{year}.xlsx"
    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
