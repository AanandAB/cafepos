@echo off
echo ========================================
echo Cafe Management System - Windows Build
echo ========================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org
    pause
    exit /b 1
)

echo Node.js version:
node --version

echo.
echo Installing dependencies...
call npm install

echo.
echo Building application...
call npm run build

if %errorlevel% neq 0 (
    echo ERROR: Build failed
    pause
    exit /b 1
)

echo.
echo Creating Windows package...

REM Create distribution directory
if exist "CafeManagement-Windows" rmdir /s /q "CafeManagement-Windows"
mkdir "CafeManagement-Windows"

REM Install PKG if not installed
echo Installing PKG packager...
call npm install -g pkg

REM Create executable
echo Creating executable...
call pkg . --targets node18-win-x64 --output "CafeManagement-Windows\cafe-management.exe"

if %errorlevel% neq 0 (
    echo ERROR: Failed to create executable
    pause
    exit /b 1
)

REM Copy necessary files
echo Copying application files...
xcopy "dist" "CafeManagement-Windows\dist\" /E /I /Y
xcopy "client" "CafeManagement-Windows\client\" /E /I /Y
copy "package.json" "CafeManagement-Windows\"
copy ".env.example" "CafeManagement-Windows\.env"

REM Create startup script
echo Creating startup script...
echo @echo off > "CafeManagement-Windows\start.bat"
echo echo Starting Cafe Management System... >> "CafeManagement-Windows\start.bat"
echo echo. >> "CafeManagement-Windows\start.bat"
echo echo Please ensure SQL Server is running and configured >> "CafeManagement-Windows\start.bat"
echo echo Edit .env file for database configuration >> "CafeManagement-Windows\start.bat"
echo echo. >> "CafeManagement-Windows\start.bat"
echo cafe-management.exe >> "CafeManagement-Windows\start.bat"
echo echo. >> "CafeManagement-Windows\start.bat"
echo echo Application stopped. Press any key to exit... >> "CafeManagement-Windows\start.bat"
echo pause ^> nul >> "CafeManagement-Windows\start.bat"

REM Create configuration guide
echo Creating configuration guide...
echo # Cafe Management System - Windows Setup > "CafeManagement-Windows\README.txt"
echo. >> "CafeManagement-Windows\README.txt"
echo ## Quick Start: >> "CafeManagement-Windows\README.txt"
echo 1. Install SQL Server Express from Microsoft >> "CafeManagement-Windows\README.txt"
echo 2. Edit .env file with your database settings >> "CafeManagement-Windows\README.txt"
echo 3. Run start.bat to launch the application >> "CafeManagement-Windows\README.txt"
echo 4. Open browser to http://localhost:5000 >> "CafeManagement-Windows\README.txt"
echo 5. Login with admin / admin123 >> "CafeManagement-Windows\README.txt"
echo. >> "CafeManagement-Windows\README.txt"
echo ## Default Database Configuration: >> "CafeManagement-Windows\README.txt"
echo Server: localhost >> "CafeManagement-Windows\README.txt"
echo Database: CafeManagement >> "CafeManagement-Windows\README.txt"
echo User: sa >> "CafeManagement-Windows\README.txt"
echo Password: YourPassword123! >> "CafeManagement-Windows\README.txt"
echo. >> "CafeManagement-Windows\README.txt"
echo For detailed setup instructions, see WINDOWS_BUILD_GUIDE.md >> "CafeManagement-Windows\README.txt"

REM Copy build guide
if exist "WINDOWS_BUILD_GUIDE.md" copy "WINDOWS_BUILD_GUIDE.md" "CafeManagement-Windows\"

echo.
echo ========================================
echo Build completed successfully!
echo ========================================
echo.
echo Package location: CafeManagement-Windows\
echo Executable: CafeManagement-Windows\cafe-management.exe
echo.
echo Next steps:
echo 1. Install SQL Server Express
echo 2. Configure database connection in .env file
echo 3. Run start.bat to launch the application
echo.
echo See WINDOWS_BUILD_GUIDE.md for detailed instructions.
echo.
pause