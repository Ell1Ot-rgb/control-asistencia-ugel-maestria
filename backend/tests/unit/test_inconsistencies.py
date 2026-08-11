from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.inconsistency_service import inconsistency_service
from app.services.biometric_import_service import biometric_import_service


@pytest.fixture(autouse=True)
def reset_services() -> None:
    inconsistency_service.reset()
    biometric_import_service.reset()


@pytest.fixture()
def auth_headers(fake_redis) -> dict[str, str]:
    client = TestClient(app)
    response = client.post(
        "/api/v1/auth/sessions",
        json={"username": "director.demo", "password": "Demo12345"},
    )
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['token']}"}


def test_detect_inconsistent_marks(auth_headers: dict[str, str]) -> None:
    marks = [
        # Duplicate
        {"id": 1, "staff_member_id": 1, "marked_at": "2026-07-01 07:42:00", "mark_type": "entry"},
        {"id": 2, "staff_member_id": 1, "marked_at": "2026-07-01 07:42:00", "mark_type": "entry"},
        # Out of shift
        {"id": 3, "staff_member_id": 1, "marked_at": "2026-07-01 05:30:00", "mark_type": "entry"},
        # Incomplete (only entry, no exit)
        {"id": 4, "staff_member_id": 2, "marked_at": "2026-07-02 07:50:00", "mark_type": "entry"},
    ]

    issues = inconsistency_service.analyze(marks)
    assert len(issues) >= 3

    types = [issue["issue_type"] for issue in issues]
    assert "duplicate" in types
    assert "out_of_shift" in types
    assert "incomplete" in types


def test_inconsistencies_api_flow(auth_headers: dict[str, str]) -> None:
    client = TestClient(app)

    marks = [
        {"id": 1, "staff_member_id": 1, "marked_at": "2026-07-01 07:42:00", "mark_type": "entry"},
        {"id": 2, "staff_member_id": 1, "marked_at": "2026-07-01 07:42:00", "mark_type": "entry"},
    ]
    inconsistency_service.analyze(marks)

    get_response = client.get("/api/v1/inconsistencies", headers=auth_headers)
    assert get_response.status_code == 200
    issues = get_response.json()
    assert len(issues) > 0
    issue_id = issues[0]["id"]

    review_response = client.post(f"/api/v1/inconsistencies/{issue_id}/review", headers=auth_headers)
    assert review_response.status_code == 200
    assert review_response.json()["status"] == "reviewed"

    updated = inconsistency_service.get(issue_id)
    assert updated["status"] == "reviewed"
