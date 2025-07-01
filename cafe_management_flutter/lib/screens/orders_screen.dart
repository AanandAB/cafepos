import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../services/database_service.dart';
import '../models/order.dart';
import 'package:intl/intl.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({Key? key}) : super(key: key);

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  List<Order> _orders = [];
  bool _isLoading = true;
  String? _errorMessage;
  OrderStatus? _filterStatus;

  @override
  void initState() {
    super.initState();
    _loadOrders();
  }

  Future<void> _loadOrders() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final orders = await DatabaseService.getOrders();
      setState(() {
        _orders = orders;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = 'Failed to load orders: ${e.toString()}';
        _isLoading = false;
      });
    }
  }

  List<Order> get filteredOrders {
    if (_filterStatus == null) {
      return _orders;
    }
    return _orders.where((order) => order.status == _filterStatus).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        title: const Text('Orders'),
        backgroundColor: const Color(0xFF8B4513),
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            onPressed: _loadOrders,
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: Column(
        children: [
          // Filter and Stats
          _buildFilterAndStats(),
          
          // Orders List
          Expanded(
            child: _buildOrdersList(),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterAndStats() {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Status Filter
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                FilterChip(
                  label: const Text('All'),
                  selected: _filterStatus == null,
                  onSelected: (selected) {
                    setState(() {
                      _filterStatus = selected ? null : _filterStatus;
                    });
                  },
                  backgroundColor: Colors.white,
                  selectedColor: const Color(0xFF8B4513),
                  labelStyle: TextStyle(
                    color: _filterStatus == null ? Colors.white : Colors.black,
                  ),
                ),
                const SizedBox(width: 8),
                ...OrderStatus.values.map((status) {
                  final isSelected = _filterStatus == status;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: FilterChip(
                      label: Text(_getStatusLabel(status)),
                      selected: isSelected,
                      onSelected: (selected) {
                        setState(() {
                          _filterStatus = selected ? status : null;
                        });
                      },
                      backgroundColor: Colors.white,
                      selectedColor: _getStatusColor(status),
                      labelStyle: TextStyle(
                        color: isSelected ? Colors.white : Colors.black,
                      ),
                    ),
                  );
                }).toList(),
              ],
            ),
          ),
          
          const SizedBox(height: 16),
          
          // Quick Stats
          Row(
            children: [
              Expanded(
                child: _buildStatCard(
                  'Total',
                  _orders.length.toString(),
                  Colors.blue,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: _buildStatCard(
                  'Pending',
                  _orders.where((o) => o.status == OrderStatus.pending).length.toString(),
                  Colors.orange,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: _buildStatCard(
                  'Preparing',
                  _orders.where((o) => o.status == OrderStatus.preparing).length.toString(),
                  Colors.purple,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: _buildStatCard(
                  'Completed',
                  _orders.where((o) => o.status == OrderStatus.completed).length.toString(),
                  Colors.green,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(String title, String value, Color color) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            Text(
              value,
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            Text(
              title,
              style: const TextStyle(fontSize: 12),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOrdersList() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_errorMessage != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error, size: 64, color: Colors.red[300]),
            const SizedBox(height: 16),
            Text(
              'Error loading orders',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(_errorMessage!),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadOrders,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    final orders = filteredOrders;

    if (orders.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.receipt_long, size: 64, color: Colors.grey),
            SizedBox(height: 16),
            Text(
              'No orders found',
              style: TextStyle(fontSize: 18, color: Colors.grey),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadOrders,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: orders.length,
        itemBuilder: (context, index) {
          final order = orders[index];
          return _buildOrderCard(order);
        },
      ),
    );
  }

  Widget _buildOrderCard(Order order) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Order #${order.id}',
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: _getStatusColor(order.status),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Text(
                    _getStatusLabel(order.status),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            
            const SizedBox(height: 12),
            
            // Order Info
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      if (order.customerName != null)
                        Text(
                          'Customer: ${order.customerName}',
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                      if (order.tableId != null)
                        Text('Table: ${order.tableId}'),
                      Text(
                        'Date: ${DateFormat('MMM dd, yyyy HH:mm').format(order.createdAt)}',
                        style: TextStyle(color: Colors.grey[600]),
                      ),
                      if (order.paymentMethod != null)
                        Text(
                          'Payment: ${_getPaymentMethodLabel(order.paymentMethod!)}',
                          style: TextStyle(color: Colors.grey[600]),
                        ),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      '₹${order.totalAmount.toStringAsFixed(2)}',
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF8B4513),
                      ),
                    ),
                    Text(
                      '${order.items.length} items',
                      style: TextStyle(color: Colors.grey[600]),
                    ),
                  ],
                ),
              ],
            ),
            
            // Order Items (expandable)
            if (order.items.isNotEmpty) ...[
              const SizedBox(height: 12),
              ExpansionTile(
                title: const Text('Order Items'),
                children: order.items.map((item) {
                  return ListTile(
                    title: Text('Item ID: ${item.menuItemId}'), // In real app, show item name
                    subtitle: Text('Notes: ${item.notes ?? 'None'}'),
                    trailing: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text('Qty: ${item.quantity}'),
                        Text(
                          '₹${item.totalPrice.toStringAsFixed(2)}',
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  );
                }).toList(),
              ),
            ],
            
            // Action Buttons
            if (order.status != OrderStatus.completed && order.status != OrderStatus.cancelled)
              Padding(
                padding: const EdgeInsets.only(top: 12),
                child: Consumer<AuthProvider>(
                  builder: (context, authProvider, child) {
                    if (authProvider.hasPermission('manage_orders')) {
                      return Row(
                        mainAxisAlignment: MainAxisAlignment.end,
                        children: [
                          if (order.status == OrderStatus.pending)
                            TextButton(
                              onPressed: () => _updateOrderStatus(order, OrderStatus.preparing),
                              child: const Text('Start Preparing'),
                            ),
                          if (order.status == OrderStatus.preparing)
                            ElevatedButton(
                              onPressed: () => _updateOrderStatus(order, OrderStatus.completed),
                              child: const Text('Mark Complete'),
                            ),
                          const SizedBox(width: 8),
                          TextButton(
                            onPressed: () => _updateOrderStatus(order, OrderStatus.cancelled),
                            style: TextButton.styleFrom(foregroundColor: Colors.red),
                            child: const Text('Cancel'),
                          ),
                        ],
                      );
                    }
                    return const SizedBox.shrink();
                  },
                ),
              ),
          ],
        ),
      ),
    );
  }

  Future<void> _updateOrderStatus(Order order, OrderStatus newStatus) async {
    try {
      order.status = newStatus;
      if (newStatus == OrderStatus.completed) {
        order.completedAt = DateTime.now();
      }
      
      await DatabaseService.updateOrder(order);
      
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Order ${_getStatusLabel(newStatus).toLowerCase()}'),
          backgroundColor: Colors.green,
        ),
      );
      
      // Refresh the orders list
      _loadOrders();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error updating order: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  String _getStatusLabel(OrderStatus status) {
    switch (status) {
      case OrderStatus.pending:
        return 'Pending';
      case OrderStatus.preparing:
        return 'Preparing';
      case OrderStatus.completed:
        return 'Completed';
      case OrderStatus.cancelled:
        return 'Cancelled';
    }
  }

  Color _getStatusColor(OrderStatus status) {
    switch (status) {
      case OrderStatus.pending:
        return Colors.orange;
      case OrderStatus.preparing:
        return Colors.purple;
      case OrderStatus.completed:
        return Colors.green;
      case OrderStatus.cancelled:
        return Colors.red;
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
}