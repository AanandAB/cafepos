import 'package:flutter/foundation.dart';
import '../models/menu_item.dart';
import '../models/category.dart';
import '../services/database_service.dart';

class MenuProvider extends ChangeNotifier {
  List<MenuItem> _menuItems = [];
  List<Category> _categories = [];
  bool _isLoading = false;
  String? _errorMessage;
  int? _selectedCategoryId;

  List<MenuItem> get menuItems => List.unmodifiable(_menuItems);
  List<Category> get categories => List.unmodifiable(_categories);
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  int? get selectedCategoryId => _selectedCategoryId;

  List<MenuItem> get filteredMenuItems {
    if (_selectedCategoryId == null) {
      return _menuItems.where((item) => item.available).toList();
    }
    return _menuItems
        .where((item) => item.categoryId == _selectedCategoryId && item.available)
        .toList();
  }

  List<MenuItem> get availableMenuItems {
    return _menuItems.where((item) => item.available && item.stockQuantity > 0).toList();
  }

  List<MenuItem> get lowStockItems {
    return _menuItems.where((item) => item.stockQuantity <= 5 && item.stockQuantity > 0).toList();
  }

  List<MenuItem> get outOfStockItems {
    return _menuItems.where((item) => item.stockQuantity == 0).toList();
  }

  Future<void> loadMenuItems() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _menuItems = await DatabaseService.getMenuItems();
    } catch (e) {
      _errorMessage = 'Failed to load menu items: ${e.toString()}';
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> loadCategories() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _categories = await DatabaseService.getCategories();
    } catch (e) {
      _errorMessage = 'Failed to load categories: ${e.toString()}';
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> loadAll() async {
    await Future.wait([
      loadMenuItems(),
      loadCategories(),
    ]);
  }

  Future<bool> addMenuItem(MenuItem menuItem) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final id = await DatabaseService.insertMenuItem(menuItem);
      menuItem.id = id;
      _menuItems.add(menuItem);
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = 'Failed to add menu item: ${e.toString()}';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> updateMenuItem(MenuItem menuItem) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      await DatabaseService.updateMenuItem(menuItem);
      final index = _menuItems.indexWhere((item) => item.id == menuItem.id);
      if (index != -1) {
        _menuItems[index] = menuItem;
      }
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = 'Failed to update menu item: ${e.toString()}';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> addCategory(Category category) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final id = await DatabaseService.insertCategory(category);
      category.id = id;
      _categories.add(category);
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = 'Failed to add category: ${e.toString()}';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  void setSelectedCategory(int? categoryId) {
    _selectedCategoryId = categoryId;
    notifyListeners();
  }

  void clearSelectedCategory() {
    _selectedCategoryId = null;
    notifyListeners();
  }

  MenuItem? getMenuItemById(int id) {
    try {
      return _menuItems.firstWhere((item) => item.id == id);
    } catch (e) {
      return null;
    }
  }

  Category? getCategoryById(int id) {
    try {
      return _categories.firstWhere((category) => category.id == id);
    } catch (e) {
      return null;
    }
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }

  void updateStock(int menuItemId, int newStock) {
    final index = _menuItems.indexWhere((item) => item.id == menuItemId);
    if (index != -1) {
      _menuItems[index].stockQuantity = newStock;
      notifyListeners();
    }
  }

  void decrementStock(int menuItemId, int quantity) {
    final index = _menuItems.indexWhere((item) => item.id == menuItemId);
    if (index != -1) {
      _menuItems[index].stockQuantity = 
          (_menuItems[index].stockQuantity - quantity).clamp(0, double.infinity).toInt();
      notifyListeners();
    }
  }
}