@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
 echo Instale Node.js 22 ou superior em https://nodejs.org e tente novamente.
 pause
 exit /b 1
)
start "" http://127.0.0.1:4173
node scripts/dev.mjs --desktop --host 127.0.0.1
pause
