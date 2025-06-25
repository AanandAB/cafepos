#!/usr/bin/env python3
"""
Cafe Management System - Auto Installer
Automated setup for the complete cafe management system
"""

import os
import sys
import subprocess
import platform
import json
from pathlib import Path

def print_header():
    print("=" * 50)
    print("   CAFE MANAGEMENT SYSTEM INSTALLER")
    print("=" * 50)
    print()

def check_node():
    """Check if Node.js is installed and get version"""
    try:
        result = subprocess.run(['node', '--version'], capture_output=True, text=True)
        if result.returncode == 0:
            version = result.stdout.strip()
            print(f"[OK] Node.js detected: {version}")
            return True
        else:
            print("[ERROR] Node.js not working properly")
            return False
    except FileNotFoundError:
        print("[ERROR] Node.js is not installed!")
        print()
        print("Please install Node.js first:")
        print("1. Go to https://nodejs.org")
        print("2. Download and install Node.js")
        print("3. Restart your computer")
        print("4. Run this installer again")
        print()
        return False

def check_files():
    """Check if required files exist"""
    required_files = ['package.json', 'server', 'client']
    missing_files = []
    
    for file in required_files:
        if not os.path.exists(file):
            missing_files.append(file)
    
    if missing_files:
        print(f"[ERROR] Missing required files: {', '.join(missing_files)}")
        print("Make sure you're running this from the cafe management folder.")
        return False
    
    print("[OK] Required files found")
    return True

def run_command(command, description):
    """Run a command with error handling"""
    print(f"[INFO] {description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"[OK] {description} completed")
        return True
    except subprocess.CalledProcessError as e:
        print(f"[ERROR] {description} failed:")
        print(f"Command: {command}")
        print(f"Error: {e.stderr}")
        return False

def create_startup_files():
    """Create startup batch file and shortcuts"""
    print("[INFO] Creating startup files...")
    
    # Determine the correct startup command based on OS
    if platform.system() == "Windows":
        # Create Windows batch file
        batch_content = '''@echo off
title Cafe Management System
color 0A
echo.
echo ========================================
echo   CAFE MANAGEMENT SYSTEM
echo ========================================
echo.
echo Starting system...
echo Login: admin / admin123
echo Web interface: http://localhost:5000
echo.
echo Press Ctrl+C to stop the system
echo.
cd /d "%~dp0"
npm run start
pause'''
        
        with open('start-cafe-system.bat', 'w') as f:
            f.write(batch_content)
        print("[OK] Created start-cafe-system.bat")
        
    else:
        # Create Unix shell script
        shell_content = '''#!/bin/bash
echo "========================================"
echo "   CAFE MANAGEMENT SYSTEM"
echo "========================================"
echo
echo "Starting system..."
echo "Login: admin / admin123"
echo "Web interface: http://localhost:5000"
echo
echo "Press Ctrl+C to stop the system"
echo
cd "$(dirname "$0")"
npm run start'''
        
        with open('start-cafe-system.sh', 'w') as f:
            f.write(shell_content)
        os.chmod('start-cafe-system.sh', 0o755)
        print("[OK] Created start-cafe-system.sh")

def create_database():
    """Initialize database if it doesn't exist"""
    if not os.path.exists('cafe.db'):
        print("[INFO] Creating database file...")
        # Create empty database file
        Path('cafe.db').touch()
        print("[OK] Database file created")
    else:
        print("[OK] Database file already exists")

def main():
    """Main installation process"""
    print_header()
    
    # Step 1: Check Node.js
    if not check_node():
        input("Press Enter to exit...")
        sys.exit(1)
    
    print()
    
    # Step 2: Check required files
    if not check_files():
        input("Press Enter to exit...")
        sys.exit(1)
    
    print()
    print("Installing Cafe Management System...")
    print()
    
    # Step 3: Install dependencies
    if not run_command('npm install', 'Installing dependencies'):
        input("Press Enter to exit...")
        sys.exit(1)
    
    # Step 4: Build application
    if not run_command('npm run build', 'Building application'):
        input("Press Enter to exit...")
        sys.exit(1)
    
    # Step 5: Create database
    create_database()
    
    # Step 6: Create startup files
    create_startup_files()
    
    # Success message
    print()
    print("=" * 50)
    print("   INSTALLATION COMPLETE!")
    print("=" * 50)
    print()
    print("To start your cafe system:")
    
    if platform.system() == "Windows":
        print("1. Double-click 'start-cafe-system.bat'")
    else:
        print("1. Run './start-cafe-system.sh'")
    
    print("2. Wait for startup (30 seconds)")
    print("3. Open browser to http://localhost:5000")
    print("4. Login: admin / admin123")
    print()
    print("Files created:")
    
    if platform.system() == "Windows":
        print("- start-cafe-system.bat (double-click to start)")
    else:
        print("- start-cafe-system.sh (run to start)")
    
    print("- cafe.db (your database)")
    print()
    print("Your cafe management system is ready!")
    print()
    
    input("Press Enter to exit...")

if __name__ == "__main__":
    main()