"""TEC-D07."""
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.api.deps import require_token
from app.services.justification_service import justification_service

router = APIRouter(prefix="/api/v1/justifications", tags=["justifications"])


@router.get("")
def list_justifications(staff_member_id: int | None = None, session: dict = Depends(require_token)):
    return justification_service.list(staff_member_id)


class JustIn(BaseModel):
    staff_member_id: int
    start_date: str
    end_date: str
    norm_code: str
    with_pay: str = "Y"
    reason: str | None = None
    support_file_path: str | None = None


@router.post("", status_code=201)
def create_justification(body: JustIn, session: dict = Depends(require_token)):
    return justification_service.create(body.model_dump())


@router.put("/{id}")
def update_justification(id: int, body: JustIn, session: dict = Depends(require_token)):
    data = body.model_dump()
    data["id"] = id
    return justification_service.create(data)  # simplified replace


class CancelBody(BaseModel):
    reason: str


@router.post("/{id}/cancellation")
def cancel_justification(id: int, body: CancelBody, session: dict = Depends(require_token)):
    return justification_service.cancel(id, body.reason)
