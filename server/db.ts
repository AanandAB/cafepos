import sql from 'mssql';

// SQL Server connection configuration
const dbConfig: sql.config = {
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || 'YourPassword123!',
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_NAME || 'CafeManagement',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true', // Use encryption for Azure
    trustServerCertificate: process.env.DB_TRUST_CERT !== 'false', // Trust self-signed certificates
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

// Create connection pool
export const pool = new sql.ConnectionPool(dbConfig);

// Initialize the connection
let isConnected = false;
export async function connectDB() {
  if (!isConnected) {
    try {
      await pool.connect();
      isConnected = true;
      console.log('Connected to SQL Server successfully');
    } catch (error) {
      console.error('SQL Server connection failed:', error);
      throw error;
    }
  }
  return pool;
}

// Database helper functions
export class DB {
  static async query(query: string, params: any[] = []) {
    const connection = await connectDB();
    const request = connection.request();
    
    // Add parameters
    params.forEach((param, index) => {
      request.input(`param${index}`, param);
    });
    
    return await request.query(query);
  }

  static async execute(query: string, params: any[] = []) {
    const connection = await connectDB();
    const request = connection.request();
    
    // Add parameters
    params.forEach((param, index) => {
      request.input(`param${index}`, param);
    });
    
    return await request.query(query);
  }
}

// Create SQL Server tables
async function initializeTables() {
  try {
    await connectDB();
    
    // Create tables using SQL Server syntax
    const createTablesSQL = `
      -- Users Table
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

      -- Categories Table
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='categories' AND xtype='U')
      CREATE TABLE categories (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        description NTEXT
      );

      -- Menu Items Table
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='menu_items' AND xtype='U')
      CREATE TABLE menu_items (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        description NTEXT,
        price REAL NOT NULL,
        category_id INT FOREIGN KEY REFERENCES categories(id),
        tax_rate REAL NOT NULL DEFAULT 5,
        available BIT NOT NULL DEFAULT 1,
        image_url NVARCHAR(500),
        stock_quantity INT DEFAULT 0
      );

      -- Inventory Items Table
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='inventory_items' AND xtype='U')
      CREATE TABLE inventory_items (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(255) NOT NULL,
        quantity REAL NOT NULL DEFAULT 0,
        unit NVARCHAR(50) NOT NULL,
        alert_threshold REAL,
        cost REAL
      );

      -- Tables Table
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='tables' AND xtype='U')
      CREATE TABLE tables (
        id INT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(100) NOT NULL,
        capacity INT,
        occupied BIT NOT NULL DEFAULT 0
      );

      -- Orders Table
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='orders' AND xtype='U')
      CREATE TABLE orders (
        id INT IDENTITY(1,1) PRIMARY KEY,
        table_id INT FOREIGN KEY REFERENCES tables(id),
        user_id INT FOREIGN KEY REFERENCES users(id),
        status NVARCHAR(50) NOT NULL DEFAULT 'pending',
        created_at DATETIME DEFAULT GETDATE(),
        completed_at DATETIME,
        total_amount REAL NOT NULL DEFAULT 0,
        tax_amount REAL NOT NULL DEFAULT 0,
        tax_type NVARCHAR(20) NOT NULL DEFAULT 'cgst_sgst',
        discount REAL NOT NULL DEFAULT 0,
        payment_method NVARCHAR(20),
        customer_name NVARCHAR(255),
        customer_phone NVARCHAR(20),
        customer_gstin NVARCHAR(15),
        invoice_number NVARCHAR(100)
      );

      -- Order Items Table
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='order_items' AND xtype='U')
      CREATE TABLE order_items (
        id INT IDENTITY(1,1) PRIMARY KEY,
        order_id INT NOT NULL FOREIGN KEY REFERENCES orders(id),
        menu_item_id INT NOT NULL FOREIGN KEY REFERENCES menu_items(id),
        quantity INT NOT NULL DEFAULT 1,
        unit_price REAL NOT NULL,
        total_price REAL NOT NULL,
        notes NTEXT
      );

      -- Employee Shifts Table
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='employee_shifts' AND xtype='U')
      CREATE TABLE employee_shifts (
        id INT IDENTITY(1,1) PRIMARY KEY,
        user_id INT NOT NULL FOREIGN KEY REFERENCES users(id),
        clock_in DATETIME NOT NULL DEFAULT GETDATE(),
        clock_out DATETIME
      );

      -- Expenses Table
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='expenses' AND xtype='U')
      CREATE TABLE expenses (
        id INT IDENTITY(1,1) PRIMARY KEY,
        description NVARCHAR(500) NOT NULL,
        amount REAL NOT NULL,
        category NVARCHAR(50) NOT NULL DEFAULT 'other',
        date DATETIME NOT NULL DEFAULT GETDATE(),
        user_id INT FOREIGN KEY REFERENCES users(id),
        notes NTEXT,
        receipt_url NVARCHAR(500)
      );

      -- Settings Table
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='settings' AND xtype='U')
      CREATE TABLE settings (
        id INT IDENTITY(1,1) PRIMARY KEY,
        [key] NVARCHAR(100) NOT NULL UNIQUE,
        value NTEXT,
        type NVARCHAR(50) NOT NULL DEFAULT 'string'
      );
    `;
    
    await DB.execute(createTablesSQL);
    console.log('SQL Server tables created successfully');
  } catch (error) {
    console.log('SQL Server table creation error:', error);
  }
}

// Initialize tables on startup
initializeTables();
