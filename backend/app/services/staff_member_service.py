"""TEC-D04 — staff member CRUD service."""

from __future__ import annotations

from copy import deepcopy
from typing import Any


class StaffMemberConflictError(ValueError):
    """Raised when staff data violates a uniqueness rule."""


class StaffMemberNotFoundError(LookupError):
    """Raised when a staff member does not exist."""


class StaffMemberService:
    def __init__(self) -> None:
        self._rows: list[dict[str, Any]] = []
        self._next_id = 1
        self.reset_demo_data()

    def reset_demo_data(self) -> None:
        self._rows = []
        self._next_id = 1
        for row in [
            {
                "dni": "45678912",
                "last_names": "Quispe Mamani",
                "first_names": "Maria Elena",
                "job_title": "Docente",
                "employment_status": "Nombrado",
            },
            {
                "dni": "71234567",
                "last_names": "Huaman Rojas",
                "first_names": "Carlos Alberto",
                "job_title": "Docente",
                "employment_status": "Contratado",
            },
            {
                "dni": "40112233",
                "last_names": "Flores Ilacopa",
                "first_names": "Leida Idalecia",
                "job_title": "Auxiliar",
                "employment_status": "Nombrado",
            },
        ]:
            self.create(row)

    def list(
        self,
        *,
        q: str | None = None,
        is_active: str | None = None,
        job_title: str | None = None,
    ) -> list[dict[str, Any]]:
        rows = self._rows
        if q:
            query = q.lower()
            rows = [
                row
                for row in rows
                if query in row["dni"]
                or query in row["last_names"].lower()
                or query in row["first_names"].lower()
            ]
        if is_active:
            rows = [row for row in rows if row["is_active"] == is_active]
        if job_title:
            query_job_title = job_title.lower()
            rows = [row for row in rows if row["job_title"].lower() == query_job_title]
        return [deepcopy(row) for row in rows]

    def get(self, staff_member_id: int) -> dict[str, Any]:
        row = self._find(staff_member_id)
        return deepcopy(row)

    def get_by_dni(self, dni: str) -> dict[str, Any] | None:
        for row in self._rows:
            if row["dni"] == dni:
                return deepcopy(row)
        return None

    def create(self, data: dict[str, Any]) -> dict[str, Any]:
        self._ensure_unique_dni(data["dni"])
        row = {
            "id": self._next_id,
            "dni": data["dni"],
            "last_names": data["last_names"],
            "first_names": data["first_names"],
            "job_title": data["job_title"],
            "employment_status": data.get("employment_status"),
            "is_active": data.get("is_active", "Y"),
        }
        self._next_id += 1
        self._rows.append(row)
        return deepcopy(row)

    def update(self, staff_member_id: int, data: dict[str, Any]) -> dict[str, Any]:
        row = self._find(staff_member_id)
        self._ensure_unique_dni(data["dni"], ignore_id=staff_member_id)
        old_row = deepcopy(row)
        row.update(
            {
                "dni": data["dni"],
                "last_names": data["last_names"],
                "first_names": data["first_names"],
                "job_title": data["job_title"],
                "employment_status": data.get("employment_status"),
                "is_active": data.get("is_active", row["is_active"]),
            }
        )
        return {"old": old_row, "new": deepcopy(row)}

    def deactivate(self, staff_member_id: int) -> dict[str, Any]:
        row = self._find(staff_member_id)
        old_row = deepcopy(row)
        row["is_active"] = "N"
        return {"old": old_row, "new": deepcopy(row)}

    def _find(self, staff_member_id: int) -> dict[str, Any]:
        for row in self._rows:
            if row["id"] == staff_member_id:
                return row
        raise StaffMemberNotFoundError(f"Staff member {staff_member_id} not found")

    def _ensure_unique_dni(self, dni: str, ignore_id: int | None = None) -> None:
        for row in self._rows:
            if row["dni"] == dni and row["id"] != ignore_id:
                raise StaffMemberConflictError(f"Staff member DNI {dni} already exists")


staff_member_service = StaffMemberService()
