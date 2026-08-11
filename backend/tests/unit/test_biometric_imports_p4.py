from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.biometric_import_service import biometric_import_service
from app.services.staff_member_service import staff_member_service

CSV_CONTENT = (
    "dni,last_names,first_names,marked_at,mark_type\n"
    "45678912,Quispe Mamani,Maria Elena,2026-07-01 07:42:00,entry\n"
    "99999999,Nuevo Demo,Carga,2026-07-02 15:05:00,exit\n"
)


@pytest.fixture(autouse=True)
def reset_demo_data() -> None:
    staff_member_service.reset_demo_data()
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


def create_import(client: TestClient, auth_headers: dict[str, str]):
    return client.post(
        "/api/v1/biometric-imports",
        files={"file": ("marks.csv", CSV_CONTENT, "text/csv")},
        headers=auth_headers,
    )


def test_create_import_reads_csv_in_order_and_detects_period(
    auth_headers: dict[str, str],
) -> None:
    response = create_import(TestClient(app), auth_headers)

    assert response.status_code == 201
    payload = response.json()
    assert payload["status"] == "draft"
    assert payload["period_start"] == "2026-07-01"
    assert payload["period_end"] == "2026-07-02"
    assert payload["matched_rows"] == 1
    assert payload["new_rows"] == 1
    assert [row["order"] for row in payload["rows"]] == [1, 2]
    assert payload["rows"][0]["match"] == "matched"
    assert payload["rows"][1]["match"] == "new"


def test_confirm_requires_new_rows_to_be_resolved(
    auth_headers: dict[str, str],
) -> None:
    client = TestClient(app)
    import_id = create_import(client, auth_headers).json()["id"]

    response = client.post(
        f"/api/v1/biometric-imports/{import_id}/confirmation",
        headers=auth_headers,
    )

    assert response.status_code == 400
    assert response.json() == {"detail": "Unresolved new rows"}


def test_register_new_then_confirm_and_cancel(
    auth_headers: dict[str, str],
) -> None:
    client = TestClient(app)
    import_id = create_import(client, auth_headers).json()["id"]

    patch_response = client.patch(
        f"/api/v1/biometric-imports/{import_id}/rows/2",
        json={"action": "register_new"},
        headers=auth_headers,
    )

    assert patch_response.status_code == 200
    assert patch_response.json()["match"] == "matched"
    assert patch_response.json()["resolved"] is True

    confirm_response = client.post(
        f"/api/v1/biometric-imports/{import_id}/confirmation",
        headers=auth_headers,
    )

    assert confirm_response.status_code == 200
    assert confirm_response.json()["status"] == "confirmed"
    assert confirm_response.json()["ok_rows"] == 2

    cancel_response = client.post(
        f"/api/v1/biometric-imports/{import_id}/cancellation",
        json={"reason": "Archivo/mes incorrecto"},
        headers=auth_headers,
    )

    assert cancel_response.status_code == 200
    assert cancel_response.json()["status"] == "cancelled"


def test_patch_and_cancel_state_conflicts(auth_headers: dict[str, str]) -> None:
    client = TestClient(app)
    import_id = create_import(client, auth_headers).json()["id"]

    cancel_draft_response = client.post(
        f"/api/v1/biometric-imports/{import_id}/cancellation",
        json={"reason": "Todavía borrador"},
        headers=auth_headers,
    )

    assert cancel_draft_response.status_code == 409
    assert cancel_draft_response.json() == {"detail": "Import is not confirmed"}


def test_confirm_creates_attendance_days(auth_headers: dict[str, str]) -> None:
    client = TestClient(app)
    import_id = create_import(client, auth_headers).json()["id"]

    client.patch(
        f"/api/v1/biometric-imports/{import_id}/rows/2",
        json={"action": "register_new"},
        headers=auth_headers,
    )

    confirm_response = client.post(
        f"/api/v1/biometric-imports/{import_id}/confirmation",
        headers=auth_headers,
    )
    assert confirm_response.status_code == 200

    from app.services.attendance_service import attendance_service
    days = attendance_service.list_month(7, 2026)
    assert len(days) == 2
    assert days[0]["attendance_date"] == "2026-07-01"
    assert days[0]["status"] in {"present", "late"}


def test_confirm_calculates_tardanzas_correctly(auth_headers: dict[str, str]) -> None:
    client = TestClient(app)
    csv_late = (
        "dni,last_names,first_names,marked_at,mark_type\n"
        "45678912,Quispe Mamani,Maria Elena,2026-07-03 08:25:00,entry\n"
    )
    import_response = client.post(
        "/api/v1/biometric-imports",
        files={"file": ("late.csv", csv_late, "text/csv")},
        headers=auth_headers,
    )
    import_id = import_response.json()["id"]
    client.post(f"/api/v1/biometric-imports/{import_id}/confirmation", headers=auth_headers)

    from app.services.attendance_service import attendance_service
    days = attendance_service.list_month(7, 2026, staff_member_id=1)
    late_day = [d for d in days if d["attendance_date"] == "2026-07-03"][0]
    assert late_day["status"] == "late"
    assert late_day["late_minutes"] == 25


