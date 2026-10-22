from datetime import datetime, date
from typing import Optional
from sqlalchemy import Column, Integer, String, Boolean, Date, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship
from backend.app.database import Base

class MaintenanceRecord(Base):
    __tablename__ = "maintenance_records"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    maintenance_number = Column(String(50), unique=True, index=True, nullable=False)
    park_id = Column(Integer, ForeignKey("parks.id", ondelete="CASCADE"), nullable=False)
    worker_id = Column(Integer, ForeignKey("workers.id", ondelete="SET NULL"), nullable=True)
    park_schedule_id = Column(Integer, ForeignKey("park_schedules.id", ondelete="SET NULL"), nullable=True)

    maintenance_type = Column(String(100), nullable=False)
    is_extraordinary = Column(Boolean, default=False)
    reason = Column(String(500), nullable=True)

    scheduled_date = Column(Date, nullable=True)
    alert_date = Column(Date, nullable=True)
    advance_days = Column(Integer, default=1)

    execution_date = Column(Date, nullable=True)
    responsible_worker = Column(String(255), nullable=True)
    start_time = Column(String(10), nullable=True)
    end_time = Column(String(10), nullable=True)
    duration_minutes = Column(Integer, nullable=True)

    status = Column(String(50), default="pendiente") # pendiente, en_proceso, finalizado, cancelado, ejecutado
    initial_observation = Column(Text, nullable=True)
    work_description = Column(Text, nullable=True)
    result = Column(String(255), nullable=True)

    photo_before_url = Column(String(1000), nullable=True)
    photo_after_url = Column(String(1000), nullable=True)
    observations = Column(Text, nullable=True)

    document_name = Column(String(255), nullable=True)
    document_url = Column(String(1000), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    park = relationship("Park", back_populates="maintenance_records")
    worker = relationship("Worker", back_populates="maintenance_records")
    schedule = relationship("ParkSchedule", back_populates="records")

    def operational_status(self, today: Optional[date] = None) -> str:
        if today is None:
            today = date.today()

        if self.status in ("finalizado", "completado", "ejecutado"):
            return "finalizado"

        if self.status in ("en_proceso", "en_mantenimiento"):
            return "en_proceso"

        if self.status == "cancelado":
            return "cancelado"

        if not self.scheduled_date:
            return "al_dia"

        if self.scheduled_date < today:
            return "vencido"

        if self.scheduled_date == today:
            return "pendiente"

        if self.alert_date and today >= self.alert_date:
            return "proximo"

        return "al_dia"
