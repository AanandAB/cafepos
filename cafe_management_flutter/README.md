# Café Management System - Flutter

A comprehensive Point of Sale (POS) and management system built with Flutter for cafés, restaurants, and food service businesses. This cross-platform application supports web, mobile (Android/iOS), and desktop (Windows/Linux/macOS) platforms.

## Features

### 🔐 Authentication & User Management
- Role-based access control (Admin, Manager, Staff, Cashier)
- Secure login with session management
- User permissions and access control

### 🛒 Point of Sale (POS) System
- Real-time order processing
- Menu item selection with category filtering
- Shopping cart functionality
- Multiple payment methods (Cash, Card, UPI, Other)
- Table management
- Order status tracking

### 📋 Menu Management
- Menu item CRUD operations
- Category management
- Stock quantity tracking
- Low stock alerts
- Pricing and tax configuration

### 📊 Order Management
- Order status tracking (Pending, Preparing, Completed, Cancelled)
- Order history and filtering
- Customer information management
- Order item details

### 💾 Data Management
- SQLite local database
- Offline-first architecture
- Data persistence and synchronization
- Real-time updates

## Technical Architecture

### Frontend (Flutter)
- **Framework**: Flutter 3.22+ with Dart
- **UI Design**: Material Design 3 with coffee-themed colors
- **State Management**: Provider pattern
- **Database**: SQLite with sqflite
- **Navigation**: Named routes

### Key Dependencies
- `provider` - State management
- `sqflite` - SQLite database
- `shared_preferences` - Local storage
- `intl` - Internationalization and date formatting
- `crypto` - Password hashing and security

## Project Structure

```
lib/
├── main.dart                 # App entry point and configuration
├── models/                   # Data models
│   ├── user.dart
│   ├── menu_item.dart
│   ├── category.dart
│   ├── order.dart
│   └── table.dart
├── services/                 # Business logic services
│   ├── database_service.dart
│   └── auth_service.dart
├── providers/                # State management
│   ├── auth_provider.dart
│   ├── menu_provider.dart
│   └── cart_provider.dart
├── screens/                  # UI screens
│   ├── login_screen.dart
│   ├── dashboard_screen.dart
│   ├── pos_screen.dart
│   ├── menu_screen.dart
│   └── orders_screen.dart
└── widgets/                  # Reusable UI components
    ├── menu_item_card.dart
    └── cart_sidebar.dart
```

## Getting Started

### Prerequisites
- Flutter 3.22 or later
- Dart SDK
- Android Studio / VS Code (for development)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cafe_management_flutter
   ```

2. **Install dependencies**
   ```bash
   flutter pub get
   ```

3. **Run the application**
   ```bash
   # For web
   flutter run -d web-server --web-port=5000 --web-hostname=0.0.0.0
   
   # For mobile (with connected device/emulator)
   flutter run
   
   # For desktop
   flutter run -d windows  # or linux, macos
   ```

### Default Login Credentials
- **Username**: admin
- **Password**: password

## Database Schema

The application uses SQLite with the following main tables:

- **users** - User accounts and roles
- **categories** - Menu item categories
- **menu_items** - Food and beverage items
- **tables** - Restaurant table management
- **orders** - Customer orders
- **order_items** - Individual items in orders

## Features by User Role

### Admin
- Full system access
- User management
- Menu and category management
- Order management
- Reports and analytics

### Manager
- Order management
- Menu management
- Reports viewing
- Table management

### Staff
- Order taking
- Menu viewing
- Basic order management

### Cashier
- Order processing
- Payment handling
- Basic menu viewing

## Building for Production

### Web
```bash
flutter build web
```

### Android
```bash
flutter build apk
# or
flutter build appbundle
```

### iOS
```bash
flutter build ios
```

### Desktop
```bash
# Windows
flutter build windows

# macOS
flutter build macos

# Linux
flutter build linux
```

## Configuration

### Database
The SQLite database is automatically created and initialized on first run with:
- Default admin user
- Sample categories (Beverages, Food, Desserts)
- Sample tables

### Customization
- Modify colors in `main.dart` (Color(0xFF8B4513) - coffee brown theme)
- Update app branding in `pubspec.yaml`
- Configure payment methods in cart provider

## API Reference

### Core Services

#### DatabaseService
- `getUsers()` - Retrieve all users
- `getMenuItems()` - Retrieve menu items
- `getOrders()` - Retrieve orders
- `insertOrder(order)` - Create new order
- `updateOrder(order)` - Update order status

#### AuthService
- `login(username, password)` - User authentication
- `logout()` - End user session
- `hasPermission(permission)` - Check user permissions

## Troubleshooting

### Common Issues

1. **Dependencies not resolving**
   ```bash
   flutter clean
   flutter pub get
   ```

2. **Database errors**
   - Clear app data to reset database
   - Check SQLite permissions

3. **Build errors**
   ```bash
   flutter doctor
   flutter upgrade
   ```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Check the documentation
- Review the code comments
- Open an issue in the repository

## Roadmap

### Planned Features
- [ ] Advanced reporting and analytics
- [ ] Cloud synchronization
- [ ] Multi-location support
- [ ] Advanced inventory management
- [ ] Customer loyalty program
- [ ] Integration with payment gateways
- [ ] Receipt printing
- [ ] Barcode/QR code scanning

---

**Version**: 1.0.0  
**Last Updated**: July 2025  
**Minimum Flutter Version**: 3.22.0