import sql from 'mssql';
import Database from 'better-sqlite3';

// SQL Server connection configuration (for production)
const dbConfig: sql.config = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'YourPassword123!',
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'CafeManagement',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_CERT !== 'false',
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

// Create connection pool for SQL Server
export const pool = new sql.ConnectionPool(dbConfig);

// SQLite fallback for development/demo
const sqlite = new Database('cafe.db');
let usingSQLServer = false;

// Initialize the connection
let isConnected = false;
export async function connectDB() {
  if (!isConnected) {
    try {
      // Try SQL Server first
      await pool.connect();
      isConnected = true;
      usingSQLServer = true;
      console.log('Connected to SQL Server successfully');
    } catch (error) {
      console.log('SQL Server not available, using SQLite fallback for demo');
      usingSQLServer = false;
      isConnected = true;
    }
  }
  return usingSQLServer ? pool : sqlite;
}

// Database helper functions with dual support
export class DB {
  static async query(query: string, params: any[] = []) {
    await connectDB();
    
    if (usingSQLServer) {
      const connection = pool;
      const request = connection.request();
      
      params.forEach((param, index) => {
        request.input(`param${index}`, param);
      });
      
      return await request.query(query);
    } else {
      // Convert SQL Server syntax to SQLite for demo
      const sqliteQuery = query
        .replace(/@param(\d+)/g, '?')
        .replace(/NVARCHAR\(\d+\)/gi, 'TEXT')
        .replace(/NTEXT/gi, 'TEXT')
        .replace(/BIT/gi, 'INTEGER')
        .replace(/DATETIME/gi, 'TEXT')
        .replace(/REAL/gi, 'REAL')
        .replace(/GETDATE\(\)/gi, "datetime('now')")
        .replace(/OUTPUT INSERTED\.\*/gi, '')
        .replace(/\[key\]/gi, 'key');
      
      const stmt = sqlite.prepare(sqliteQuery);
      try {
        if (sqliteQuery.toLowerCase().includes('select')) {
          const rows = stmt.all(...params);
          return { recordset: rows };
        } else {
          const result = stmt.run(...params);
          return { recordset: [{ id: result.lastInsertRowid, ...result }] };
        }
      } catch (error) {
        console.log('SQLite query error:', error, 'Query:', sqliteQuery);
        return { recordset: [] };
      }
    }
  }

  static async execute(query: string, params: any[] = []) {
    return this.query(query, params);
  }
}

// Create tables with dual database support
async function initializeTables() {
  try {
    await connectDB();
    
    if (usingSQLServer) {
      // SQL Server table creation
      const createTablesSQL = `
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
        CREATE TABLE users (
          id INT IDENTITY(1,1) PRIMARY KEY,
          name NVARCHAR(255) NOT NULL,
          username NVARCHAR(100) NOT NULL UNIQUE,
          password NVARCHAR(255) NOT NULL,
          role NVARCHAR(50) NOT NULL DEFAULT 'staff',
          active BIT NOT NULL DEFAULT 1,
          created_at DATETIME DEFAULT GETDATE()
        );
      `;
      await DB.execute(createTablesSQL);
      console.log('SQL Server tables created successfully');
    } else {
      // SQLite table creation for demo
      sqlite.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          username TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'staff',
          active INTEGER NOT NULL DEFAULT 1,
          created_at TEXT DEFAULT (datetime('now'))
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
          created_at TEXT DEFAULT (datetime('now')),
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
          clock_in TEXT NOT NULL DEFAULT (datetime('now')),
          clock_out TEXT
        );

        CREATE TABLE IF NOT EXISTS expenses (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          description TEXT NOT NULL,
          amount REAL NOT NULL,
          category TEXT NOT NULL DEFAULT 'other',
          date TEXT NOT NULL DEFAULT (datetime('now')),
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
      console.log('SQLite tables created successfully for demo');
    }
  } catch (error) {
    console.log('Database table creation error:', error);
  }
}

// Initialize tables on startup
initializeTables();
