import 'package:flutter/foundation.dart';
import '../models/customer_model.dart';
import '../core/services/api_service.dart';

class CustomersProvider extends ChangeNotifier {
  final ApiService apiService;
  
  CustomersProvider({required this.apiService});
  
  List<CustomerModel> _customers = [];
  bool _isLoading = false;
  String? _error;

  List<CustomerModel> get customers => _customers;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchCustomers() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await apiService.getCustomers();
      if (response != null) {
        _customers = response.map((data) => CustomerModel.fromJson(data)).toList();
      } else {
        _error = 'Failed to load customers';
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  CustomerModel? getCustomerById(int id) {
    try {
      return _customers.firstWhere((c) => c.id == id);
    } catch (e) {
      return null;
    }
  }
}
