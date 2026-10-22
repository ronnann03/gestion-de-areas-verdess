# Sistema de Gestión de Áreas Verdes y Parques

Plataforma integral para el control de áreas verdes, inventario de parques, programación automatizada de mantenimientos, control de cuadrillas y generación de reportes técnicos municipales.

## 🚀 Arquitectura y Tecnologías

* **Backend:** **Python 3.14 + FastAPI**
  * **ORM & Base de datos:** SQLAlchemy 2.0 con SQLite (cero configuración inicial).
  * **Validación:** Pydantic v2.
  * **Seguridad:** Cifrado con Bcrypt y sesiones firmadas.
  * **Documentación interactiva:** OpenAPI / Swagger UI en `/docs`.
* **Frontend:** **React 19 + TypeScript + Vite**
  * **Estilos:** Tailwind CSS v4.
  * **Componentes:** Radix UI y Lucide React Icons.
  * **Mapas interactivos:** Leaflet (geolocalización de parques).

---

## 🛠️ Puesta en Marcha Rápida

### 1. Requisitos Previos
* **Python 3.10+** (recomendado Python 3.12 - 3.14)
* **Node.js 18+** y **npm**

### 2. Configurar Backend (Python)
```bash
# Crear e iniciar entorno virtual
python -m venv .venv
.\.venv\Scripts\activate   # En Windows PowerShell / CMD

# Instalar dependencias
pip install -r backend/requirements.txt

# Poblar base de datos inicial con reglas automáticas y usuario demo
python backend/seed.py
```

### 3. Iniciar el Servidor de Backend
```bash
python run_app.py
```
> El servidor estará disponible en: **http://127.0.0.1:8000**
> La documentación interactiva Swagger estará en: **http://127.0.0.1:8000/docs**

### 4. Iniciar el Servidor de Frontend (Vite)
En una segunda terminal:
```bash
npm install
npm run dev
```

---

## 🔐 Credenciales por Defecto

* **Correo:** `admin@nuevochimbote.gob.pe`
* **Contraseña:** `admin123`

---

## 📋 Módulos Principales

1. **Dashboard:**
   * Métricas en tiempo real: Parques activos, puntos de agua, mantenimientos del mes.
   * Semáforo de estados: *Al día*, *Próximo*, *Pendiente hoy*, *Vencido*, *En proceso*.
   * Próximos 10 mantenimientos priorizados.
2. **Parques (`/parques`):**
   * Inventario georreferenciado (latitud/longitud) con visor de mapa interactivo Leaflet.
   * Generación automática de códigos correlativos (`PRQ-0001`, `PRQ-0002`...).
   * Programación automática de mantenimientos periódicos al registrar un parque según su tipo.
3. **Mantenimientos (`/mantenimientos`):**
   * Bandeja clasificada por pestañas según estado.
   * Flujo de atención: *Iniciar*, *Finalizar*, *Atender de inmediato* y *Cancelar*.
   * **Cálculo automático del próximo mantenimiento** tras finalizar un servicio recurrente.
   * Generación e impresión de partes técnicos de mantenimiento.
4. **Trabajadores (`/trabajadores`):**
   * Catálogo de cuadrillas y operarios con correlativo (`TRB-0001`).
   * Estadísticas de horas y servicios completados.
5. **Configuración (`/configuracion`):**
   * Catálogo de tipos de áreas verdes y tipos de mantenimiento.
   * Matriz de reglas automáticas (frecuencia en días y días de anticipación de alerta).
   * Datos y membretes institucionales de la municipalidad.
6. **Reportes (`/reportes`):**
   * Filtros por fecha, parque, cuadrilla y estado.
   * Exportación instantánea a **CSV / Excel** y vista optimizada para impresión / PDF.
