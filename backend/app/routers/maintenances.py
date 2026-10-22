import os
from datetime import date, datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, Request, Form, File, UploadFile
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc
from backend.app.database import get_db, STORAGE_DIR
from backend.app.models.park import Park
from backend.app.models.schedule import ParkSchedule
from backend.app.models.maintenance import MaintenanceRecord
from backend.app.models.worker import Worker
from backend.app.models.configuration import MaintenanceType, MaintenanceRule, InstitutionalSetting
from backend.app.inertia import inertia_render, inertia_redirect

router = APIRouter()

def get_next_maint_number(db: Session, year: int) -> str:
    count = db.query(MaintenanceRecord).count() + 1
    return f"PM-{count:06d}-{year}"

@router.get("/mantenimientos")
def maintenances_index(request: Request, db: Session = Depends(get_db)):
    user_id = request.session.get("user_id")
    if not user_id:
        return RedirectResponse(url="/login", status_code=303)

    today = date.today()
    records_query = db.query(MaintenanceRecord).order_by(desc(MaintenanceRecord.id)).all()

    records_data = []
    for r in records_query:
        computed_status = r.operational_status(today)
        is_alert_active = computed_status == "proximo"

        records_data.append({
            "id": r.id,
            "maintenance_number": r.maintenance_number,
            "park_id": r.park_id,
            "park_name": r.park.name if r.park else "Parque no especificado",
            "park_code": r.park.code if r.park else f"PRQ-{r.park_id:04d}",
            "green_area_type": r.park.green_area_type if r.park else "Parque",
            "park_zone": r.park.zone if r.park else "Sector Central",
            "park_address": r.park.address if r.park else "",
            "maintenance_type": r.maintenance_type,
            "is_extraordinary": bool(r.is_extraordinary),
            "reason": r.reason,
            "frequency_days": r.schedule.frequency_days if r.schedule else None,
            "scheduled_date": r.scheduled_date.isoformat() if r.scheduled_date else None,
            "scheduled_date_formatted": r.scheduled_date.strftime("%d/%m/%Y") if r.scheduled_date else "Sin fecha",
            "alert_date": r.alert_date.isoformat() if r.alert_date else None,
            "alert_date_formatted": r.alert_date.strftime("%d/%m/%Y") if r.alert_date else None,
            "advance_days": r.advance_days or 1,
            "is_alert_active": is_alert_active,
            "execution_date": r.execution_date.isoformat() if r.execution_date else None,
            "execution_date_formatted": r.execution_date.strftime("%d/%m/%Y") if r.execution_date else None,
            "worker_id": r.worker_id,
            "responsible_worker": r.worker.full_name if r.worker else (r.responsible_worker or "Por asignar"),
            "start_time": r.start_time,
            "end_time": r.end_time,
            "duration_minutes": r.duration_minutes,
            "status": r.status,
            "computed_status": computed_status,
            "initial_observation": r.initial_observation,
            "work_description": r.work_description,
            "result": r.result,
            "photo_before_url": r.photo_before_url,
            "photo_after_url": r.photo_after_url,
            "observations": r.observations,
            "document_name": r.document_name,
            "document_url": r.document_url,
        })

    # Contadores por pestañas
    counts = {
        "todos": len(records_data),
        "proximos": sum(1 for r in records_data if r["computed_status"] == "proximo"),
        "pendientes": sum(1 for r in records_data if r["computed_status"] in ("pendiente", "vencido")),
        "vencidos": sum(1 for r in records_data if r["computed_status"] == "vencido"),
        "en_proceso": sum(1 for r in records_data if r["computed_status"] == "en_proceso"),
        "finalizados": sum(1 for r in records_data if r["computed_status"] == "finalizado"),
        "cancelados": sum(1 for r in records_data if r["computed_status"] == "cancelado"),
    }

    # Parques activos
    active_parks = db.query(Park).filter(Park.is_active == True).order_by(Park.name).all()
    parks_list = [
        {
            "id": p.id,
            "code": p.code,
            "name": p.name,
            "green_area_type": p.green_area_type,
            "address": p.address,
            "zone": p.zone,
        }
        for p in active_parks
    ]

    rules = db.query(MaintenanceRule).filter(MaintenanceRule.is_active == True).all()
    maint_types = [t.name for t in db.query(MaintenanceType).filter(MaintenanceType.is_active == True).order_by(MaintenanceType.name).all()]

    active_workers = db.query(Worker).filter(Worker.is_active == True).order_by(Worker.last_name, Worker.first_name).all()
    workers_list = [
        {
            "id": w.id,
            "full_name": w.full_name,
            "position": w.position,
            "crew": w.crew,
        }
        for w in active_workers
    ]

    return inertia_render(request, db, "maintenances/index", {
        "records": records_data,
        "counts": counts,
        "parks": parks_list,
        "rules": [
            {
                "id": r.id,
                "green_area_type": r.green_area_type,
                "maintenance_type": r.maintenance_type,
                "frequency_days": r.frequency_days,
                "advance_days": r.advance_days,
            }
            for r in rules
        ],
        "tiposMantenimiento": maint_types,
        "workers": workers_list,
    })

@router.post("/mantenimientos/extraordinario")
def store_extraordinary(
    request: Request,
    park_id: int = Form(...),
    maintenance_type: str = Form(...),
    scheduled_date: str = Form(...),
    reason: str = Form(...),
    advance_days: Optional[int] = Form(1),
    worker_id: Optional[int] = Form(None),
    observations: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    try:
        sch_date = datetime.strptime(scheduled_date, "%Y-%m-%d").date()
    except Exception:
        sch_date = date.today()

    adv_days = int(advance_days or 1)
    alert_date = sch_date - timedelta(days=adv_days)

    worker = db.query(Worker).filter(Worker.id == worker_id).first() if worker_id else None
    m_num = get_next_maint_number(db, sch_date.year)

    record = MaintenanceRecord(
        maintenance_number=m_num,
        park_id=park_id,
        maintenance_type=maintenance_type,
        is_extraordinary=True,
        reason=reason,
        scheduled_date=sch_date,
        alert_date=alert_date,
        advance_days=adv_days,
        worker_id=worker.id if worker else None,
        responsible_worker=worker.full_name if worker else "Por asignar",
        status="pendiente",
        observations=observations,
    )
    db.add(record)
    db.commit()

    return inertia_redirect(
        "/mantenimientos",
        flash_msg={"success": f"Mantenimiento extraordinario {m_num} programado exitosamente."},
        request=request
    )

@router.post("/mantenimientos/{maintenance_id}/iniciar")
async def iniciar_mantenimiento(
    maintenance_id: int,
    request: Request,
    execution_date: str = Form(...),
    start_time: str = Form(...),
    worker_id: int = Form(...),
    initial_observation: Optional[str] = Form(None),
    photo_before: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    maintenance = db.query(MaintenanceRecord).filter(MaintenanceRecord.id == maintenance_id).first()
    if not maintenance:
        return inertia_redirect("/mantenimientos", request=request)

    try:
        exec_date = datetime.strptime(execution_date, "%Y-%m-%d").date()
    except Exception:
        exec_date = date.today()

    worker = db.query(Worker).filter(Worker.id == worker_id).first()

    photo_url = maintenance.photo_before_url
    if photo_before and photo_before.filename:
        filename = f"before_{int(datetime.utcnow().timestamp())}_{photo_before.filename}"
        before_dir = STORAGE_DIR / "maintenances" / "before"
        file_path = before_dir / filename
        content = await photo_before.read()
        file_path.write_bytes(content)
        photo_url = f"/storage/maintenances/before/{filename}"

    maintenance.execution_date = exec_date
    maintenance.start_time = start_time
    maintenance.worker_id = worker.id if worker else None
    maintenance.responsible_worker = worker.full_name if worker else "Personal municipal"
    maintenance.initial_observation = initial_observation
    maintenance.photo_before_url = photo_url
    maintenance.status = "en_proceso"

    db.commit()

    return inertia_redirect(
        "/mantenimientos",
        flash_msg={"success": f"El mantenimiento {maintenance.maintenance_number} ha iniciado y pasó a estado 'En mantenimiento'."},
        request=request
    )

@router.post("/mantenimientos/{maintenance_id}/finalizar")
async def finalizar_mantenimiento(
    maintenance_id: int,
    request: Request,
    end_time: str = Form(...),
    work_description: str = Form(...),
    result: str = Form(...),
    worker_id: int = Form(...),
    execution_date: Optional[str] = Form(None),
    start_time: Optional[str] = Form(None),
    observations: Optional[str] = Form(None),
    photo_after: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    maintenance = db.query(MaintenanceRecord).filter(MaintenanceRecord.id == maintenance_id).first()
    if not maintenance:
        return inertia_redirect("/mantenimientos", request=request)

    exec_date = maintenance.execution_date or date.today()
    if execution_date:
        try:
            exec_date = datetime.strptime(execution_date, "%Y-%m-%d").date()
        except Exception:
            pass

    st_time = start_time or maintenance.start_time or "08:00"

    duration = None
    try:
        st = datetime.strptime(f"{exec_date} {st_time}", "%Y-%m-%d %H:%M")
        et = datetime.strptime(f"{exec_date} {end_time}", "%Y-%m-%d %H:%M")
        if et > st:
            duration = int((et - st).total_seconds() // 60)
    except Exception:
        pass

    worker = db.query(Worker).filter(Worker.id == worker_id).first()

    photo_url = maintenance.photo_after_url
    if photo_after and photo_after.filename:
        filename = f"after_{int(datetime.utcnow().timestamp())}_{photo_after.filename}"
        after_dir = STORAGE_DIR / "maintenances" / "after"
        file_path = after_dir / filename
        content = await photo_after.read()
        file_path.write_bytes(content)
        photo_url = f"/storage/maintenances/after/{filename}"

    maintenance.execution_date = exec_date
    maintenance.start_time = st_time
    maintenance.end_time = end_time
    maintenance.duration_minutes = duration
    maintenance.work_description = work_description
    maintenance.result = result
    maintenance.observations = observations or maintenance.observations
    maintenance.worker_id = worker.id if worker else None
    maintenance.responsible_worker = worker.full_name if worker else "Personal municipal"
    maintenance.photo_after_url = photo_url
    maintenance.status = "finalizado"
    maintenance.document_name = f"Parte de mantenimiento {maintenance.maintenance_number}"

    # Regla de automatización: programar siguiente mantenimiento si es recurrente
    if not maintenance.is_extraordinary and maintenance.park_schedule_id:
        schedule = db.query(ParkSchedule).filter(ParkSchedule.id == maintenance.park_schedule_id).first()
        if schedule and schedule.is_active and schedule.park:
            rule = db.query(MaintenanceRule).filter(
                MaintenanceRule.green_area_type == schedule.park.green_area_type,
                MaintenanceRule.maintenance_type == schedule.maintenance_type,
                MaintenanceRule.is_active == True
            ).first()

            freq_days = rule.frequency_days if rule else schedule.frequency_days
            adv_days = rule.advance_days if rule else 3

            next_date = exec_date + timedelta(days=freq_days)
            alert_date = next_date - timedelta(days=adv_days)

            schedule.frequency_days = freq_days
            schedule.last_executed_at = exec_date
            schedule.next_scheduled_date = next_date

            next_m_num = get_next_maint_number(db, next_date.year)
            next_record = MaintenanceRecord(
                maintenance_number=next_m_num,
                park_id=schedule.park_id,
                park_schedule_id=schedule.id,
                maintenance_type=schedule.maintenance_type,
                is_extraordinary=False,
                scheduled_date=next_date,
                alert_date=alert_date,
                advance_days=adv_days,
                status="pendiente",
            )
            db.add(next_record)

    db.commit()

    return inertia_redirect(
        "/mantenimientos",
        flash_msg={"success": f"El mantenimiento {maintenance.maintenance_number} ha sido finalizado con éxito."},
        request=request
    )

@router.post("/mantenimientos/{maintenance_id}/atender")
async def atender_mantenimiento(
    maintenance_id: int,
    request: Request,
    execution_date: str = Form(...),
    start_time: str = Form(...),
    end_time: str = Form(...),
    work_description: str = Form(...),
    result: str = Form(...),
    worker_id: int = Form(...),
    observations: Optional[str] = Form(None),
    photo_before: Optional[UploadFile] = File(None),
    photo_after: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    maintenance = db.query(MaintenanceRecord).filter(MaintenanceRecord.id == maintenance_id).first()
    if not maintenance:
        return inertia_redirect("/mantenimientos", request=request)

    try:
        exec_date = datetime.strptime(execution_date, "%Y-%m-%d").date()
    except Exception:
        exec_date = date.today()

    duration = None
    try:
        st = datetime.strptime(f"{exec_date} {start_time}", "%Y-%m-%d %H:%M")
        et = datetime.strptime(f"{exec_date} {end_time}", "%Y-%m-%d %H:%M")
        if et > st:
            duration = int((et - st).total_seconds() // 60)
    except Exception:
        pass

    worker = db.query(Worker).filter(Worker.id == worker_id).first()

    photo_before_url = maintenance.photo_before_url
    if photo_before and photo_before.filename:
        filename = f"before_{int(datetime.utcnow().timestamp())}_{photo_before.filename}"
        before_dir = STORAGE_DIR / "maintenances" / "before"
        file_path = before_dir / filename
        content = await photo_before.read()
        file_path.write_bytes(content)
        photo_before_url = f"/storage/maintenances/before/{filename}"

    photo_after_url = maintenance.photo_after_url
    if photo_after and photo_after.filename:
        filename = f"after_{int(datetime.utcnow().timestamp())}_{photo_after.filename}"
        after_dir = STORAGE_DIR / "maintenances" / "after"
        file_path = after_dir / filename
        content = await photo_after.read()
        file_path.write_bytes(content)
        photo_after_url = f"/storage/maintenances/after/{filename}"

    maintenance.execution_date = exec_date
    maintenance.start_time = start_time
    maintenance.end_time = end_time
    maintenance.duration_minutes = duration
    maintenance.work_description = work_description
    maintenance.result = result
    maintenance.observations = observations
    maintenance.worker_id = worker.id if worker else None
    maintenance.responsible_worker = worker.full_name if worker else "Personal municipal"
    maintenance.photo_before_url = photo_before_url
    maintenance.photo_after_url = photo_after_url
    maintenance.status = "finalizado"
    maintenance.document_name = f"Parte de mantenimiento {maintenance.maintenance_number}"

    # Programar siguiente si es recurrente
    if not maintenance.is_extraordinary and maintenance.park_schedule_id:
        schedule = db.query(ParkSchedule).filter(ParkSchedule.id == maintenance.park_schedule_id).first()
        if schedule and schedule.is_active and schedule.park:
            rule = db.query(MaintenanceRule).filter(
                MaintenanceRule.green_area_type == schedule.park.green_area_type,
                MaintenanceRule.maintenance_type == schedule.maintenance_type,
                MaintenanceRule.is_active == True
            ).first()

            freq_days = rule.frequency_days if rule else schedule.frequency_days
            adv_days = rule.advance_days if rule else 3

            next_date = exec_date + timedelta(days=freq_days)
            alert_date = next_date - timedelta(days=adv_days)

            schedule.frequency_days = freq_days
            schedule.last_executed_at = exec_date
            schedule.next_scheduled_date = next_date

            next_m_num = get_next_maint_number(db, next_date.year)
            next_record = MaintenanceRecord(
                maintenance_number=next_m_num,
                park_id=schedule.park_id,
                park_schedule_id=schedule.id,
                maintenance_type=schedule.maintenance_type,
                is_extraordinary=False,
                scheduled_date=next_date,
                alert_date=alert_date,
                advance_days=adv_days,
                status="pendiente",
            )
            db.add(next_record)

    db.commit()

    return inertia_redirect(
        "/mantenimientos",
        flash_msg={"success": f"El mantenimiento {maintenance.maintenance_number} ha sido atendido y completado."},
        request=request
    )

@router.patch("/mantenimientos/{maintenance_id}/cancelar")
def cancelar_mantenimiento(maintenance_id: int, request: Request, db: Session = Depends(get_db)):
    maintenance = db.query(MaintenanceRecord).filter(MaintenanceRecord.id == maintenance_id).first()
    if maintenance:
        maintenance.status = "cancelado"
        db.commit()
        return inertia_redirect(
            "/mantenimientos",
            flash_msg={"success": f"El mantenimiento {maintenance.maintenance_number} fue cancelado."},
            request=request
        )
    return inertia_redirect("/mantenimientos", request=request)

@router.get("/mantenimientos/{maintenance_id}/documento")
def imprimir_documento(maintenance_id: int, db: Session = Depends(get_db)):
    m = db.query(MaintenanceRecord).filter(MaintenanceRecord.id == maintenance_id).first()
    if not m:
        return HTMLResponse("<h1>Mantenimiento no encontrado</h1>", status_code=404)

    inst = db.query(InstitutionalSetting).first()
    mun_name = inst.municipality_name if inst else "Municipalidad Distrital de Nuevo Chimbote"
    dep_name = inst.department_name if inst else "Área de Parques y Jardines"

    html = f"""<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Parte Técnico - {m.maintenance_number}</title>
    <style>
        body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; max-width: 800px; margin: 0 auto; }}
        .header {{ border-bottom: 2px solid #059669; padding-bottom: 20px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }}
        h1 {{ margin: 0; font-size: 20px; color: #065f46; }}
        .badge {{ background: #ecfdf5; color: #047857; padding: 4px 12px; border-radius: 9999px; font-weight: 600; font-size: 14px; border: 1px solid #a7f3d0; }}
        .section {{ margin-bottom: 20px; background: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; }}
        .section h2 {{ font-size: 15px; margin-top: 0; margin-bottom: 12px; color: #334155; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; }}
        .grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }}
        .label {{ font-size: 12px; color: #64748b; font-weight: 500; }}
        .value {{ font-size: 14px; font-weight: 600; color: #0f172a; margin-top: 2px; }}
        .footer {{ margin-top: 40px; border-top: 1px dashed #94a3b8; padding-top: 20px; display: flex; justify-content: space-around; text-align: center; font-size: 13px; color: #475569; }}
        .sig-line {{ width: 180px; border-bottom: 1px solid #000; margin: 50px auto 8px auto; }}
        @media print {{ body {{ padding: 0; }} }}
    </style>
</head>
<body onload="window.print()">
    <div class="header">
        <div>
            <h1>{mun_name}</h1>
            <p style="margin: 4px 0; color: #64748b; font-size: 13px;">{dep_name}</p>
        </div>
        <div class="badge">N° {m.maintenance_number}</div>
    </div>

    <div class="section">
        <h2>Información del Espacio Público</h2>
        <div class="grid">
            <div>
                <div class="label">Área Verde / Parque</div>
                <div class="value">{m.park.name if m.park else 'N/A'} ({m.park.code if m.park else 'N/A'})</div>
            </div>
            <div>
                <div class="label">Tipo de Área</div>
                <div class="value">{m.park.green_area_type if m.park else 'N/A'}</div>
            </div>
            <div>
                <div class="label">Ubicación / Dirección</div>
                <div class="value">{m.park.address if m.park else 'N/A'} - {m.park.zone if m.park else ''}</div>
            </div>
            <div>
                <div class="label">Punto de Agua</div>
                <div class="value">{'Sí' if m.park and m.park.has_water_point else 'No'} ({m.park.water_supply_type if m.park else 'N/A'})</div>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>Detalles de la Intervención</h2>
        <div class="grid">
            <div>
                <div class="label">Tipo de Mantenimiento</div>
                <div class="value">{m.maintenance_type} {'(Extraordinario)' if m.is_extraordinary else '(Programado)'}</div>
            </div>
            <div>
                <div class="label">Fecha de Ejecución</div>
                <div class="value">{m.execution_date.strftime('%d/%m/%Y') if m.execution_date else 'No registrada'}</div>
            </div>
            <div>
                <div class="label">Horario / Duración</div>
                <div class="value">{m.start_time or '--'} a {m.end_time or '--'} ({m.duration_minutes or 0} minutos)</div>
            </div>
            <div>
                <div class="label">Responsable Asignado</div>
                <div class="value">{m.responsible_worker or 'Personal Municipal'}</div>
            </div>
        </div>
        <div style="margin-top: 12px;">
            <div class="label">Descripción de Trabajos Realizados</div>
            <div class="value" style="font-weight: 400; margin-top: 4px;">{m.work_description or 'Sin descripción registrada'}</div>
        </div>
        <div style="margin-top: 12px;">
            <div class="label">Resultado y Estado de Entrega</div>
            <div class="value" style="font-weight: 400; margin-top: 4px;">{m.result or 'Conforme'}</div>
        </div>
    </div>

    <div class="footer">
        <div>
            <div class="sig-line"></div>
            <div>Responsable de Cuadrilla</div>
            <div style="font-size: 11px; color: #94a3b8;">Firma y Sello</div>
        </div>
        <div>
            <div class="sig-line"></div>
            <div>Supervisión Municipal</div>
            <div style="font-size: 11px; color: #94a3b8;">V° B° Área de Parques y Jardines</div>
        </div>
    </div>
</body>
</html>"""
    return HTMLResponse(content=html)
