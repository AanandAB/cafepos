# Café Management System - Local Setup Guide

This guide will help you download and run the café management system on your desktop computer.

## What You'll Need

Before starting, make sure you have these installed on your computer:

1. **Node.js** (version 18 or newer)
   - Download from: https://nodejs.org/
   - Choose the "LTS" version (recommended)

2. **PostgreSQL Database** (version 12 or newer)
   - Download from: https://www.postgresql.org/download/
   - Remember the password you set during installation

3. **Git** (for downloading the code)
   - Download from: https://git-scm.com/downloads

## Step 1: Download the Code

1. Open your computer's terminal or command prompt
2. Navigate to where you want to store the project (like your Desktop)
3. Run this command to download the code:
   ```bash
   git clone [YOUR_REPLIT_GIT_URL]
   cd [PROJECT_FOLDER_NAME]
   ```

   *Note: Replace [YOUR_REPLIT_GIT_URL] with your actual Replit git URL*

## Step 2: Install Dependencies

1. In the terminal, make sure you're in the project folder
2. Install all required packages:
   ```bash
   npm install
   ```
   This will take a few minutes to download everything needed.

## Step 3: Set Up Your Database

1. **Start PostgreSQL** on your computer
   - On Windows: Use the PostgreSQL service or pgAdmin
   - On Mac: Use the PostgreSQL app or Homebrew
   - On Linux: Use systemctl or your package manager

2. **Create a new database**:
   - Open your PostgreSQL client (like pgAdmin or psql)
   - Create a new database called `cafe_management`

3. **Create your environment file**:
   - In your project folder, create a file called `.env`
   - Add this line (replace with your actual database details):
   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/cafe_management
   ```
   Replace:
   - `username` with your PostgreSQL username
   - `password` with your PostgreSQL password
   - `cafe_management` with your database name

## Step 4: Set Up the Database Tables

Run this command to create all the necessary tables:
```bash
npm run db:push
```

This will create all the tables needed for the café system.

## Step 5: Build the Application

Create the production files:
```bash
npm run build
```

## Step 6: Start the Application

Start the server:
```bash
npm run start
```

You should see a message saying the server is running on port 5000.

## Step 7: Open in Your Browser

1. Open your web browser
2. Go to: `http://localhost:5000`
3. You should see the café management system login page

## Default Login Details

- **Username**: admin
- **Password**: admin

## What's Included

Your café management system includes:

- **Point of Sale**: Take orders and process payments
- **Inventory Management**: Track stock levels and costs
- **Employee Management**: Clock in/out and shift tracking
- **Reports**: Sales, expenses, and profit analysis
- **Menu Management**: Add/edit menu items and categories
- **Table Management**: Track table occupancy
- **Expense Tracking**: Monitor all business expenses

## Troubleshooting

### Database Connection Issues
- Make sure PostgreSQL is running
- Check your DATABASE_URL in the `.env` file
- Verify your database exists and credentials are correct

### Port Already in Use
If port 5000 is busy, you can change it by adding this to your `.env` file:
```
PORT=3000
```

### Build Errors
- Make sure you have Node.js version 18 or newer
- Delete `node_modules` folder and run `npm install` again

### Can't Access the Website
- Make sure the server is running (you should see "serving on port 5000")
- Try `http://127.0.0.1:5000` instead of localhost
- Check your firewall settings

## Backup Your Data

To backup your data regularly:
1. Use PostgreSQL's backup tools (pg_dump)
2. Or use the built-in backup feature in the application

## Getting Updates

To get the latest updates from Replit:
```bash
git pull origin main
npm install
npm run db:push
npm run build
```

## Need Help?

If you run into issues:
1. Check that all prerequisites are installed correctly
2. Make sure your database is running
3. Verify your `.env` file has the correct database connection string
4. Check the terminal for error messages

The system is designed to work offline once set up, so you can run your café even without internet connection.