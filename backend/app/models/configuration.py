from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from backend.app.database import Base

class GreenAreaType(Base):
    __tablename__ = "green_area_types"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class MaintenanceType(Base):
    __tablename__ = "maintenance_types"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(String(500), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class MaintenanceRule(Base):
    __tablename__ = "maintenance_rules"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    green_area_type = Column(String(100), nullable=False)
    maintenance_type = Column(String(100), nullable=False)
    frequency_days = Column(Integer, default=30)
    advance_days = Column(Integer, default=3)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class InstitutionalSetting(Base):
    __tablename__ = "institutional_settings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    municipality_name = Column(String(255), default="Municipalidad Distrital de Nuevo Chimbote")
    department_name = Column(String(255), default="Área de Parques y Jardines")
    logo_path = Column(String(255), nullable=True)
    address = Column(String(255), nullable=True)
    manager_name = Column(String(255), nullable=True)
    management_year = Column(String(10), default="2026")
    document_footer = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    @property
    def logo_url(self) -> str | None:
        if self.logo_path:
            return f"/storage/{self.logo_path}" if not self.logo_path.startswith("/") else self.logo_path
        return None
