import 'dart:io';

void main() {
  final file = File('E:/Project/Windsurf/CafeFlutterApp/icafe_flutter/lib/screens/menu/menu_screen.dart');
  String content = file.readAsStringSync();
  content = content.replaceAll(
    "decoration: const InputDecoration(\n                      prefixText: '\${AppConstants.currencySymbol} ',",
    "decoration: InputDecoration(\n                      prefixText: '\${AppConstants.currencySymbol} ',"
  );
  content = content.replaceAll(
    "decoration: const InputDecoration(\r\n                      prefixText: '\${AppConstants.currencySymbol} ',",
    "decoration: InputDecoration(\r\n                      prefixText: '\${AppConstants.currencySymbol} ',"
  );
  file.writeAsStringSync(content);
  print('Fixed menu_screen.dart');
}
