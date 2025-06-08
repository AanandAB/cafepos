@echo off
echo ========================================
echo  Cafe POS System - Windows Setup
echo ========================================
echo.

:: Check if Node.js is installed
echo [1/6] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please download and install Node.js from https://nodejs.org/
    echo Choose the LTS version (20.x or higher)
    pause
    exit /b 1
)
echo ✓ Node.js is installed

:: Check if PostgreSQL is available
echo [2/6] Checking PostgreSQL connection...
set DATABASE_URL=postgresql://postgres:admin@localhost:5432/cafe_pos
echo Using database URL: %DATABASE_URL%

:: Install dependencies
echo [3/6] Installing application dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo ✓ Dependencies installed

:: Setup database
echo [4/6] Setting up database...
call npm run db:push
if %errorlevel% neq 0 (
    echo ERROR: Database setup failed
    echo Please ensure PostgreSQL is running and the database exists
    echo Default connection: postgresql://postgres:admin@localhost:5432/cafe_pos
    pause
    exit /b 1
)
echo ✓ Database setup complete

:: Create start script
echo [5/6] Creating startup scripts...
echo @echo off > start-cafe-pos.bat
echo echo Starting Cafe POS System... >> start-cafe-pos.bat
echo set DATABASE_URL=%DATABASE_URL% >> start-cafe-pos.bat
echo call npm run dev >> start-cafe-pos.bat
echo pause >> start-cafe-pos.bat

echo ✓ Startup script created

:: Final instructions
echo [6/6] Setup complete!
echo.
echo ========================================
echo  SETUP SUCCESSFUL!
echo ========================================
echo.
echo Your Cafe POS System is ready to use:
echo.
echo 1. Run 'start-cafe-pos.bat' to start the system
echo 2. Open your browser to: http://localhost:5000
echo 3. Login with:
echo    Username: admin
echo    Password: admin123
echo.
echo IMPORTANT: Change the default password after first login!
echo.
echo For support, refer to the README.md file.
echo.
pause