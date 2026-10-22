import os
import re
from datetime import date, datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, Request, Form, File, UploadFile
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc
from backend.app.database import get_db, STORAGE_DIR
from backend.app.models.park import Park
from backend.app.models.schedule import ParkSchedule
from backend.app.models.maintenance import MaintenanceRecord
from backend.app.models.configuration import GreenAreaType, MaintenanceRule
from backend.app.inertia import inertia_render, inertia_redirect

router = APIRouter()

def get_next_park_code(db: Session) -> str:
    parks = db.query(Park.code).all()
    max_num = 0
    for (code,) in parks:
        if code and (m := re.match(r"PRQ-(\d+)", str(code))):
            max_num = max(max_num, int(m.group(1)))
    return f"PRQ-{max_num + 1:04d}"

def get_next_maintenance_number(db: Session, year: int) -> str:
    count = db.query(MaintenanceRecord).count() + 1
    return f"PM-{count:06d}-{year}"

@router.get("/parques")
def parks_index(request: Request, db: Session = Depends(get_db)):
    user_id = request.session.get("user_id")
    if not user_id:
        return RedirectResponse(url="/login", status_code=303)

    today = date.today()
    parks_query = db.query(Park).order_by(desc(Park.id)).all()

    parks_data = []
    for park in parks_query:
        schedules = sorted(park.schedules, key=lambda s: s.next_scheduled_date or date(9999, 12, 31))
        next_schedule = next((s for s in schedules if s.next_scheduled_date and s.next_scheduled_date >= today and s.is_active), None)
        if not next_schedule and schedules:
            next_schedule = schedules[0]

        next_maint = None
        if next_schedule:
            formatted_date = next_schedule.next_scheduled_date.strftime("%d/%m/%Y") if next_schedule.next_scheduled_date else "Por definir"
            next_maint = {
                "type": next_schedule.maintenance_type,
                "date": formatted_date,
                "raw_date": next_schedule.next_scheduled_date.isoformat() if next_schedule.next_scheduled_date else None,
            }

        sorted_records = sorted(
            park.maintenance_records,
            key=lambda m: (m.execution_date or date(1970, 1, 1), m.scheduled_date or date(1970, 1, 1)),
            reverse=True
        )

        parks_data.append({
            "id": park.id,
            "code": park.code or f"PRQ-{park.id:04d}",
            "name": park.name,
            "green_area_type": park.green_area_type or "Parque",
            "registration_date": park.registration_date.isoformat() if park.registration_date else None,
            "address": park.address or "",
            "zone": park.zone or "",
            "reference": park.reference or "",
            "latitude": float(park.latitude) if park.latitude is not None else None,
            "longitude": float(park.longitude) if park.longitude is not None else None,
            "public_use_area": float(park.public_use_area or 0),
            "green_area": float(park.green_area or park.area or 0),
            "total_area": float(park.total_area or 0),
            "has_water_point": bool(park.has_water_point),
            "water_supply_type": park.water_supply_type,
            "water_point_status": park.water_point_status,
            "water_point_observations": park.water_point_observations,
            "conservation_status": park.conservation_status or park.status or "regular",
            "photo_url": park.photo_url,
            "general_observations": park.general_observations or park.description,
            "is_active": bool(park.is_active),
            "created_at": park.created_at.strftime("%d/%m/%Y") if park.created_at else None,
            "next_maintenance": next_maint,
            "schedules": [
                {
                    "id": s.id,
                    "maintenance_type": s.maintenance_type,
                    "frequency_days": s.frequency_days,
                    "last_executed_at": s.last_executed_at.strftime("%d/%m/%Y") if s.last_executed_at else None,
                    "next_scheduled_date": s.next_scheduled_date.strftime("%d/%m/%Y") if s.next_scheduled_date else None,
                    "is_active": bool(s.is_active),
                }
                for s in schedules
            ],
            "maintenance_records": [
                {
                    "id": m.id,
                    "maintenance_type": m.maintenance_type,
                    "is_extraordinary": bool(m.is_extraordinary),
                    "scheduled_date": m.scheduled_date.strftime("%d/%m/%Y") if m.scheduled_date else None,
                    "execution_date": m.execution_date.strftime("%d/%m/%Y") if m.execution_date else None,
                    "responsible_worker": m.responsible_worker or "Personal municipal",
                    "start_time": m.start_time[:5] if m.start_time else None,
                    "end_time": m.end_time[:5] if m.end_time else None,
                    "duration_minutes": m.duration_minutes,
                    "status": m.status,
                    "observations": m.observations,
                    "document_name": m.document_name,
                    "document_url": m.document_url,
                }
                for m in sorted_records
            ],
        })

    next_code = get_next_park_code(db)
    active_rules = db.query(MaintenanceRule).filter(MaintenanceRule.is_active == True).all()
    green_area_types = [t.name for t in db.query(GreenAreaType).filter(GreenAreaType.is_active == True).order_by(GreenAreaType.name).all()]

    return inertia_render(request, db, "parks/index", {
        "parks": parks_data,
        "nextGeneratedCode": next_code,
        "maintenanceRules": [
            {
                "id": r.id,
                "green_area_type": r.green_area_type,
                "maintenance_type": r.maintenance_type,
                "frequency_days": r.frequency_days,
                "advance_days": r.advance_days,
                "is_active": r.is_active,
            }
            for r in active_rules
        ],
        "greenAreaTypes": green_area_types,
    })

@router.post("/parques")
async def parks_store(
    request: Request,
    name: str = Form(...),
    green_area_type: str = Form("Parque"),
    code: Optional[str] = Form(None),
    registration_date: Optional[str] = Form(None),
    address: Optional[str] = Form(None),
    zone: Optional[str] = Form(None),
    reference: Optional[str] = Form(None),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    public_use_area: Optional[float] = Form(0.0),
    green_area: Optional[float] = Form(0.0),
    total_area: Optional[float] = Form(0.0),
    has_water_point: bool = Form(False),
    water_supply_type: Optional[str] = Form(None),
    water_point_status: Optional[str] = Form(None),
    water_point_observations: Optional[str] = Form(None),
    conservation_status: str = Form("regular"),
    photo_url: Optional[str] = Form(None),
    photo: Optional[UploadFile] = File(None),
    general_observations: Optional[str] = Form(None),
    is_active: bool = Form(True),
    db: Session = Depends(get_db)
):
    if not code or not code.strip():
        code = get_next_park_code(db)

    reg_date = date.today()
    if registration_date:
        try:
            reg_date = datetime.strptime(registration_date, "%Y-%m-%d").date()
        except Exception:
            pass

    final_photo_url = photo_url
    if photo and photo.filename:
        filename = f"park_{int(datetime.utcnow().timestamp())}_{photo.filename}"
        parks_storage = STORAGE_DIR / "parks"
        file_path = parks_storage / filename
        content = await photo.read()
        file_path.write_bytes(content)
        final_photo_url = f"/storage/parks/{filename}"

    park = Park(
        code=code.strip(),
        name=name.strip(),
        green_area_type=green_area_type,
        registration_date=reg_date,
        address=address,
        zone=zone,
        reference=reference,
        latitude=latitude,
        longitude=longitude,
        public_use_area=public_use_area,
        green_area=green_area,
        total_area=total_area,
        has_water_point=has_water_point,
        water_supply_type=water_supply_type,
        water_point_status=water_point_status,
        water_point_observations=water_point_observations,
        conservation_status=conservation_status,
        photo_url=final_photo_url,
        general_observations=general_observations,
        is_active=is_active,
        area=green_area,
        status=conservation_status,
        description=general_observations,
    )
    db.add(park)
    db.commit()
    db.refresh(park)

    # Automatización: Reglas automáticas para el tipo de área verde
    rules = db.query(MaintenanceRule).filter(
        MaintenanceRule.green_area_type == green_area_type,
        MaintenanceRule.is_active == True
    ).all()

    for rule in rules:
        next_date = reg_date + timedelta(days=rule.frequency_days)
        alert_date = next_date - timedelta(days=rule.advance_days)

        schedule = ParkSchedule(
            park_id=park.id,
            maintenance_type=rule.maintenance_type,
            frequency_days=rule.frequency_days,
            next_scheduled_date=next_date,
            is_active=True,
        )
        db.add(schedule)
        db.commit()
        db.refresh(schedule)

        m_num = get_next_maintenance_number(db, next_date.year)
        record = MaintenanceRecord(
            maintenance_number=m_num,
            park_id=park.id,
            park_schedule_id=schedule.id,
            maintenance_type=rule.maintenance_type,
            scheduled_date=next_date,
            alert_date=alert_date,
            advance_days=rule.advance_days,
            status="pendiente",
            is_extraordinary=False,
        )
        db.add(record)

    db.commit()

    return inertia_redirect(
        "/parques",
        flash_msg={"success": "El parque se registró correctamente y se generaron sus programaciones automáticas."},
        request=request
    )

@router.put("/parques/{park_id}")
async def parks_update(
    park_id: int,
    request: Request,
    name: str = Form(...),
    green_area_type: str = Form("Parque"),
    registration_date: Optional[str] = Form(None),
    address: Optional[str] = Form(None),
    zone: Optional[str] = Form(None),
    reference: Optional[str] = Form(None),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
    public_use_area: Optional[float] = Form(0.0),
    green_area: Optional[float] = Form(0.0),
    total_area: Optional[float] = Form(0.0),
    has_water_point: bool = Form(False),
    water_supply_type: Optional[str] = Form(None),
    water_point_status: Optional[str] = Form(None),
    water_point_observations: Optional[str] = Form(None),
    conservation_status: str = Form("regular"),
    photo_url: Optional[str] = Form(None),
    photo: Optional[UploadFile] = File(None),
    general_observations: Optional[str] = Form(None),
    is_active: bool = Form(True),
    db: Session = Depends(get_db)
):
    park = db.query(Park).filter(Park.id == park_id).first()
    if not park:
        return inertia_redirect("/parques", flash_msg={"error": "Parque no encontrado."}, request=request)

    reg_date = park.registration_date
    if registration_date:
        try:
            reg_date = datetime.strptime(registration_date, "%Y-%m-%d").date()
        except Exception:
            pass

    final_photo_url = photo_url or park.photo_url
    if photo and photo.filename:
        filename = f"park_{int(datetime.utcnow().timestamp())}_{photo.filename}"
        parks_storage = STORAGE_DIR / "parks"
        file_path = parks_storage / filename
        content = await photo.read()
        file_path.write_bytes(content)
        final_photo_url = f"/storage/parks/{filename}"

    park.name = name.strip()
    park.green_area_type = green_area_type
    park.registration_date = reg_date
    park.address = address
    park.zone = zone
    park.reference = reference
    park.latitude = latitude
    park.longitude = longitude
    park.public_use_area = public_use_area
    park.green_area = green_area
    park.total_area = total_area
    park.has_water_point = has_water_point
    park.water_supply_type = water_supply_type
    park.water_point_status = water_point_status
    park.water_point_observations = water_point_observations
    park.conservation_status = conservation_status
    park.photo_url = final_photo_url
    park.general_observations = general_observations
    park.is_active = is_active
    park.area = green_area
    park.status = conservation_status
    park.description = general_observations

    db.commit()

    return inertia_redirect(
        "/parques",
        flash_msg={"success": "Información del parque actualizada correctamente."},
        request=request
    )

@router.patch("/parques/{park_id}/toggle-status")
def parks_toggle_status(park_id: int, request: Request, db: Session = Depends(get_db)):
    park = db.query(Park).filter(Park.id == park_id).first()
    if park:
        park.is_active = not park.is_active
        db.commit()
        estado = "activado" if park.is_active else "desactivado"
        return inertia_redirect(
            "/parques",
            flash_msg={"success": f"El parque {park.name} ha sido {estado} correctamente."},
            request=request
        )
    return inertia_redirect("/parques", request=request)

@router.post("/parques/{park_id}/mantenimiento-extraordinario")
def parks_extraordinary_maintenance(
    park_id: int,
    request: Request,
    maintenance_type: str = Form(...),
    execution_date: str = Form(...),
    responsible_worker: str = Form(...),
    start_time: Optional[str] = Form(None),
    end_time: Optional[str] = Form(None),
    duration_minutes: Optional[int] = Form(None),
    observations: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    park = db.query(Park).filter(Park.id == park_id).first()
    if not park:
        return inertia_redirect("/parques", request=request)

    exec_date = date.today()
    try:
        exec_date = datetime.strptime(execution_date, "%Y-%m-%d").date()
    except Exception:
        pass

    duration = duration_minutes
    if not duration and start_time and end_time:
        try:
            st = datetime.strptime(start_time, "%H:%M")
            et = datetime.strptime(end_time, "%H:%M")
            if et > st:
                duration = int((et - st).total_seconds() // 60)
        except Exception:
            pass

    year = exec_date.year
    rec_count = db.query(MaintenanceRecord).count() + 1
    doc_name = f"ACT-EXT-{park.code}-{year}-{rec_count:03d}.pdf"

    record = MaintenanceRecord(
        maintenance_number=f"EXT-{rec_count:06d}-{year}",
        park_id=park.id,
        maintenance_type=maintenance_type,
        is_extraordinary=True,
        scheduled_date=exec_date,
        execution_date=exec_date,
        responsible_worker=responsible_worker,
        start_time=start_time,
        end_time=end_time,
        duration_minutes=duration,
        status="ejecutado",
        observations=observations,
        document_name=doc_name,
        document_url=f"/storage/documents/{doc_name}",
    )
    db.add(record)
    db.commit()

    return inertia_redirect(
        "/parques",
        flash_msg={"success": f"Mantenimiento extraordinario registrado con éxito. Se generó el documento {doc_name}."},
        request=request
    )

@router.delete("/parques/{park_id}")
def parks_destroy(park_id: int, request: Request, db: Session = Depends(get_db)):
    park = db.query(Park).filter(Park.id == park_id).first()
    if park:
        db.delete(park)
        db.commit()
        return inertia_redirect(
            "/parques",
            flash_msg={"success": "El parque fue eliminado del sistema."},
            request=request
        )
    return inertia_redirect("/parques", request=request)
