"""TEC-D04 related — staff CRUD contract."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.api.deps import require_token
from app.services.audit_service import audit_service
from app.services.staff_member_service import (
    StaffMemberConflictError,
    StaffMemberNotFoundError,
    staff_member_service,
)

router = APIRouter(prefix="/api/v1/staff-members", tags=["staff"])


class StaffIn(BaseModel):
    dni: str = Field(pattern=r"^[0-9]{8}$")
    last_names: str = Field(min_length=1)
    first_names: str = Field(min_length=1)
    job_title: str = Field(min_length=1)
    employment_status: str | None = None
    is_active: str = Field(default="Y", pattern=r"^[YN]$")


@router.get("")
def list_staff(
    q: str | None = None,
    is_active: str | None = None,
    job_title: str | None = None,
    session: dict = Depends(require_token),
):
    return staff_member_service.list(q=q, is_active=is_active, job_title=job_title)


@router.post("", status_code=201)
def create_staff(body: StaffIn, session: dict = Depends(require_token)):
    try:
        row = staff_member_service.create(body.model_dump())
    except StaffMemberConflictError as exc:
        raise HTTPException(
            status_code=409, detail="Staff member DNI already exists"
        ) from exc
    audit_service.record(
        user_id=session["user_id"],
        entity_name="staff_member",
        entity_id=row["id"],
        action_name="create",
        new_value=row,
    )
    return row


@router.get("/{id}")
def get_staff(id: int, session: dict = Depends(require_token)):
    try:
        return staff_member_service.get(id)
    except StaffMemberNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Staff member not found") from exc


@router.put("/{id}")
def update_staff(id: int, body: StaffIn, session: dict = Depends(require_token)):
    try:
        change = staff_member_service.update(id, body.model_dump())
    except StaffMemberNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Staff member not found") from exc
    except StaffMemberConflictError as exc:
        raise HTTPException(
            status_code=409, detail="Staff member DNI already exists"
        ) from exc
    audit_service.record(
        user_id=session["user_id"],
        entity_name="staff_member",
        entity_id=id,
        action_name="update",
        old_value=change["old"],
        new_value=change["new"],
    )
    return change["new"]


@router.post("/{id}/deactivation")
def deactivate(id: int, session: dict = Depends(require_token)):
    try:
        change = staff_member_service.deactivate(id)
    except StaffMemberNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Staff member not found") from exc
    audit_service.record(
        user_id=session["user_id"],
        entity_name="staff_member",
        entity_id=id,
        action_name="deactivate",
        old_value=change["old"],
        new_value=change["new"],
    )
    return change["new"]
