@echo off
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1"
if errorlevel 1 (
  echo.
  echo Setup did not complete. Install Node.js from https://nodejs.org and run install.bat again.
  pause
  exit /b 1
)
pause
