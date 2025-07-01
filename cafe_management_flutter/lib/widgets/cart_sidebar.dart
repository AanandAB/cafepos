import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/cart_provider.dart';
import '../providers/auth_provider.dart';
import '../services/database_service.dart';
import '../models/order.dart';

class CartSidebar extends StatefulWidget {
  const CartSidebar({Key? key}) : super(key: key);

  @override
  State<CartSidebar> createState() => _CartSidebarState();
}

class _CartSidebarState extends State<CartSidebar> {
  final _customerNameController = TextEditingController();
  final _customerPhoneController = TextEditingController();
  PaymentMethod? _selectedPaymentMethod;
  bool _isProcessing = false;

  @override
  Widget build(BuildContext context) {
    return Consumer<CartProvider>(
      builder: (context, cartProvider, child) {
        if (cartProvider.isEmpty) {
          return _buildEmptyCart();
        }

        return Column(
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Order Summary',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  TextButton(
                    onPressed: cartProvider.isEmpty ? null : () {
                      _showClearCartDialog(context, cartProvider);
                    },
                    child: const Text('Clear All'),
                  ),
                ],
              ),
            ),

            // Cart Items
            Expanded(
              child: ListView.builder(
                itemCount: cartProvider.items.length,
                itemBuilder: (context, index) {
                  final cartItem = cartProvider.items[index];
                  return _buildCartItem(cartItem, index, cartProvider);
                },
              ),
            ),

            // Customer Info Section
            _buildCustomerInfoSection(cartProvider),

            // Payment Method Section
            _buildPaymentMethodSection(cartProvider),

            // Order Summary
            _buildOrderSummary(cartProvider),

            // Checkout Button
            _buildCheckoutButton(cartProvider),
          ],
        );
      },
    );
  }

  Widget _buildEmptyCart() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.shopping_cart_outlined,
            size: 64,
            color: Colors.grey,
          ),
          SizedBox(height: 16),
          Text(
            'Your cart is empty',
            style: TextStyle(
              fontSize: 18,
              color: Colors.grey,
            ),
          ),
          SizedBox(height: 8),
          Text(
            'Add items from the menu to get started',
            style: TextStyle(
              color: Colors.grey,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCartItem(CartItem cartItem, int index, CartProvider cartProvider) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        cartItem.menuItem.name,
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                      if (cartItem.notes != null && cartItem.notes!.isNotEmpty)
                        Padding(
                          padding: const EdgeInsets.only(top: 4),
                          child: Text(
                            'Note: ${cartItem.notes}',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[600],
                              fontStyle: FontStyle.italic,
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
                Text(
                  '₹${cartItem.totalPrice.toStringAsFixed(2)}',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                    color: Color(0xFF8B4513),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    IconButton(
                      onPressed: () {
                        if (cartItem.quantity > 1) {
                          cartProvider.updateQuantity(index, cartItem.quantity - 1);
                        } else {
                          cartProvider.removeItem(index);
                        }
                      },
                      icon: const Icon(Icons.remove),
                      iconSize: 20,
                      constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                      decoration: BoxDecoration(
                        border: Border.all(color: Colors.grey[300]!),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        cartItem.quantity.toString(),
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                    IconButton(
                      onPressed: () {
                        cartProvider.updateQuantity(index, cartItem.quantity + 1);
                      },
                      icon: const Icon(Icons.add),
                      iconSize: 20,
                      constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
                    ),
                  ],
                ),
                Row(
                  children: [
                    TextButton(
                      onPressed: () => _showNotesDialog(context, cartProvider, index),
                      child: const Text('Note'),
                    ),
                    IconButton(
                      onPressed: () => cartProvider.removeItem(index),
                      icon: const Icon(Icons.delete, color: Colors.red),
                      iconSize: 20,
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCustomerInfoSection(CartProvider cartProvider) {
    return Card(
      margin: const EdgeInsets.all(16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Customer Information',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _customerNameController,
              decoration: const InputDecoration(
                labelText: 'Customer Name (Optional)',
                border: OutlineInputBorder(),
                isDense: true,
              ),
              onChanged: (value) {
                cartProvider.setCustomerInfo(name: value.isEmpty ? null : value);
              },
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _customerPhoneController,
              decoration: const InputDecoration(
                labelText: 'Phone Number (Optional)',
                border: OutlineInputBorder(),
                isDense: true,
              ),
              keyboardType: TextInputType.phone,
              onChanged: (value) {
                cartProvider.setCustomerInfo(phone: value.isEmpty ? null : value);
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPaymentMethodSection(CartProvider cartProvider) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Payment Method',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
            const SizedBox(height: 12),
            Wrap(
              spacing: 8,
              children: PaymentMethod.values.map((method) {
                return ChoiceChip(
                  label: Text(_getPaymentMethodLabel(method)),
                  selected: _selectedPaymentMethod == method,
                  onSelected: (selected) {
                    setState(() {
                      _selectedPaymentMethod = selected ? method : null;
                    });
                    cartProvider.setPaymentMethod(_selectedPaymentMethod);
                  },
                );
              }).toList(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOrderSummary(CartProvider cartProvider) {
    return Card(
      margin: const EdgeInsets.all(16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            _buildSummaryRow('Subtotal', '₹${cartProvider.subtotal.toStringAsFixed(2)}'),
            _buildSummaryRow('Tax', '₹${cartProvider.taxAmount.toStringAsFixed(2)}'),
            if (cartProvider.discount > 0)
              _buildSummaryRow('Discount', '-₹${cartProvider.discount.toStringAsFixed(2)}'),
            const Divider(),
            _buildSummaryRow(
              'Total',
              '₹${cartProvider.total.toStringAsFixed(2)}',
              isTotal: true,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryRow(String label, String value, {bool isTotal = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: isTotal ? 16 : 14,
              fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              fontSize: isTotal ? 16 : 14,
              fontWeight: FontWeight.bold,
              color: isTotal ? const Color(0xFF8B4513) : null,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCheckoutButton(CartProvider cartProvider) {
    return Container(
      padding: const EdgeInsets.all(16),
      child: SizedBox(
        width: double.infinity,
        height: 48,
        child: ElevatedButton(
          onPressed: _isProcessing ? null : () => _processOrder(cartProvider),
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF8B4513),
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
          child: _isProcessing
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    color: Colors.white,
                    strokeWidth: 2,
                  ),
                )
              : Text(
                  'Process Order - ₹${cartProvider.total.toStringAsFixed(2)}',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
        ),
      ),
    );
  }

  Future<void> _processOrder(CartProvider cartProvider) async {
    if (_selectedPaymentMethod == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select a payment method'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() {
      _isProcessing = true;
    });

    try {
      final authProvider = context.read<AuthProvider>();
      final order = cartProvider.createOrder(authProvider.currentUser?.id);
      
      await DatabaseService.insertOrder(order);

      // Clear cart
      cartProvider.clear();
      _customerNameController.clear();
      _customerPhoneController.clear();
      setState(() {
        _selectedPaymentMethod = null;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Order processed successfully!'),
          backgroundColor: Colors.green,
        ),
      );

      // Navigate back or show success dialog
      if (Navigator.canPop(context)) {
        Navigator.pop(context);
      }

    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error processing order: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() {
        _isProcessing = false;
      });
    }
  }

  String _getPaymentMethodLabel(PaymentMethod method) {
    switch (method) {
      case PaymentMethod.cash:
        return 'Cash';
      case PaymentMethod.card:
        return 'Card';
      case PaymentMethod.upi:
        return 'UPI';
      case PaymentMethod.other:
        return 'Other';
    }
  }

  void _showNotesDialog(BuildContext context, CartProvider cartProvider, int index) {
    final textController = TextEditingController(
      text: cartProvider.items[index].notes ?? '',
    );

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Add Note'),
        content: TextField(
          controller: textController,
          decoration: const InputDecoration(
            hintText: 'Enter special instructions...',
            border: OutlineInputBorder(),
          ),
          maxLines: 3,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              cartProvider.updateNotes(index, textController.text.isEmpty ? null : textController.text);
              Navigator.pop(context);
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  void _showClearCartDialog(BuildContext context, CartProvider cartProvider) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Clear Cart'),
        content: const Text('Are you sure you want to clear all items from the cart?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              cartProvider.clear();
              Navigator.pop(context);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            child: const Text('Clear'),
          ),
        ],
      ),
    );
  }
}