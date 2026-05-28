@echo off
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-anicade.ps1"
echo.
echo If the browser did not open, use the local URL printed above.
pause
