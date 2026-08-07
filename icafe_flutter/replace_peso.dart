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
    
    if (content.contains("prefixText: '₱ '")) {
      content = content.replaceAll("prefixText: '₱ '", "prefixText: '\${AppConstants.currencySymbol} '");
      modified = true;
    }
    if (content.contains("'₱ '")) {
        content = content.replaceAll("'₱ '", "'\${AppConstants.currencySymbol} '");
        modified = true;
    }
    if (content.contains('"₱ "')) {
        content = content.replaceAll('"₱ "', '"\${AppConstants.currencySymbol} "');
        modified = true;
    }

    if (modified) {
      if (!content.contains('app_constants.dart') && content.contains('AppConstants')) {
        final importIdx = content.indexOf('import ');
        if (importIdx != -1) {
          content = content.replaceFirst('import ', "import 'package:icafe_app/core/constants/app_constants.dart';\nimport ");
        }
      }
      
      file.writeAsStringSync(content);
      replacedCount++;
      print('Updated peso: \${file.path}');
    }
  }
  print('Total files updated: $replacedCount');
}
