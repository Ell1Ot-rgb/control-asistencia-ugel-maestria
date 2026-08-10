"""TEC-D06."""

from fastapi import APIRouter, Depends

from app.api.deps import require_token
from app.services.inconsistency_service import inconsistency_service

router = APIRouter(prefix="/api/v1/inconsistencies", tags=["inconsistencies"])


@router.get("")
def list_inconsistencies(session: dict = Depends(require_token)):
    return inconsistency_service.analyze([])


@router.post("/{id}/review")
def review(id: int, session: dict = Depends(require_token)):
    return {"id": id, "status": "reviewed"}


@router.post("/{id}/correction")
def correct(id: int, session: dict = Depends(require_token)):
    return {"id": id, "status": "corrected"}
