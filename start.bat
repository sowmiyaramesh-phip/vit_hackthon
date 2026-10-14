@echo off
echo ============================================================
echo   ATLAS+MONITORING : Clinical Surveillance System
echo   Frontend: HTML5, CSS3, Vanilla JavaScript
echo   Backend:  Python Flask REST API
echo   DBMS:     MySQL (with Resilient SQLite Fallback)
echo   DSA:      Graph, Max-Heap, FIFO Queue, Audit Ledger
echo ============================================================

REM 1. Start Python Flask Application Server
start "ATLAS+MONITORING Server" cmd /k "py -m backend.app"

REM 2. Wait 2 seconds for server initialization
timeout /t 2 /nobreak >nul

REM 3. Automatically launch Google Chrome / Default Browser
echo Launching ATLAS+MONITORING in browser...
start http://127.0.0.1:5000/

echo ============================================================
echo   SYSTEM IS LIVE!
echo   Application URL: http://127.0.0.1:5000/
echo   API Health:      http://127.0.0.1:5000/api/dsa/status
echo ============================================================
