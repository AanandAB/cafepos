class Order {
  int? id;
  int? tableId;
  int? userId;
  OrderStatus status;
  DateTime createdAt;
  DateTime? completedAt;
  double totalAmount;
  double taxAmount;
  TaxType taxType;
  double discount;
  PaymentMethod? paymentMethod;
  String? customerName;
  String? customerPhone;
  String? customerGstin;
  String? invoiceNumber;
  List<OrderItem> items;

  Order({
    this.id,
    this.tableId,
    this.userId,
    this.status = OrderStatus.pending,
    DateTime? createdAt,
    this.completedAt,
    this.totalAmount = 0.0,
    this.taxAmount = 0.0,
    this.taxType = TaxType.cgstSgst,
    this.discount = 0.0,
    this.paymentMethod,
    this.customerName,
    this.customerPhone,
    this.customerGstin,
    this.invoiceNumber,
    List<OrderItem>? items,
  }) : createdAt = createdAt ?? DateTime.now(),
       items = items ?? [];

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'tableId': tableId,
      'userId': userId,
      'status': status.name,
      'createdAt': createdAt.toIso8601String(),
      'completedAt': completedAt?.toIso8601String(),
      'totalAmount': totalAmount,
      'taxAmount': taxAmount,
      'taxType': taxType.name,
      'discount': discount,
      'paymentMethod': paymentMethod?.name,
      'customerName': customerName,
      'customerPhone': customerPhone,
      'customerGstin': customerGstin,
      'invoiceNumber': invoiceNumber,
    };
  }

  factory Order.fromMap(Map<String, dynamic> map) {
    return Order(
      id: map['id'],
      tableId: map['tableId'],
      userId: map['userId'],
      status: OrderStatus.values.firstWhere((e) => e.name == map['status']),
      createdAt: DateTime.parse(map['createdAt']),
      completedAt: map['completedAt'] != null ? DateTime.parse(map['completedAt']) : null,
      totalAmount: map['totalAmount'].toDouble(),
      taxAmount: map['taxAmount'].toDouble(),
      taxType: TaxType.values.firstWhere((e) => e.name == map['taxType']),
      discount: map['discount'].toDouble(),
      paymentMethod: map['paymentMethod'] != null 
          ? PaymentMethod.values.firstWhere((e) => e.name == map['paymentMethod'])
          : null,
      customerName: map['customerName'],
      customerPhone: map['customerPhone'],
      customerGstin: map['customerGstin'],
      invoiceNumber: map['invoiceNumber'],
    );
  }
}

class OrderItem {
  int? id;
  int orderId;
  int menuItemId;
  int quantity;
  double unitPrice;
  double totalPrice;
  String? notes;

  OrderItem({
    this.id,
    required this.orderId,
    required this.menuItemId,
    this.quantity = 1,
    required this.unitPrice,
    required this.totalPrice,
    this.notes,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'orderId': orderId,
      'menuItemId': menuItemId,
      'quantity': quantity,
      'unitPrice': unitPrice,
      'totalPrice': totalPrice,
      'notes': notes,
    };
  }

  factory OrderItem.fromMap(Map<String, dynamic> map) {
    return OrderItem(
      id: map['id'],
      orderId: map['orderId'],
      menuItemId: map['menuItemId'],
      quantity: map['quantity'],
      unitPrice: map['unitPrice'].toDouble(),
      totalPrice: map['totalPrice'].toDouble(),
      notes: map['notes'],
    );
  }
}

enum OrderStatus {
  pending,
  preparing,
  completed,
  cancelled,
}

enum TaxType {
  cgstSgst,
  igst,
}

enum PaymentMethod {
  cash,
  card,
  upi,
  other,
}