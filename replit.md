# Café Management System - Replit Guide

## Overview

This is a comprehensive Point of Sale (POS) and management system specifically designed for cafés, restaurants, and food service businesses. The application is built with modern web technologies and provides a full-featured solution for managing daily café operations including order processing, inventory management, employee tracking, and detailed reporting.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom café-themed design system
- **UI Components**: Radix UI primitives with shadcn/ui component library
- **State Management**: React Query (TanStack Query) for server state, React Context for application state
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod schema validation

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript throughout the full stack
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Passport.js with local strategy and session management
- **Session Storage**: Memory-based session store with express-session

### Build System
- **Bundler**: Vite for fast development and optimized production builds
- **Development**: Hot module replacement with TypeScript checking
- **Production**: Optimized builds with code splitting and asset optimization

## Key Components

### User Management & Authentication
- Role-based access control (Admin, Manager, Staff, Cashier)
- Session-based authentication with secure login/logout
- User profile management and permission handling
- Employee shift tracking and management

### Point of Sale System
- Real-time order processing with table management
- Menu item selection with category filtering
- Shopping cart functionality with item modifications
- Multiple payment methods (Cash, Card, UPI, Other)
- Invoice generation with GST compliance
- Table occupancy status tracking

### Inventory Management
- Stock quantity tracking for menu items
- Low stock alerts and thresholds
- Inventory item management with units and costs
- Automatic stock updates when orders are processed

### Reporting & Analytics
- Daily, weekly, and monthly sales reports
- Tax reporting (CGST, SGST, IGST) for Indian GST compliance
- Popular items analysis and profit tracking
- Employee performance and shift reports
- Predictive analytics with TensorFlow.js integration

### Data Management
- PostgreSQL database with comprehensive schema
- Automated backup and CSV export functionality
- Data synchronization and real-time updates
- Google Drive integration for cloud backups

## Data Flow

### Order Processing Flow
1. User selects table or chooses takeaway option
2. Menu items are added to cart with quantity and modifications
3. Order summary calculates subtotal, taxes, and total
4. Payment processing with method selection
5. Order is saved to database with invoice generation
6. Table status is updated and inventory is decremented
7. Receipt generation and optional printing

### Inventory Flow
1. Menu items have stock quantities tracked in real-time
2. When orders are placed, stock is automatically decremented
3. Low stock alerts trigger when thresholds are reached
4. Inventory reports show usage patterns and recommendations

### Authentication Flow
1. Users log in with username/password credentials
2. Session is created and stored server-side
3. Role-based permissions control feature access
4. Employee shifts are tracked with clock-in/clock-out functionality

## External Dependencies

### Core Dependencies
- **Database**: PostgreSQL for data persistence
- **UI Framework**: React with TypeScript
- **Styling**: Tailwind CSS with Radix UI components
- **State Management**: TanStack React Query
- **Authentication**: Passport.js with session management
- **Charts**: Recharts for data visualization
- **PDF Generation**: Browser-based PDF generation for reports
- **ML/Analytics**: TensorFlow.js for predictive analytics

### Development Dependencies
- **Build Tool**: Vite with TypeScript support
- **Database Migrations**: Drizzle Kit for schema management
- **Code Quality**: ESLint and TypeScript compiler
- **Testing**: Built-in browser testing capabilities

## Deployment Strategy

### Production Environment
- **Platform**: Replit deployment with autoscale configuration
- **Database**: PostgreSQL with connection pooling
- **Build Process**: Vite production build with optimizations
- **Port Configuration**: Port 5000 (internal) mapped to port 80 (external)
- **Environment Variables**: DATABASE_URL for database connection

### Development Workflow
- **Development Server**: `npm run dev` starts both frontend and backend
- **Database Setup**: `npm run db:push` applies schema changes
- **Build Process**: `npm run build` creates production-ready assets
- **Start Production**: `npm run start` runs the production server

### Scaling Considerations
- Session storage can be moved to Redis for multi-instance deployments
- Database connection pooling is configured for high availability
- Static assets are served efficiently through Vite's production build
- Real-time updates use polling rather than WebSockets for simplicity

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- June 14, 2025: Created comprehensive deployment guide for local desktop setup
- June 13, 2025: Successfully migrated from Replit Agent to Replit environment
- Enhanced inventory management with automatic expense tracking for purchases and restocking
- Fixed shift history functionality and inventory expense tracking
- Database schema applied and initialized with default data
- All core functionality verified working: authentication, POS, inventory, reporting, employee shifts

## Changelog

Changelog:
- June 13, 2025. Initial setup and migration completed