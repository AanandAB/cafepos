@echo off
echo Starting Cafe Management System...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is available
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not available
    echo Please ensure Node.js is properly installed
    pause
    exit /b 1
)

REM Check if dependencies are installed
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Check if application is built
if not exist "dist" (
    echo Building application...
    npm run build
    if %errorlevel% neq 0 (
        echo ERROR: Failed to build application
        pause
        exit /b 1
    )
)

REM Start the application
echo Starting server...
echo The application will be available at: http://localhost:5000
echo Press Ctrl+C to stop the server
echo.
set NODE_ENV=production
node dist/index.js

pause