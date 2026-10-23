from pathlib import Path
from fastapi import FastAPI, Request, status
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, RedirectResponse
from starlette.middleware.sessions import SessionMiddleware

from backend.app.database import engine, Base, STORAGE_DIR, BASE_DIR
import backend.app.models  # asegura que todos los modelos se registren en Base
from backend.app.routers import auth, dashboard, parks, maintenances, workers, configuration, reports

# Crear tablas en base de datos
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Sistema de Gestión de Áreas Verdes",
    description="API y Plataforma de Control de Parques y Mantenimientos",
    version="2.0.0",
)

# Sesiones firmadas para login e Inertia flash data
app.add_middleware(
    SessionMiddleware,
    secret_key="gestion_areas_verdes_llave_secreta_segura_2026",
    session_cookie="session_id",
    max_age=60 * 60 * 24 * 7,  # 7 días
)

# CORS para comunicación fluida con Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(RequestValidationError)
async def inertia_validation_exception_handler(request: Request, exc: RequestValidationError):
    if request.headers.get("X-Inertia"):
        errors = {}
        for err in exc.errors():
            loc = err.get("loc", [])
            field = str(loc[-1]) if loc else "general"
            errors[field] = err.get("msg", "Error de validación")
        request.session["errors"] = errors
        referer = request.headers.get("referer", request.url.path)
        return RedirectResponse(url=referer, status_code=status.HTTP_303_SEE_OTHER)
    return JSONResponse(status_code=422, content={"detail": exc.errors()})

# Montar almacenamiento estático de fotos y documentos
app.mount("/storage", StaticFiles(directory=str(STORAGE_DIR)), name="storage")

# Montar build estático del frontend si existe
public_build = BASE_DIR.parent / "public" / "build"
if public_build.exists():
    app.mount("/build", StaticFiles(directory=str(public_build)), name="build")

# Registrar routers
app.include_router(auth.router, tags=["Autenticación"])
app.include_router(dashboard.router, tags=["Dashboard"])
app.include_router(parks.router, tags=["Parques"])
app.include_router(maintenances.router, tags=["Mantenimientos"])
app.include_router(workers.router, tags=["Trabajadores"])
app.include_router(configuration.router, tags=["Configuración"])
app.include_router(reports.router, tags=["Reportes"])
