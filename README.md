# Cafe Management System

A comprehensive cafe management application with inventory tracking, order management, employee shifts, and financial reporting.

## Features

- **User Management**: Role-based access control (Admin, Manager, Staff, Cashier)
- **Menu Management**: Categories, items, pricing, and stock tracking
- **Order Processing**: Point-of-sale system with table management
- **Inventory Control**: Stock tracking with low-stock alerts
- **Employee Management**: Shift tracking and payroll integration
- **Financial Reports**: Daily sales, expenses, and profit analysis
- **Backup System**: Data export/import functionality

## Quick Start

### Windows
1. Double-click `start-windows.bat`
2. Open browser to `http://localhost:5000`
3. Login with: admin / admin123

### Mac/Linux
1. Run `./start-unix.sh`
2. Open browser to `http://localhost:5000`
3. Login with: admin / admin123

## System Requirements

- Node.js 18+ 
- PostgreSQL 12+
- 4GB RAM minimum
- 500MB storage space

## Default Login

- **Username**: admin
- **Password**: admin123

*Change the default password immediately after first login*

## Support

For detailed installation and troubleshooting, see `DEPLOYMENT_GUIDE.md`

## Technology Stack

- Frontend: React, TypeScript, Tailwind CSS
- Backend: Node.js, Express, PostgreSQL
- Database: Drizzle ORM with PostgreSQL
- Authentication: Passport.js with sessions