#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Building Cafe Management System Package...\n');

// Create package directory
const packageDir = 'cafe-management-package';
const distDir = path.join(packageDir, 'dist');

if (fs.existsSync(packageDir)) {
    console.log('📁 Removing existing package directory...');
    fs.rmSync(packageDir, { recursive: true, force: true });
}

console.log('📁 Creating package directory...');
fs.mkdirSync(packageDir, { recursive: true });
fs.mkdirSync(distDir, { recursive: true });

// Build the application
console.log('🔨 Building application...');
try {
    execSync('npm run build', { stdio: 'inherit' });
} catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
}

// Copy necessary files
console.log('📋 Copying files...');

const filesToCopy = [
    'package.json',
    'package-lock.json',
    'start-windows.bat',
    'start-unix.sh',
    'DEPLOYMENT_GUIDE.md',
    'README.md',
    'dist',
    'drizzle.config.ts',
    'shared',
    'server/backup-system.ts',
    'server/db-setup.ts',
    'server/db-update.ts',
    'server/storage.ts',
    'server/update-db.ts'
];

filesToCopy.forEach(file => {
    const srcPath = path.resolve(file);
    const destPath = path.join(packageDir, file);
    
    if (fs.existsSync(srcPath)) {
        if (fs.statSync(srcPath).isDirectory()) {
            fs.cpSync(srcPath, destPath, { recursive: true });
        } else {
            fs.mkdirSync(path.dirname(destPath), { recursive: true });
            fs.copyFileSync(srcPath, destPath);
        }
        console.log(`✅ Copied: ${file}`);
    } else {
        console.log(`⚠️  Not found: ${file}`);
    }
});

// Create a simplified package.json for production
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const productionPackageJson = {
    name: packageJson.name,
    version: packageJson.version,
    type: packageJson.type,
    license: packageJson.license,
    scripts: {
        "start": "cross-env NODE_ENV=production node dist/index.js",
        "start:windows": "set NODE_ENV=production && node dist/index.js",
        "start:unix": "NODE_ENV=production node dist/index.js",
        "db:push": "drizzle-kit push"
    },
    dependencies: {
        // Only include production dependencies
        "cross-env": packageJson.dependencies["cross-env"],
        "drizzle-kit": packageJson.dependencies["drizzle-kit"],
        "drizzle-orm": packageJson.dependencies["drizzle-orm"],
        "pg": packageJson.dependencies["pg"],
        "express": packageJson.dependencies["express"],
        "express-session": packageJson.dependencies["express-session"],
        "passport": packageJson.dependencies["passport"],
        "passport-local": packageJson.dependencies["passport-local"],
        "connect-pg-simple": packageJson.dependencies["connect-pg-simple"],
        "multer": packageJson.dependencies["multer"],
        "zod": packageJson.dependencies["zod"],
        "date-fns": packageJson.dependencies["date-fns"],
        "papaparse": packageJson.dependencies["papaparse"],
        "jstat": packageJson.dependencies["jstat"],
        "ml-regression": packageJson.dependencies["ml-regression"],
        "ws": packageJson.dependencies["ws"]
    }
};

fs.writeFileSync(
    path.join(packageDir, 'package.json'), 
    JSON.stringify(productionPackageJson, null, 2)
);

// Create .env template
const envTemplate = `# Database Configuration
# Replace with your actual database credentials
DATABASE_URL=postgresql://username:password@localhost:5432/cafe_management
PGHOST=localhost
PGPORT=5432
PGDATABASE=cafe_management
PGUSER=your_username
PGPASSWORD=your_password

# Application Configuration
NODE_ENV=production
PORT=5000`;

fs.writeFileSync(path.join(packageDir, '.env.template'), envTemplate);

// Create setup instructions
const setupInstructions = `# Quick Setup Instructions

1. Install Prerequisites:
   - Node.js (https://nodejs.org/)
   - PostgreSQL (https://www.postgresql.org/download/)

2. Database Setup:
   - Create database: CREATE DATABASE cafe_management;
   - Copy .env.template to .env
   - Update .env with your database credentials

3. Start Application:
   - Windows: Double-click start-windows.bat
   - Mac/Linux: ./start-unix.sh

4. Access Application:
   - Open browser to http://localhost:5000
   - Login: admin / admin123

For detailed instructions, see DEPLOYMENT_GUIDE.md`;

fs.writeFileSync(path.join(packageDir, 'QUICK_START.txt'), setupInstructions);

console.log('\n✅ Package created successfully!');
console.log(`📦 Package location: ${packageDir}/`);
console.log('\n📋 Package contents:');
console.log('   - Application files (dist/)');
console.log('   - Startup scripts (start-windows.bat, start-unix.sh)');
console.log('   - Deployment guide (DEPLOYMENT_GUIDE.md)');
console.log('   - Quick start guide (QUICK_START.txt)');
console.log('   - Environment template (.env.template)');
console.log('   - Production package.json');
console.log('\n🎉 Ready for deployment!');