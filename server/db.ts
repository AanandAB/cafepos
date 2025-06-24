import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from "@shared/schema";

// Use SQLite for simpler setup in Replit environment
const sqlite = new Database('cafe.db');
export const db = drizzle(sqlite, { schema });

// Create tables directly using Drizzle's schema
async function initializeTables() {
  try {
    // Use Drizzle's push functionality to create tables
    const { sql } = await import('drizzle-orm');
    
    // Create tables manually since migrations are failing
    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'staff',
        active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT DEFAULT (CURRENT_TIMESTAMP)
      );

      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT
      );

      CREATE TABLE IF NOT EXISTS menu_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        category_id INTEGER REFERENCES categories(id),
        tax_rate REAL NOT NULL DEFAULT 5,
        available INTEGER NOT NULL DEFAULT 1,
        image_url TEXT,
        stock_quantity INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS inventory_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        quantity REAL NOT NULL DEFAULT 0,
        unit TEXT NOT NULL,
        alert_threshold REAL,
        cost REAL
      );

      CREATE TABLE IF NOT EXISTS tables (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        capacity INTEGER,
        occupied INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_id INTEGER REFERENCES tables(id),
        user_id INTEGER REFERENCES users(id),
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT DEFAULT (CURRENT_TIMESTAMP),
        completed_at TEXT,
        total_amount REAL NOT NULL DEFAULT 0,
        tax_amount REAL NOT NULL DEFAULT 0,
        tax_type TEXT NOT NULL DEFAULT 'cgst_sgst',
        discount REAL NOT NULL DEFAULT 0,
        payment_method TEXT,
        customer_name TEXT,
        customer_phone TEXT,
        customer_gstin TEXT,
        invoice_number TEXT
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER NOT NULL REFERENCES orders(id),
        menu_item_id INTEGER NOT NULL REFERENCES menu_items(id),
        quantity INTEGER NOT NULL DEFAULT 1,
        unit_price REAL NOT NULL,
        total_price REAL NOT NULL,
        notes TEXT
      );

      CREATE TABLE IF NOT EXISTS employee_shifts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL REFERENCES users(id),
        clock_in TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        clock_out TEXT
      );

      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        description TEXT NOT NULL,
        amount REAL NOT NULL,
        category TEXT NOT NULL DEFAULT 'other',
        date TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
        user_id INTEGER REFERENCES users(id),
        notes TEXT,
        receipt_url TEXT
      );

      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT NOT NULL UNIQUE,
        value TEXT,
        type TEXT NOT NULL DEFAULT 'string'
      );
    `);
    
    console.log('Database tables created successfully');
  } catch (error) {
    console.log('Database table creation error:', error);
  }
}

// Initialize tables on startup
initializeTables();
