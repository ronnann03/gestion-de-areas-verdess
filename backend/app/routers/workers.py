import re
from typing import Optional
from fastapi import APIRouter, Depends, Request, Form
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc
from backend.app.database import get_db
from backend.app.models.worker import Worker
from backend.app.models.maintenance import MaintenanceRecord
from backend.app.inertia import inertia_render, inertia_redirect

router = APIRouter()

def get_next_worker_code(db: Session) -> str:
    codes = db.query(Worker.code).all()
    max_num = 0
    for (code,) in codes:
        if code and (m := re.match(r"TRB-(\d+)", str(code))):
            max_num = max(max_num, int(m.group(1)))
    return f"TRB-{max_num + 1:04d}"

@router.get("/trabajadores")
def workers_index(request: Request, db: Session = Depends(get_db)):
    user_id = request.session.get("user_id")
    if not user_id:
        return RedirectResponse(url="/login", status_code=303)

    workers = db.query(Worker).order_by(desc(Worker.id)).all()

    workers_data = []
    for w in workers:
        records = w.maintenance_records
        total = len(records)
        completed = sum(1 for r in records if r.status in ("finalizado", "completado", "ejecutado"))
        pending = sum(1 for r in records if r.status in ("pendiente", "en_proceso"))

        workers_data.append({
            "id": w.id,
            "code": w.code,
            "document_number": w.document_number,
            "first_name": w.first_name,
            "last_name": w.last_name,
            "full_name": w.full_name,
            "position": w.position,
            "phone": w.phone,
            "crew": w.crew,
            "observations": w.observations,
            "is_active": bool(w.is_active),
            "created_at": w.created_at.strftime("%d/%m/%Y") if w.created_at else None,
            "maintenances_count": total,
            "completed_maintenances_count": completed,
            "pending_maintenances_count": pending,
        })

    next_code = get_next_worker_code(db)

    return inertia_render(request, db, "workers/index", {
        "workers": workers_data,
        "nextGeneratedCode": next_code,
    })

@router.post("/trabajadores")
def workers_store(
    request: Request,
    first_name: str = Form(...),
    last_name: str = Form(...),
    document_number: Optional[str] = Form(None),
    position: Optional[str] = Form("Operario de mantenimiento"),
    phone: Optional[str] = Form(None),
    crew: Optional[str] = Form(None),
    observations: Optional[str] = Form(None),
    is_active: bool = Form(True),
    code: Optional[str] = Form(None),
    db: Session = Depends(get_db)
):
    if not code or not code.strip():
        code = get_next_worker_code(db)

    worker = Worker(
        code=code.strip(),
        first_name=first_name.strip(),
        last_name=last_name.strip(),
        document_number=document_number,
        position=position,
        phone=phone,
        crew=crew,
        observations=observations,
        is_active=is_active,
    )
    db.add(worker)
    db.commit()

    return inertia_redirect(
        "/trabajadores",
        flash_msg={"success": f"El trabajador {worker.full_name} fue registrado con código {worker.code}."},
        request=request
    )

@router.put("/trabajadores/{worker_id}")
def workers_update(
    worker_id: int,
    request: Request,
    first_name: str = Form(...),
    last_name: str = Form(...),
    document_number: Optional[str] = Form(None),
    position: Optional[str] = Form("Operario de mantenimiento"),
    phone: Optional[str] = Form(None),
    crew: Optional[str] = Form(None),
    observations: Optional[str] = Form(None),
    is_active: bool = Form(True),
    db: Session = Depends(get_db)
):
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if not worker:
        return inertia_redirect("/trabajadores", request=request)

    worker.first_name = first_name.strip()
    worker.last_name = last_name.strip()
    worker.document_number = document_number
    worker.position = position
    worker.phone = phone
    worker.crew = crew
    worker.observations = observations
    worker.is_active = is_active

    db.commit()

    return inertia_redirect(
        "/trabajadores",
        flash_msg={"success": f"Información de {worker.full_name} actualizada correctamente."},
        request=request
    )

@router.patch("/trabajadores/{worker_id}/toggle-status")
def workers_toggle_status(worker_id: int, request: Request, db: Session = Depends(get_db)):
    worker = db.query(Worker).filter(Worker.id == worker_id).first()
    if worker:
        worker.is_active = not worker.is_active
        db.commit()
        st = "activado" if worker.is_active else "desactivado"
        return inertia_redirect(
            "/trabajadores",
            flash_msg={"success": f"El trabajador {worker.full_name} ha sido {st}."},
            request=request
        )
    return inertia_redirect("/trabajadores", request=request)
