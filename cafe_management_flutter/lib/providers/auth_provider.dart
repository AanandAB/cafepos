import 'package:flutter/foundation.dart';
import '../models/user.dart';
import '../services/auth_service.dart';

class AuthProvider extends ChangeNotifier {
  User? _currentUser;
  bool _isLoading = false;
  String? _errorMessage;

  User? get currentUser => _currentUser;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get isLoggedIn => _currentUser != null;

  Future<void> initializeAuth() async {
    _isLoading = true;
    notifyListeners();

    try {
      if (await AuthService.isLoggedIn()) {
        _currentUser = AuthService.currentUser;
      }
    } catch (e) {
      _errorMessage = 'Failed to initialize authentication: ${e.toString()}';
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<bool> login(String username, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final result = await AuthService.login(username, password);
      
      if (result.success) {
        _currentUser = result.user;
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _errorMessage = result.message;
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _errorMessage = 'Login failed: ${e.toString()}';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    _isLoading = true;
    notifyListeners();

    try {
      await AuthService.logout();
      _currentUser = null;
      _errorMessage = null;
    } catch (e) {
      _errorMessage = 'Logout failed: ${e.toString()}';
    }

    _isLoading = false;
    notifyListeners();
  }

  bool hasPermission(String permission) {
    return AuthService.hasPermission(permission);
  }

  Future<bool> changePassword(String oldPassword, String newPassword) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final result = await AuthService.changePassword(oldPassword, newPassword);
      
      if (result.success) {
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _errorMessage = result.message;
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _errorMessage = 'Password change failed: ${e.toString()}';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}