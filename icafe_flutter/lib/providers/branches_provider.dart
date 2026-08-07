import 'package:flutter/foundation.dart';
import '../core/services/api_service.dart';
import '../core/utils/json_utils.dart';
import 'app_provider.dart';

class BranchItem {
  final int id;
  final String name;
  final String? code;
  final String? address;
  final String? phone;
  final bool isActive;

  BranchItem({
    required this.id,
    required this.name,
    this.code,
    this.address,
    this.phone,
    required this.isActive,
  });

  factory BranchItem.fromJson(Map<String, dynamic> json) {
    return BranchItem(
      id: JsonUtils.parseInt(json['id']),
      name: json['name'] ?? '',
      code: json['code'],
      address: json['address'],
      phone: json['phone'],
      isActive: json['is_active'] == true || json['is_active'] == 1 || json['is_active'] == '1',
    );
  }
}

class BranchesProvider extends ChangeNotifier {
  final ApiService _apiService;

  List<BranchItem> _branches = [];
  int? _activeBranchId;
  bool _isLoading = false;
  String? _error;

  BranchesProvider({required ApiService apiService}) : _apiService = apiService;

  List<BranchItem> get branches => _branches;
  int? get activeBranchId => _activeBranchId;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchBranches(AppProvider appProv) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await _apiService.get('/branches');
      if (res != null && res['success'] == true) {
        final List<dynamic> list = res['branches'] ?? [];
        _branches = list.map((json) => BranchItem.fromJson(json as Map<String, dynamic>)).toList();
        _activeBranchId = JsonUtils.parseIntNullable(res['primary_branch_id']);
        
        // Sync active branch to local AppProvider if activeBranchId is set
        if (_activeBranchId != null) {
          final activeBranch = _branches.firstWhere((b) => b.id == _activeBranchId, orElse: () => _branches.first);
          appProv.setActiveBranch(activeBranch.id, activeBranch.name);
        }
      } else {
        _error = res?['message'] ?? 'Failed to load branches';
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> createBranch({
    required String name,
    String? code,
    String? address,
    String? phone,
    required bool isActive,
    required AppProvider appProv,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await _apiService.post('/branches', {
        'name': name,
        'code': code,
        'address': address,
        'phone': phone,
        'is_active': isActive,
      });

      if (res != null && res['success'] == true) {
        await fetchBranches(appProv);
        return true;
      }
      _error = res?['message'] ?? 'Failed to create branch';
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
    return false;
  }

  Future<bool> updateBranch({
    required int id,
    required String name,
    String? code,
    String? address,
    String? phone,
    required bool isActive,
    required AppProvider appProv,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await _apiService.put('/branches/$id', {
        'name': name,
        'code': code,
        'address': address,
        'phone': phone,
        'is_active': isActive,
      });

      if (res != null && res['success'] == true) {
        await fetchBranches(appProv);
        return true;
      }
      _error = res?['message'] ?? 'Failed to update branch';
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
    return false;
  }

  Future<bool> deleteBranch(int id, AppProvider appProv) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await _apiService.delete('/branches/$id');
      if (res) {
        await fetchBranches(appProv);
        return true;
      }
      _error = 'Failed to delete branch';
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
    return false;
  }

  Future<bool> switchBranch(int branchId, String branchName, AppProvider appProv) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await _apiService.post('/branches/switch', {
        'branch_id': branchId,
      });

      if (res != null && res['success'] == true) {
        _activeBranchId = branchId;
        appProv.setActiveBranch(branchId, branchName);
        notifyListeners();
        return true;
      }
      _error = res?['message'] ?? 'Failed to switch branch context';
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
    return false;
  }
}
