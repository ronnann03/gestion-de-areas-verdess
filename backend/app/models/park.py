from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Boolean, Date, DateTime, Numeric, Text
from sqlalchemy.orm import relationship
from backend.app.database import Base

class Park(Base):
    __tablename__ = "parks"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    green_area_type = Column(String(100), default="Parque")
    registration_date = Column(Date, default=date.today)
    address = Column(String(255), nullable=True)
    zone = Column(String(255), nullable=True)
    reference = Column(String(255), nullable=True)
    latitude = Column(Numeric(10, 7), nullable=True)
    longitude = Column(Numeric(10, 7), nullable=True)
    public_use_area = Column(Numeric(10, 2), default=0.0)
    green_area = Column(Numeric(10, 2), default=0.0)
    total_area = Column(Numeric(10, 2), default=0.0)
    has_water_point = Column(Boolean, default=False)
    water_supply_type = Column(String(100), nullable=True)
    water_point_status = Column(String(100), nullable=True)
    water_point_observations = Column(Text, nullable=True)
    conservation_status = Column(String(50), default="regular")
    photo_url = Column(String(1000), nullable=True)
    general_observations = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Compatibilidad previa
    description = Column(Text, nullable=True)
    status = Column(String(50), nullable=True)
    area = Column(Numeric(10, 2), nullable=True)
    observations = Column(Text, nullable=True)

    schedules = relationship("ParkSchedule", back_populates="park", cascade="all, delete-orphan")
    maintenance_records = relationship("MaintenanceRecord", back_populates="park", cascade="all, delete-orphan")
