import sys
from pathlib import Path
from datetime import date, timedelta
import bcrypt

# Agregar raíz al sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.app.database import SessionLocal, Base, engine
from backend.app.models.user import User
from backend.app.models.configuration import GreenAreaType, MaintenanceType, MaintenanceRule, InstitutionalSetting
from backend.app.models.worker import Worker
from backend.app.models.park import Park
from backend.app.models.schedule import ParkSchedule
from backend.app.models.maintenance import MaintenanceRecord

def hash_pw(pw: str) -> str:
    return bcrypt.hashpw(pw.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def seed():
    print("Iniciando seed de la base de datos...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Usuario Administrador
        if not db.query(User).filter(User.email == "admin@nuevochimbote.gob.pe").first():
            user = User(
                name="Administrador Municipal",
                email="admin@nuevochimbote.gob.pe",
                password=hash_pw("admin123"),
                is_active=True,
            )
            db.add(user)
            print("Usuario creado: admin@nuevochimbote.gob.pe / admin123")

        # 2. Configuración Institucional
        if not db.query(InstitutionalSetting).first():
            inst = InstitutionalSetting(
                municipality_name="Municipalidad Distrital de Nuevo Chimbote",
                department_name="Área de Parques y Jardines",
                address="Av. Pacífico S/N, Nuevo Chimbote",
                manager_name="Ing. Gestión Ambiental",
                management_year="2026",
                document_footer="Municipalidad Distrital de Nuevo Chimbote - Gestión Ambiental y Áreas Verdes",
            )
            db.add(inst)
            print("Datos institucionales configurados.")

        # 3. Tipos de Áreas Verdes
        default_types = [
            ("Parque", "Espacio público con áreas verdes destinadas a la recreación pasiva o activa."),
            ("Plaza", "Espacio público abierto con áreas verdes y cívicas."),
            ("Alameda", "Paseo público arbolado y jardines lineales."),
            ("Bermas Centrales", "Áreas verdes divisorias en avenidas principales."),
            ("Jardín de Aislamiento", "Fajas verdes para mitigar el impacto acústico y visual."),
        ]
        for name, desc in default_types:
            if not db.query(GreenAreaType).filter(GreenAreaType.name == name).first():
                db.add(GreenAreaType(name=name, description=desc, is_active=True))

        # 4. Tipos de Mantenimiento
        maint_types = [
            ("Poda y deshierbe", "Corte de césped, retiro de maleza y poda de arbustos."),
            ("Riego tecnificado / cisterna", "Abastecimiento de agua por red o camión cisterna."),
            ("Fertilización y abono", "Aplicación de compost, humus y nutrientes orgánicos."),
            ("Control fitosanitario", "Tratamiento y prevención de plagas."),
            ("Mantenimiento de infraestructura", "Pintura y reparación de bancas, juegos y luminarias."),
        ]
        for name, desc in maint_types:
            if not db.query(MaintenanceType).filter(MaintenanceType.name == name).first():
                db.add(MaintenanceType(name=name, description=desc, is_active=True))

        db.commit()

        # 5. Reglas de Mantenimiento
        rules = [
            ("Parque", "Poda y deshierbe", 15, 3),
            ("Parque", "Riego tecnificado / cisterna", 7, 2),
            ("Plaza", "Poda y deshierbe", 10, 2),
            ("Plaza", "Riego tecnificado / cisterna", 5, 1),
            ("Alameda", "Poda y deshierbe", 20, 3),
            ("Bermas Centrales", "Riego tecnificado / cisterna", 7, 2),
        ]
        for gat, mt, freq, adv in rules:
            if not db.query(MaintenanceRule).filter(
                MaintenanceRule.green_area_type == gat,
                MaintenanceRule.maintenance_type == mt
            ).first():
                db.add(MaintenanceRule(
                    green_area_type=gat,
                    maintenance_type=mt,
                    frequency_days=freq,
                    advance_days=adv,
                    is_active=True
                ))

        # 6. Trabajadores de cuadrilla
        workers = [
            ("TRB-0001", "72345678", "Juan", "Pérez López", "Capataz General", "943112233", "Cuadrilla 1 - Sector Norte"),
            ("TRB-0002", "73456789", "Carlos", "Mendoza Ríos", "Operario de Poda", "943223344", "Cuadrilla 1 - Sector Norte"),
            ("TRB-0003", "74567890", "Roberto", "Quispe Flores", "Conductor de Cisterna", "943334455", "Cuadrilla Riego"),
        ]
        for code, doc, fn, ln, pos, phone, crew in workers:
            if not db.query(Worker).filter(Worker.code == code).first():
                db.add(Worker(
                    code=code,
                    document_number=doc,
                    first_name=fn,
                    last_name=ln,
                    position=pos,
                    phone=phone,
                    crew=crew,
                    is_active=True
                ))

        db.commit()

        # 7. Parque Demo
        if not db.query(Park).first():
            today = date.today()
            park = Park(
                code="PRQ-0001",
                name="Parque Central de la Familia",
                green_area_type="Parque",
                registration_date=today,
                address="Av. Brasil con Av. Central",
                zone="Sector 2",
                reference="Frente a la I.E. República Peruana",
                latitude=-9.1234567,
                longitude=-78.5234567,
                public_use_area=1200.0,
                green_area=3500.0,
                total_area=4700.0,
                has_water_point=True,
                water_supply_type="Cisterna y red",
                water_point_status="Operativo",
                conservation_status="bueno",
                general_observations="Parque principal del distrito con alta afluencia ciudadana.",
                is_active=True,
                area=3500.0,
                status="bueno",
            )
            db.add(park)
            db.commit()
            db.refresh(park)

            # Programaciones automáticas
            active_rules = db.query(MaintenanceRule).filter(
                MaintenanceRule.green_area_type == "Parque",
                MaintenanceRule.is_active == True
            ).all()

            for idx, r in enumerate(active_rules, 1):
                next_d = today + timedelta(days=r.frequency_days)
                alert_d = next_d - timedelta(days=r.advance_days)

                sched = ParkSchedule(
                    park_id=park.id,
                    maintenance_type=r.maintenance_type,
                    frequency_days=r.frequency_days,
                    next_scheduled_date=next_d,
                    is_active=True,
                )
                db.add(sched)
                db.commit()
                db.refresh(sched)

                m_rec = MaintenanceRecord(
                    maintenance_number=f"PM-{idx:06d}-{next_d.year}",
                    park_id=park.id,
                    park_schedule_id=sched.id,
                    maintenance_type=r.maintenance_type,
                    scheduled_date=next_d,
                    alert_date=alert_d,
                    advance_days=r.advance_days,
                    status="pendiente",
                    is_extraordinary=False,
                )
                db.add(m_rec)

            db.commit()
            print("Parque inicial PRQ-0001 registrado con mantenimientos automatizados.")

        print("Base de datos poblada exitosamente.")

    finally:
        db.close()

if __name__ == "__main__":
    seed()
