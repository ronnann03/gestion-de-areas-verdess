import json
from pathlib import Path
from typing import Any, Dict, Optional
from fastapi import Request, status
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from sqlalchemy.orm import Session
from backend.app.models.user import User

BASE_DIR = Path(__file__).resolve().parent.parent.parent
PUBLIC_DIR = BASE_DIR / "public"
HOT_FILE = PUBLIC_DIR / "hot"
MANIFEST_FILE = PUBLIC_DIR / "build" / "manifest.json"

ZIGGY_ROUTES = {
    "home": {"uri": "/", "methods": ["GET", "HEAD"]},
    "login": {"uri": "login", "methods": ["GET", "HEAD", "POST"]},
    "logout": {"uri": "logout", "methods": ["POST"]},
    "dashboard": {"uri": "dashboard", "methods": ["GET", "HEAD"]},
    "parks.index": {"uri": "parques", "methods": ["GET", "HEAD"]},
    "parks.store": {"uri": "parques", "methods": ["POST"]},
    "parks.update": {"uri": "parques/{park}", "methods": ["PUT"]},
    "parks.toggle-status": {"uri": "parques/{park}/toggle-status", "methods": ["PATCH"]},
    "parks.extraordinary-maintenance": {"uri": "parques/{park}/mantenimiento-extraordinario", "methods": ["POST"]},
    "parks.destroy": {"uri": "parques/{park}", "methods": ["DELETE"]},
    "maintenances.index": {"uri": "mantenimientos", "methods": ["GET", "HEAD"]},
    "maintenances.store-extraordinary": {"uri": "mantenimientos/extraordinario", "methods": ["POST"]},
    "maintenances.iniciar": {"uri": "mantenimientos/{maintenance}/iniciar", "methods": ["POST"]},
    "maintenances.finalizar": {"uri": "mantenimientos/{maintenance}/finalizar", "methods": ["POST"]},
    "maintenances.atender": {"uri": "mantenimientos/{maintenance}/atender", "methods": ["POST"]},
    "maintenances.cancelar": {"uri": "mantenimientos/{maintenance}/cancelar", "methods": ["PATCH"]},
    "maintenances.documento": {"uri": "mantenimientos/{maintenance}/documento", "methods": ["GET", "HEAD"]},
    "workers.index": {"uri": "trabajadores", "methods": ["GET", "HEAD"]},
    "workers.store": {"uri": "trabajadores", "methods": ["POST"]},
    "workers.update": {"uri": "trabajadores/{worker}", "methods": ["PUT"]},
    "workers.toggle-status": {"uri": "trabajadores/{worker}/toggle-status", "methods": ["PATCH"]},
    "workers.mantenimientos": {"uri": "trabajadores/{worker}/mantenimientos", "methods": ["GET", "HEAD"]},
    "reports.index": {"uri": "reportes", "methods": ["GET", "HEAD"]},
    "reports.csv": {"uri": "reportes/exportar/csv", "methods": ["GET", "HEAD"]},
    "reports.pdf": {"uri": "reportes/exportar/pdf", "methods": ["GET", "HEAD"]},
    "reports.print": {"uri": "reportes/imprimir", "methods": ["GET", "HEAD"]},
    "configuration.index": {"uri": "configuracion", "methods": ["GET", "HEAD"]},
    "configuration.green-area-types.store": {"uri": "configuracion/tipos-area", "methods": ["POST"]},
    "configuration.green-area-types.update": {"uri": "configuracion/tipos-area/{greenAreaType}", "methods": ["PUT"]},
    "configuration.green-area-types.toggle": {"uri": "configuracion/tipos-area/{greenAreaType}/estado", "methods": ["PATCH"]},
    "configuration.maintenance-types.store": {"uri": "configuracion/tipos-mantenimiento", "methods": ["POST"]},
    "configuration.maintenance-types.update": {"uri": "configuracion/tipos-mantenimiento/{maintenanceType}", "methods": ["PUT"]},
    "configuration.maintenance-types.toggle": {"uri": "configuracion/tipos-mantenimiento/{maintenanceType}/estado", "methods": ["PATCH"]},
    "configuration.rules.store": {"uri": "configuracion/reglas", "methods": ["POST"]},
    "configuration.rules.update": {"uri": "configuracion/reglas/{maintenanceRule}", "methods": ["PUT"]},
    "configuration.rules.toggle": {"uri": "configuracion/reglas/{maintenanceRule}/estado", "methods": ["PATCH"]},
    "configuration.institution.update": {"uri": "configuracion/datos-institucionales", "methods": ["POST"]},
    "password.request": {"uri": "forgot-password", "methods": ["GET", "HEAD"]},
    "password.email": {"uri": "forgot-password", "methods": ["POST"]},
    "password.reset": {"uri": "reset-password/{token}", "methods": ["GET", "HEAD"]},
    "password.update": {"uri": "reset-password", "methods": ["POST"]},
    "register": {"uri": "register", "methods": ["GET", "HEAD", "POST"]},
    "profile.edit": {"uri": "settings/profile", "methods": ["GET", "HEAD"]},
    "profile.update": {"uri": "settings/profile", "methods": ["PATCH"]},
    "profile.destroy": {"uri": "settings/profile", "methods": ["DELETE"]},
    "password.edit": {"uri": "settings/password", "methods": ["GET", "HEAD"]},
    "appearance": {"uri": "settings/appearance", "methods": ["GET", "HEAD"]},
}

from starlette.requests import Request as StarletteRequest
from starlette.datastructures import FormData

_orig_get_form = StarletteRequest._get_form

async def custom_get_form(self, *args, **kwargs):
    if self._form is None:
        ct = self.headers.get("content-type", "")
        if "application/json" in ct:
            try:
                body = await self.body()
                if body:
                    data = json.loads(body)
                    if isinstance(data, dict):
                        items = []
                        for k, v in data.items():
                            if v is None:
                                continue
                            if isinstance(v, bool):
                                items.append((k, "true" if v else "false"))
                            elif isinstance(v, list):
                                for item in v:
                                    items.append((k, str(item)))
                            elif isinstance(v, dict):
                                items.append((k, json.dumps(v)))
                            else:
                                items.append((k, str(v)))
                        self._form = FormData(items)
                        return self._form
            except Exception:
                pass
    return await _orig_get_form(self, *args, **kwargs)

StarletteRequest._get_form = custom_get_form

async def get_request_data(request: Request) -> Dict[str, Any]:
    ct = request.headers.get("content-type", "")
    if "application/json" in ct:
        try:
            return await request.json()
        except Exception:
            return {}
    elif "application/x-www-form-urlencoded" in ct or "multipart/form-data" in ct:
        try:
            form = await request.form()
            return dict(form)
        except Exception:
            return {}
    return dict(request.query_params)

def get_current_user(request: Request, db: Session) -> Optional[User]:
    user_id = request.session.get("user_id")
    if not user_id:
        return None
    return db.query(User).filter(User.id == user_id, User.is_active == True).first()

def get_shared_props(request: Request, db: Session) -> Dict[str, Any]:
    user = get_current_user(request, db)
    flash_data = request.session.pop("flash", {})
    errors_data = request.session.pop("errors", {})

    user_data = None
    if user:
        user_data = {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "email_verified_at": user.email_verified_at.isoformat() if user.email_verified_at else None,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "updated_at": user.updated_at.isoformat() if user.updated_at else None,
        }

    return {
        "name": "Gestión de Áreas Verdes",
        "quote": {
            "message": "El cuidado de las áreas verdes es vida para la comunidad.",
            "author": "Gestión Ambiental",
        },
        "auth": {
            "user": user_data,
        },
        "flash": flash_data,
        "errors": errors_data,
    }

def get_vite_tags() -> str:
    vite_host = "http://127.0.0.1:5173"
    if HOT_FILE.exists():
        try:
            vite_host = HOT_FILE.read_text().strip()
        except Exception:
            pass

    # Modo desarrollo (Vite server)
    dev_tags = f"""
    <script type="module">
        import RefreshRuntime from '{vite_host}/@react-refresh'
        RefreshRuntime.injectIntoGlobalHook(window)
        window.$RefreshReg$ = () => {{}}
        window.$RefreshSig$ = () => (type) => type
        window.__vite_plugin_react_preamble_installed__ = true
    </script>
    <script type="module" src="{vite_host}/@vite/client"></script>
    <script type="module" src="{vite_host}/resources/js/app.tsx"></script>
    """

    # Si hay build de producción
    if MANIFEST_FILE.exists():
        try:
            manifest = json.loads(MANIFEST_FILE.read_text(encoding="utf-8"))
            app_entry = manifest.get("resources/js/app.tsx", {})
            css_files = app_entry.get("css", [])
            js_file = app_entry.get("file", "")

            prod_tags = ""
            for css in css_files:
                prod_tags += f'<link rel="stylesheet" href="/build/{css}" />\n'
            if js_file:
                prod_tags += f'<script type="module" src="/build/{js_file}"></script>\n'
            return prod_tags
        except Exception:
            pass

    return dev_tags

def render_html_shell(page_data: Dict[str, Any]) -> str:
    page_json = json.dumps(page_data, ensure_ascii=False)
    ziggy_json = json.dumps({
        "url": "http://127.0.0.1:8000",
        "port": 8000,
        "defaults": {},
        "routes": ZIGGY_ROUTES,
    }, ensure_ascii=False)

    vite_tags = get_vite_tags()

    template = """<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Gestión de Áreas Verdes</title>
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script>
        window.Ziggy = __ZIGGY_JSON__;
        window.route = function(name, params) {
            if (!name) return { current: function(p) {
                var path = window.location.pathname.replace(/^\\//, '');
                if (!p) return path;
                var re = new RegExp('^' + p.replace(/\\*/g, '.*') + '$');
                return re.test(path);
            }};
            var routes = (window.Ziggy && window.Ziggy.routes) || {};
            var r = routes[name];
            var uri = r ? r.uri : ('/' + name.replace(/\\./g, '/'));
            if (params !== undefined && params !== null) {
                if (typeof params === 'object' && !Array.isArray(params)) {
                    for (var k in params) {
                        uri = uri.replace('{' + k + '}', encodeURIComponent(params[k]));
                        uri = uri.replace('{' + k + '?}', encodeURIComponent(params[k]));
                    }
                } else {
                    uri = uri.replace(/\\{[a-zA-Z_]+\\??\\}/, encodeURIComponent(params));
                }
            }
            uri = uri.replace(/\\/\\{[a-zA-Z_]+\\?\\}/g, '');
            return uri.startsWith('/') ? uri : ('/' + uri);
        };
    </script>
    __VITE_TAGS__
</head>
<body class="font-sans antialiased">
    <div id="app" data-page='__PAGE_DATA__'></div>
</body>
</html>"""

    html = (
        template
        .replace("__ZIGGY_JSON__", ziggy_json)
        .replace("__VITE_TAGS__", vite_tags)
        .replace("__PAGE_DATA__", page_json.replace("'", "&#39;"))
    )
    return html

def inertia_render(
    request: Request,
    db: Session,
    component: str,
    props: Dict[str, Any],
    status_code: int = 200,
):
    shared = get_shared_props(request, db)
    full_props = {**shared, **props}

    current_url = request.url.path
    if request.url.query:
        current_url += f"?{request.url.query}"

    page_data = {
        "component": component,
        "props": full_props,
        "url": current_url,
        "version": "1",
    }

    if request.headers.get("X-Inertia"):
        return JSONResponse(
            content=page_data,
            headers={"X-Inertia": "true", "Vary": "X-Inertia"},
            status_code=status_code,
        )

    return HTMLResponse(
        content=render_html_shell(page_data),
        status_code=status_code,
    )

def inertia_redirect(url: str, flash_msg: Optional[Dict[str, str]] = None, request: Optional[Request] = None):
    if flash_msg and request:
        if "flash" not in request.session:
            request.session["flash"] = {}
        request.session["flash"].update(flash_msg)
    return RedirectResponse(url=url, status_code=status.HTTP_303_SEE_OTHER)
