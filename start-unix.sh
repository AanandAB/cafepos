#!/bin/bash

echo "Starting Cafe Management System..."
echo

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "ERROR: Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "ERROR: npm is not available"
    echo "Please ensure Node.js is properly installed"
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to install dependencies"
        exit 1
    fi
fi

# Check if application is built
if [ ! -d "dist" ]; then
    echo "Building application..."
    npm run build
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to build application"
        exit 1
    fi
fi

# Start the application
echo "Starting server..."
echo "The application will be available at: http://localhost:5000"
echo "Press Ctrl+C to stop the server"
echo

export NODE_ENV=production
node dist/index.js