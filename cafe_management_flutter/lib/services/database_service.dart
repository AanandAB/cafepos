import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import '../models/user.dart';
import '../models/category.dart';
import '../models/menu_item.dart';
import '../models/order.dart';
import '../models/table.dart';

class DatabaseService {
  static Database? _database;
  static const String _databaseName = 'cafe_management.db';
  static const int _databaseVersion = 1;

  static Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDatabase();
    return _database!;
  }

  static Future<Database> _initDatabase() async {
    String path = join(await getDatabasesPath(), _databaseName);
    return await openDatabase(
      path,
      version: _databaseVersion,
      onCreate: _onCreate,
    );
  }

  static Future<void> _onCreate(Database db, int version) async {
    // Users table
    await db.execute('''
      CREATE TABLE users(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'staff',
        active INTEGER NOT NULL DEFAULT 1,
        createdAt TEXT NOT NULL
      )
    ''');

    // Categories table
    await db.execute('''
      CREATE TABLE categories(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT
      )
    ''');

    // Menu items table
    await db.execute('''
      CREATE TABLE menu_items(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        categoryId INTEGER,
        taxRate REAL NOT NULL DEFAULT 18.0,
        available INTEGER NOT NULL DEFAULT 1,
        imageUrl TEXT,
        stockQuantity INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (categoryId) REFERENCES categories (id)
      )
    ''');

    // Tables
    await db.execute('''
      CREATE TABLE tables(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        capacity INTEGER,
        occupied INTEGER NOT NULL DEFAULT 0
      )
    ''');

    // Orders table
    await db.execute('''
      CREATE TABLE orders(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tableId INTEGER,
        userId INTEGER,
        status TEXT NOT NULL DEFAULT 'pending',
        createdAt TEXT NOT NULL,
        completedAt TEXT,
        totalAmount REAL NOT NULL DEFAULT 0.0,
        taxAmount REAL NOT NULL DEFAULT 0.0,
        taxType TEXT NOT NULL DEFAULT 'cgstSgst',
        discount REAL NOT NULL DEFAULT 0.0,
        paymentMethod TEXT,
        customerName TEXT,
        customerPhone TEXT,
        customerGstin TEXT,
        invoiceNumber TEXT,
        FOREIGN KEY (tableId) REFERENCES tables (id),
        FOREIGN KEY (userId) REFERENCES users (id)
      )
    ''');

    // Order items table
    await db.execute('''
      CREATE TABLE order_items(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orderId INTEGER NOT NULL,
        menuItemId INTEGER NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        unitPrice REAL NOT NULL,
        totalPrice REAL NOT NULL,
        notes TEXT,
        FOREIGN KEY (orderId) REFERENCES orders (id),
        FOREIGN KEY (menuItemId) REFERENCES menu_items (id)
      )
    ''');

    // Employee shifts table
    await db.execute('''
      CREATE TABLE employee_shifts(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        clockIn TEXT NOT NULL,
        clockOut TEXT,
        FOREIGN KEY (userId) REFERENCES users (id)
      )
    ''');

    // Expenses table
    await db.execute('''
      CREATE TABLE expenses(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        description TEXT NOT NULL,
        amount REAL NOT NULL,
        category TEXT NOT NULL DEFAULT 'other',
        date TEXT NOT NULL,
        userId INTEGER,
        notes TEXT,
        receiptUrl TEXT,
        FOREIGN KEY (userId) REFERENCES users (id)
      )
    ''');

    // Settings table
    await db.execute('''
      CREATE TABLE settings(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT,
        type TEXT NOT NULL DEFAULT 'string'
      )
    ''');

    // Insert default admin user
    await db.insert('users', {
      'name': 'Administrator',
      'username': 'admin',
      'password': r'$2b$10$K7L1OJ45/4Y2nIvhRVpCe.FSmhDdWoXehVzJptpT1/GxseHVH.vHu', // hashed 'password'
      'role': 'admin',
      'active': 1,
      'createdAt': DateTime.now().toIso8601String(),
    });

    // Insert sample categories
    await db.insert('categories', {'name': 'Beverages', 'description': 'Hot and cold drinks'});
    await db.insert('categories', {'name': 'Food', 'description': 'Main dishes and snacks'});
    await db.insert('categories', {'name': 'Desserts', 'description': 'Sweet treats'});

    // Insert sample tables
    await db.insert('tables', {'name': 'Table 1', 'capacity': 4, 'occupied': 0});
    await db.insert('tables', {'name': 'Table 2', 'capacity': 2, 'occupied': 0});
    await db.insert('tables', {'name': 'Table 3', 'capacity': 6, 'occupied': 0});
  }

  // User operations
  static Future<List<User>> getUsers() async {
    final db = await database;
    final List<Map<String, dynamic>> maps = await db.query('users');
    return List.generate(maps.length, (i) => User.fromMap(maps[i]));
  }

  static Future<User?> getUserByUsername(String username) async {
    final db = await database;
    final List<Map<String, dynamic>> maps = await db.query(
      'users',
      where: 'username = ?',
      whereArgs: [username],
    );
    if (maps.isNotEmpty) {
      return User.fromMap(maps.first);
    }
    return null;
  }

  static Future<int> insertUser(User user) async {
    final db = await database;
    return await db.insert('users', user.toMap());
  }

  static Future<int> updateUser(User user) async {
    final db = await database;
    return await db.update(
      'users',
      user.toMap(),
      where: 'id = ?',
      whereArgs: [user.id],
    );
  }

  static Future<int> deleteUser(int id) async {
    final db = await database;
    return await db.delete(
      'users',
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  // Category operations
  static Future<List<Category>> getCategories() async {
    final db = await database;
    final List<Map<String, dynamic>> maps = await db.query('categories');
    return List.generate(maps.length, (i) => Category.fromMap(maps[i]));
  }

  static Future<int> insertCategory(Category category) async {
    final db = await database;
    return await db.insert('categories', category.toMap());
  }

  // Menu item operations
  static Future<List<MenuItem>> getMenuItems() async {
    final db = await database;
    final List<Map<String, dynamic>> maps = await db.query('menu_items');
    return List.generate(maps.length, (i) => MenuItem.fromMap(maps[i]));
  }

  static Future<int> insertMenuItem(MenuItem menuItem) async {
    final db = await database;
    return await db.insert('menu_items', menuItem.toMap());
  }

  static Future<int> updateMenuItem(MenuItem menuItem) async {
    final db = await database;
    return await db.update(
      'menu_items',
      menuItem.toMap(),
      where: 'id = ?',
      whereArgs: [menuItem.id],
    );
  }

  // Table operations
  static Future<List<TableModel>> getTables() async {
    final db = await database;
    final List<Map<String, dynamic>> maps = await db.query('tables');
    return List.generate(maps.length, (i) => TableModel.fromMap(maps[i]));
  }

  static Future<int> insertTable(TableModel table) async {
    final db = await database;
    return await db.insert('tables', table.toMap());
  }

  static Future<int> updateTable(TableModel table) async {
    final db = await database;
    return await db.update(
      'tables',
      table.toMap(),
      where: 'id = ?',
      whereArgs: [table.id],
    );
  }

  // Order operations
  static Future<List<Order>> getOrders() async {
    final db = await database;
    final List<Map<String, dynamic>> maps = await db.query('orders', orderBy: 'createdAt DESC');
    List<Order> orders = List.generate(maps.length, (i) => Order.fromMap(maps[i]));
    
    // Load order items for each order
    for (Order order in orders) {
      order.items = await getOrderItems(order.id!);
    }
    
    return orders;
  }

  static Future<List<OrderItem>> getOrderItems(int orderId) async {
    final db = await database;
    final List<Map<String, dynamic>> maps = await db.query(
      'order_items',
      where: 'orderId = ?',
      whereArgs: [orderId],
    );
    return List.generate(maps.length, (i) => OrderItem.fromMap(maps[i]));
  }

  static Future<int> insertOrder(Order order) async {
    final db = await database;
    int orderId = await db.insert('orders', order.toMap());
    
    // Insert order items
    for (OrderItem item in order.items) {
      item.orderId = orderId;
      await db.insert('order_items', item.toMap());
      
      // Update menu item stock
      await db.rawUpdate(
        'UPDATE menu_items SET stockQuantity = stockQuantity - ? WHERE id = ?',
        [item.quantity, item.menuItemId],
      );
    }
    
    return orderId;
  }

  static Future<int> updateOrder(Order order) async {
    final db = await database;
    return await db.update(
      'orders',
      order.toMap(),
      where: 'id = ?',
      whereArgs: [order.id],
    );
  }

  // Analytics and reporting
  static Future<double> getTodaySales() async {
    final db = await database;
    final today = DateTime.now();
    final startOfDay = DateTime(today.year, today.month, today.day).toIso8601String();
    final endOfDay = DateTime(today.year, today.month, today.day, 23, 59, 59).toIso8601String();
    
    final result = await db.rawQuery(
      'SELECT SUM(totalAmount) as total FROM orders WHERE createdAt >= ? AND createdAt <= ? AND status = ?',
      [startOfDay, endOfDay, 'completed'],
    );
    
    return result.first['total'] as double? ?? 0.0;
  }

  static Future<List<Map<String, dynamic>>> getPopularItems() async {
    final db = await database;
    return await db.rawQuery('''
      SELECT mi.name, SUM(oi.quantity) as totalSold
      FROM order_items oi
      JOIN menu_items mi ON oi.menuItemId = mi.id
      JOIN orders o ON oi.orderId = o.id
      WHERE o.status = 'completed'
      GROUP BY oi.menuItemId
      ORDER BY totalSold DESC
      LIMIT 10
    ''');
  }

  static Future<void> closeDatabase() async {
    final db = _database;
    if (db != null) {
      await db.close();
      _database = null;
    }
  }
}