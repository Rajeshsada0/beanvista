import 'package:flutter/foundation.dart';
import '../core/services/api_service.dart';
import '../core/utils/json_utils.dart';

class TaxItem {
  final int id;
  final String name;
  final double rate;
  final bool status;

  TaxItem({
    required this.id,
    required this.name,
    required this.rate,
    required this.status,
  });

  factory TaxItem.fromJson(Map<String, dynamic> json) {
    return TaxItem(
      id: JsonUtils.parseInt(json['id']),
      name: json['name'] ?? '',
      rate: JsonUtils.parseDouble(json['rate']),
      status: json['status'] == true || json['status'] == 1 || json['status'] == '1',
    );
  }
}

class TaxesProvider extends ChangeNotifier {
  final ApiService _apiService;

  List<TaxItem> _taxes = [];
  bool _isLoading = false;
  String? _error;

  TaxesProvider({required ApiService apiService}) : _apiService = apiService;

  List<TaxItem> get taxes => _taxes;
  bool get isLoading => _isLoading;
  String? get error => _error;

  double get activeTaxRate {
    return _taxes
        .where((t) => t.status)
        .fold(0.0, (sum, t) => sum + (t.rate / 100));
  }

  Future<void> fetchTaxes() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await _apiService.get('/taxes');
      if (res != null && res['success'] == true) {
        final List<dynamic> list = res['taxes'] ?? [];
        _taxes = list.map((json) => TaxItem.fromJson(json as Map<String, dynamic>)).toList();
      } else {
        _error = res?['message'] ?? 'Failed to load taxes';
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> storeTax(String name, double rate, bool status) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final res = await _apiService.post('/taxes', {
        'name': name,
        'rate': rate,
        'status': status,
      });
      if (res != null && res['success'] == true) {
        await fetchTaxes();
        return true;
      }
      _error = res?['message'] ?? 'Failed to create tax';
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
    return false;
  }

  Future<bool> updateTax(int id, String name, double rate, bool status) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final res = await _apiService.put('/taxes/$id', {
        'name': name,
        'rate': rate,
        'status': status,
      });
      if (res != null && res['success'] == true) {
        await fetchTaxes();
        return true;
      }
      _error = res?['message'] ?? 'Failed to update tax';
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
    return false;
  }

  Future<bool> deleteTax(int id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final success = await _apiService.delete('/taxes/$id');
      if (success) {
        await fetchTaxes();
        return true;
      }
      _error = 'Failed to delete tax';
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
    return false;
  }
}
