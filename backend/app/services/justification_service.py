"""TEC-D07 — justifications with support file path."""
from __future__ import annotations

from typing import Any


class JustificationService:
    def __init__(self) -> None:
        self._items: dict[int, dict[str, Any]] = {}
        self._seq = 0

    def create(self, data: dict[str, Any]) -> dict[str, Any]:
        self._seq += 1
        data = {**data, "id": self._seq, "status": "active"}
        self._items[self._seq] = data
        return data

    def list(self, staff_member_id: int | None = None) -> list[dict[str, Any]]:
        rows = list(self._items.values())
        if staff_member_id:
            rows = [r for r in rows if r.get("staff_member_id") == staff_member_id]
        return rows

    def cancel(self, jid: int, reason: str) -> dict[str, Any]:
        item = self._items[jid]
        item["status"] = "cancelled"
        item["cancel_reason"] = reason
        return item


justification_service = JustificationService()
