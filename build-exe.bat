@echo off
echo.
echo ===============================================
echo   Building Cafe Management System EXE
echo ===============================================
echo.

echo [1/5] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [2/5] Installing dependencies...
npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo [3/5] Building web application...
npm run build
if %errorlevel% neq 0 (
    echo ERROR: Failed to build application
    pause
    exit /b 1
)

echo [4/5] Building Windows executable...
npx electron-builder --win --publish=never
if %errorlevel% neq 0 (
    echo ERROR: Failed to build executable
    pause
    exit /b 1
)

echo [5/5] Creating portable package...
if not exist "portable-package" mkdir portable-package
xcopy /E /I /Y dist portable-package\dist
copy start-windows.bat portable-package\
copy DEPLOYMENT_GUIDE.md portable-package\
copy README.md portable-package\
copy .env.template portable-package\
copy package.json portable-package\

echo.
echo ===============================================
echo   Build Complete!
echo ===============================================
echo.
echo Executable created in: dist\
echo Portable package in: portable-package\
echo.
echo To run the executable:
echo - Double-click the .exe file in dist folder
echo.
echo To distribute:
echo - Use the portable-package folder
echo - Customer runs start-windows.bat
echo.
pause