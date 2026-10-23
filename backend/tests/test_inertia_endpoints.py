import pytest
from starlette.testclient import TestClient
from backend.app.main import app
from backend.app.database import SessionLocal
from backend.app.models.worker import Worker

@pytest.fixture
def client():
    return TestClient(app)

def test_login_page_renders_html(client):
    res = client.get("/login")
    assert res.status_code == 200
    assert "data-page=" in res.text
    assert "window.Ziggy" in res.text

def test_login_invalid_credentials(client):
    res = client.post(
        "/login",
        headers={"X-Inertia": "true", "Content-Type": "application/json"},
        json={"email": "wrong@test.com", "password": "wrong"},
        follow_redirects=False,
    )
    assert res.status_code == 303
    assert res.headers["location"] == "/login"

def test_login_valid_credentials_and_dashboard(client):
    res = client.post(
        "/login",
        headers={"X-Inertia": "true", "Content-Type": "application/json"},
        json={"email": "admin@nuevochimbote.gob.pe", "password": "admin123"},
        follow_redirects=False,
    )
    assert res.status_code == 303
    assert res.headers["location"] == "/dashboard"

    res_dash = client.get("/dashboard", headers={"X-Inertia": "true"})
    assert res_dash.status_code == 200
    assert res_dash.headers.get("x-inertia") == "true"
    data = res_dash.json()
    assert data["component"] == "dashboard"
    assert data["props"]["auth"]["user"]["email"] == "admin@nuevochimbote.gob.pe"

def test_create_worker_with_inertia_json(client):
    client.post(
        "/login",
        headers={"X-Inertia": "true", "Content-Type": "application/json"},
        json={"email": "admin@nuevochimbote.gob.pe", "password": "admin123"},
        follow_redirects=False,
    )
    unique_name = "TrabajadorTestInertia"
    res = client.post(
        "/trabajadores",
        headers={"X-Inertia": "true", "Content-Type": "application/json"},
        json={
            "first_name": unique_name,
            "last_name": "Autotest",
            "position": "Operario",
            "is_active": True,
        },
        follow_redirects=False,
    )
    assert res.status_code == 303
    assert res.headers["location"] == "/trabajadores"

    db = SessionLocal()
    try:
        w = db.query(Worker).filter(Worker.first_name == unique_name).first()
        assert w is not None
        assert w.position == "Operario"
        db.delete(w)
        db.commit()
    finally:
        db.close()
