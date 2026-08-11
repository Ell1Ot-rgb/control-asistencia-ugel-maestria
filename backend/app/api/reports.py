"""TEC-D09 TEC-D12."""

from fastapi import APIRouter, Depends, HTTPException, Response

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
