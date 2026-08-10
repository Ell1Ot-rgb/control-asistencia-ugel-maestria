"""TEC-D09 TEC-D12."""
from fastapi import APIRouter, Depends

from app.api.deps import require_token
from app.services.report_service import report_service

router = APIRouter(prefix="/api/v1/reports", tags=["reports"])


@router.get("/annex-03")
def annex03(month: int, year: int, format: str = "json", session: dict = Depends(require_token)):
    return report_service.annex_03(month, year)


@router.get("/annex-04")
def annex04(month: int, year: int, format: str = "json", session: dict = Depends(require_token)):
    return report_service.annex_04(month, year)
