import '../models/user.dart';
import '../models/category.dart';
import '../models/menu_item.dart';
import '../models/order.dart';
import '../models/table.dart';
import 'package:crypto/crypto.dart';
import 'dart:convert';

class DatabaseService {
  // In-memory storage for web compatibility
  static List<User> _users = [];
  static List<Category> _categories = [];
  static List<MenuItem> _menuItems = [];
  static List<TableModel> _tables = [];
  static List<Order> _orders = [];
  static int _nextUserId = 1;
  static int _nextCategoryId = 1;
  static int _nextMenuItemId = 1;
  static int _nextTableId = 1;
  static int _nextOrderId = 1;
  static bool _isInitialized = false;

  static Future<void> get database async {
    if (!_isInitialized) {
      await _initializeData();
      _isInitialized = true;
    }
  }

  static Future<void> _initializeData() async {
    // Initialize default admin user
    _users.add(User(
      id: _nextUserId++,
      name: 'Administrator',
      username: 'admin',
      password: _hashPassword('password'), // Simple hash for demo
      role: UserRole.admin,
      active: true,
      createdAt: DateTime.now(),
    ));

    // Initialize sample categories
    _categories.addAll([
      Category(id: _nextCategoryId++, name: 'Beverages', description: 'Hot and cold drinks'),
      Category(id: _nextCategoryId++, name: 'Food', description: 'Main dishes and snacks'),
      Category(id: _nextCategoryId++, name: 'Desserts', description: 'Sweet treats'),
    ]);

    // Initialize sample menu items
    _menuItems.addAll([
      MenuItem(
        id: _nextMenuItemId++,
        name: 'Espresso',
        description: 'Rich and bold coffee',
        price: 80.0,
        categoryId: 1,
        stockQuantity: 50,
      ),
      MenuItem(
        id: _nextMenuItemId++,
        name: 'Cappuccino',
        description: 'Coffee with steamed milk foam',
        price: 120.0,
        categoryId: 1,
        stockQuantity: 45,
      ),
      MenuItem(
        id: _nextMenuItemId++,
        name: 'Sandwich',
        description: 'Grilled club sandwich',
        price: 180.0,
        categoryId: 2,
        stockQuantity: 25,
      ),
      MenuItem(
        id: _nextMenuItemId++,
        name: 'Chocolate Cake',
        description: 'Rich chocolate layer cake',
        price: 150.0,
        categoryId: 3,
        stockQuantity: 15,
      ),
    ]);

    // Initialize sample tables
    _tables.addAll([
      TableModel(id: _nextTableId++, name: 'Table 1', capacity: 4, occupied: false),
      TableModel(id: _nextTableId++, name: 'Table 2', capacity: 2, occupied: false),
      TableModel(id: _nextTableId++, name: 'Table 3', capacity: 6, occupied: false),
    ]);
  }

  static String _hashPassword(String password) {
    final bytes = utf8.encode(password);
    final digest = sha256.convert(bytes);
    return digest.toString();
  }

  // User operations
  static Future<List<User>> getUsers() async {
    await database;
    return List.from(_users);
  }

  static Future<User?> getUserByUsername(String username) async {
    await database;
    try {
      return _users.firstWhere((user) => user.username == username);
    } catch (e) {
      return null;
    }
  }

  static Future<int> insertUser(User user) async {
    await database;
    user.id = _nextUserId++;
    _users.add(user);
    return user.id!;
  }

  static Future<int> updateUser(User user) async {
    await database;
    final index = _users.indexWhere((u) => u.id == user.id);
    if (index != -1) {
      _users[index] = user;
      return 1;
    }
    return 0;
  }

  static Future<int> deleteUser(int id) async {
    await database;
    final index = _users.indexWhere((user) => user.id == id);
    if (index != -1) {
      _users.removeAt(index);
      return 1;
    }
    return 0;
  }

  // Category operations
  static Future<List<Category>> getCategories() async {
    await database;
    return List.from(_categories);
  }

  static Future<int> insertCategory(Category category) async {
    await database;
    category.id = _nextCategoryId++;
    _categories.add(category);
    return category.id!;
  }

  // Menu item operations
  static Future<List<MenuItem>> getMenuItems() async {
    await database;
    return List.from(_menuItems);
  }

  static Future<int> insertMenuItem(MenuItem menuItem) async {
    await database;
    menuItem.id = _nextMenuItemId++;
    _menuItems.add(menuItem);
    return menuItem.id!;
  }

  static Future<int> updateMenuItem(MenuItem menuItem) async {
    await database;
    final index = _menuItems.indexWhere((item) => item.id == menuItem.id);
    if (index != -1) {
      _menuItems[index] = menuItem;
      return 1;
    }
    return 0;
  }

  // Table operations
  static Future<List<TableModel>> getTables() async {
    await database;
    return List.from(_tables);
  }

  static Future<int> insertTable(TableModel table) async {
    await database;
    table.id = _nextTableId++;
    _tables.add(table);
    return table.id!;
  }

  static Future<int> updateTable(TableModel table) async {
    await database;
    final index = _tables.indexWhere((t) => t.id == table.id);
    if (index != -1) {
      _tables[index] = table;
      return 1;
    }
    return 0;
  }

  // Order operations
  static Future<List<Order>> getOrders() async {
    await database;
    return List.from(_orders);
  }

  static Future<List<OrderItem>> getOrderItems(int orderId) async {
    await database;
    final order = _orders.firstWhere((o) => o.id == orderId);
    return order.items;
  }

  static Future<int> insertOrder(Order order) async {
    await database;
    order.id = _nextOrderId++;
    
    // Update menu item stock
    for (OrderItem item in order.items) {
      final menuIndex = _menuItems.indexWhere((m) => m.id == item.menuItemId);
      if (menuIndex != -1) {
        _menuItems[menuIndex].stockQuantity -= item.quantity;
        if (_menuItems[menuIndex].stockQuantity < 0) {
          _menuItems[menuIndex].stockQuantity = 0;
        }
      }
    }
    
    _orders.add(order);
    return order.id!;
  }

  static Future<int> updateOrder(Order order) async {
    await database;
    final index = _orders.indexWhere((o) => o.id == order.id);
    if (index != -1) {
      _orders[index] = order;
      return 1;
    }
    return 0;
  }

  // Analytics and reporting
  static Future<double> getTodaySales() async {
    await database;
    final today = DateTime.now();
    final startOfDay = DateTime(today.year, today.month, today.day);
    final endOfDay = DateTime(today.year, today.month, today.day, 23, 59, 59);
    
    double total = 0.0;
    for (final order in _orders) {
      if (order.status == OrderStatus.completed &&
          order.createdAt.isAfter(startOfDay) &&
          order.createdAt.isBefore(endOfDay)) {
        total += order.totalAmount;
      }
    }
    
    return total;
  }

  static Future<List<Map<String, dynamic>>> getPopularItems() async {
    await database;
    final Map<int, int> itemCounts = {};
    
    for (final order in _orders) {
      if (order.status == OrderStatus.completed) {
        for (final item in order.items) {
          itemCounts[item.menuItemId] = 
              (itemCounts[item.menuItemId] ?? 0) + item.quantity;
        }
      }
    }
    
    final List<Map<String, dynamic>> popularItems = [];
    for (final entry in itemCounts.entries) {
      final menuItem = _menuItems.firstWhere((m) => m.id == entry.key);
      popularItems.add({
        'name': menuItem.name,
        'totalSold': entry.value,
      });
    }
    
    popularItems.sort((a, b) => b['totalSold'].compareTo(a['totalSold']));
    return popularItems.take(10).toList();
  }

  static Future<void> closeDatabase() async {
    // Nothing to close for in-memory storage
  }
}