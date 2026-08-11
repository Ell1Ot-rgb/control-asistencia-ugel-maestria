"""TEC-D10."""

from fastapi import APIRouter, Depends

from app.api.deps import require_token
from app.services.dashboard_service import dashboard_service

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])


@router.get("/indicators")
def indicators(month: int, year: int, session: dict = Depends(require_token)):
    return dashboard_service.indicators(month, year)
