"""TEC-D09 + TEC-D12 — annex reports using institution header + attendance_day."""
from __future__ import annotations

from typing import Any


class ReportService:
    def annex_03(self, month: int, year: int, institution: dict[str, Any] | None = None) -> dict[str, Any]:
        inst = institution or {
            "school_name": "IE Demo",
            "ugel": "UGEL Demo",
            "modular_code": "1234567",
        }
        return {
            "institution": inst,
            "period": {"month": month, "year": year},
            "rows": [],
            "format_note": "json preview; xlsx export wires openpyxl later",
        }

    def annex_04(self, month: int, year: int) -> dict[str, Any]:
        return {
            "period": {"month": month, "year": year},
            "rows": [],
            "format_note": "totals from attendance_day",
        }


report_service = ReportService()
