import 'package:flutter/foundation.dart';
import '../core/services/api_service.dart';
import '../core/utils/json_utils.dart';

class StaffPerformanceItem {
  final int id;
  final String name;
  final String email;
  final String role;
  final int shiftsCount;
  final double totalHours;
  final int totalOrders;
  final double totalSales;
  final double totalTips;
  final double avgOrderDuration;

  StaffPerformanceItem({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    required this.shiftsCount,
    required this.totalHours,
    required this.totalOrders,
    required this.totalSales,
    required this.totalTips,
    required this.avgOrderDuration,
  });

  factory StaffPerformanceItem.fromJson(Map<String, dynamic> json) {
    return StaffPerformanceItem(
      id: JsonUtils.parseInt(json['id']),
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      role: json['role'] ?? 'staff',
      shiftsCount: JsonUtils.parseInt(json['shifts_count']),
      totalHours: JsonUtils.parseDouble(json['total_hours']),
      totalOrders: JsonUtils.parseInt(json['total_orders']),
      totalSales: JsonUtils.parseDouble(json['total_sales']),
      totalTips: JsonUtils.parseDouble(json['total_tips']),
      avgOrderDuration: JsonUtils.parseDouble(json['avg_order_duration']),
    );
  }
}

class StaffPerformanceProvider extends ChangeNotifier {
  final ApiService _apiService;

  List<StaffPerformanceItem> _staffList = [];
  bool _isLoading = false;
  String? _error;

  StaffPerformanceProvider({required ApiService apiService}) : _apiService = apiService;

  List<StaffPerformanceItem> get staffList => _staffList;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchPerformance() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await _apiService.get('/staff/performance');
      if (res != null && res['success'] == true) {
        final List<dynamic> list = res['staff'] ?? [];
        _staffList = list.map((json) => StaffPerformanceItem.fromJson(json as Map<String, dynamic>)).toList();
      } else {
        _error = res?['message'] ?? 'Failed to load staff performance';
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> addStaff({
    required String name,
    required String email,
    required String password,
    required String role,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await _apiService.post('/staff', {
        'name': name,
        'email': email,
        'password': password,
        'role': role,
      });

      if (res != null && res['success'] == true) {
        await fetchPerformance(); // Refresh list
        return true;
      } else {
        _error = res?['message'] ?? 'Failed to add staff member';
        return false;
      }
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> updateStaff({
    required int id,
    required String name,
    required String email,
    String? password,
    required String role,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final payload = {
        'name': name,
        'email': email,
        'role': role,
        if (password != null && password.isNotEmpty) 'password': password,
      };

      final res = await _apiService.put('/staff/$id', payload);

      if (res != null && res['success'] == true) {
        await fetchPerformance(); // Refresh list
        return true;
      } else {
        _error = res?['message'] ?? 'Failed to update staff member';
        return false;
      }
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> deleteStaff(int id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final success = await _apiService.delete('/staff/$id');

      if (success) {
        await fetchPerformance(); // Refresh list
        return true;
      } else {
        _error = 'Failed to remove staff member';
        return false;
      }
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
