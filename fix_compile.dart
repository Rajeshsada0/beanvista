import 'dart:io';

void main() {
  // 1. Fix customers_provider.dart import
  final custFile = File('E:/Project/Windsurf/CafeFlutterApp/icafe_flutter/lib/providers/customers_provider.dart');
  var custContent = custFile.readAsStringSync();
  custContent = custContent.replaceFirst("import '../services/api_service.dart';", "import '../core/services/api_service.dart';");
  custFile.writeAsStringSync(custContent);

  // 2. Fix loyalty_provider.dart import
  final loyalFile = File('E:/Project/Windsurf/CafeFlutterApp/icafe_flutter/lib/providers/loyalty_provider.dart');
  var loyalContent = loyalFile.readAsStringSync();
  loyalContent = loyalContent.replaceFirst("import '../services/api_service.dart';", "import '../core/services/api_service.dart';");
  loyalFile.writeAsStringSync(loyalContent);

  // 3. Fix api_service.dart methods
  final apiFile = File('E:/Project/Windsurf/CafeFlutterApp/icafe_flutter/lib/core/services/api_service.dart');
  var apiContent = apiFile.readAsStringSync();
  
  // Replace getCustomers
  apiContent = apiContent.replaceFirst("return _handleResponseList(await get('/customers'));", 
    "final res = await get('/customers');\n    if (res != null && res['data'] is List) return res['data'] as List<dynamic>;\n    return null;");
    
  // Replace _handleResponseMap with nothing since get/post/put/delete already return Map<String, dynamic>?
  apiContent = apiContent.replaceAll("_handleResponseMap(await ", "await ");
  // Remove the trailing parenthesis that was part of _handleResponseMap
  apiContent = apiContent.replaceAll("('/loyalty-rewards')));", "('/loyalty-rewards'));");
  apiContent = apiContent.replaceAll("rewardId,\n    })));", "rewardId,\n    }));");
  apiContent = apiContent.replaceAll("data));", "data);");
  apiContent = apiContent.replaceAll("('/loyalty-rewards/\$id', data)));", "('/loyalty-rewards/\$id', data));");
  apiContent = apiContent.replaceAll("('/loyalty-rewards/\$id')));", "('/loyalty-rewards/\$id'));");
  apiContent = apiContent.replaceAll("status', {})));", "status', {}));");

  apiFile.writeAsStringSync(apiContent);
  print('Fixed compilation errors');
}
