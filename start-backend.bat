@echo off
echo ========================================
echo   LeatherFlow AI ERP - Starting Backend
echo ========================================
cd /d "%~dp0backend"
echo Starting FastAPI backend on http://localhost:8000 ...
echo API Docs: http://localhost:8000/api/docs
echo.
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
pause
