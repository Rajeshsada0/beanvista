import 'dart:io';

void main() async {
  final directory = Directory('E:/Project/Windsurf/CafeFlutterApp/icafe_flutter/lib');
  
  if (!directory.existsSync()) {
    print('Directory not found');
    return;
  }
  
  final files = directory.listSync(recursive: true)
      .whereType<File>()
      .where((f) => f.path.endsWith('.dart'));
      
  int replacedCount = 0;
  
  for (var file in files) {
    String content = file.readAsStringSync();
    bool modified = false;
    
    // Replace 'Rs. ' inside string interpolations or strings
    if (content.contains("'Rs. ")) {
      content = content.replaceAll("'Rs. ", "'\${AppConstants.currencySymbol} ");
      modified = true;
    }
    if (content.contains('"Rs. ')) {
      content = content.replaceAll('"Rs. ', '"\${AppConstants.currencySymbol} ');
      modified = true;
    }
    // Also replace standalone 'Rs.' just in case
    if (content.contains("'Rs.'")) {
      content = content.replaceAll("'Rs.'", "AppConstants.currencySymbol");
      modified = true;
    }
    
    // Check for formatCurrency default param
    if (content.contains("symbol = 'Rs.'")) {
        content = content.replaceAll("symbol = 'Rs.'", "symbol = 'Rs.'"); // Will fix this manually or it won't matter if we pass it or just let AppConstants handle it. Actually better to fix formatters separately.
    }

    if (modified) {
      // Ensure AppConstants is imported if we used it
      if (!content.contains('app_constants.dart') && content.contains('AppConstants')) {
        // Find a good place to import
        final importIdx = content.indexOf('import ');
        if (importIdx != -1) {
          // just insert at the first import
          content = content.replaceFirst('import ', "import 'package:icafe_app/core/constants/app_constants.dart';\nimport ");
        }
      }
      
      file.writeAsStringSync(content);
      replacedCount++;
      print('Updated: \${file.path}');
    }
  }
  print('Total files updated: $replacedCount');
}
