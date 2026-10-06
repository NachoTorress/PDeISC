@echo off
cd /d "%~dp0backend" || exit /b 1
npm run reset:admin
set "RESULTADO=%ERRORLEVEL%"
echo.
pause
exit /b %RESULTADO%
