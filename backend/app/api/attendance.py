"""TEC-D08 — attendance records."""
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.api.deps import require_token
from app.services.attendance_service import attendance_service
from app.services.audit_service import audit_service

router = APIRouter(prefix="/api/v1/attendance-records", tags=["attendance"])


@router.get("")
def list_records(month: int, year: int, staff_member_id: int | None = None, session: dict = Depends(require_token)):
    return attendance_service.list_month(month, year, staff_member_id)


class DayUpdate(BaseModel):
    staff_member_id: int
    attendance_date: str
    status: str
    late_minutes: int = 0
    norm_code: str | None = None
    justification_id: int | None = None


@router.put("/days")
def update_day(body: DayUpdate, session: dict = Depends(require_token)):
    row = attendance_service.upsert_day(
        body.staff_member_id, body.attendance_date, body.status, body.late_minutes, body.justification_id
    )
    audit_service.record(user_id=session["user_id"], entity_name="attendance_day", entity_id=0, action_name="edit", new_value=row)
    return row
