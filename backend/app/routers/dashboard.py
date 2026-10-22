from datetime import date, datetime
from fastapi import APIRouter, Depends, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.park import Park
from backend.app.models.maintenance import MaintenanceRecord
from backend.app.models.configuration import InstitutionalSetting
from backend.app.inertia import inertia_render

router = APIRouter()

def get_remaining_meta(scheduled_date: date | None, today: date) -> tuple[int | None, str]:
    if not scheduled_date:
        return None, "Sin fecha"
    diff = (scheduled_date - today).days
    if diff < 0:
        return diff, f"Vencido hace {abs(diff)} día(s)"
    elif diff == 0:
        return 0, "Hoy"
    elif diff == 1:
        return 1, "Mañana"
    else:
        return diff, f"En {diff} días"

@router.get("/dashboard")
def dashboard(request: Request, db: Session = Depends(get_db)):
    user_id = request.session.get("user_id")
    if not user_id:
        return RedirectResponse(url="/login", status_code=303)

    today = date.today()
    parks = db.query(Park).all()
    records = db.query(MaintenanceRecord).all()

    # Pre-calcular estados operativos
    records_with_status = [(r, r.operational_status(today)) for r in records]

    status_counts = {
        "al_dia": sum(1 for _, st in records_with_status if st == "al_dia"),
        "proximo": sum(1 for _, st in records_with_status if st == "proximo"),
        "pendiente": sum(1 for _, st in records_with_status if st == "pendiente"),
        "vencido": sum(1 for _, st in records_with_status if st == "vencido"),
        "en_proceso": sum(1 for _, st in records_with_status if st == "en_proceso"),
    }

    scheduled_states = {"al_dia", "proximo", "pendiente", "vencido"}
    scheduled_count = sum(1 for _, st in records_with_status if st in scheduled_states)

    # Mantenimientos completados en el mes actual
    completed_month = sum(
        1 for r, st in records_with_status
        if st == "finalizado" and r.execution_date and r.execution_date.year == today.year and r.execution_date.month == today.month
    )

    # Filtrar para lista de próximos mantenimientos (priorizados)
    valid_states = {"en_proceso", "vencido", "pendiente", "proximo", "al_dia"}
    candidates = [
        (r, st) for r, st in records_with_status
        if st in valid_states
    ]

    priority_map = {
        "en_proceso": 0,
        "vencido": 1,
        "pendiente": 2,
        "proximo": 3,
        "al_dia": 4,
    }

    candidates.sort(key=lambda item: (
        priority_map.get(item[1], 5),
        item[0].scheduled_date or date(9999, 12, 31),
        item[0].id
    ))

    # Top 10
    top_candidates = candidates[:10]
    upcoming_maintenances = []

    for r, st in top_candidates:
        remaining_days, remaining_label = get_remaining_meta(r.scheduled_date, today)

        # Buscar último mantenimiento finalizado del mismo parque y tipo
        last_m = next((
            cand for cand, cst in records_with_status
            if cand.id != r.id
            and cand.park_id == r.park_id
            and cand.maintenance_type == r.maintenance_type
            and cst == "finalizado"
            and cand.execution_date
        ), None)

        last_date_str = last_m.execution_date.strftime("%d/%m/%Y") if last_m and last_m.execution_date else None

        upcoming_maintenances.append({
            "id": r.id,
            "maintenance_number": r.maintenance_number,
            "park_name": r.park.name if r.park else "Sin parque",
            "park_code": r.park.code if r.park else f"PRQ-{r.park_id:04d}",
            "green_area_type": r.park.green_area_type if r.park else "Parque",
            "maintenance_type": r.maintenance_type,
            "is_extraordinary": bool(r.is_extraordinary),
            "reason": r.reason,
            "last_maintenance": last_date_str,
            "next_date": r.scheduled_date.strftime("%d/%m/%Y") if r.scheduled_date else None,
            "remaining_days": remaining_days,
            "remaining_label": remaining_label,
            "status": st,
            "is_in_progress": st == "en_proceso",
        })

    institution = db.query(InstitutionalSetting).first()

    return inertia_render(request, db, "dashboard", {
        "institution": {
            "municipality_name": institution.municipality_name if institution else "Municipalidad Distrital de Nuevo Chimbote",
            "department_name": institution.department_name if institution else "Área de Parques y Jardines",
            "logo_url": institution.logo_url if institution else None,
        },
        "indicators": {
            "parks_total": len(parks),
            "parks_active": sum(1 for p in parks if p.is_active),
            "parks_inactive": sum(1 for p in parks if not p.is_active),
            "parks_with_water": sum(1 for p in parks if p.has_water_point),
            "parks_without_water": sum(1 for p in parks if not p.has_water_point),
            "maintenances_scheduled": scheduled_count,
            "maintenances_upcoming": status_counts["proximo"],
            "maintenances_pending_today": status_counts["pendiente"],
            "maintenances_overdue": status_counts["vencido"],
            "maintenances_in_progress": status_counts["en_proceso"],
            "maintenances_completed_month": completed_month,
        },
        "alertCounts": status_counts,
        "upcomingMaintenances": upcoming_maintenances,
    })
