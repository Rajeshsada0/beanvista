import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/user_model.dart';
import '../core/services/api_service.dart';
import '../core/services/auth_service.dart';

class AuthProvider extends ChangeNotifier {
  UserModel? _user;
  bool _isLoading = false;
  String? _error;
  bool _initialized = false;

  final ApiService _apiService;
  final AuthService _authService;
  final _secureStorage = const FlutterSecureStorage();

  AuthProvider({
    required ApiService apiService,
    required AuthService authService,
  })  : _apiService = apiService,
        _authService = authService;

  UserModel? get user => _user;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAuthenticated => _user != null;
  bool get initialized => _initialized;

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      // Clear any stale stored auth data before attempting a fresh login
      // so a network failure mid-login never leaves phantom credentials behind.
      await _authService.clearAll();
      _apiService.setToken(null);

      final response = await _apiService.post('/auth/login', {
        'email': email,
        'password': password,
      });

      // Check for API error response
      if (response == null || response['error'] == true) {
        _error = response?['message'] as String? ?? 'Login failed. Please check your connection.';
        _isLoading = false;
        notifyListeners();
        return false;
      }

      if (response['token'] != null) {
        final token = response['token'] as String;
        final userData = response['user'] as Map<String, dynamic>;

        await _authService.saveToken(token);
        await _authService.saveUser(jsonEncode(userData));
        _apiService.setToken(token);

        // Securely store credentials for biometrics support
        await _secureStorage.write(key: 'saved_email', value: email);
        await _secureStorage.write(key: 'saved_password', value: password);

        _user = UserModel.fromJson(userData);
        _isLoading = false;
        notifyListeners();
        return true;
      }

      _error = 'Invalid response from server. Please try again.';
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      // Ensure stale credentials are never left behind on unexpected errors
      await _authService.clearAll();
      _apiService.setToken(null);
      _error = 'Login failed: ${e.toString()}';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> logout() async {
    try {
      await _apiService.post('/auth/logout', {});
    } catch (_) {}

    await _authService.clearAll();
    _apiService.setToken(null);
    _user = null;
    notifyListeners();
  }

  Future<bool> updateProfile({
    required String name,
    required String email,
    String? phone,
    String? password,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.post('/auth/profile', {
        'name': name,
        'email': email,
        if (phone != null) 'phone': phone,
        if (password != null && password.isNotEmpty) 'password': password,
      });

      if (response != null && response['error'] == true) {
        _error = response['message'] as String? ?? 'Failed to update profile';
        _isLoading = false;
        notifyListeners();
        return false;
      }

      if (response != null && response['user'] != null) {
        final userData = response['user'] as Map<String, dynamic>;

        await _authService.saveUser(jsonEncode(userData));
        _user = UserModel.fromJson(userData);

        if (password != null && password.isNotEmpty) {
          await _secureStorage.write(key: 'saved_password', value: password);
        }
        await _secureStorage.write(key: 'saved_email', value: email);

        _isLoading = false;
        notifyListeners();
        return true;
      }

      _error = 'Invalid response from server. Please try again.';
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      _error = 'Update failed: ${e.toString()}';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<void> tryAutoLogin() async {
    _isLoading = true;
    notifyListeners();

    try {
      final token = await _authService.getToken();
      final userJson = await _authService.getUser();

      if (token != null && token.isNotEmpty && userJson != null) {
        _apiService.setToken(token);

        // Validate token with a live server user check.
        // /auth/user returns 200 with user data if active, or 401/403 if token or tenant is deleted.
        final validation = await _apiService.get('/auth/user');

        final isValid = validation != null && validation['error'] != true && validation['user'] != null;

        if (isValid) {
          // Token confirmed valid — restore user session from fresh server data
          try {
            final userData = validation['user'] as Map<String, dynamic>;
            await _authService.saveUser(jsonEncode(userData));
            _user = UserModel.fromJson(userData);
          } catch (_) {
            // Corrupt stored user data — force re-login
            await _authService.clearAll();
            _apiService.setToken(null);
            _user = null;
          }
        } else {
          // Server rejected token or tenant was deleted/disabled — clear stored auth
          await _authService.clearAll();
          _apiService.setToken(null);
          _user = null;
        }
      } else {
        // No stored token/user — stay on login screen
        _user = null;
      }
    } catch (e) {
      debugPrint('tryAutoLogin error: $e');
      await _authService.clearAll();
      _apiService.setToken(null);
      _user = null;
    }

    _isLoading = false;
    _initialized = true;
    notifyListeners();
  }

  Future<bool> register({
    required String cafeName,
    required String name,
    required String email,
    required String phoneCode,
    required String phone,
    required String password,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.register({
        'cafe_name': cafeName,
        'name': name,
        'email': email,
        'phone_code': phoneCode,
        'phone': phone,
        'password': password,
      });

      if (response != null && response['error'] == true) {
        _error = response['message'] as String? ?? 'Registration failed';
        _isLoading = false;
        notifyListeners();
        return false;
      }

      if (response != null && response['token'] != null) {
        final token = response['token'] as String;
        final userData = response['user'] as Map<String, dynamic>;

        await _authService.saveToken(token);
        await _authService.saveUser(jsonEncode(userData));
        _apiService.setToken(token);

        // Securely store credentials for biometrics support
        await _secureStorage.write(key: 'saved_email', value: email);
        await _secureStorage.write(key: 'saved_password', value: password);

        _user = UserModel.fromJson(userData);
        _isLoading = false;
        notifyListeners();
        return true;
      }

      _error = 'Invalid response from server. Please try again.';
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      _error = 'Registration failed: ${e.toString()}';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> sendPasswordResetEmail(String email) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.post('/auth/forgot-password', {
        'email': email,
      });

      if (response == null || response['error'] == true) {
        _error = response?['message'] as String? ?? 'Failed to send password reset link.';
        _isLoading = false;
        notifyListeners();
        return false;
      }

      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = 'Failed: ${e.toString()}';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> resendVerificationEmail() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.post('/auth/email/verification-notification', {});

      if (response == null || response['error'] == true) {
        _error = response?['message'] as String? ?? 'Failed to send verification email.';
        _isLoading = false;
        notifyListeners();
        return false;
      }

      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = 'Failed: ${e.toString()}';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> checkVerificationStatus() async {
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.get('/auth/user');

      if (response == null || response['error'] == true) {
        _error = response?['message'] as String? ?? 'Failed to check verification status.';
        notifyListeners();
        return false;
      }

      if (response['user'] != null) {
        final userData = response['user'] as Map<String, dynamic>;
        await _authService.saveUser(jsonEncode(userData));
        _user = UserModel.fromJson(userData);
        notifyListeners();
        return _user?.isVerified ?? false;
      }

      return false;
    } catch (e) {
      _error = 'Failed: ${e.toString()}';
      notifyListeners();
      return false;
    }
  }
}
