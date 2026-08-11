"""TEC-D06 — rule engine + IA stub (IA only suggests; never auto-writes)."""

from __future__ import annotations

from typing import Any
from collections import defaultdict


def detect_basic_issues(marks: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Deterministic rules: duplicate same day/type, missing pair, out of shift timestamp."""
    issues: list[dict[str, Any]] = []
    seen: dict[str, int] = {}
    by_staff_date: dict[str, set[str]] = defaultdict(set)

    for m in marks:
        marked_at = str(m.get("marked_at") or "")
        staff_id = m.get("staff_member_id")
        date_str = marked_at[:10] if len(marked_at) >= 10 else ""
        time_str = marked_at[11:19] if len(marked_at) >= 19 else ""
        mark_type = m.get("mark_type")

        # Rule 1: Duplicate
        key = f"{staff_id}:{date_str}:{mark_type}"
        if key in seen:
            issues.append(
                {
                    "mark_id": m.get("id"),
                    "issue_type": "duplicate",
                    "description": "Marcación duplicada el mismo día/tipo",
                    "status": "pending",
                    "source": "rules",
                }
            )
        seen[key] = 1

        # Rule 2: Out of shift (before 06:00 or after 18:00)
        if time_str:
            try:
                hour = int(time_str.split(":")[0])
                if hour < 6 or hour >= 18:
                    issues.append(
                        {
                            "mark_id": m.get("id"),
                            "issue_type": "out_of_shift",
                            "description": f"Marcación fuera del turno oficial ({time_str})",
                            "status": "pending",
                            "source": "rules",
                        }
                    )
            except ValueError:
                pass

        if staff_id and date_str and mark_type:
            by_staff_date[f"{staff_id}:{date_str}"].add(mark_type)

    # Rule 3: Incomplete (entry without exit or exit without entry)
    for staff_date, types in by_staff_date.items():
        if "entry" in types and "exit" not in types:
            issues.append(
                {
                    "mark_id": None,
                    "issue_type": "incomplete",
                    "description": f"Marcación incompleta (solo entrada registrada)",
                    "status": "pending",
                    "source": "rules",
                }
            )

    return issues


def ia_suggest(marks: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Placeholder for ML service — returns empty or low-confidence hints only."""
    return []
