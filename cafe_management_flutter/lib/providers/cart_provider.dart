import 'package:flutter/foundation.dart';
import '../models/menu_item.dart';
import '../models/order.dart';

class CartItem {
  final MenuItem menuItem;
  int quantity;
  String? notes;

  CartItem({
    required this.menuItem,
    this.quantity = 1,
    this.notes,
  });

  double get totalPrice => menuItem.totalPrice * quantity;
  double get taxAmount => menuItem.taxAmount * quantity;
  double get subtotal => menuItem.price * quantity;
}

class CartProvider extends ChangeNotifier {
  final List<CartItem> _items = [];
  int? _selectedTableId;
  String? _customerName;
  String? _customerPhone;
  String? _customerGstin;
  double _discount = 0.0;
  PaymentMethod? _paymentMethod;

  List<CartItem> get items => List.unmodifiable(_items);
  int? get selectedTableId => _selectedTableId;
  String? get customerName => _customerName;
  String? get customerPhone => _customerPhone;
  String? get customerGstin => _customerGstin;
  double get discount => _discount;
  PaymentMethod? get paymentMethod => _paymentMethod;

  int get itemCount => _items.fold(0, (sum, item) => sum + item.quantity);
  
  double get subtotal => _items.fold(0.0, (sum, item) => sum + item.subtotal);
  
  double get taxAmount => _items.fold(0.0, (sum, item) => sum + item.taxAmount);
  
  double get total => subtotal + taxAmount - _discount;

  bool get isEmpty => _items.isEmpty;

  void addItem(MenuItem menuItem, {int quantity = 1, String? notes}) {
    final existingIndex = _items.indexWhere(
      (item) => item.menuItem.id == menuItem.id && item.notes == notes,
    );

    if (existingIndex >= 0) {
      _items[existingIndex].quantity += quantity;
    } else {
      _items.add(CartItem(
        menuItem: menuItem,
        quantity: quantity,
        notes: notes,
      ));
    }
    notifyListeners();
  }

  void removeItem(int index) {
    if (index >= 0 && index < _items.length) {
      _items.removeAt(index);
      notifyListeners();
    }
  }

  void updateQuantity(int index, int quantity) {
    if (index >= 0 && index < _items.length) {
      if (quantity <= 0) {
        _items.removeAt(index);
      } else {
        _items[index].quantity = quantity;
      }
      notifyListeners();
    }
  }

  void updateNotes(int index, String? notes) {
    if (index >= 0 && index < _items.length) {
      _items[index].notes = notes;
      notifyListeners();
    }
  }

  void setTableId(int? tableId) {
    _selectedTableId = tableId;
    notifyListeners();
  }

  void setCustomerInfo({
    String? name,
    String? phone,
    String? gstin,
  }) {
    _customerName = name;
    _customerPhone = phone;
    _customerGstin = gstin;
    notifyListeners();
  }

  void setDiscount(double discount) {
    _discount = discount;
    notifyListeners();
  }

  void setPaymentMethod(PaymentMethod? method) {
    _paymentMethod = method;
    notifyListeners();
  }

  Order createOrder(int? userId) {
    final order = Order(
      tableId: _selectedTableId,
      userId: userId,
      totalAmount: total,
      taxAmount: taxAmount,
      discount: _discount,
      paymentMethod: _paymentMethod,
      customerName: _customerName,
      customerPhone: _customerPhone,
      customerGstin: _customerGstin,
      taxType: TaxType.cgstSgst, // Default to CGST+SGST
    );

    // Convert cart items to order items
    for (int i = 0; i < _items.length; i++) {
      final cartItem = _items[i];
      order.items.add(OrderItem(
        orderId: 0, // Will be set when order is saved
        menuItemId: cartItem.menuItem.id!,
        quantity: cartItem.quantity,
        unitPrice: cartItem.menuItem.price,
        totalPrice: cartItem.totalPrice,
        notes: cartItem.notes,
      ));
    }

    return order;
  }

  void clear() {
    _items.clear();
    _selectedTableId = null;
    _customerName = null;
    _customerPhone = null;
    _customerGstin = null;
    _discount = 0.0;
    _paymentMethod = null;
    notifyListeners();
  }

  CartItem? getItem(int index) {
    if (index >= 0 && index < _items.length) {
      return _items[index];
    }
    return null;
  }

  bool hasItem(int menuItemId) {
    return _items.any((item) => item.menuItem.id == menuItemId);
  }

  int getItemQuantity(int menuItemId) {
    final cartItem = _items.firstWhere(
      (item) => item.menuItem.id == menuItemId,
      orElse: () => CartItem(menuItem: MenuItem(name: '', price: 0), quantity: 0),
    );
    return cartItem.quantity;
  }
}