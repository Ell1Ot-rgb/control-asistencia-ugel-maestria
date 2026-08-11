from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def get_auth_token():
    res = client.post(
        "/api/v1/auth/sessions",
        json={"username": "director.demo", "password": "Demo12345"},
    )
    return res.json()["token"]

def test_parse_dat_attlog():
    token = get_auth_token()
    dat_content = (
        "45678912\t2026-08-03 07:50:00\t1\n"
        "45678912\t2026-08-03 13:00:00\t0\n"
    )
    res = client.post(
        "/api/v1/biometric-imports",
        headers={"Authorization": f"Bearer {token}"},
        files={"file": ("attlog.dat", dat_content.encode("utf-8"), "text/plain")},
    )
    assert res.status_code == 201
    data = res.json()
    assert data["status"] == "draft"
    assert data["total_rows"] == 2

def test_export_official_excel():
    token = get_auth_token()
    res = client.get(
        "/api/v1/reports/official-excel?month=8&year=2026",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    assert len(res.content) > 1000
