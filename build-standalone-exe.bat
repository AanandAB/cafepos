@echo off
echo.
echo ===============================================
echo   Building Standalone Cafe Management EXE
echo ===============================================
echo.

echo [1/4] Checking prerequisites...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found. Install from https://nodejs.org/
    pause
    exit /b 1
)

echo [2/4] Installing build dependencies...
npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)

echo [3/4] Building application...
npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed
    pause
    exit /b 1
)

echo [4/4] Creating standalone executable...
npx pkg dist/index.js --targets node18-win-x64 --output cafe-management.exe --compress Brotli
if %errorlevel% neq 0 (
    echo ERROR: Failed to create executable
    pause
    exit /b 1
)

echo.
echo ===============================================
echo   SUCCESS! Executable Created
echo ===============================================
echo.
echo Your executable: cafe-management.exe
echo File size: 
dir cafe-management.exe | find "cafe-management.exe"
echo.
echo To run:
echo 1. Set up PostgreSQL database
echo 2. Create .env file with database credentials
echo 3. Double-click cafe-management.exe
echo 4. Open browser to http://localhost:5000
echo.
echo Default login: admin / admin123
echo.
pause