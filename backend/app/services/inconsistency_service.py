"""TEC-D06 — inconsistency orchestration and state persistence."""

from __future__ import annotations

from copy import deepcopy
from typing import Any
from app.rules.inconsistency_rules import detect_basic_issues, ia_suggest


class InconsistencyService:
    def __init__(self) -> None:
        self._issues: dict[int, dict[str, Any]] = {}
        self._seq = 0

    def reset(self) -> None:
        self._issues = {}
        self._seq = 0

    def analyze(self, marks: list[dict[str, Any]]) -> list[dict[str, Any]]:
        raw_issues = detect_basic_issues(marks)
        raw_issues.extend(ia_suggest(marks))
        
        stored = []
        for issue in raw_issues:
            self._seq += 1
            item = {
                "id": self._seq,
                "mark_id": issue.get("mark_id"),
                "issue_type": issue.get("issue_type"),
                "description": issue.get("description"),
                "status": issue.get("status", "pending"),
                "source": issue.get("source", "rules"),
            }
            self._issues[self._seq] = item
            stored.append(deepcopy(item))
        return stored

    def list(self) -> list[dict[str, Any]]:
        return [deepcopy(item) for item in self._issues.values()]

    def get(self, issue_id: int) -> dict[str, Any] | None:
        item = self._issues.get(issue_id)
        return deepcopy(item) if item else None

    def review(self, issue_id: int) -> dict[str, Any] | None:
        item = self._issues.get(issue_id)
        if not item:
            return None
        item["status"] = "reviewed"
        return deepcopy(item)

    def correct(self, issue_id: int) -> dict[str, Any] | None:
        item = self._issues.get(issue_id)
        if not item:
            return None
        item["status"] = "corrected"
        return deepcopy(item)


inconsistency_service = InconsistencyService()
