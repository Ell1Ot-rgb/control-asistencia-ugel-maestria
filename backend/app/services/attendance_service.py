"""TEC-D08 — attendance_day source of truth."""
from __future__ import annotations

from typing import Any


class AttendanceService:
    def __init__(self) -> None:
        self._days: dict[str, dict[str, Any]] = {}

    def upsert_day(self, staff_member_id: int, attendance_date: str, status: str, late_minutes: int = 0, justification_id: int | None = None) -> dict[str, Any]:
        key = f"{staff_member_id}:{attendance_date}"
        row = {
            "staff_member_id": staff_member_id,
            "attendance_date": attendance_date,
            "status": status,
            "late_minutes": late_minutes,
            "justification_id": justification_id,
        }
        self._days[key] = row
        return row

    def list_month(self, month: int, year: int, staff_member_id: int | None = None) -> list[dict[str, Any]]:
        prefix = f"{year:04d}-{month:02d}"
        out = []
        for row in self._days.values():
            if not str(row["attendance_date"]).startswith(prefix):
                continue
            if staff_member_id and row["staff_member_id"] != staff_member_id:
                continue
            out.append(row)
        return out


attendance_service = AttendanceService()
