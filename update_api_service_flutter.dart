import 'dart:io';

void main() {
  final file = File('E:/Project/Windsurf/CafeFlutterApp/icafe_flutter/lib/core/services/api_service.dart');
  String content = file.readAsStringSync();
  
  final appendString = """
  // Customers
  Future<List<dynamic>?> getCustomers() async {
    return _handleResponseList(await get('/customers'));
  }

  // Loyalty Rewards
  Future<Map<String, dynamic>?> getLoyaltyRewards() async {
    return _handleResponseMap(await get('/loyalty-rewards'));
  }

  Future<Map<String, dynamic>?> redeemLoyaltyReward(int customerId, int rewardId) async {
    return _handleResponseMap(await post('/loyalty-rewards/redeem', {
      'customer_id': customerId,
      'reward_id': rewardId,
    }));
  }

  Future<Map<String, dynamic>?> createLoyaltyReward(Map<String, dynamic> data) async {
    return _handleResponseMap(await post('/loyalty-rewards', data));
  }

  Future<Map<String, dynamic>?> updateLoyaltyReward(int id, Map<String, dynamic> data) async {
    return _handleResponseMap(await put('/loyalty-rewards/\$id', data));
  }

  Future<Map<String, dynamic>?> deleteLoyaltyReward(int id) async {
    return _handleResponseMap(await delete('/loyalty-rewards/\$id'));
  }

  Future<Map<String, dynamic>?> toggleLoyaltyRewardStatus(int id) async {
    return _handleResponseMap(await patch('/loyalty-rewards/\$id/status', {}));
  }
}
""";

  content = content.replaceFirst("}\n", appendString);
  content = content.replaceFirst("}\r\n", appendString);

  file.writeAsStringSync(content);
  print('Updated ApiService');
}
