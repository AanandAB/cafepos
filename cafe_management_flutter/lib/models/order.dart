import 'package:hive/hive.dart';

part 'order.g.dart';

@HiveType(typeId: 4)
class Order extends HiveObject {
  @HiveField(0)
  int? id;

  @HiveField(1)
  int? tableId;

  @HiveField(2)
  int? userId;

  @HiveField(3)
  OrderStatus status;

  @HiveField(4)
  DateTime createdAt;

  @HiveField(5)
  DateTime? completedAt;

  @HiveField(6)
  double totalAmount;

  @HiveField(7)
  double taxAmount;

  @HiveField(8)
  TaxType taxType;

  @HiveField(9)
  double discount;

  @HiveField(10)
  PaymentMethod? paymentMethod;

  @HiveField(11)
  String? customerName;

  @HiveField(12)
  String? customerPhone;

  @HiveField(13)
  String? customerGstin;

  @HiveField(14)
  String? invoiceNumber;

  @HiveField(15)
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

@HiveType(typeId: 5)
class OrderItem extends HiveObject {
  @HiveField(0)
  int? id;

  @HiveField(1)
  int orderId;

  @HiveField(2)
  int menuItemId;

  @HiveField(3)
  int quantity;

  @HiveField(4)
  double unitPrice;

  @HiveField(5)
  double totalPrice;

  @HiveField(6)
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

@HiveType(typeId: 6)
enum OrderStatus {
  @HiveField(0)
  pending,
  @HiveField(1)
  preparing,
  @HiveField(2)
  completed,
  @HiveField(3)
  cancelled,
}

@HiveType(typeId: 7)
enum TaxType {
  @HiveField(0)
  cgstSgst,
  @HiveField(1)
  igst,
}

@HiveType(typeId: 8)
enum PaymentMethod {
  @HiveField(0)
  cash,
  @HiveField(1)
  card,
  @HiveField(2)
  upi,
  @HiveField(3)
  other,
}