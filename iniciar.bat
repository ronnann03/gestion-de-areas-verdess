@echo off
cd /d "%~dp0"
if exist "gestion-areas-verdes-main" (
    cd "gestion-areas-verdes-main"
)
echo ========================================================
echo   Iniciando Sistema de Gestion de Areas Verdes
echo   Servidor en: http://localhost:8000
echo ========================================================
.\.venv\Scripts\python.exe run_app.py
pause
