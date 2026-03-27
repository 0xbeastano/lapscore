@echo off
title LapScore — Starting...
color 0A

echo.
echo  ██╗      █████╗ ██████╗ ███████╗ ██████╗ ██████╗ ██████╗ ███████╗
echo  ██║     ██╔══██╗██╔══██╗██╔════╝██╔════╝██╔════╝██╔══██╗██╔════╝
echo  ██║     ███████║██████╔╝███████╗██║     ██║     ██████╔╝█████╗
echo  ██║     ██╔══██║██╔═══╝ ╚════██║██║     ██║     ██╔══██╗██╔══╝
echo  ███████╗██║  ██║██║     ███████║╚██████╗╚██████╗██║  ██║███████╗
echo  ╚══════╝╚═╝  ╚═╝╚═╝     ╚══════╝ ╚═════╝ ╚═════╝╚═╝  ╚═╝╚══════╝
echo.
echo  Your PC's health. Scored. Explained. Fixed.
echo  ─────────────────────────────────────────────────
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
  echo  [ERROR] Node.js is not installed.
  echo.
  echo  Please install Node.js first:
  echo  https://nodejs.org  (download the LTS version)
  echo.
  echo  After installing Node.js, double-click this
  echo  file again.
  echo.
  pause
  exit /b 1
)

:: Check if setup is needed (node_modules missing)
if not exist "node_modules\" (
  echo  [SETUP] First run detected. Installing...
  echo  This takes about 2 minutes. Please wait.
  echo.
  call npm install
  if %errorlevel% neq 0 (
    echo  [ERROR] npm install failed.
    echo  Try running as Administrator.
    pause
    exit /b 1
  )
)

if not exist "client\node_modules\" (
  echo  [SETUP] Installing dashboard components...
  cd client
  call npm install
  if %errorlevel% neq 0 (
    echo  [ERROR] Client install failed.
    pause
    exit /b 1
  )
  cd ..
)

:: Build React if dist folder missing or empty
if not exist "client\dist\index.html" (
  echo  [BUILD] Building dashboard...
  cd client
  call npm run build
  if %errorlevel% neq 0 (
    echo  [ERROR] Build failed.
    pause
    exit /b 1
  )
  cd ..
)

:: All checks passed — start the server
echo  [OK] Starting LapScore...
echo.
echo  Dashboard will open at:
echo  http://localhost:7821
echo.
echo  Press Ctrl+C to stop.
echo.

:: Open browser after 2 second delay
start /b cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:7821"

:: Start the server
node server/index.js

pause
