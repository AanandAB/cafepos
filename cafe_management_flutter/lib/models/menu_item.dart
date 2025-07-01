class MenuItem {
  int? id;
  String name;
  String? description;
  double price;
  int? categoryId;
  double taxRate;
  bool available;
  String? imageUrl;
  int stockQuantity;

  MenuItem({
    this.id,
    required this.name,
    this.description,
    required this.price,
    this.categoryId,
    this.taxRate = 18.0, // Default GST rate
    this.available = true,
    this.imageUrl,
    this.stockQuantity = 0,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'price': price,
      'categoryId': categoryId,
      'taxRate': taxRate,
      'available': available ? 1 : 0,
      'imageUrl': imageUrl,
      'stockQuantity': stockQuantity,
    };
  }

  factory MenuItem.fromMap(Map<String, dynamic> map) {
    return MenuItem(
      id: map['id'],
      name: map['name'],
      description: map['description'],
      price: map['price'].toDouble(),
      categoryId: map['categoryId'],
      taxRate: map['taxRate']?.toDouble() ?? 18.0,
      available: map['available'] == 1,
      imageUrl: map['imageUrl'],
      stockQuantity: map['stockQuantity'] ?? 0,
    );
  }

  double get taxAmount => price * (taxRate / 100);
  double get totalPrice => price + taxAmount;
}