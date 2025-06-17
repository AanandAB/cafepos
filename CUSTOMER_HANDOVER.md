# Cafe Management System - Customer Handover Package

## What You're Getting

A complete cafe management system that handles:
- Point of sale operations
- Inventory tracking
- Employee shift management
- Financial reporting
- Menu and table management

## Windows Installation (Your Primary Method)

1. **Install Prerequisites**
   - Download Node.js from https://nodejs.org/ (choose LTS version)
   - Download PostgreSQL from https://www.postgresql.org/download/
   - During Node.js installation, ensure "Add to PATH" is checked

2. **Database Setup**
   - Open PostgreSQL (pgAdmin or command line)
   - Create a new database: `CREATE DATABASE cafe_management;`
   - Note your username, password, and port (usually 5432)

3. **Configure Environment**
   - Copy `.env.template` to `.env`
   - Edit `.env` with your database details:
     ```
     DATABASE_URL=postgresql://your_username:your_password@localhost:5432/cafe_management
     PGUSER=your_username
     PGPASSWORD=your_password
     ```

4. **Start Application**
   - Double-click `start-windows.bat`
   - Wait for installation and build (first time only)
   - Open browser to http://localhost:5000
   - Login: admin / admin123

## Daily Operation

- Start: Double-click `start-windows.bat`
- Stop: Press Ctrl+C in the command window
- Access: http://localhost:5000

## Multi-Computer Setup

To use on multiple computers in your cafe:

1. Find the main computer's IP address
2. On other computers: http://[MAIN_COMPUTER_IP]:5000
3. Ensure all computers are on same network
4. Configure Windows Firewall to allow port 5000

## Security Checklist

- [ ] Change admin password immediately after first login
- [ ] Create user accounts for each employee with appropriate roles
- [ ] Set up regular database backups
- [ ] Restrict network access if needed

## Troubleshooting

**"Node.js not found"**: Install Node.js and restart command prompt
**"Database connection failed"**: Check PostgreSQL is running and .env file is correct
**"Port already in use"**: Close other applications using port 5000

## Support Files Included

- `start-windows.bat` - Main startup script
- `start-unix.sh` - For Mac/Linux (if needed)
- `DEPLOYMENT_GUIDE.md` - Detailed technical instructions
- `README.md` - System overview
- `.env.template` - Environment configuration template

## Default System Data

The system comes pre-configured with:
- Admin user (username: admin, password: admin123)
- Sample menu categories and items
- Default table layout
- Basic inventory items

Change these to match your cafe after installation.

## Backup and Updates

- Use the backup feature in the admin panel regularly
- Keep your .env file safe - it contains your database credentials
- For updates, replace files and run start-windows.bat again

This system will handle all your cafe operations reliably. The Windows batch script makes it easy to start daily.