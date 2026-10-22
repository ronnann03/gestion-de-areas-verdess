import os
import sys
import subprocess
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
PYTHON = sys.executable

def main():
    print("=" * 60)
    print("Sistema de Gestión de Áreas Verdes (FastAPI + Python)")
    print("=" * 60)

    # 1. Verificar base de datos y correr seed si no existe
    db_file = BASE_DIR / "backend" / "data" / "gestion_areas_verdes.db"
    if not db_file.exists():
        print("[*] Base de datos no encontrada. Ejecutando seed inicial...")
        subprocess.run([PYTHON, str(BASE_DIR / "backend" / "seed.py")], check=True)

    # 2. Iniciar FastAPI con Uvicorn
    print("\n[*] Iniciando servidor FastAPI en http://127.0.0.1:8000 ...")
    print("[*] Documentación OpenAPI (Swagger): http://127.0.0.1:8000/docs")
    print("[*] Para desarrollo con Vite, ejecuta en otra terminal: npm run dev")
    print("=" * 60)

    import uvicorn
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=True)

if __name__ == "__main__":
    main()
