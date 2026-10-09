@echo off
setlocal
title Crear version de BomberMan
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\Crear-Version.ps1"
echo.
pause
endlocal
