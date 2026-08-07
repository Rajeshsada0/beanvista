import 'dart:io';

void main() {
  final file = File('E:/Project/Windsurf/CafeFlutterApp/icafe_flutter/lib/core/services/api_service.dart');
  String content = file.readAsStringSync();
  
  // Extract the mistakenly injected block
  final regex = RegExp(r'\s+// Customers\n\s+Future<List<dynamic>\?> getCustomers.*?toggleLoyaltyRewardStatus\(int id\) async \{\n\s+return _handleResponseMap\(await patch\(' + r"'/loyalty-rewards/\$id/status'" + r', \{\}\)\);\n\s+\}\n\}', dotAll: true);
  
  // Remove it from the top
  content = content.replaceFirst(regex, '');

  // Append properly to the end of the class
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
}""";

  // Replace the last closing bracket of the file
  if (content.endsWith('}\n')) {
    content = content.substring(0, content.length - 2) + appendString + '\n';
  } else if (content.endsWith('}')) {
    content = content.substring(0, content.length - 1) + appendString + '\n';
  } else {
    // try replacing last }
    int lastIndex = content.lastIndexOf('}');
    if (lastIndex != -1) {
      content = content.substring(0, lastIndex) + appendString + content.substring(lastIndex + 1);
    }
  }

  file.writeAsStringSync(content);
  print('Fixed api_service.dart');
}
