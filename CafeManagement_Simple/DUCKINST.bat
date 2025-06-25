@echo off
title Cafe Management System - Auto Installer
color 0A
echo.
echo ========================================
echo   CAFE MANAGEMENT SYSTEM INSTALLER
echo ========================================
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo.
    echo Please install Node.js first:
    echo 1. Go to https://nodejs.org
    echo 2. Download and install Node.js
    echo 3. Restart your computer
    echo 4. Run this installer again
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js detected
node --version

echo.
echo Installing Cafe Management System...
echo.

REM Check if we're in the right directory
if not exist "package.json" (
    echo [ERROR] package.json not found!
    echo Make sure you're running this from the cafe management folder.
    pause
    exit /b 1
)

echo [1/4] Installing dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)

echo.
echo [2/4] Building application...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Failed to build application
    pause
    exit /b 1
)

echo.
echo [3/4] Initializing database...
if not exist "cafe.db" (
    echo Creating database file...
    type nul > cafe.db
)

echo.
echo [4/4] Creating shortcuts...

REM Create desktop shortcut batch file
echo @echo off > start-cafe-system.bat
echo title Cafe Management System >> start-cafe-system.bat
echo echo Starting Cafe Management System... >> start-cafe-system.bat
echo echo. >> start-cafe-system.bat
echo echo Login: admin / admin123 >> start-cafe-system.bat
echo echo Web: http://localhost:5000 >> start-cafe-system.bat
echo echo. >> start-cafe-system.bat
echo cd /d "%~dp0" >> start-cafe-system.bat
echo npm run start >> start-cafe-system.bat
echo pause >> start-cafe-system.bat

echo.
echo ========================================
echo   INSTALLATION COMPLETE!
echo ========================================
echo.
echo To start your cafe system:
echo 1. Double-click 'start-cafe-system.bat'
echo 2. Wait for startup (30 seconds)
echo 3. Open browser to http://localhost:5000
echo 4. Login: admin / admin123
echo.
echo Files created:
echo - start-cafe-system.bat (double-click to start)
echo - cafe.db (your database)
echo.
echo Your cafe management system is ready!
echo.
pause