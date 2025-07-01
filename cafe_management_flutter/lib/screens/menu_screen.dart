import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/menu_provider.dart';
import '../providers/auth_provider.dart';
import '../models/menu_item.dart';
import '../models/category.dart';

class MenuScreen extends StatefulWidget {
  const MenuScreen({Key? key}) : super(key: key);

  @override
  State<MenuScreen> createState() => _MenuScreenState();
}

class _MenuScreenState extends State<MenuScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<MenuProvider>().loadAll();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        title: const Text('Menu Management'),
        backgroundColor: const Color(0xFF8B4513),
        foregroundColor: Colors.white,
        actions: [
          Consumer<AuthProvider>(
            builder: (context, authProvider, child) {
              if (authProvider.hasPermission('manage_menu')) {
                return IconButton(
                  onPressed: () => _showAddMenuItemDialog(),
                  icon: const Icon(Icons.add),
                );
              }
              return const SizedBox.shrink();
            },
          ),
        ],
      ),
      body: Consumer<MenuProvider>(
        builder: (context, menuProvider, child) {
          if (menuProvider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (menuProvider.errorMessage != null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.error, size: 64, color: Colors.red[300]),
                  const SizedBox(height: 16),
                  Text(
                    'Error loading menu',
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                  const SizedBox(height: 8),
                  Text(menuProvider.errorMessage!),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => menuProvider.loadAll(),
                    child: const Text('Retry'),
                  ),
                ],
              ),
            );
          }

          return Column(
            children: [
              // Stats Cards
              _buildStatsCards(menuProvider),
              
              // Menu Items List
              Expanded(
                child: _buildMenuItemsList(menuProvider),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildStatsCards(MenuProvider menuProvider) {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Expanded(
            child: _buildStatCard(
              'Total Items',
              menuProvider.menuItems.length.toString(),
              Icons.restaurant_menu,
              Colors.blue,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: _buildStatCard(
              'Available',
              menuProvider.availableMenuItems.length.toString(),
              Icons.check_circle,
              Colors.green,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: _buildStatCard(
              'Low Stock',
              menuProvider.lowStockItems.length.toString(),
              Icons.warning,
              Colors.orange,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: _buildStatCard(
              'Out of Stock',
              menuProvider.outOfStockItems.length.toString(),
              Icons.error,
              Colors.red,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Icon(icon, size: 32, color: color),
            const SizedBox(height: 8),
            Text(
              value,
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            Text(
              title,
              style: Theme.of(context).textTheme.bodySmall,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMenuItemsList(MenuProvider menuProvider) {
    if (menuProvider.menuItems.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.restaurant_menu, size: 64, color: Colors.grey),
            SizedBox(height: 16),
            Text(
              'No menu items found',
              style: TextStyle(fontSize: 18, color: Colors.grey),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: menuProvider.menuItems.length,
      itemBuilder: (context, index) {
        final menuItem = menuProvider.menuItems[index];
        return _buildMenuItemCard(menuItem, menuProvider);
      },
    );
  }

  Widget _buildMenuItemCard(MenuItem menuItem, MenuProvider menuProvider) {
    final isOutOfStock = menuItem.stockQuantity <= 0;
    final isLowStock = menuItem.stockQuantity <= 5 && menuItem.stockQuantity > 0;

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: ListTile(
        leading: Container(
          width: 60,
          height: 60,
          decoration: BoxDecoration(
            color: Colors.grey[200],
            borderRadius: BorderRadius.circular(8),
          ),
          child: const Icon(Icons.restaurant, color: Colors.grey),
        ),
        title: Text(
          menuItem.name,
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (menuItem.description != null)
              Text(menuItem.description!),
            const SizedBox(height: 4),
            Row(
              children: [
                Text(
                  '₹${menuItem.price.toStringAsFixed(2)}',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF8B4513),
                  ),
                ),
                const SizedBox(width: 16),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: isOutOfStock 
                        ? Colors.red 
                        : isLowStock 
                            ? Colors.orange 
                            : Colors.green,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    'Stock: ${menuItem.stockQuantity}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
        trailing: Consumer<AuthProvider>(
          builder: (context, authProvider, child) {
            if (authProvider.hasPermission('manage_menu')) {
              return PopupMenuButton<String>(
                onSelected: (value) {
                  switch (value) {
                    case 'edit':
                      _showEditMenuItemDialog(menuItem, menuProvider);
                      break;
                    case 'stock':
                      _showUpdateStockDialog(menuItem, menuProvider);
                      break;
                  }
                },
                itemBuilder: (context) => [
                  const PopupMenuItem(
                    value: 'edit',
                    child: Row(
                      children: [
                        Icon(Icons.edit),
                        SizedBox(width: 8),
                        Text('Edit'),
                      ],
                    ),
                  ),
                  const PopupMenuItem(
                    value: 'stock',
                    child: Row(
                      children: [
                        Icon(Icons.inventory),
                        SizedBox(width: 8),
                        Text('Update Stock'),
                      ],
                    ),
                  ),
                ],
              );
            }
            return const SizedBox.shrink();
          },
        ),
      ),
    );
  }

  void _showAddMenuItemDialog() {
    // Implementation for add menu item dialog
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Add menu item feature coming soon')),
    );
  }

  void _showEditMenuItemDialog(MenuItem menuItem, MenuProvider menuProvider) {
    // Implementation for edit menu item dialog
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Edit menu item feature coming soon')),
    );
  }

  void _showUpdateStockDialog(MenuItem menuItem, MenuProvider menuProvider) {
    final stockController = TextEditingController(
      text: menuItem.stockQuantity.toString(),
    );

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Update Stock - ${menuItem.name}'),
        content: TextField(
          controller: stockController,
          decoration: const InputDecoration(
            labelText: 'Stock Quantity',
            border: OutlineInputBorder(),
          ),
          keyboardType: TextInputType.number,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              final newStock = int.tryParse(stockController.text);
              if (newStock != null && newStock >= 0) {
                menuItem.stockQuantity = newStock;
                await menuProvider.updateMenuItem(menuItem);
                Navigator.pop(context);
                
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Stock updated successfully'),
                    backgroundColor: Colors.green,
                  ),
                );
              } else {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Please enter a valid stock quantity'),
                    backgroundColor: Colors.red,
                  ),
                );
              }
            },
            child: const Text('Update'),
          ),
        ],
      ),
    );
  }
}