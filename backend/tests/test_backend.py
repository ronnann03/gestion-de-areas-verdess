from datetime import date, timedelta
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.app.database import Base
from backend.app.models.user import User
from backend.app.models.park import Park
from backend.app.models.schedule import ParkSchedule
from backend.app.models.maintenance import MaintenanceRecord
from backend.app.models.worker import Worker
from backend.app.models.configuration import GreenAreaType, MaintenanceRule
from backend.app.routers.parks import get_next_park_code
from backend.app.routers.workers import get_next_worker_code
from backend.app.routers.auth import hash_password, verify_password

@pytest.fixture
def db_session():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(bind=engine)
    TestingSession = sessionmaker(bind=engine)
    session = TestingSession()
    yield session
    session.close()

def test_operational_status(db_session):
    today = date(2026, 10, 22)

    # 1. Finalizado
    m_fin = MaintenanceRecord(
        maintenance_number="PM-000001-2026",
        park_id=1,
        maintenance_type="Poda",
        status="finalizado",
    )
    assert m_fin.operational_status(today) == "finalizado"

    # 2. En proceso
    m_proc = MaintenanceRecord(
        maintenance_number="PM-000002-2026",
        park_id=1,
        maintenance_type="Poda",
        status="en_proceso",
    )
    assert m_proc.operational_status(today) == "en_proceso"

    # 3. Vencido (programado antes de hoy)
    m_venc = MaintenanceRecord(
        maintenance_number="PM-000003-2026",
        park_id=1,
        maintenance_type="Poda",
        scheduled_date=today - timedelta(days=2),
        status="pendiente",
    )
    assert m_venc.operational_status(today) == "vencido"

    # 4. Pendiente hoy
    m_hoy = MaintenanceRecord(
        maintenance_number="PM-000004-2026",
        park_id=1,
        maintenance_type="Poda",
        scheduled_date=today,
        status="pendiente",
    )
    assert m_hoy.operational_status(today) == "pendiente"

    # 5. Próximo (alerta activa)
    m_prox = MaintenanceRecord(
        maintenance_number="PM-000005-2026",
        park_id=1,
        maintenance_type="Poda",
        scheduled_date=today + timedelta(days=2),
        alert_date=today - timedelta(days=1), # la alerta ya inició
        advance_days=3,
        status="pendiente",
    )
    assert m_prox.operational_status(today) == "proximo"

    # 6. Al día (alerta aún no inicia)
    m_aldia = MaintenanceRecord(
        maintenance_number="PM-000006-2026",
        park_id=1,
        maintenance_type="Poda",
        scheduled_date=today + timedelta(days=20),
        alert_date=today + timedelta(days=17),
        advance_days=3,
        status="pendiente",
    )
    assert m_aldia.operational_status(today) == "al_dia"

def test_code_generators(db_session):
    # Test park codes
    assert get_next_park_code(db_session) == "PRQ-0001"
    p = Park(code="PRQ-0001", name="Parque Uno")
    db_session.add(p)
    db_session.commit()
    assert get_next_park_code(db_session) == "PRQ-0002"

    # Test worker codes
    assert get_next_worker_code(db_session) == "TRB-0001"
    w = Worker(code="TRB-0001", first_name="Juan", last_name="Perez")
    db_session.add(w)
    db_session.commit()
    assert get_next_worker_code(db_session) == "TRB-0002"

def test_password_hashing():
    pw = "secreto123"
    hashed = hash_password(pw)
    assert verify_password(pw, hashed)
    assert not verify_password("incorrecto", hashed)
