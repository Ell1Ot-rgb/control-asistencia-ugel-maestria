from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.staff_member_service import staff_member_service


@pytest.fixture(autouse=True)
def reset_staff_demo_data() -> None:
    staff_member_service.reset_demo_data()


@pytest.fixture()
def auth_headers(fake_redis) -> dict[str, str]:
    client = TestClient(app)
    response = client.post(
        "/api/v1/auth/sessions",
        json={"username": "director.demo", "password": "Demo12345"},
    )
    assert response.status_code == 200
    token = response.json()["token"]
    return {"Authorization": f"Bearer {token}"}


def test_list_staff_members_with_filters(auth_headers: dict[str, str]) -> None:
    client = TestClient(app)

    response = client.get(
        "/api/v1/staff-members",
        params={"q": "quispe", "is_active": "Y", "job_title": "Docente"},
        headers=auth_headers,
    )

    assert response.status_code == 200
    assert [row["dni"] for row in response.json()] == ["45678912"]


def test_create_get_update_and_deactivate_staff_member(
    auth_headers: dict[str, str],
) -> None:
    client = TestClient(app)

    create_response = client.post(
        "/api/v1/staff-members",
        json={
            "dni": "88889999",
            "last_names": "Ramos Soto",
            "first_names": "Ana Lucia",
            "job_title": "Administrativo",
            "employment_status": "Contratado",
        },
        headers=auth_headers,
    )

    assert create_response.status_code == 201
    created = create_response.json()
    assert created["id"] == 4
    assert created["is_active"] == "Y"

    get_response = client.get(
        f"/api/v1/staff-members/{created['id']}", headers=auth_headers
    )

    assert get_response.status_code == 200
    assert get_response.json()["dni"] == "88889999"

    update_response = client.put(
        f"/api/v1/staff-members/{created['id']}",
        json={
            "dni": "88889999",
            "last_names": "Ramos Soto",
            "first_names": "Ana Lucia",
            "job_title": "Docente",
            "employment_status": "Nombrado",
            "is_active": "Y",
        },
        headers=auth_headers,
    )

    assert update_response.status_code == 200
    assert update_response.json()["job_title"] == "Docente"

    deactivate_response = client.post(
        f"/api/v1/staff-members/{created['id']}/deactivation",
        headers=auth_headers,
    )

    assert deactivate_response.status_code == 200
    assert deactivate_response.json()["is_active"] == "N"


def test_create_staff_member_rejects_duplicate_dni(
    auth_headers: dict[str, str],
) -> None:
    response = TestClient(app).post(
        "/api/v1/staff-members",
        json={
            "dni": "45678912",
            "last_names": "Duplicado",
            "first_names": "Demo",
            "job_title": "Docente",
        },
        headers=auth_headers,
    )

    assert response.status_code == 409
    assert response.json() == {"detail": "Staff member DNI already exists"}


def test_staff_member_not_found_returns_404(auth_headers: dict[str, str]) -> None:
    response = TestClient(app).get("/api/v1/staff-members/999", headers=auth_headers)

    assert response.status_code == 404
    assert response.json() == {"detail": "Staff member not found"}
