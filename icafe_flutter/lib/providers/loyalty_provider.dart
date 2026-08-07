import 'package:flutter/foundation.dart';
import 'package:image_picker/image_picker.dart';
import '../models/loyalty_reward_model.dart';
import '../core/services/api_service.dart';

class LoyaltyProvider extends ChangeNotifier {
  final ApiService apiService;
  
  LoyaltyProvider({required this.apiService});
  
  List<LoyaltyRewardModel> _rewards = [];
  bool _isLoading = false;
  String? _error;

  List<LoyaltyRewardModel> get rewards => _rewards;
  List<LoyaltyRewardModel> get activeRewards => _rewards.where((r) => r.status).toList();
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchRewards() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await apiService.getLoyaltyRewards();
      if (response != null && response['success'] == true && response['data'] != null) {
        final List data = response['data'];
        _rewards = data.map((item) => LoyaltyRewardModel.fromJson(item)).toList();
      } else {
        _error = response?['message'] ?? 'Failed to load rewards';
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> createReward(Map<String, String> data, {XFile? imageFile}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await apiService.postMultipart('/loyalty-rewards', data, imageFile);
      if (response != null && response['success'] == true) {
        await fetchRewards();
        return true;
      }
      _error = response?['message'] ?? 'Failed to create reward';
      return false;
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> updateReward(int id, Map<String, String> data, {XFile? imageFile}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final fields = {
        ...data,
        '_method': 'PUT',
      };
      final response = await apiService.postMultipart('/loyalty-rewards/$id', fields, imageFile);
      if (response != null && response['success'] == true) {
        await fetchRewards();
        return true;
      }
      _error = response?['message'] ?? 'Failed to update reward';
      return false;
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> toggleStatus(int id) async {
    final index = _rewards.indexWhere((r) => r.id == id);
    if (index == -1) return false;

    // Optimistically toggle status locally
    final oldReward = _rewards[index];
    final newStatus = !oldReward.status;
    _rewards[index] = oldReward.copyWith(status: newStatus);
    notifyListeners();

    try {
      final response = await apiService.toggleLoyaltyRewardStatus(id);
      if (response != null && response['success'] == true) {
        if (response['data'] != null) {
          final updated = LoyaltyRewardModel.fromJson(response['data']);
          final currIdx = _rewards.indexWhere((r) => r.id == id);
          if (currIdx != -1) {
            _rewards[currIdx] = updated;
            notifyListeners();
          }
        }
        return true;
      } else {
        // Revert on failure
        final currIdx = _rewards.indexWhere((r) => r.id == id);
        if (currIdx != -1) {
          _rewards[currIdx] = oldReward;
          notifyListeners();
        }
        return false;
      }
    } catch (e) {
      // Revert on error
      final currIdx = _rewards.indexWhere((r) => r.id == id);
      if (currIdx != -1) {
        _rewards[currIdx] = oldReward;
        notifyListeners();
      }
      return false;
    }
  }

  Future<bool> deleteReward(int id) async {
    final response = await apiService.deleteLoyaltyReward(id);
    if (response != null && response['success'] == true) {
      _rewards.removeWhere((r) => r.id == id);
      notifyListeners();
      return true;
    }
    return false;
  }
}
