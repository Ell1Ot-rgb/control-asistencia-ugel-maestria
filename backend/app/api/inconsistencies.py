"""TEC-D06 — inconsistency API routes."""

from fastapi import APIRouter, Depends, HTTPException

from app.api.deps import require_token
from app.services.inconsistency_service import inconsistency_service

router = APIRouter(prefix="/api/v1/inconsistencies", tags=["inconsistencies"])


@router.get("")
def list_inconsistencies(session: dict = Depends(require_token)):
    return inconsistency_service.list()


@router.post("/{id}/review")
def review(id: int, session: dict = Depends(require_token)):
    result = inconsistency_service.review(id)
    if not result:
        raise HTTPException(status_code=404, detail="Inconsistency not found")
    return result


@router.post("/{id}/correction")
def correct(id: int, session: dict = Depends(require_token)):
    result = inconsistency_service.correct(id)
    if not result:
        raise HTTPException(status_code=404, detail="Inconsistency not found")
    return result
