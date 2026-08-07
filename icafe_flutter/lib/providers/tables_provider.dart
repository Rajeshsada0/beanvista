import 'package:flutter/foundation.dart';
import '../core/services/api_service.dart';
import '../core/utils/json_utils.dart';

class TableItem {
  final int id;
  final String number;
  final int capacity;
  final String status;
  final Map<String, dynamic>? order;

  TableItem({
    required this.id,
    required this.number,
    required this.capacity,
    required this.status,
    this.order,
  });

  factory TableItem.fromJson(Map<String, dynamic> json) {
    return TableItem(
      id: JsonUtils.parseInt(json['id']),
      number: json['number'] ?? '',
      capacity: JsonUtils.parseInt(json['capacity'], 1),
      status: json['status'] ?? 'available',
      order: json['order'] != null ? Map<String, dynamic>.from(json['order']) : null,
    );
  }
}

class TablesProvider extends ChangeNotifier {
  final ApiService _apiService;
  List<TableItem> _tables = [];
  bool _isLoading = false;
  String? _error;

  TablesProvider({required ApiService apiService}) : _apiService = apiService;

  List<TableItem> get tables => _tables;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchTables() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.get('/tables');
      if (response != null && response['error'] != true && response['data'] != null) {
        final list = response['data'] as List;
        _tables = list.map((e) => TableItem.fromJson(e as Map<String, dynamic>)).toList();
      }
    } catch (e) {
      _error = 'Failed to fetch tables: $e';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> addTable({
    required String tableNumber,
    required int capacity,
    required String status,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.post('/tables', {
        'table_number': tableNumber,
        'capacity': capacity,
        'status': status,
      });
      _isLoading = false;
      if (response != null && response['success'] == true) {
        _apiService.logActivity(
          'Table Created',
          'Added table $tableNumber ($capacity seats)',
          type: 'table',
        );
        await fetchTables();
        return true;
      } else {
        _error = response?['message'] ?? 'Failed to add table';
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = 'Failed to add table: $e';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> updateTable(
    int tableId, {
    required String tableNumber,
    required int capacity,
    required String status,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.put('/tables/$tableId', {
        'table_number': tableNumber,
        'capacity': capacity,
        'status': status,
      });
      _isLoading = false;
      if (response != null && response['success'] == true) {
        await fetchTables();
        return true;
      } else {
        _error = response?['message'] ?? 'Failed to update table';
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = 'Failed to update table: $e';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> deleteTable(int tableId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final success = await _apiService.delete('/tables/$tableId');
      _isLoading = false;
      if (success) {
        await fetchTables();
        return true;
      } else {
        _error = 'Failed to delete table';
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = 'Failed to delete table: $e';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }
}
