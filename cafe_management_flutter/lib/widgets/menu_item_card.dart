import 'package:flutter/material.dart';
import '../models/menu_item.dart';

class MenuItemCard extends StatelessWidget {
  final MenuItem menuItem;
  final VoidCallback onAddToCart;

  const MenuItemCard({
    Key? key,
    required this.menuItem,
    required this.onAddToCart,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final isOutOfStock = menuItem.stockQuantity <= 0;
    final isLowStock = menuItem.stockQuantity <= 5 && menuItem.stockQuantity > 0;

    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Image Section
          Expanded(
            flex: 2,
            child: Container(
              width: double.infinity,
              decoration: BoxDecoration(
                borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                color: Colors.grey[200],
              ),
              child: Stack(
                children: [
                  // Placeholder image or actual image
                  Center(
                    child: menuItem.imageUrl != null
                        ? ClipRRect(
                            borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                            child: Image.network(
                              menuItem.imageUrl!,
                              width: double.infinity,
                              height: double.infinity,
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) => _buildPlaceholderImage(),
                            ),
                          )
                        : _buildPlaceholderImage(),
                  ),
                  
                  // Stock status indicator
                  if (isOutOfStock || isLowStock)
                    Positioned(
                      top: 8,
                      right: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: isOutOfStock ? Colors.red : Colors.orange,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          isOutOfStock ? 'Out of Stock' : 'Low Stock',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
          
          // Content Section
          Expanded(
            flex: 3,
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Name
                  Text(
                    menuItem.name,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  
                  // Description
                  if (menuItem.description != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      menuItem.description!,
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[600],
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                  
                  const Spacer(),
                  
                  // Stock quantity
                  Text(
                    'Stock: ${menuItem.stockQuantity}',
                    style: TextStyle(
                      fontSize: 12,
                      color: isOutOfStock ? Colors.red : isLowStock ? Colors.orange : Colors.green,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  
                  const SizedBox(height: 8),
                  
                  // Price and Add Button
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '₹${menuItem.price.toStringAsFixed(2)}',
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF8B4513),
                            ),
                          ),
                          if (menuItem.taxRate > 0)
                            Text(
                              '+${menuItem.taxRate}% tax',
                              style: TextStyle(
                                fontSize: 10,
                                color: Colors.grey[600],
                              ),
                            ),
                        ],
                      ),
                      
                      ElevatedButton(
                        onPressed: isOutOfStock ? null : onAddToCart,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF8B4513),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.add, size: 16),
                            SizedBox(width: 4),
                            Text('Add', style: TextStyle(fontSize: 12)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPlaceholderImage() {
    return Container(
      width: double.infinity,
      height: double.infinity,
      decoration: BoxDecoration(
        borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
        color: Colors.grey[300],
      ),
      child: const Icon(
        Icons.restaurant,
        size: 48,
        color: Colors.grey,
      ),
    );
  }
}