@echo off
setlocal

cd /d "%~dp0"

if /i not "%~1"=="elevated" (
  powershell -NoProfile -ExecutionPolicy Bypass -Command "Start-Process -FilePath '%~f0' -ArgumentList 'elevated' -Verb RunAs" >nul 2>&1
  if errorlevel 1 (
    echo Administrator access was not granted. Setup cancelled.
    pause
    exit /b 1
  )
  exit /b 0
)

set "INSTALL_SCRIPT=%~dp0install-enrol-protocol.ps1"

if not exist "%INSTALL_SCRIPT%" (
  echo Could not find install-enrol-protocol.ps1 in:
  echo %~dp0
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -File "%INSTALL_SCRIPT%"
if errorlevel 1 (
  echo.
  echo Setup failed. Review the PowerShell error above.
  pause
  exit /b 1
)

echo.
echo Helper setup complete. Restart your browser if folder buttons do not open immediately.
pause
exit /b 0
