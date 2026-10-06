@echo off
setlocal EnableExtensions DisableDelayedExpansion

set "ROOT=%~dp0"
set "API_PORT=4000"
set "API_URL="

if not exist "%ROOT%backend\.env" goto missing_env
if not exist "%ROOT%frontend\.env" goto missing_env
if not exist "%ROOT%backend\node_modules" goto missing_dependencies
if not exist "%ROOT%frontend\node_modules" goto missing_dependencies

for /f "usebackq tokens=1,* delims==" %%A in ("%ROOT%backend\.env") do (
  if /I "%%A"=="PORT" set "API_PORT=%%B"
  if /I "%%A"=="APP_BASE_URL" set "API_URL=%%B"
)

if not defined API_URL goto missing_url
where npm.cmd >nul 2>&1 || goto missing_command
where npx.cmd >nul 2>&1 || goto missing_command
ngrok version >nul 2>&1 || goto missing_command

if /I "%~1"=="--check" (
  echo Configuracion lista. API: %API_URL% ^(puerto %API_PORT%^)
  exit /b 0
)

echo Iniciando API, ngrok y Expo Go en tres ventanas...
start "Acceso - API" /D "%ROOT%backend" cmd /k "npm start"
start "Acceso - ngrok" /D "%ROOT%" cmd /k "ngrok http %API_PORT% --url %API_URL%"
start "Acceso - Expo Go" /D "%ROOT%frontend" cmd /k "npx expo start --go --tunnel --port 8090"
echo Escanea el QR de la ventana Expo Go cuando aparezca.
exit /b 0

:missing_env
echo Falta backend\.env o frontend\.env.
goto error

:missing_dependencies
echo Faltan dependencias. Ejecuta npm install en backend y frontend.
goto error

:missing_url
echo Falta APP_BASE_URL en backend\.env.
goto error

:missing_command
echo Falta npm, npx o ngrok en PATH.
goto error

:error
echo Revisa COMANDOS.md para iniciar manualmente.
pause
exit /b 1
