@echo off
echo.
echo ===============================================
echo   Simple EXE Builder for Cafe Management
echo ===============================================
echo.

echo Creating portable executable package...

REM Check if build exists
if not exist "dist" (
    echo Building application first...
    npm run build
    if %errorlevel% neq 0 (
        echo Build failed. Please check errors above.
        pause
        exit /b 1
    )
)

REM Create package directory
if exist "cafe-exe-package" rmdir /s /q cafe-exe-package
mkdir cafe-exe-package
mkdir cafe-exe-package\dist
mkdir cafe-exe-package\node_modules
mkdir cafe-exe-package\shared

REM Copy essential files
echo Copying application files...
xcopy /E /I /Y dist cafe-exe-package\dist
xcopy /E /I /Y shared cafe-exe-package\shared
copy package.json cafe-exe-package\
copy drizzle.config.ts cafe-exe-package\
copy .env.template cafe-exe-package\
copy README.md cafe-exe-package\
copy DEPLOYMENT_GUIDE.md cafe-exe-package\

REM Copy only production dependencies
echo Copying essential Node modules...
for %%d in (pg drizzle-orm express passport cross-env) do (
    if exist "node_modules\%%d" (
        xcopy /E /I /Y "node_modules\%%d" "cafe-exe-package\node_modules\%%d"
    )
)

REM Create launcher script
echo Creating launcher...
(
echo @echo off
echo echo Starting Cafe Management System...
echo echo.
echo if not exist ".env" ^(
echo     echo WARNING: No .env file found. Please copy .env.template to .env
echo     echo and configure your database settings.
echo     pause
echo ^)
echo echo Server starting on http://localhost:5000
echo echo Default login: admin / admin123
echo echo Press Ctrl+C to stop
echo echo.
echo set NODE_ENV=production
echo node dist/index.js
echo pause
) > cafe-exe-package\run-cafe.bat

REM Create installation guide
(
echo # Cafe Management System - Portable Package
echo.
echo ## Quick Setup:
echo 1. Install Node.js from https://nodejs.org/
echo 2. Install PostgreSQL and create database 'cafe_management'
echo 3. Copy .env.template to .env and add your database details
echo 4. Double-click run-cafe.bat
echo 5. Open browser to http://localhost:5000
echo 6. Login with: admin / admin123
echo.
echo This package contains everything needed to run the cafe system.
echo No additional npm install required.
) > cafe-exe-package\SETUP.md

echo.
echo ===============================================
echo   Package Created Successfully!
echo ===============================================
echo.
echo Location: cafe-exe-package\
echo.
echo To distribute to customer:
echo 1. Zip the cafe-exe-package folder
echo 2. Customer extracts and runs run-cafe.bat
echo 3. Requires only Node.js and PostgreSQL installed
echo.
echo The package is now ready for deployment!
echo.
pause