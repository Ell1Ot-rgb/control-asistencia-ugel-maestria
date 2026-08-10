"""TEC-D05 — biometric import wizard (draft → confirm/cancel)."""

from __future__ import annotations

import csv
from copy import deepcopy
from datetime import datetime
from io import StringIO
from typing import Any

from app.services.staff_member_service import (
    StaffMemberConflictError,
    staff_member_service,
)


class BiometricImportError(ValueError):
    def __init__(self, code: str) -> None:
        super().__init__(code)
        self.code = code


class BiometricImportService:
    def __init__(self) -> None:
        self._imports: dict[int, dict[str, Any]] = {}
        self._seq = 0

    def reset(self) -> None:
        self._imports = {}
        self._seq = 0

    def list(
        self,
        *,
        status: str | None = None,
        month: int | None = None,
        year: int | None = None,
    ) -> list[dict[str, Any]]:
        rows = list(self._imports.values())
        if status:
            rows = [row for row in rows if row["status"] == status]
        if month and year:
            prefix = f"{year:04d}-{month:02d}"
            rows = [
                row
                for row in rows
                if str(row.get("period_start") or "").startswith(prefix)
                or str(row.get("period_end") or "").startswith(prefix)
            ]
        return [deepcopy(row) for row in rows]

    def create_draft_from_csv(self, file_name: str, content: bytes) -> dict[str, Any]:
        rows = self._parse_csv(content)
        return self._create_draft(file_name, rows)

    def get(self, import_id: int) -> dict[str, Any] | None:
        row = self._imports.get(import_id)
        return deepcopy(row) if row else None

    def update_row(
        self,
        import_id: int,
        row_id: int,
        *,
        action: str,
        dni: str | None = None,
        last_names: str | None = None,
        first_names: str | None = None,
    ) -> dict[str, Any]:
        imp = self._find(import_id)
        if imp["status"] != "draft":
            raise BiometricImportError("conflict_not_draft")
        row = self._find_row(imp, row_id)
        if dni:
            row["dni"] = dni
        if last_names:
            row["last_names"] = last_names
        if first_names:
            row["first_names"] = first_names

        if action == "research":
            self._apply_match(row)
            row["resolved"] = row["match"] == "matched"
        elif action == "register_new":
            self._register_new_staff(row)
            self._apply_match(row)
            row["resolved"] = True
        elif action == "skip":
            row["skipped"] = True
            row["resolved"] = True
        else:
            raise BiometricImportError("invalid_row_action")

        self._refresh_counters(imp)
        return deepcopy(row)

    def confirm(self, import_id: int) -> dict[str, Any]:
        imp = self._find(import_id)
        if imp["status"] != "draft":
            raise BiometricImportError("conflict_not_draft")
        if any(
            row.get("match") == "new"
            and not row.get("resolved")
            and not row.get("skipped")
            for row in imp["rows"]
        ):
            raise BiometricImportError("unresolved_new_rows")
        imp["status"] = "confirmed"
        imp["ok_rows"] = sum(1 for row in imp["rows"] if not row.get("skipped"))
        imp["error_rows"] = sum(1 for row in imp["rows"] if row.get("skipped"))
        return deepcopy(imp)

    def cancel(self, import_id: int, reason: str) -> dict[str, Any]:
        imp = self._find(import_id)
        if imp["status"] != "confirmed":
            raise BiometricImportError("conflict_not_confirmed")
        imp["status"] = "cancelled"
        imp["cancel_reason"] = reason
        return deepcopy(imp)

    def _create_draft(
        self, file_name: str, rows: list[dict[str, Any]]
    ) -> dict[str, Any]:
        self._seq += 1
        imp = {
            "id": self._seq,
            "file_name": file_name,
            "status": "draft",
            "period_start": self._period_value(rows, minimum=True),
            "period_end": self._period_value(rows, minimum=False),
            "total_rows": len(rows),
            "matched_rows": 0,
            "new_rows": 0,
            "ok_rows": 0,
            "error_rows": 0,
            "rows": rows,
        }
        self._refresh_counters(imp)
        self._imports[self._seq] = imp
        return deepcopy(imp)

    def _parse_csv(self, content: bytes) -> list[dict[str, Any]]:
        text = content.decode("utf-8-sig")
        reader = csv.DictReader(StringIO(text))
        required_fields = {"dni", "marked_at", "mark_type"}
        if not reader.fieldnames or not required_fields.issubset(
            set(reader.fieldnames)
        ):
            raise BiometricImportError("invalid_file")

        rows: list[dict[str, Any]] = []
        for order, raw_row in enumerate(reader, start=1):
            marked_at = self._parse_marked_at(raw_row.get("marked_at") or "")
            row = {
                "row_id": order,
                "order": order,
                "dni": (raw_row.get("dni") or "").strip(),
                "last_names": (raw_row.get("last_names") or "").strip(),
                "first_names": (raw_row.get("first_names") or "").strip(),
                "marked_at": marked_at.isoformat(sep=" "),
                "mark_type": (raw_row.get("mark_type") or "").strip().lower(),
                "match": "new",
                "staff_member_id": None,
                "resolved": False,
                "skipped": False,
            }
            if row["mark_type"] not in {"entry", "exit"}:
                raise BiometricImportError("invalid_file")
            self._apply_match(row)
            rows.append(row)
        if not rows:
            raise BiometricImportError("invalid_file")
        return rows

    def _apply_match(self, row: dict[str, Any]) -> None:
        staff_member = staff_member_service.get_by_dni(row["dni"])
        if staff_member:
            row["match"] = "matched"
            row["staff_member_id"] = staff_member["id"]
            row["resolved"] = True
            row["skipped"] = False
        else:
            row["match"] = "new"
            row["staff_member_id"] = None

    def _register_new_staff(self, row: dict[str, Any]) -> None:
        try:
            staff_member_service.create(
                {
                    "dni": row["dni"],
                    "last_names": row["last_names"] or "Sin apellidos",
                    "first_names": row["first_names"] or "Sin nombres",
                    "job_title": "No especificado",
                    "employment_status": "Registrado en carga biométrica",
                }
            )
        except StaffMemberConflictError:
            pass

    def _refresh_counters(self, imp: dict[str, Any]) -> None:
        rows = imp["rows"]
        imp["matched_rows"] = sum(1 for row in rows if row.get("match") == "matched")
        imp["new_rows"] = sum(
            1 for row in rows if row.get("match") == "new" and not row.get("resolved")
        )

    def _period_value(self, rows: list[dict[str, Any]], *, minimum: bool) -> str | None:
        dates = [str(row["marked_at"])[:10] for row in rows]
        if not dates:
            return None
        return min(dates) if minimum else max(dates)

    def _find(self, import_id: int) -> dict[str, Any]:
        try:
            return self._imports[import_id]
        except KeyError as exc:
            raise BiometricImportError("not_found") from exc

    def _find_row(self, imp: dict[str, Any], row_id: int) -> dict[str, Any]:
        for row in imp["rows"]:
            if row["row_id"] == row_id:
                return row
        raise BiometricImportError("row_not_found")

    def _parse_marked_at(self, value: str) -> datetime:
        try:
            return datetime.fromisoformat(value.strip())
        except ValueError as exc:
            raise BiometricImportError("invalid_file") from exc


biometric_import_service = BiometricImportService()
