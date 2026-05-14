@echo off
echo ==========================================
echo   LeatherFlow AI ERP - Starting Frontend
echo ==========================================
cd /d "%~dp0frontend"
echo Starting React frontend on http://localhost:5173 ...
echo.
npm run dev
pause
