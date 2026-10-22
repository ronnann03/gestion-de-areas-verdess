from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Boolean, Date, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database import Base

class ParkSchedule(Base):
    __tablename__ = "park_schedules"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    park_id = Column(Integer, ForeignKey("parks.id", ondelete="CASCADE"), nullable=False)
    maintenance_type = Column(String(100), nullable=False)
    frequency_days = Column(Integer, default=30)
    last_executed_at = Column(Date, nullable=True)
    next_scheduled_date = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    park = relationship("Park", back_populates="schedules")
    records = relationship("MaintenanceRecord", back_populates="schedule")
