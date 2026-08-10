"""TEC-D06 — inconsistency orchestration."""
from app.rules.inconsistency_rules import detect_basic_issues, ia_suggest


class InconsistencyService:
    def analyze(self, marks: list[dict]) -> list[dict]:
        issues = detect_basic_issues(marks)
        issues.extend(ia_suggest(marks))
        return issues


inconsistency_service = InconsistencyService()
