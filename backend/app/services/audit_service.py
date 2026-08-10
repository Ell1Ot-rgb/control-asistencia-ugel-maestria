"""TEC-D11 — audit trail (persists when Oracle available; always logs structured events)."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any


class AuditService:
    def __init__(self) -> None:
        self._memory: list[dict[str, Any]] = []

    def record(
        self,
        *,
        user_id: int,
        entity_name: str,
        entity_id: int,
        action_name: str,
        old_value: Any = None,
        new_value: Any = None,
    ) -> dict[str, Any]:
        entry = {
            "user_account_id": user_id,
            "entity_name": entity_name,
            "entity_id": entity_id,
            "action_name": action_name,
            "old_value": old_value,
            "new_value": new_value,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        self._memory.append(entry)
        # TODO: INSERT INTO audit_log when Oracle repository is wired
        return entry


audit_service = AuditService()
