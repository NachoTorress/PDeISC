@echo off
setlocal
title Iniciar BomberMan
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\Iniciar-BomberMan.ps1" %*
echo.
if "%~1"=="" pause
endlocal
