# Café Management System - Complete Setup Guide

## Table of Contents
1. [System Requirements](#system-requirements)
2. [Hardware Setup](#hardware-setup)
3. [User Creation and Role Assignment](#user-creation-and-role-assignment)
4. [Initial Configuration](#initial-configuration)
5. [Training Guide](#training-guide)
6. [Daily Operations Workflow](#daily-operations-workflow)
7. [Troubleshooting](#troubleshooting)
8. [Maintenance Schedule](#maintenance-schedule)

## System Requirements

### Minimum Hardware Requirements
- **Point of Sale Device**: Tablet or laptop with minimum 4GB RAM
- **Internet Connection**: Stable broadband (minimum 10 Mbps)
- **Backup Device**: Secondary tablet or phone for redundancy
- **Receipt Printer**: USB or Bluetooth thermal printer (optional)
- **Cash Drawer**: Electronic cash drawer connected to POS system

### Software Requirements
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Stable internet connection for cloud deployment
- Local WiFi network for devices

## Hardware Setup

### Device Configuration
1. **Manager Station** (Primary POS)
   - Desktop computer or high-end tablet
   - Large screen (minimum 13 inches recommended)
   - Full access to all system features

2. **Staff Stations** (3 devices)
   - Tablets (10-12 inches recommended)
   - Wall-mounted or counter stands
   - Access to order taking and basic functions

3. **Network Setup**
   - Dedicated WiFi network for POS devices
   - Guest WiFi separate from POS network
   - Backup internet connection (mobile hotspot)

## User Creation and Role Assignment

### Step-by-Step User Setup

#### 1. Manager Account Setup
**User: Sarah Johnson (Manager)**
```
Role: Manager
Username: sarah.manager
Password: [Secure password - minimum 8 characters]
Permissions:
- Full system access
- User management
- Financial reports
- Inventory management
- Menu modifications
- System settings
```

#### 2. Staff Account Creation
**Staff Member 1: Mike Chen (Senior Staff)**
```
Role: Staff
Username: mike.staff
Password: [Secure password]
Permissions:
- Order management
- Table management
- Basic inventory view
- Shift management
- Customer service
```

**Staff Member 2: Emma Rodriguez (Staff)**
```
Role: Staff
Username: emma.staff
Password: [Secure password]
Permissions:
- Order taking
- Payment processing
- Table status updates
- Menu browsing
- Basic reporting
```

**Staff Member 3: James Kumar (Part-time Staff)**
```
Role: Staff
Username: james.staff
Password: [Secure password]
Permissions:
- Order taking
- Basic menu access
- Table management
- Customer service
- Limited reporting
```

### Creating Users in the System

1. **Login as Admin**
   - Username: `admin`
   - Password: `admin123`

2. **Navigate to User Management**
   - Go to Settings → User Management
   - Click "Add New User"

3. **Create Manager Account**
   ```
   Full Name: Sarah Johnson
   Username: sarah.manager
   Role: Manager
   Password: [Set secure password]
   Active: Yes
   ```

4. **Create Staff Accounts** (Repeat for each staff member)
   ```
   Full Name: Mike Chen
   Username: mike.staff
   Role: Staff
   Password: [Set secure password]
   Active: Yes
   ```

## Initial Configuration

### 1. Business Information Setup
Navigate to Settings → Business Information:

```
Business Name: [Your Café Name]
Address: [Complete café address]
Phone: [Café phone number]
Email: [Café email address]
GST Number: [If applicable]
Operating Hours: [Daily operating schedule]
```

### 2. Menu Configuration

#### Categories Setup
Create main menu categories:
1. **Hot Beverages** - Coffee, tea, hot chocolate
2. **Cold Beverages** - Iced drinks, smoothies, sodas
3. **Light Meals** - Sandwiches, salads, wraps
4. **Desserts** - Pastries, cakes, cookies
5. **Snacks** - Quick bites, chips, nuts

#### Sample Menu Items with Pricing
```
Hot Beverages:
- Espresso: $2.50
- Americano: $3.00
- Cappuccino: $3.50
- Latte: $4.00
- Mocha: $4.50

Cold Beverages:
- Iced Coffee: $3.50
- Cold Brew: $4.00
- Smoothie: $5.00
- Iced Tea: $2.50

Light Meals:
- Chicken Sandwich: $8.00
- Caesar Salad: $7.50
- Veggie Wrap: $6.50

Desserts:
- Chocolate Brownie: $3.50
- Cheesecake Slice: $4.50
- Muffin: $2.50
```

### 3. Table Configuration
Set up tables according to café layout:
```
Table T1: Capacity 2, Window seat
Table T2: Capacity 2, Corner table
Table T3: Capacity 4, Center table
Table T4: Capacity 4, Patio table
Table T5: Capacity 6, Group table
Table T6: Capacity 2, Counter seating
```

### 4. Inventory Setup
Initial inventory items:
```
Coffee Beans: 10 kg, Alert at 2 kg
Tea Leaves: 5 kg, Alert at 1 kg
Milk: 50 liters, Alert at 10 liters
Sugar: 20 kg, Alert at 5 kg
Bread: 20 loaves, Alert at 5 loaves
Chicken: 10 kg, Alert at 2 kg
Vegetables: 15 kg, Alert at 3 kg
```

### 5. Tax Configuration
```
CGST Rate: 2.5%
SGST Rate: 2.5%
IGST Rate: 5%
Service Tax: 10% (if applicable)
```

## Training Guide

### Manager Training (Sarah Johnson)

#### Week 1: System Overview
- **Day 1-2**: Basic navigation and user interface
- **Day 3-4**: Order management and payment processing
- **Day 5**: Inventory management and stock tracking

#### Week 2: Advanced Features
- **Day 1-2**: Report generation and analysis
- **Day 3-4**: User management and staff scheduling
- **Day 5**: System maintenance and backup procedures

### Staff Training (Mike, Emma, James)

#### Day 1: Basic Operations
- Login and logout procedures
- Taking customer orders
- Adding items to orders
- Processing payments

#### Day 2: Table Management
- Assigning orders to tables
- Updating table status
- Managing multiple orders

#### Day 3: Customer Service
- Handling order modifications
- Processing refunds
- Managing customer complaints

#### Day 4: Inventory Basics
- Checking stock levels
- Understanding low stock alerts
- Basic inventory updates

#### Day 5: Shift Management
- Clock in/out procedures
- Shift handover process
- End-of-shift procedures

## Daily Operations Workflow

### Opening Procedures (Manager - Sarah)
1. **System Startup** (8:00 AM)
   - Turn on all devices
   - Login to management dashboard
   - Check system status and updates

2. **Daily Setup** (8:15 AM)
   - Review yesterday's sales report
   - Check inventory levels
   - Verify menu item availability
   - Update any menu changes or specials

3. **Staff Preparation** (8:30 AM)
   - Brief staff on daily specials
   - Assign roles and stations
   - Review any system updates

### Shift Operations (All Staff)

#### Opening Shift (Mike - 9:00 AM - 3:00 PM)
- Clock in using staff login
- Check table status and clean setup
- Review menu and daily specials
- Handle morning rush orders
- Monitor inventory during busy periods
- Process customer payments
- Clock out and handover to next shift

#### Afternoon Shift (Emma - 3:00 PM - 9:00 PM)
- Clock in and receive handover from Mike
- Check afternoon inventory levels
- Handle lunch and dinner orders
- Process group bookings
- Update table occupancy
- Handle evening closure prep
- Clock out and update daily summary

#### Part-time Coverage (James - Peak hours/Weekends)
- Clock in for assigned shifts
- Focus on order taking and customer service
- Assist with payment processing
- Support main staff during busy periods
- Clock out with shift summary

### Closing Procedures (Manager - Sarah)
1. **Daily Reconciliation** (9:30 PM)
   - Review total sales for the day
   - Reconcile cash and card payments
   - Check for any order discrepancies

2. **Inventory Check** (9:45 PM)
   - Update stock levels
   - Note items running low
   - Plan for next day's supplies

3. **System Backup** (10:00 PM)
   - Create daily backup
   - Review staff hours
   - Generate daily report

4. **Security** (10:15 PM)
   - Logout all staff accounts
   - Secure POS devices
   - Enable overnight backup

## Staff Responsibilities Matrix

| Task | Sarah (Manager) | Mike (Senior) | Emma (Staff) | James (Part-time) |
|------|----------------|---------------|--------------|-------------------|
| System Administration | ✓ | - | - | - |
| User Management | ✓ | - | - | - |
| Financial Reports | ✓ | View Only | View Only | - |
| Menu Management | ✓ | Suggest | Suggest | - |
| Inventory Management | ✓ | Update | Update | View Only |
| Order Processing | ✓ | ✓ | ✓ | ✓ |
| Payment Processing | ✓ | ✓ | ✓ | ✓ |
| Table Management | ✓ | ✓ | ✓ | ✓ |
| Customer Service | ✓ | ✓ | ✓ | ✓ |
| Shift Management | ✓ | ✓ | ✓ | ✓ |
| System Backup | ✓ | - | - | - |
| Staff Scheduling | ✓ | Input | Input | Input |

## Emergency Procedures

### System Downtime
1. **Immediate Actions**
   - Switch to backup device
   - Use mobile hotspot if internet fails
   - Continue operations with manual backup

2. **Manual Backup Process**
   - Record orders on paper
   - Use calculator for totals
   - Input data when system restored

### Staff Absence
- **Manager Absent**: Mike takes temporary management role
- **Staff Absent**: Remaining staff cover with manager support
- **Multiple Absent**: Contact part-time staff or manager covers

## Monthly Maintenance

### Week 1: System Health Check
- Review system performance
- Check all device functionality
- Update software if needed
- Clean and maintain hardware

### Week 2: User Account Review
- Review staff access levels
- Update passwords if needed
- Check for inactive accounts
- Audit user activities

### Week 3: Data Analysis
- Generate monthly sales reports
- Analyze popular menu items
- Review inventory turnover
- Assess staff performance metrics

### Week 4: System Optimization
- Archive old data
- Optimize database performance
- Plan for system improvements
- Staff feedback collection

## Troubleshooting Common Issues

### Login Problems
```
Issue: Staff cannot login
Solution: 
1. Verify username/password
2. Check caps lock
3. Reset password via manager
4. Check user account status
```

### Payment Processing Issues
```
Issue: Payment fails to process
Solution:
1. Check internet connection
2. Verify payment method
3. Try alternative payment option
4. Contact payment processor
```

### Inventory Discrepancies
```
Issue: Stock levels don't match physical count
Solution:
1. Perform manual inventory count
2. Update system quantities
3. Investigate usage patterns
4. Implement better tracking
```

### System Performance Issues
```
Issue: System running slowly
Solution:
1. Close unnecessary browser tabs
2. Restart device
3. Check internet speed
4. Clear browser cache
```

## Success Metrics

### Daily Targets
- Order processing time: < 3 minutes per order
- Payment processing: < 30 seconds
- Table turnover: 45 minutes average
- Customer satisfaction: > 90%

### Weekly Goals
- Sales targets based on historical data
- Inventory waste: < 5%
- Staff efficiency: All tasks completed on time
- System uptime: > 99%

### Monthly Objectives
- Revenue growth: Track month-over-month
- Cost optimization: Reduce waste and inefficiencies
- Staff performance: Meet training milestones
- Customer retention: Regular customer percentage

## Contact Information

### Support Contacts
- **System Administrator**: [Your contact]
- **Technical Support**: [Support number]
- **Manager Emergency**: Sarah Johnson [Phone]
- **Backup Manager**: Mike Chen [Phone]

### Vendor Contacts
- **Internet Provider**: [ISP contact]
- **Payment Processor**: [Payment support]
- **Hardware Supplier**: [Hardware support]
- **Software Support**: [Software support]

This setup guide provides a complete framework for implementing your café management system with proper role assignments, training procedures, and operational workflows tailored for your specific team structure.