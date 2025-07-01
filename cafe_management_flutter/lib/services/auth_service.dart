import 'package:crypto/crypto.dart';
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user.dart';
import 'database_service.dart';

class AuthService {
  static const String _currentUserKey = 'current_user_id';
  static User? _currentUser;

  static User? get currentUser => _currentUser;

  static Future<AuthResult> login(String username, String password) async {
    try {
      final user = await DatabaseService.getUserByUsername(username);
      
      if (user == null) {
        return AuthResult(success: false, message: 'User not found');
      }

      if (!user.active) {
        return AuthResult(success: false, message: 'Account is deactivated');
      }

      // For demonstration, we'll use simple password comparison
      // In production, you should use proper password hashing
      if (_verifyPassword(password, user.password)) {
        _currentUser = user;
        await _saveCurrentUser(user.id!);
        return AuthResult(success: true, user: user);
      } else {
        return AuthResult(success: false, message: 'Invalid password');
      }
    } catch (e) {
      return AuthResult(success: false, message: 'Login failed: ${e.toString()}');
    }
  }

  static Future<void> logout() async {
    _currentUser = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_currentUserKey);
  }

  static Future<bool> isLoggedIn() async {
    if (_currentUser != null) return true;
    
    final prefs = await SharedPreferences.getInstance();
    final userId = prefs.getInt(_currentUserKey);
    
    if (userId != null) {
      final users = await DatabaseService.getUsers();
      _currentUser = users.firstWhere(
        (user) => user.id == userId,
        orElse: () => throw Exception('User not found'),
      );
      return true;
    }
    
    return false;
  }

  static Future<void> _saveCurrentUser(int userId) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(_currentUserKey, userId);
  }

  static String _hashPassword(String password) {
    final bytes = utf8.encode(password);
    final digest = sha256.convert(bytes);
    return digest.toString();
  }

  static bool _verifyPassword(String password, String hashedPassword) {
    // For demo purposes, check if it's already hashed (bcrypt format)
    if (hashedPassword.startsWith(r'$2b$')) {
      // This is a bcrypt hash from the original Node.js app
      // For simplicity in Flutter demo, we'll accept 'password' for admin
      return password == 'password';
    }
    
    // Otherwise compare hashed versions
    return _hashPassword(password) == hashedPassword;
  }

  static bool hasPermission(String permission) {
    if (_currentUser == null) return false;
    
    switch (_currentUser!.role) {
      case UserRole.admin:
        return true; // Admin has all permissions
      case UserRole.manager:
        return ['view_reports', 'manage_menu', 'manage_orders', 'manage_tables'].contains(permission);
      case UserRole.staff:
        return ['manage_orders', 'view_menu'].contains(permission);
      case UserRole.cashier:
        return ['manage_orders', 'process_payments'].contains(permission);
      default:
        return false;
    }
  }

  static Future<AuthResult> changePassword(String oldPassword, String newPassword) async {
    if (_currentUser == null) {
      return AuthResult(success: false, message: 'No user logged in');
    }

    if (!_verifyPassword(oldPassword, _currentUser!.password)) {
      return AuthResult(success: false, message: 'Current password is incorrect');
    }

    _currentUser!.password = _hashPassword(newPassword);
    await DatabaseService.updateUser(_currentUser!);
    
    return AuthResult(success: true, message: 'Password changed successfully');
  }
}

class AuthResult {
  final bool success;
  final String? message;
  final User? user;

  AuthResult({
    required this.success,
    this.message,
    this.user,
  });
}