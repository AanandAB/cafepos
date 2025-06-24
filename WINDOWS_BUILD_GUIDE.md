# Windows Build and Deployment Guide

This guide provides comprehensive instructions for building, packaging, and deploying the Cafe Management System on Windows environments using SQL Server.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [SQL Server Setup](#sql-server-setup)
3. [Application Setup](#application-setup)
4. [Building for Production](#building-for-production)
5. [Creating Windows Installer](#creating-windows-installer)
6. [Deployment Options](#deployment-options)
7. [Troubleshooting](#troubleshooting)

## Prerequisites

### Software Requirements
- **Windows 10/11** or **Windows Server 2016+**
- **Node.js 18+** (Download from [nodejs.org](https://nodejs.org))
- **SQL Server 2019+** or **SQL Server Express** (Free version)
- **Git** (Optional, for version control)

### Hardware Requirements
- **RAM**: Minimum 8GB, Recommended 16GB+
- **Storage**: 2GB free space for application + SQL Server space
- **CPU**: Dual-core processor (Quad-core recommended)

## SQL Server Setup

### Option 1: SQL Server Express (Free)

1. **Download SQL Server Express**
   ```
   https://www.microsoft.com/en-us/sql-server/sql-server-downloads
   ```

2. **Install with Mixed Mode Authentication**
   - Choose "Mixed Mode" during installation
   - Set a strong SA password (e.g., `YourStrongPassword123!`)
   - Enable TCP/IP protocol

3. **Enable SQL Server Browser Service**
   ```
   - Open Services (services.msc)
   - Find "SQL Server Browser"
   - Set to "Automatic" and Start
   ```

4. **Configure SQL Server for Remote Access**
   ```
   - Open SQL Server Configuration Manager
   - Enable TCP/IP in "SQL Server Network Configuration"
   - Set TCP Port to 1433
   - Restart SQL Server service
   ```

### Option 2: Full SQL Server

Follow Microsoft's official installation guide for SQL Server Developer/Standard edition.

### Create Database

1. **Connect using SQL Server Management Studio (SSMS)**
2. **Create the database**:
   ```sql
   CREATE DATABASE CafeManagement;
   ```

## Application Setup

### 1. Environment Configuration

Create a `.env` file in the project root:

```env
# SQL Server Configuration
DB_USER=sa
DB_PASSWORD=YourStrongPassword123!
DB_SERVER=localhost
DB_NAME=CafeManagement
DB_ENCRYPT=false
DB_TRUST_CERT=true

# Application Configuration
NODE_ENV=production
SESSION_SECRET=your-super-secret-session-key-here
PORT=5000
```

### 2. Install Dependencies

```bash
# Install Node.js dependencies
npm install

# Install additional Windows-specific dependencies
npm install --global windows-build-tools
```

### 3. Database Initialization

The application will automatically create tables on first run. To manually initialize:

```bash
npm run db:setup
```

## Building for Production

### 1. Build the Application

```bash
# Build frontend and backend
npm run build

# Verify build completed successfully
dir dist
```

### 2. Test Production Build

```bash
# Start production server
npm start

# Test at http://localhost:5000
```

### 3. Create Standalone Executable

#### Option A: Using PKG (Recommended)

```bash
# Install pkg globally
npm install -g pkg

# Create Windows executable
pkg package.json --targets node18-win-x64 --output cafe-management.exe

# Include assets
mkdir cafe-management-app
copy cafe-management.exe cafe-management-app\
xcopy dist cafe-management-app\dist\ /E /I
xcopy client cafe-management-app\client\ /E /I
copy .env.example cafe-management-app\.env
```

#### Option B: Using Electron

```bash
# Build Electron app
npm run build:electron

# Package for Windows
npm run package:win
```

### 4. Create Distribution Package

```batch
@echo off
echo Creating Cafe Management System Distribution...

mkdir "CafeManagement-Windows"
cd "CafeManagement-Windows"

REM Copy application files
copy "..\cafe-management.exe" .
xcopy "..\dist" "dist\" /E /I
xcopy "..\client" "client\" /E /I
copy "..\package.json" .
copy "..\.env.example" ".env"

REM Create startup scripts
echo @echo off > start.bat
echo echo Starting Cafe Management System... >> start.bat
echo cafe-management.exe >> start.bat
echo pause >> start.bat

REM Create configuration file
echo # Cafe Management System Configuration > config.txt
echo # Edit the .env file to configure database connection >> config.txt
echo # Default login: admin / admin123 >> config.txt

echo Distribution package created successfully!
pause
```

## Creating Windows Installer

### Using NSIS (Nullsoft Scriptable Install System)

1. **Install NSIS**
   Download from [nsis.sourceforge.io](https://nsis.sourceforge.io)

2. **Create installer script (`installer.nsi`)**:

```nsis
!define APP_NAME "Cafe Management System"
!define COMP_NAME "YourCompany"
!define VERSION "1.0.0"
!define DESCRIPTION "Complete POS and Management System for Cafes"
!define INSTALLER_NAME "CafeManagementSetup.exe"
!define MAIN_APP_EXE "cafe-management.exe"
!define INSTALL_TYPE "SetShellVarContext all"
!define REG_ROOT "HKLM"
!define REG_APP_PATH "Software\Microsoft\Windows\CurrentVersion\App Paths\${MAIN_APP_EXE}"
!define UNINSTALL_PATH "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}"

Name "${APP_NAME}"
Caption "${APP_NAME}"
OutFile "${INSTALLER_NAME}"
BrandingText "${APP_NAME}"
XPStyle on
InstallDirRegKey "${REG_ROOT}" "${REG_APP_PATH}" ""
InstallDir "$PROGRAMFILES\${APP_NAME}"

Page components
Page directory
Page instfiles

UninstPage uninstConfirm
UninstPage instfiles

Section -MainProgram
  ${INSTALL_TYPE}
  SetOverwrite ifnewer
  SetOutPath "$INSTDIR"
  
  File "cafe-management.exe"
  File /r "dist"
  File /r "client"
  File ".env"
  File "package.json"
  
  WriteRegStr ${REG_ROOT} "${REG_APP_PATH}" "" "$INSTDIR\${MAIN_APP_EXE}"
  WriteRegStr ${REG_ROOT} "${UNINSTALL_PATH}" "DisplayName" "${APP_NAME}"
  WriteRegStr ${REG_ROOT} "${UNINSTALL_PATH}" "UninstallString" "$INSTDIR\uninstall.exe"
  WriteRegStr ${REG_ROOT} "${UNINSTALL_PATH}" "DisplayIcon" "$INSTDIR\${MAIN_APP_EXE}"
  WriteRegStr ${REG_ROOT} "${UNINSTALL_PATH}" "DisplayVersion" "${VERSION}"
  
  WriteUninstaller "$INSTDIR\uninstall.exe"
SectionEnd

Section "Desktop Shortcut" SEC_DESKTOP
  CreateShortCut "$DESKTOP\${APP_NAME}.lnk" "$INSTDIR\${MAIN_APP_EXE}"
SectionEnd

Section "Start Menu Shortcuts" SEC_START_MENU
  CreateDirectory "$SMPROGRAMS\${APP_NAME}"
  CreateShortCut "$SMPROGRAMS\${APP_NAME}\${APP_NAME}.lnk" "$INSTDIR\${MAIN_APP_EXE}"
  CreateShortCut "$SMPROGRAMS\${APP_NAME}\Uninstall.lnk" "$INSTDIR\uninstall.exe"
SectionEnd

Section Uninstall
  ${INSTALL_TYPE}
  Delete "$INSTDIR\${MAIN_APP_EXE}"
  Delete "$INSTDIR\uninstall.exe"
  
  RmDir /r "$INSTDIR\dist"
  RmDir /r "$INSTDIR\client"
  RmDir "$INSTDIR"
  
  Delete "$DESKTOP\${APP_NAME}.lnk"
  Delete "$SMPROGRAMS\${APP_NAME}\*.*"
  RmDir "$SMPROGRAMS\${APP_NAME}"
  
  DeleteRegKey ${REG_ROOT} "${UNINSTALL_PATH}"
  DeleteRegKey ${REG_ROOT} "${REG_APP_PATH}"
SectionEnd
```

3. **Build installer**:
   ```bash
   makensis installer.nsi
   ```

## Deployment Options

### Option 1: Standalone Desktop Application

**Best for**: Single location, offline usage

1. Copy the built application to target machine
2. Install SQL Server Express locally
3. Configure `.env` file
4. Run the application

### Option 2: Client-Server Setup

**Best for**: Multiple terminals, central database

1. **Server Machine**:
   - Install SQL Server
   - Deploy application as Windows Service
   - Configure firewall (port 5000)

2. **Client Machines**:
   - Access via web browser: `http://server-ip:5000`
   - No installation required

### Option 3: Windows Service Deployment

Create a Windows Service using `node-windows`:

```bash
# Install node-windows
npm install -g node-windows

# Create service installer
node create-service.js
```

**create-service.js**:
```javascript
const Service = require('node-windows').Service;

const svc = new Service({
  name: 'Cafe Management System',
  description: 'Cafe POS and Management System',
  script: 'C:\\path\\to\\cafe-management\\dist\\index.js'
});

svc.on('install', () => {
  svc.start();
});

svc.install();
```

## Database Backup and Maintenance

### Automated Backup Script

Create `backup.bat`:

```batch
@echo off
set BACKUP_DIR=C:\CafeBackups
set DATE=%DATE:~10,4%-%DATE:~4,2%-%DATE:~7,2%
set TIME=%TIME:~0,2%-%TIME:~3,2%-%TIME:~6,2%

if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

sqlcmd -S localhost -d CafeManagement -Q "BACKUP DATABASE CafeManagement TO DISK='%BACKUP_DIR%\CafeManagement_%DATE%_%TIME%.bak'"

echo Database backup completed: %BACKUP_DIR%\CafeManagement_%DATE%_%TIME%.bak
pause
```

## Security Considerations

### 1. Database Security
- Use strong SA password
- Create dedicated database user for application
- Enable Windows Authentication when possible
- Regular security updates

### 2. Application Security
- Change default admin password immediately
- Use HTTPS in production (configure reverse proxy)
- Regular application updates
- Firewall configuration

### 3. Network Security
```
Firewall Rules:
- Allow inbound: Port 5000 (HTTP)
- Allow inbound: Port 1433 (SQL Server) - only from trusted IPs
- Block all other unnecessary ports
```

## Troubleshooting

### Common Issues

1. **"Cannot connect to SQL Server"**
   ```
   - Check SQL Server is running
   - Verify TCP/IP is enabled
   - Check firewall settings
   - Verify connection string in .env
   ```

2. **"Port 5000 already in use"**
   ```
   - Change PORT in .env file
   - Or stop conflicting service:
     netstat -ano | findstr :5000
     taskkill /PID <process_id> /F
   ```

3. **"Module not found errors"**
   ```
   - Reinstall dependencies: npm install
   - Clear npm cache: npm cache clean --force
   - Delete node_modules and reinstall
   ```

4. **Performance Issues**
   ```
   - Monitor SQL Server performance
   - Check available RAM and CPU
   - Review database indexes
   - Consider SSD storage
   ```

### Log Files

- **Application Logs**: `logs/application.log`
- **SQL Server Logs**: SQL Server Management Studio → Management → SQL Server Logs
- **Windows Event Logs**: Event Viewer → Windows Logs → Application

### Support Commands

```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Test SQL Server connection
sqlcmd -S localhost -U sa -P YourPassword123!

# Check running processes
tasklist | findstr node

# Check network connections
netstat -an | findstr 5000
```

## Performance Optimization

### 1. Database Optimization
```sql
-- Create indexes for better performance
CREATE INDEX IX_orders_created_at ON orders(created_at);
CREATE INDEX IX_order_items_order_id ON order_items(order_id);
CREATE INDEX IX_menu_items_category_id ON menu_items(category_id);
```

### 2. Application Optimization
- Enable gzip compression
- Implement caching strategies
- Optimize database queries
- Use connection pooling

### 3. System Optimization
- Allocate sufficient RAM to SQL Server
- Use SSD storage for database files
- Regular database maintenance (reindex, update statistics)
- Monitor system resources

## Conclusion

This guide provides comprehensive instructions for deploying the Cafe Management System on Windows with SQL Server. For additional support or customization requirements, refer to the application documentation or contact support.

Remember to:
- Test thoroughly before production deployment
- Implement regular backup procedures
- Keep system and application updated
- Monitor performance and logs regularly