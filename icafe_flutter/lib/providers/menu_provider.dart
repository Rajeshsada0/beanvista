import 'package:flutter/foundation.dart';
import 'package:image_picker/image_picker.dart';
import '../core/services/api_service.dart';
import '../core/utils/json_utils.dart';

class CategoryItem {
  final int id;
  final String name;

  CategoryItem({required this.id, required this.name});

  factory CategoryItem.fromJson(Map<String, dynamic> json) {
    return CategoryItem(
      id: JsonUtils.parseInt(json['id']),
      name: json['name'] ?? '',
    );
  }
}

class MenuItem {
  final int id;
  final String name;
  final String category;
  final int? categoryId;
  final double price;
  final double costPrice;
  final String? imageUrl;
  final bool outOfStock;
  final bool sendToKitchen;
  final bool status;

  MenuItem({
    required this.id,
    required this.name,
    required this.category,
    this.categoryId,
    required this.price,
    required this.costPrice,
    this.imageUrl,
    this.outOfStock = false,
    this.sendToKitchen = true,
    this.status = true,
  });

  factory MenuItem.fromJson(Map<String, dynamic> json) {
    return MenuItem(
      id: JsonUtils.parseInt(json['id']),
      name: json['name'] ?? '',
      category: json['category'] ?? '',
      categoryId: JsonUtils.parseIntNullable(json['category_id']),
      price: JsonUtils.parseDouble(json['price']),
      costPrice: JsonUtils.parseDouble(json['cost_price']),
      imageUrl: json['image_url'],
      outOfStock: json['out_of_stock'] == true || json['out_of_stock'] == 1,
      sendToKitchen: json['send_to_kitchen'] == true || json['send_to_kitchen'] == 1 || json['send_to_kitchen'] == null,
      status: json['status'] == true || json['status'] == 1 || json['status'] == null,
    );
  }
}

class MenuProvider extends ChangeNotifier {
  final ApiService _apiService;
  List<CategoryItem> _categories = [];
  List<MenuItem> _menus = [];
  bool _isLoading = false;
  String? _error;

  MenuProvider({required ApiService apiService}) : _apiService = apiService;

  List<CategoryItem> get categories => _categories;
  List<MenuItem> get menus => _menus;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchMenus() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.get('/menus');
      if (response != null && response['error'] != true) {
        if (response['categories'] != null) {
          final cats = response['categories'] as List;
          _categories = cats.map((e) => CategoryItem.fromJson(e as Map<String, dynamic>)).toList();
        }
        if (response['menus'] != null) {
          final items = response['menus'] as List;
          _menus = items.map((e) => MenuItem.fromJson(e as Map<String, dynamic>)).toList();
        }
      }
    } catch (e) {
      _error = 'Failed to fetch menus: $e';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> createMenu(String name, String category, double price, double costPrice, {bool sendToKitchen = true, XFile? imageFile, String? serverImagePath}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final Map<String, String> body = {
        'name': name,
        'category': category,
        'price': price.toString(),
        'cost_price': costPrice.toString(),
        'send_to_kitchen': sendToKitchen ? '1' : '0',
      };
      if (serverImagePath != null) {
        body['image'] = serverImagePath;
      }

      final response = await _apiService.postMultipart('/menus', body, imageFile);
      if (response != null && response['success'] == true) {
        _apiService.logActivity(
          'New Menu Item',
          'Created menu item "$name" (Rs. ${price.toStringAsFixed(2)})',
          type: 'menu',
        );
        await fetchMenus();
        return true;
      }
      return false;
    } catch (e) {
      _error = 'Failed to create menu item: $e';
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> updateMenu(int id, String name, String category, double price, double costPrice, {bool? status, bool? sendToKitchen, XFile? imageFile, String? serverImagePath}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final Map<String, String> body = {
        '_method': 'PUT',
        'name': name,
        'category': category,
        'price': price.toString(),
        'cost_price': costPrice.toString(),
      };
      if (status != null) {
        body['status'] = status ? '1' : '0';
      }
      if (sendToKitchen != null) {
        body['send_to_kitchen'] = sendToKitchen ? '1' : '0';
      }
      if (serverImagePath != null) {
        body['image'] = serverImagePath;
      }

      final response = await _apiService.postMultipart('/menus/$id', body, imageFile);
      if (response != null && response['success'] == true) {
        _apiService.logActivity(
          'Menu Item Updated',
          'Updated menu item "$name"',
          type: 'menu',
        );
        await fetchMenus();
        return true;
      }
      return false;
    } catch (e) {
      _error = 'Failed to update menu item: $e';
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> deleteMenu(int id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final success = await _apiService.delete('/menus/$id');
      if (success) {
        await fetchMenus();
        return true;
      }
      return false;
    } catch (e) {
      _error = 'Failed to delete menu item: $e';
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> createCategory(String name) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.post('/categories', {
        'name': name,
      });
      if (response != null && response['success'] == true) {
        await fetchMenus();
        return true;
      }
      return false;
    } catch (e) {
      _error = 'Failed to create category: $e';
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> updateCategory(int id, String name) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.put('/categories/$id', {
        'name': name,
      });
      if (response != null && response['success'] == true) {
        await fetchMenus();
        return true;
      }
      return false;
    } catch (e) {
      _error = 'Failed to update category: $e';
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> deleteCategory(int id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final success = await _apiService.delete('/categories/$id');
      if (success) {
        await fetchMenus();
        return true;
      }
      return false;
    } catch (e) {
      _error = 'Failed to delete category: $e';
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
