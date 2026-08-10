"""TEC-D05 — biometric import wizard (draft → confirm/cancel). TEC-D08 on confirm."""
from __future__ import annotations

from typing import Any


class BiometricImportService:
    def __init__(self) -> None:
        self._imports: dict[int, dict[str, Any]] = {}
        self._seq = 0

    def create_draft_from_upload(self, file_name: str, rows: list[dict[str, Any]]) -> dict[str, Any]:
        self._seq += 1
        imp = {
            "id": self._seq,
            "file_name": file_name,
            "status": "draft",
            "period_start": None,
            "period_end": None,
            "total_rows": len(rows),
            "matched_rows": sum(1 for r in rows if r.get("match") == "matched"),
            "new_rows": sum(1 for r in rows if r.get("match") == "new"),
            "ok_rows": 0,
            "error_rows": 0,
            "rows": rows,
        }
        self._imports[self._seq] = imp
        return imp

    def get(self, import_id: int) -> dict[str, Any] | None:
        return self._imports.get(import_id)

    def confirm(self, import_id: int) -> dict[str, Any]:
        imp = self._imports[import_id]
        if imp["status"] != "draft":
            raise ValueError("conflict_not_draft")
        if any(r.get("match") == "new" and not r.get("resolved") for r in imp.get("rows", [])):
            raise ValueError("unresolved_new_rows")
        imp["status"] = "confirmed"
        # TEC-D08: consolidate attendance_day (repository TODO)
        return imp

    def cancel(self, import_id: int, reason: str) -> dict[str, Any]:
        imp = self._imports[import_id]
        if imp["status"] != "confirmed":
            raise ValueError("conflict_not_confirmed")
        imp["status"] = "cancelled"
        imp["cancel_reason"] = reason
        return imp


biometric_import_service = BiometricImportService()
