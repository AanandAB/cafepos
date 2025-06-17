@echo off
echo.
echo ===============================================
echo   Cafe POS System - Windows Setup
echo ===============================================
echo.

echo [1/6] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    echo Choose the LTS version and make sure to check "Add to PATH"
    pause
    exit /b 1
) else (
    echo Node.js found: 
    node --version
)

echo Press any key to continue . . .
pause >nul

echo [2/6] Checking npm availability...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm is not available
    echo Please ensure Node.js is properly installed
    pause
    exit /b 1
) else (
    echo npm found: 
    npm --version
)

echo [3/6] Checking environment configuration...
if not exist ".env" (
    echo WARNING: .env file not found
    echo Please copy .env.template to .env and configure your database settings
    echo See DEPLOYMENT_GUIDE.md for detailed instructions
    pause
    echo Continuing with default environment...
)

echo [4/6] Installing dependencies...
if not exist "node_modules" (
    echo This may take a few minutes...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install dependencies
        echo Check your internet connection and try again
        pause
        exit /b 1
    )
    echo Dependencies installed successfully!
) else (
    echo Dependencies already installed
)

echo [5/6] Building application...
if not exist "dist" (
    echo Building application files...
    npm run build
    if %errorlevel% neq 0 (
        echo ERROR: Failed to build application
        echo Please check for any error messages above
        pause
        exit /b 1
    )
    echo Application built successfully!
) else (
    echo Application already built
)

echo [6/6] Starting server...
echo.
echo ===============================================
echo   Cafe POS System is starting...
echo ===============================================
echo.
echo Server will be available at: http://localhost:5000
echo Default login: admin / admin123
echo.
echo Press Ctrl+C to stop the server
echo To access from other computers, use: http://[THIS_COMPUTER_IP]:5000
echo.

set NODE_ENV=production
node dist/index.js

echo.
echo Server stopped. Press any key to exit...
pause >nul