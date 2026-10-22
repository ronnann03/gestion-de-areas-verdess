from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Request, Form, File, UploadFile
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from backend.app.database import get_db, STORAGE_DIR
from backend.app.models.configuration import GreenAreaType, MaintenanceType, MaintenanceRule, InstitutionalSetting
from backend.app.models.park import Park
from backend.app.inertia import inertia_render, inertia_redirect

router = APIRouter()

@router.get("/configuracion")
def configuration_index(request: Request, db: Session = Depends(get_db)):
    user_id = request.session.get("user_id")
    if not user_id:
        return RedirectResponse(url="/login", status_code=303)

    green_area_types = db.query(GreenAreaType).all()
    maintenance_types = db.query(MaintenanceType).all()
    rules = db.query(MaintenanceRule).all()
    inst = db.query(InstitutionalSetting).first()

    gat_data = []
    for g in green_area_types:
        parks_cnt = db.query(Park).filter(Park.green_area_type == g.name).count()
        gat_data.append({
            "id": g.id,
            "name": g.name,
            "description": g.description,
            "is_active": bool(g.is_active),
            "parks_count": parks_cnt,
        })

    mt_data = []
    for m in maintenance_types:
        mt_data.append({
            "id": m.id,
            "name": m.name,
            "description": m.description,
            "is_active": bool(m.is_active),
        })

    rules_data = []
    for r in rules:
        rules_data.append({
            "id": r.id,
            "green_area_type": r.green_area_type,
            "maintenance_type": r.maintenance_type,
            "frequency_days": r.frequency_days,
            "advance_days": r.advance_days,
            "is_active": bool(r.is_active),
        })

    return inertia_render(request, db, "configuration/index", {
        "greenAreaTypes": gat_data,
        "maintenanceTypes": mt_data,
        "maintenanceRules": rules_data,
        "institution": {
            "municipality_name": inst.municipality_name if inst else "Municipalidad Distrital de Nuevo Chimbote",
            "department_name": inst.department_name if inst else "Área de Parques y Jardines",
            "logo_url": inst.logo_url if inst else None,
            "address": inst.address if inst else "",
            "manager_name": inst.manager_name if inst else "",
            "management_year": inst.management_year if inst else "2026",
            "document_footer": inst.document_footer if inst else "",
        },
    })

# --- Green Area Types ---
@router.post("/configuracion/tipos-area")
def store_green_area_type(request: Request, name: str = Form(...), description: Optional[str] = Form(None), db: Session = Depends(get_db)):
    gat = GreenAreaType(name=name.strip(), description=description, is_active=True)
    db.add(gat)
    db.commit()
    return inertia_redirect("/configuracion", flash_msg={"success": "Tipo de área verde agregado."}, request=request)

@router.put("/configuracion/tipos-area/{gat_id}")
def update_green_area_type(gat_id: int, request: Request, name: str = Form(...), description: Optional[str] = Form(None), db: Session = Depends(get_db)):
    gat = db.query(GreenAreaType).filter(GreenAreaType.id == gat_id).first()
    if gat:
        gat.name = name.strip()
        gat.description = description
        db.commit()
        return inertia_redirect("/configuracion", flash_msg={"success": "Tipo de área verde actualizado."}, request=request)
    return inertia_redirect("/configuracion", request=request)

@router.patch("/configuracion/tipos-area/{gat_id}/estado")
def toggle_green_area_type(gat_id: int, request: Request, db: Session = Depends(get_db)):
    gat = db.query(GreenAreaType).filter(GreenAreaType.id == gat_id).first()
    if gat:
        gat.is_active = not gat.is_active
        db.commit()
        return inertia_redirect("/configuracion", flash_msg={"success": "Estado de tipo de área verde actualizado."}, request=request)
    return inertia_redirect("/configuracion", request=request)

# --- Maintenance Types ---
@router.post("/configuracion/tipos-mantenimiento")
def store_maintenance_type(request: Request, name: str = Form(...), description: Optional[str] = Form(None), db: Session = Depends(get_db)):
    mt = MaintenanceType(name=name.strip(), description=description, is_active=True)
    db.add(mt)
    db.commit()
    return inertia_redirect("/configuracion", flash_msg={"success": "Tipo de mantenimiento agregado."}, request=request)

@router.put("/configuracion/tipos-mantenimiento/{mt_id}")
def update_maintenance_type(mt_id: int, request: Request, name: str = Form(...), description: Optional[str] = Form(None), db: Session = Depends(get_db)):
    mt = db.query(MaintenanceType).filter(MaintenanceType.id == mt_id).first()
    if mt:
        mt.name = name.strip()
        mt.description = description
        db.commit()
        return inertia_redirect("/configuracion", flash_msg={"success": "Tipo de mantenimiento actualizado."}, request=request)
    return inertia_redirect("/configuracion", request=request)

@router.patch("/configuracion/tipos-mantenimiento/{mt_id}/estado")
def toggle_maintenance_type(mt_id: int, request: Request, db: Session = Depends(get_db)):
    mt = db.query(MaintenanceType).filter(MaintenanceType.id == mt_id).first()
    if mt:
        mt.is_active = not mt.is_active
        db.commit()
        return inertia_redirect("/configuracion", flash_msg={"success": "Estado actualizado."}, request=request)
    return inertia_redirect("/configuracion", request=request)

# --- Maintenance Rules ---
@router.post("/configuracion/reglas")
def store_rule(
    request: Request,
    green_area_type: str = Form(...),
    maintenance_type: str = Form(...),
    frequency_days: int = Form(...),
    advance_days: int = Form(...),
    db: Session = Depends(get_db)
):
    rule = MaintenanceRule(
        green_area_type=green_area_type,
        maintenance_type=maintenance_type,
        frequency_days=frequency_days,
        advance_days=advance_days,
        is_active=True,
    )
    db.add(rule)
    db.commit()
    return inertia_redirect("/configuracion", flash_msg={"success": "Regla de mantenimiento registrada exitosamente."}, request=request)

@router.put("/configuracion/reglas/{rule_id}")
def update_rule(
    rule_id: int,
    request: Request,
    frequency_days: int = Form(...),
    advance_days: int = Form(...),
    db: Session = Depends(get_db)
):
    rule = db.query(MaintenanceRule).filter(MaintenanceRule.id == rule_id).first()
    if rule:
        rule.frequency_days = frequency_days
        rule.advance_days = advance_days
        db.commit()
        return inertia_redirect("/configuracion", flash_msg={"success": "Regla de mantenimiento actualizada."}, request=request)
    return inertia_redirect("/configuracion", request=request)

@router.patch("/configuracion/reglas/{rule_id}/estado")
def toggle_rule(rule_id: int, request: Request, db: Session = Depends(get_db)):
    rule = db.query(MaintenanceRule).filter(MaintenanceRule.id == rule_id).first()
    if rule:
        rule.is_active = not rule.is_active
        db.commit()
        return inertia_redirect("/configuracion", flash_msg={"success": "Estado de regla actualizado."}, request=request)
    return inertia_redirect("/configuracion", request=request)

# --- Institutional Settings ---
@router.post("/configuracion/datos-institucionales")
async def update_institution(
    request: Request,
    municipality_name: str = Form(...),
    department_name: str = Form(...),
    address: Optional[str] = Form(None),
    manager_name: Optional[str] = Form(None),
    management_year: Optional[str] = Form("2026"),
    document_footer: Optional[str] = Form(None),
    logo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    inst = db.query(InstitutionalSetting).first()
    if not inst:
        inst = InstitutionalSetting()
        db.add(inst)

    inst.municipality_name = municipality_name
    inst.department_name = department_name
    inst.address = address
    inst.manager_name = manager_name
    inst.management_year = management_year
    inst.document_footer = document_footer

    if logo and logo.filename:
        filename = f"logo_{int(datetime.utcnow().timestamp())}_{logo.filename}"
        logo_path = STORAGE_DIR / filename
        content = await logo.read()
        logo_path.write_bytes(content)
        inst.logo_path = filename

    db.commit()

    return inertia_redirect("/configuracion", flash_msg={"success": "Datos institucionales actualizados."}, request=request)
