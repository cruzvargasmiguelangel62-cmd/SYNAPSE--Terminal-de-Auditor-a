@echo off
REM Inicia el frontend (Vite) y el backend (Express) en paralelo
start cmd /k "cd /d %~dp0 && npm run dev"
start cmd /k "cd /d %~dp0\backend && node server.js"
