@echo off
echo.
echo ===============================================
echo   Creating Full Standalone EXE Package
echo ===============================================
echo.

REM Build the application first
echo [1/6] Building web application...
call npm run build
if %errorlevel% neq 0 (
    echo Build failed. Check errors above.
    pause
    exit /b 1
)

REM Create standalone executable
echo [2/6] Creating standalone executable...
call npx pkg . --targets node18-win-x64 --output cafe-management-system.exe
if %errorlevel% neq 0 (
    echo Failed to create executable. Trying alternative method...
    call npx pkg dist/index.js --targets node18-win-x64 --output cafe-management-system.exe
)

REM Create deployment folder
echo [3/6] Creating deployment package...
if exist "CafeManagement-Deployment" rmdir /s /q CafeManagement-Deployment
mkdir CafeManagement-Deployment
mkdir CafeManagement-Deployment\database-setup

REM Copy executable and support files
copy cafe-management-system.exe CafeManagement-Deployment\
copy .env.template CafeManagement-Deployment\
copy README.md CafeManagement-Deployment\
copy DEPLOYMENT_GUIDE.md CafeManagement-Deployment\

REM Create simple launcher
echo [4/6] Creating launcher scripts...
(
echo @echo off
echo title Cafe Management System
echo echo.
echo echo ===============================================
echo echo   Cafe Management System
echo echo ===============================================
echo echo.
echo if not exist ".env" ^(
echo     echo SETUP REQUIRED: Please copy .env.template to .env
echo     echo and configure your database settings first.
echo     echo.
echo     echo See DEPLOYMENT_GUIDE.md for detailed instructions.
echo     pause
echo     exit /b 1
echo ^)
echo echo Starting Cafe Management System...
echo echo Server will be available at: http://localhost:5000
echo echo Default login: admin / admin123
echo echo.
echo echo Press Ctrl+C to stop the server
echo start http://localhost:5000
echo cafe-management-system.exe
echo pause
) > CafeManagement-Deployment\Start-Cafe-System.bat

REM Create database setup script
echo [5/6] Creating database setup helper...
(
echo @echo off
echo echo.
echo echo ===============================================
echo echo   Database Setup Helper
echo echo ===============================================
echo echo.
echo echo This script helps you set up the PostgreSQL database.
echo echo.
echo echo Prerequisites:
echo echo 1. PostgreSQL must be installed
echo echo 2. You need database admin credentials
echo echo.
echo set /p PGUSER="Enter PostgreSQL username (default: postgres): "
echo if "%%PGUSER%%"=="" set PGUSER=postgres
echo.
echo set /p PGHOST="Enter PostgreSQL host (default: localhost): "
echo if "%%PGHOST%%"=="" set PGHOST=localhost
echo.
echo set /p PGPORT="Enter PostgreSQL port (default: 5432): "
echo if "%%PGPORT%%"=="" set PGPORT=5432
echo.
echo echo Creating database...
echo psql -U %%PGUSER%% -h %%PGHOST%% -p %%PGPORT%% -c "CREATE DATABASE cafe_management;"
echo.
echo echo Database created! Now creating .env file...
echo echo.
echo set /p PGPASSWORD="Enter password for %%PGUSER%%: "
echo.
echo ^(
echo DATABASE_URL=postgresql://%%PGUSER%%:%%PGPASSWORD%%@%%PGHOST%%:%%PGPORT%%/cafe_management
echo PGHOST=%%PGHOST%%
echo PGPORT=%%PGPORT%%
echo PGDATABASE=cafe_management
echo PGUSER=%%PGUSER%%
echo PGPASSWORD=%%PGPASSWORD%%
echo NODE_ENV=production
echo PORT=5000
echo ^) ^> .env
echo.
echo Setup complete! You can now run Start-Cafe-System.bat
echo pause
) > CafeManagement-Deployment\Setup-Database.bat

REM Create installation guide
echo [6/6] Creating installation guide...
(
echo # Cafe Management System - Complete Installation Package
echo.
echo ## What's Included:
echo - cafe-management-system.exe ^(Main application^)
echo - Start-Cafe-System.bat ^(Easy launcher^)
echo - Setup-Database.bat ^(Database setup helper^)
echo - Configuration templates and guides
echo.
echo ## Installation Steps:
echo.
echo ### 1. Install Prerequisites
echo - Download PostgreSQL from https://www.postgresql.org/download/
echo - Remember the username and password you set during installation
echo.
echo ### 2. Setup Database
echo - Run Setup-Database.bat
echo - Follow the prompts to create the database and .env file
echo.
echo ### 3. Start Application
echo - Double-click Start-Cafe-System.bat
echo - Your browser will open automatically to http://localhost:5000
echo - Login with: admin / admin123
echo.
echo ## Daily Use:
echo - Start: Double-click Start-Cafe-System.bat
echo - Stop: Press Ctrl+C in the command window or close it
echo.
echo ## Network Access:
echo To use from multiple computers:
echo 1. Find this computer's IP address
echo 2. On other computers, go to: http://[IP_ADDRESS]:5000
echo 3. Ensure Windows Firewall allows port 5000
echo.
echo ## Support:
echo - See DEPLOYMENT_GUIDE.md for detailed troubleshooting
echo - Change admin password after first login
echo - Use backup features in the admin panel regularly
echo.
echo This package contains everything needed - no additional downloads required!
) > CafeManagement-Deployment\INSTALLATION.md

echo.
echo ===============================================
echo   SUCCESS! Complete Package Created
echo ===============================================
echo.
echo Package location: CafeManagement-Deployment\
echo.
echo Package contents:
echo - cafe-management-system.exe ^(~50MB standalone executable^)
echo - Start-Cafe-System.bat ^(Easy launcher^)
echo - Setup-Database.bat ^(Database setup helper^)
echo - INSTALLATION.md ^(Step-by-step guide^)
echo - Configuration templates
echo.
echo To distribute:
echo 1. Zip the CafeManagement-Deployment folder
echo 2. Customer extracts and follows INSTALLATION.md
echo 3. Only PostgreSQL installation required on customer machine
echo.
echo The executable includes Node.js runtime - no separate installation needed!
echo.
pause