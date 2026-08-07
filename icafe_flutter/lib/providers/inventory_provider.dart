import 'package:flutter/foundation.dart';
import '../core/services/api_service.dart';

class InventoryProvider extends ChangeNotifier {
  final ApiService _apiService;
  
  List<Map<String, dynamic>> _items = [];
  List<Map<String, dynamic>> _purchases = [];
  List<Map<String, dynamic>> _usages = [];
  List<Map<String, dynamic>> _suppliers = [];
  List<Map<String, dynamic>> _groups = [];
  List<Map<String, dynamic>> _units = [];
  List<Map<String, dynamic>> _menus = [];
  List<Map<String, dynamic>> _recipes = [];
  
  bool _isLoading = false;
  String? _error;

  InventoryProvider({required ApiService apiService}) : _apiService = apiService;

  List<Map<String, dynamic>> get items => _items;
  List<Map<String, dynamic>> get purchases => _purchases;
  List<Map<String, dynamic>> get usages => _usages;
  List<Map<String, dynamic>> get suppliers => _suppliers;
  List<Map<String, dynamic>> get groups => _groups;
  List<Map<String, dynamic>> get units => _units;
  List<Map<String, dynamic>> get menus => _menus;
  List<Map<String, dynamic>> get recipes => _recipes;
  
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchInventory() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.get('/inventory');
      if (response != null && response['success'] == true) {
        if (response['items'] != null) {
          _items = List<Map<String, dynamic>>.from(response['items']);
        }
        if (response['purchases'] != null) {
          _purchases = List<Map<String, dynamic>>.from(response['purchases']);
        }
        if (response['usages'] != null) {
          _usages = List<Map<String, dynamic>>.from(response['usages']);
        }
        if (response['suppliers'] != null) {
          _suppliers = List<Map<String, dynamic>>.from(response['suppliers']);
        }
        if (response['groups'] != null) {
          _groups = List<Map<String, dynamic>>.from(response['groups']);
        }
        if (response['units'] != null) {
          _units = List<Map<String, dynamic>>.from(response['units']);
        }
        if (response['menus'] != null) {
          _menus = List<Map<String, dynamic>>.from(response['menus']);
        }
        if (response['recipes'] != null) {
          _recipes = List<Map<String, dynamic>>.from(response['recipes']);
        }
      } else {
        _error = 'Failed to load inventory data';
      }
    } catch (e) {
      _error = 'Failed to fetch inventory: $e';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> createItem({
    required String name,
    required double lowStockThreshold,
    required double currentStock,
    int? stockGroupId,
    int? measuringUnitId,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.post('/inventory/items', {
        'name': name,
        'low_stock_threshold': lowStockThreshold,
        'current_stock': currentStock,
        'stock_group_id': stockGroupId,
        'measuring_unit_id': measuringUnitId,
      });

      if (response != null && response['success'] == true) {
        await fetchInventory();
        return true;
      }
      return false;
    } catch (e) {
      _error = 'Failed to create item: $e';
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> updateItem({
    required int id,
    required String name,
    required double lowStockThreshold,
    required double currentStock,
    int? stockGroupId,
    int? measuringUnitId,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.put('/inventory/items/$id', {
        'name': name,
        'low_stock_threshold': lowStockThreshold,
        'current_stock': currentStock,
        'stock_group_id': stockGroupId,
        'measuring_unit_id': measuringUnitId,
      });

      if (response != null && response['success'] == true) {
        await fetchInventory();
        return true;
      }
      return false;
    } catch (e) {
      _error = 'Failed to update item: $e';
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> deleteItem(int id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.delete('/inventory/items/$id');
      if (response == true) {
        await fetchInventory();
        return true;
      }
      return false;
    } catch (e) {
      _error = 'Failed to delete item: $e';
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> createPurchase({
    required int inventoryItemId,
    int? supplierId,
    required double quantity,
    required double unitPrice,
    required double totalPrice,
    required String purchaseDate,
    String? notes,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.post('/inventory/purchases', {
        'inventory_item_id': inventoryItemId,
        'supplier_id': supplierId,
        'quantity': quantity,
        'unit_price': unitPrice,
        'total_price': totalPrice,
        'purchase_date': purchaseDate,
        'notes': notes,
      });

      if (response != null && response['success'] == true) {
        await fetchInventory();
        return true;
      }
      return false;
    } catch (e) {
      _error = 'Failed to log purchase: $e';
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> createUsage({
    required int inventoryItemId,
    required double quantityUsed,
    required String usageDate,
    String? notes,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.post('/inventory/usages', {
        'inventory_item_id': inventoryItemId,
        'quantity_used': quantityUsed,
        'usage_date': usageDate,
        'notes': notes,
      });

      if (response != null && response['success'] == true) {
        await fetchInventory();
        return true;
      }
      return false;
    } catch (e) {
      _error = 'Failed to log usage: $e';
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> createSupplier({
    required String name,
    String? contactPerson,
    String? phone,
    String? email,
    String? address,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.post('/inventory/suppliers', {
        'name': name,
        'contact_person': contactPerson,
        'phone': phone,
        'email': email,
        'address': address,
      });

      if (response != null && response['success'] == true) {
        await fetchInventory();
        return true;
      }
      return false;
    } catch (e) {
      _error = 'Failed to create supplier: $e';
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> updateSupplier({
    required int id,
    required String name,
    String? contactPerson,
    String? phone,
    String? email,
    String? address,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.put('/inventory/suppliers/$id', {
        'name': name,
        'contact_person': contactPerson,
        'phone': phone,
        'email': email,
        'address': address,
      });

      if (response != null && response['success'] == true) {
        await fetchInventory();
        return true;
      }
      return false;
    } catch (e) {
      _error = 'Failed to update supplier: $e';
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> deleteSupplier(int id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.delete('/inventory/suppliers/$id');

      if (response == true) {
        await fetchInventory();
        return true;
      }
      return false;
    } catch (e) {
      _error = 'Failed to delete supplier: $e';
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> saveRecipe({
    required int menuId,
    required List<Map<String, dynamic>> ingredients,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.post('/inventory/recipes', {
        'menu_id': menuId,
        'ingredients': ingredients,
      });

      if (response != null && response['success'] == true) {
        await fetchInventory();
        return true;
      }
      return false;
    } catch (e) {
      _error = 'Failed to save recipe: $e';
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> createUnit({
    required String name,
    required String shortName,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.post('/inventory/units', {
        'name': name,
        'short_name': shortName,
      });

      if (response != null && response['success'] == true) {
        await fetchInventory();
        return true;
      }
      return false;
    } catch (e) {
      _error = 'Failed to create unit: $e';
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> updateUnit({
    required int id,
    required String name,
    required String shortName,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.put('/inventory/units/$id', {
        'name': name,
        'short_name': shortName,
      });

      if (response != null && response['success'] == true) {
        await fetchInventory();
        return true;
      }
      return false;
    } catch (e) {
      _error = 'Failed to update unit: $e';
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> deleteUnit(int id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.delete('/inventory/units/$id');
      if (response == true) {
        await fetchInventory();
        return true;
      }
      return false;
    } catch (e) {
      _error = 'Failed to delete unit: $e';
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> createGroup({
    required String name,
    String? description,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.post('/inventory/groups', {
        'name': name,
        'description': description,
      });

      if (response != null && response['success'] == true) {
        await fetchInventory();
        return true;
      }
      return false;
    } catch (e) {
      _error = 'Failed to create group: $e';
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> updateGroup({
    required int id,
    required String name,
    String? description,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.put('/inventory/groups/$id', {
        'name': name,
        'description': description,
      });

      if (response != null && response['success'] == true) {
        await fetchInventory();
        return true;
      }
      return false;
    } catch (e) {
      _error = 'Failed to update group: $e';
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> deleteGroup(int id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.delete('/inventory/groups/$id');
      if (response == true) {
        await fetchInventory();
        return true;
      }
      return false;
    } catch (e) {
      _error = 'Failed to delete group: $e';
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
