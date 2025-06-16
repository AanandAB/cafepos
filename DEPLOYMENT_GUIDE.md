# Cafe Management System - Desktop Deployment Guide

## Prerequisites

Before deploying this application, ensure you have:

1. **Node.js** (version 18 or higher)
   - Download from: https://nodejs.org/
   - Choose the LTS (Long Term Support) version
   - During installation, make sure to check "Add to PATH"

2. **PostgreSQL Database** (version 12 or higher)
   - Download from: https://www.postgresql.org/download/
   - Remember the username and password you set during installation
   - Note the port number (default is 5432)

## Installation Steps

### 1. Download and Extract
- Extract the application files to a folder (e.g., `C:\CafeManagement` on Windows)

### 2. Database Setup
- Open PostgreSQL command line or pgAdmin
- Create a new database for the cafe system:
  ```sql
  CREATE DATABASE cafe_management;
  ```

### 3. Environment Configuration
- Create a file named `.env` in the root folder
- Add the following content (replace with your database details):
  ```
  DATABASE_URL=postgresql://username:password@localhost:5432/cafe_management
  PGHOST=localhost
  PGPORT=5432
  PGDATABASE=cafe_management
  PGUSER=your_username
  PGPASSWORD=your_password
  ```

### 4. Installation and First Run

#### For Windows:
- Double-click `start-windows.bat`
- The script will automatically:
  - Install dependencies
  - Build the application
  - Start the server

#### For Mac/Linux:
- Open Terminal in the application folder
- Run: `./start-unix.sh`
- If permission denied, run: `chmod +x start-unix.sh` then `./start-unix.sh`

### 5. Access the Application
- Open your web browser
- Go to: `http://localhost:5000`
- Login with default credentials:
  - Username: `admin`
  - Password: `admin123`

## Manual Installation (Alternative)

If the startup scripts don't work, follow these manual steps:

1. Open Command Prompt/Terminal in the application folder
2. Install dependencies:
   ```
   npm install
   ```
3. Build the application:
   ```
   npm run build
   ```
4. Start the application:
   - Windows: `npm run start:windows`
   - Mac/Linux: `npm run start:unix`

## Daily Operations

### Starting the Application
- Simply run `start-windows.bat` (Windows) or `./start-unix.sh` (Mac/Linux)
- The application will be available at `http://localhost:5000`

### Stopping the Application
- Press `Ctrl+C` in the command window
- Close the command window

### Backup Data
- The application includes automatic backup features
- Access backup options through the admin panel
- Regular backups are recommended

### Updating the System
- Replace application files with new version
- Run the startup script to apply updates
- Database will be automatically updated

## Troubleshooting

### Common Issues

1. **"Node.js not found"**
   - Install Node.js from nodejs.org
   - Restart command prompt after installation

2. **"Database connection failed"**
   - Check PostgreSQL is running
   - Verify database credentials in `.env` file
   - Ensure database exists

3. **"Port 5000 already in use"**
   - Close other applications using port 5000
   - Or modify port in `server/index.ts`

4. **"Permission denied" (Mac/Linux)**
   - Run: `chmod +x start-unix.sh`

### Getting Help
- Check the application logs in the command window
- Contact support with error messages for assistance

## Security Notes

- Change default admin password immediately after first login
- Keep the application updated
- Regular database backups are essential
- Restrict network access if needed (firewall settings)

## System Requirements

- **RAM**: Minimum 4GB, Recommended 8GB
- **Storage**: 500MB free space
- **Network**: Local network access for multiple users
- **OS**: Windows 10+, macOS 10.14+, or Linux Ubuntu 18.04+

## Network Access (Multiple Computers)

To access from other computers on the same network:

1. Find the server computer's IP address
2. On other computers, go to: `http://[SERVER_IP]:5000`
3. Ensure firewall allows port 5000
4. All computers must be on the same network

Example: If server IP is 192.168.1.100, access via `http://192.168.1.100:5000`