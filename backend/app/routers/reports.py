import csv
import io
from datetime import date, datetime
from typing import Optional
from fastapi import APIRouter, Depends, Request
from fastapi.responses import HTMLResponse, StreamingResponse, RedirectResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc
from backend.app.database import get_db
from backend.app.models.park import Park
from backend.app.models.worker import Worker
from backend.app.models.maintenance import MaintenanceRecord
from backend.app.models.configuration import InstitutionalSetting
from backend.app.inertia import inertia_render

router = APIRouter()

def status_label(status: str) -> str:
    labels = {
        "al_dia": "Al día",
        "proximo": "Próximo",
        "pendiente": "Pendiente hoy",
        "vencido": "Vencido",
        "en_proceso": "En proceso",
        "finalizado": "Finalizado",
        "cancelado": "Cancelado",
    }
    return labels.get(status, status.capitalize())

def duration_label(minutes: Optional[int]) -> str:
    if not minutes:
        return "--"
    hours = minutes // 60
    mins = minutes % 60
    if hours > 0 and mins > 0:
        return f"{hours}h {mins}m"
    elif hours > 0:
        return f"{hours}h"
    return f"{mins}m"

@router.get("/reportes")
def reports_index(
    request: Request,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    park_id: Optional[str] = None,
    maintenance_type: Optional[str] = None,
    worker_id: Optional[str] = None,
    status: Optional[str] = None,
    type: Optional[str] = "parks",
    db: Session = Depends(get_db)
):
    user_id = request.session.get("user_id")
    if not user_id:
        return RedirectResponse(url="/login", status_code=303)

    today = date.today()
    parks = db.query(Park).order_by(Park.name).all()
    workers = db.query(Worker).order_by(Worker.last_name, Worker.first_name).all()
    all_records = db.query(MaintenanceRecord).all()

    maint_types = sorted(list({r.maintenance_type for r in all_records if r.maintenance_type}))

    # Parks Report
    parks_report = [
        {
            "id": p.id,
            "code": p.code or f"PRQ-{p.id:04d}",
            "name": p.name,
            "green_area_type": p.green_area_type or "Parque",
            "location": " - ".join(filter(None, [p.address, p.zone])) or "Sin ubicación",
            "public_use_area": float(p.public_use_area) if p.public_use_area is not None else None,
            "green_area": float(p.green_area or p.area or 0),
            "has_water_point": bool(p.has_water_point),
            "water_point_status": p.water_point_status,
            "conservation_status": p.conservation_status or p.status or "regular",
            "is_active": bool(p.is_active),
        }
        for p in parks
    ]

    # Filtered Maintenances
    records_query = db.query(MaintenanceRecord)
    if park_id and park_id.isdigit():
        records_query = records_query.filter(MaintenanceRecord.park_id == int(park_id))
    if maintenance_type:
        records_query = records_query.filter(MaintenanceRecord.maintenance_type == maintenance_type)
    if worker_id and worker_id.isdigit():
        records_query = records_query.filter(MaintenanceRecord.worker_id == int(worker_id))

    filtered_records = records_query.order_by(desc(MaintenanceRecord.scheduled_date), desc(MaintenanceRecord.id)).all()

    maintenance_report = []
    for r in filtered_records:
        st = r.operational_status(today)
        if status and st != status:
            continue

        maintenance_report.append({
            "id": r.id,
            "maintenance_number": r.maintenance_number,
            "scheduled_date": r.scheduled_date.strftime("%d/%m/%Y") if r.scheduled_date else None,
            "execution_date": r.execution_date.strftime("%d/%m/%Y") if r.execution_date else None,
            "park_name": r.park.name if r.park else "Sin parque",
            "park_code": r.park.code if r.park else "",
            "maintenance_type": r.maintenance_type,
            "worker_name": r.worker.full_name if r.worker else (r.responsible_worker or "Por asignar"),
            "duration_minutes": r.duration_minutes,
            "duration_label": duration_label(r.duration_minutes),
            "status": st,
            "status_label": status_label(st),
        })

    # Park Histories
    park_histories = []
    for p in parks:
        p_records = sorted(
            p.maintenance_records,
            key=lambda m: (m.scheduled_date or date(1970, 1, 1), m.id),
            reverse=True
        )
        unique_types = sorted(list({r.maintenance_type for r in p_records if r.maintenance_type}))
        park_histories.append({
            "id": p.id,
            "code": p.code or f"PRQ-{p.id:04d}",
            "name": p.name,
            "maintenance_count": len(p_records),
            "maintenance_types": unique_types,
            "records": [
                {
                    "id": r.id,
                    "maintenance_number": r.maintenance_number,
                    "maintenance_type": r.maintenance_type,
                    "scheduled_date": r.scheduled_date.strftime("%d/%m/%Y") if r.scheduled_date else None,
                    "execution_date": r.execution_date.strftime("%d/%m/%Y") if r.execution_date else None,
                    "worker_name": r.worker.full_name if r.worker else (r.responsible_worker or "Por asignar"),
                    "schedule": f"{r.schedule.frequency_days} días" if r.schedule else "Sin frecuencia",
                    "observations": r.observations or r.work_description or "Sin observaciones",
                    "document_name": r.document_name,
                    "document_url": r.document_url,
                    "status": r.operational_status(today),
                    "status_label": status_label(r.operational_status(today)),
                }
                for r in p_records
            ]
        })

    # Worker Report
    worker_report = []
    for w in workers:
        w_records = w.maintenance_records
        total_mins = sum(r.duration_minutes or 0 for r in w_records)
        unique_parks = sorted(list({r.park.name for r in w_records if r.park}))
        unique_wtypes = sorted(list({r.maintenance_type for r in w_records if r.maintenance_type}))

        worker_report.append({
            "id": w.id,
            "code": w.code,
            "full_name": w.full_name,
            "position": w.position,
            "is_active": bool(w.is_active),
            "maintenance_count": len(w_records),
            "parks": unique_parks,
            "work_types": unique_wtypes,
            "hours": round(total_mins / 60.0, 1),
            "completed_count": sum(1 for r in w_records if r.status in ("finalizado", "completado", "ejecutado")),
            "cancelled_count": sum(1 for r in w_records if r.status == "cancelado"),
        })

    # Alerts Report
    pending_records = [r for r in all_records if r.status == "pendiente"]
    upcoming = [r for r in pending_records if r.scheduled_date and r.scheduled_date > today]
    due_today = [r for r in pending_records if r.scheduled_date and r.scheduled_date == today]
    overdue = [r for r in pending_records if r.scheduled_date and r.scheduled_date < today]
    in_progress = [r for r in all_records if r.status in ("en_proceso", "en_mantenimiento")]

    attn_park_ids = {r.park_id for r in (due_today + overdue + in_progress)}
    up_to_date_parks = [p for p in parks if p.is_active and p.id not in attn_park_ids]

    def map_mini(records_list):
        return [
            {
                "id": r.id,
                "maintenance_number": r.maintenance_number,
                "park_name": r.park.name if r.park else "Sin parque",
                "maintenance_type": r.maintenance_type,
                "scheduled_date": r.scheduled_date.strftime("%d/%m/%Y") if r.scheduled_date else None,
            }
            for r in sorted(records_list, key=lambda x: x.scheduled_date or date(9999, 12, 31))
        ]

    alerts_report = {
        "counts": {
            "up_to_date": len(up_to_date_parks),
            "upcoming": len(upcoming),
            "due_today": len(due_today),
            "overdue": len(overdue),
            "in_progress": len(in_progress),
        },
        "up_to_date_parks": [{"id": p.id, "code": p.code, "name": p.name} for p in up_to_date_parks],
        "upcoming": map_mini(upcoming),
        "due_today": map_mini(due_today),
        "overdue": map_mini(overdue),
        "in_progress": map_mini(in_progress),
    }

    # Water Report
    with_water = [p for p in parks if p.has_water_point]
    water_report = {
        "counts": {
            "with_water": len(with_water),
            "without_water": sum(1 for p in parks if not p.has_water_point),
            "operational": sum(1 for p in with_water if (p.water_point_status or "").lower() in ("operativo", "bueno", "funcional")),
            "with_observations": sum(1 for p in with_water if bool(p.water_point_observations)),
            "non_operational": sum(1 for p in with_water if (p.water_point_status or "").lower() in ("no operativo", "inoperativo", "malo")),
        },
        "parks": [
            {
                "id": p.id,
                "code": p.code or f"PRQ-{p.id:04d}",
                "name": p.name,
                "has_water_point": bool(p.has_water_point),
                "water_supply_type": p.water_supply_type,
                "water_point_status": p.water_point_status,
                "observations": p.water_point_observations,
            }
            for p in parks
        ]
    }

    inst = db.query(InstitutionalSetting).first()

    return inertia_render(request, db, "reports/index", {
        "filters": {
            "date_from": date_from or "",
            "date_to": date_to or "",
            "park_id": park_id or "",
            "maintenance_type": maintenance_type or "",
            "worker_id": worker_id or "",
            "status": status or "",
        },
        "filterOptions": {
            "parks": [{"id": p.id, "code": p.code, "name": p.name} for p in parks],
            "workers": [{"id": w.id, "full_name": w.full_name} for w in workers],
            "maintenanceTypes": maint_types,
        },
        "parksReport": parks_report,
        "maintenanceReport": maintenance_report,
        "parkHistories": park_histories,
        "workerReport": worker_report,
        "alertsReport": alerts_report,
        "waterReport": water_report,
        "institutionName": inst.municipality_name if inst else "Municipalidad Distrital de Nuevo Chimbote",
    })

@router.get("/reportes/exportar/csv")
def export_csv(
    type: str = "parks",
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    park_id: Optional[str] = None,
    maintenance_type: Optional[str] = None,
    worker_id: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    output = io.StringIO()
    output.write("\ufeff") # UTF-8 BOM
    writer = csv.writer(output, delimiter=";")

    if type == "parks":
        writer.writerow(["Código", "Nombre", "Tipo Área", "Ubicación", "Área Verde (m2)", "Punto Agua", "Estado"])
        parks = db.query(Park).order_by(Park.name).all()
        for p in parks:
            writer.writerow([
                p.code,
                p.name,
                p.green_area_type,
                f"{p.address or ''} {p.zone or ''}".strip(),
                float(p.green_area or p.area or 0),
                "Sí" if p.has_water_point else "No",
                p.conservation_status or "regular"
            ])
        filename = "reporte_parques.csv"
    else:
        writer.writerow(["N° Mantenimiento", "Fecha Programada", "Fecha Ejecución", "Parque", "Tipo", "Responsable", "Duración", "Estado"])
        records = db.query(MaintenanceRecord).order_by(desc(MaintenanceRecord.id)).all()
        for r in records:
            writer.writerow([
                r.maintenance_number,
                r.scheduled_date.strftime("%d/%m/%Y") if r.scheduled_date else "",
                r.execution_date.strftime("%d/%m/%Y") if r.execution_date else "",
                r.park.name if r.park else "",
                r.maintenance_type,
                r.responsible_worker or "",
                r.duration_minutes or 0,
                r.status,
            ])
        filename = "reporte_mantenimientos.csv"

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/reportes/imprimir")
def print_report(type: str = "parks", db: Session = Depends(get_db)):
    inst = db.query(InstitutionalSetting).first()
    mun = inst.municipality_name if inst else "Municipalidad Distrital de Nuevo Chimbote"
    dep = inst.department_name if inst else "Área de Parques y Jardines"

    parks = db.query(Park).order_by(Park.name).all()

    rows_html = "".join([
        f"<tr><td>{p.code}</td><td>{p.name}</td><td>{p.green_area_type}</td><td>{p.address or ''}</td><td>{'Sí' if p.has_water_point else 'No'}</td><td>{p.conservation_status}</td></tr>"
        for p in parks
    ])

    html = f"""<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <title>Reporte Consolidado - {mun}</title>
    <style>
        body {{ font-family: sans-serif; padding: 24px; color: #1e293b; }}
        h1 {{ color: #065f46; margin: 0; font-size: 20px; }}
        table {{ width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }}
        th, td {{ border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }}
        th {{ background: #f1f5f9; font-weight: 600; }}
        @media print {{ body {{ padding: 0; }} }}
    </style>
</head>
<body onload="window.print()">
    <h1>{mun}</h1>
    <p style="color: #64748b; margin-top: 4px;">{dep} - Reporte Consolidado de Áreas Verdes</p>
    <table>
        <thead>
            <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Tipo de Área</th>
                <th>Ubicación</th>
                <th>Punto Agua</th>
                <th>Estado</th>
            </tr>
        </thead>
        <tbody>
            {rows_html}
        </tbody>
    </table>
</body>
</html>"""
    return HTMLResponse(content=html)
