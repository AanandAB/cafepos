import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/menu_provider.dart';
import '../providers/cart_provider.dart';
import '../providers/auth_provider.dart';
import '../models/menu_item.dart';
import '../models/order.dart';
import '../services/database_service.dart';
import '../widgets/menu_item_card.dart';
import '../widgets/cart_sidebar.dart';

class POSScreen extends StatefulWidget {
  const POSScreen({Key? key}) : super(key: key);

  @override
  State<POSScreen> createState() => _POSScreenState();
}

class _POSScreenState extends State<POSScreen> {
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
        title: const Text(
          'Point of Sale',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: const Color(0xFF8B4513),
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          Consumer<CartProvider>(
            builder: (context, cartProvider, child) {
              return IconButton(
                icon: Badge(
                  label: Text(cartProvider.itemCount.toString()),
                  child: const Icon(Icons.shopping_cart),
                ),
                onPressed: () => _showCartSidebar(),
              );
            },
          ),
        ],
      ),
      body: Row(
        children: [
          // Menu Section
          Expanded(
            flex: 3,
            child: _buildMenuSection(),
          ),
          
          // Cart Section (visible on larger screens)
          if (MediaQuery.of(context).size.width > 800)
            Container(
              width: 350,
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey[300]!),
              ),
              child: const CartSidebar(),
            ),
        ],
      ),
      floatingActionButton: MediaQuery.of(context).size.width <= 800
          ? Consumer<CartProvider>(
              builder: (context, cartProvider, child) {
                if (cartProvider.isEmpty) return const SizedBox.shrink();
                
                return FloatingActionButton.extended(
                  onPressed: _showCartSidebar,
                  backgroundColor: const Color(0xFF8B4513),
                  foregroundColor: Colors.white,
                  icon: Badge(
                    label: Text(cartProvider.itemCount.toString()),
                    child: const Icon(Icons.shopping_cart),
                  ),
                  label: Text('₹${cartProvider.total.toStringAsFixed(2)}'),
                );
              },
            )
          : null,
    );
  }

  Widget _buildMenuSection() {
    return Consumer<MenuProvider>(
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
                Text(
                  menuProvider.errorMessage!,
                  style: Theme.of(context).textTheme.bodyMedium,
                  textAlign: TextAlign.center,
                ),
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
            // Category Filter
            _buildCategoryFilter(menuProvider),
            
            // Menu Items Grid
            Expanded(
              child: _buildMenuGrid(menuProvider),
            ),
          ],
        );
      },
    );
  }

  Widget _buildCategoryFilter(MenuProvider menuProvider) {
    return Container(
      padding: const EdgeInsets.all(16),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            FilterChip(
              label: const Text('All Items'),
              selected: menuProvider.selectedCategoryId == null,
              onSelected: (selected) {
                if (selected) {
                  menuProvider.clearSelectedCategory();
                }
              },
              backgroundColor: Colors.white,
              selectedColor: const Color(0xFF8B4513),
              labelStyle: TextStyle(
                color: menuProvider.selectedCategoryId == null
                    ? Colors.white
                    : Colors.black,
              ),
            ),
            const SizedBox(width: 8),
            ...menuProvider.categories.map((category) {
              final isSelected = menuProvider.selectedCategoryId == category.id;
              return Padding(
                padding: const EdgeInsets.only(right: 8),
                child: FilterChip(
                  label: Text(category.name),
                  selected: isSelected,
                  onSelected: (selected) {
                    if (selected) {
                      menuProvider.setSelectedCategory(category.id);
                    } else {
                      menuProvider.clearSelectedCategory();
                    }
                  },
                  backgroundColor: Colors.white,
                  selectedColor: const Color(0xFF8B4513),
                  labelStyle: TextStyle(
                    color: isSelected ? Colors.white : Colors.black,
                  ),
                ),
              );
            }).toList(),
          ],
        ),
      ),
    );
  }

  Widget _buildMenuGrid(MenuProvider menuProvider) {
    final filteredItems = menuProvider.filteredMenuItems;

    if (filteredItems.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.restaurant_menu, size: 64, color: Colors.grey),
            SizedBox(height: 16),
            Text(
              'No menu items available',
              style: TextStyle(fontSize: 18, color: Colors.grey),
            ),
          ],
        ),
      );
    }

    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: _getCrossAxisCount(context),
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
        childAspectRatio: 0.8,
      ),
      itemCount: filteredItems.length,
      itemBuilder: (context, index) {
        final menuItem = filteredItems[index];
        return MenuItemCard(
          menuItem: menuItem,
          onAddToCart: () => _addToCart(menuItem),
        );
      },
    );
  }

  int _getCrossAxisCount(BuildContext context) {
    final width = MediaQuery.of(context).size.width;
    if (width > 1200) return 4;
    if (width > 800) return 3;
    if (width > 600) return 2;
    return 1;
  }

  void _addToCart(MenuItem menuItem) {
    if (menuItem.stockQuantity <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${menuItem.name} is out of stock'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    context.read<CartProvider>().addItem(menuItem);
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${menuItem.name} added to cart'),
        duration: const Duration(seconds: 1),
        backgroundColor: Colors.green,
      ),
    );
  }

  void _showCartSidebar() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        builder: (context, scrollController) => Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Order Summary',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.close),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: SingleChildScrollView(
                  controller: scrollController,
                  child: const CartSidebar(),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}