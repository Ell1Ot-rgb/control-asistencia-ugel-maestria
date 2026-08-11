"""TEC-D07 — justification routes."""

import os
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, Field

from app.api.deps import require_token
from app.services.audit_service import audit_service
from app.services.justification_service import (
    JustificationNotFoundError,
    JustificationValidationError,
    justification_service,
)

router = APIRouter(prefix="/api/v1/justifications", tags=["justifications"])

VALID_NORM_CODES = {"J", "LS", "LG", "P", "H", "F", "LIC", "PER"}


@router.get("")
def list_justifications(
    staff_member_id: int | None = None,
    status: str | None = None,
    session: dict = Depends(require_token),
):
    return justification_service.list(staff_member_id, status)


class JustificationUpdate(BaseModel):
    staff_member_id: int
    start_date: str
    end_date: str
    norm_code: str
    with_pay: str = Field(default="Y", pattern=r"^[YN]$")
    reason: str | None = None
    support_file_path: str | None = None


@router.post("", status_code=201)
async def create_justification(
    staff_member_id: int = Form(...),
    start_date: str = Form(...),
    end_date: str = Form(...),
    norm_code: str = Form(...),
    with_pay: str = Form("Y"),
    reason: str | None = Form(None),
    support_file: UploadFile | None = File(None),
    session: dict = Depends(require_token),
):
    if norm_code not in VALID_NORM_CODES:
        raise HTTPException(status_code=400, detail="Invalid norm_code")

    support_file_path = None
    if support_file and support_file.filename:
        content = await support_file.read()
        upload_dir = os.path.join("uploads", "justifications")
        os.makedirs(upload_dir, exist_ok=True)
        target_path = os.path.join(upload_dir, support_file.filename)
        with open(target_path, "wb") as f:
            f.write(content)
        support_file_path = f"uploads/justifications/{support_file.filename}"

    data = {
        "staff_member_id": staff_member_id,
        "start_date": start_date,
        "end_date": end_date,
        "norm_code": norm_code,
        "with_pay": with_pay,
        "reason": reason,
        "support_file_path": support_file_path,
        "registered_by_id": session["user_id"],
    }
    try:
        item = justification_service.create(data)
    except JustificationValidationError as exc:
        raise HTTPException(status_code=400, detail="Invalid justification") from exc
    audit_service.record(
        user_id=session["user_id"],
        entity_name="justification",
        entity_id=item["id"],
        action_name="create",
        new_value=item,
    )
    return item


@router.put("/{id}")
def update_justification(
    id: int, body: JustificationUpdate, session: dict = Depends(require_token)
):
    if body.norm_code not in VALID_NORM_CODES:
        raise HTTPException(status_code=400, detail="Invalid norm_code")

    data = body.model_dump()
    data["registered_by_id"] = session["user_id"]
    try:
        change = justification_service.update(id, data)
    except JustificationNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Justification not found") from exc
    except JustificationValidationError as exc:
        raise HTTPException(status_code=400, detail="Invalid justification") from exc
    audit_service.record(
        user_id=session["user_id"],
        entity_name="justification",
        entity_id=id,
        action_name="update",
        old_value=change["old"],
        new_value=change["new"],
    )
    return change["new"]


class CancelBody(BaseModel):
    reason: str


@router.post("/{id}/cancellation")
def cancel_justification(
    id: int, body: CancelBody, session: dict = Depends(require_token)
):
    try:
        item = justification_service.cancel(id, body.reason)
    except JustificationNotFoundError as exc:
        raise HTTPException(status_code=404, detail="Justification not found") from exc
    audit_service.record(
        user_id=session["user_id"],
        entity_name="justification",
        entity_id=id,
        action_name="cancel",
        new_value={"reason": body.reason},
    )
    return item
