import 'dart:io';

void main() {
  final file = File('E:/Project/Windsurf/CafeFlutterApp/icafe_flutter/lib/screens/dashboard/dashboard_screen.dart');
  String content = file.readAsStringSync();
  
  if (!content.contains("import '../../core/utils/formatters.dart';")) {
      content = content.replaceFirst("import '../../core/utils/json_utils.dart';", "import '../../core/utils/json_utils.dart';\nimport '../../core/utils/formatters.dart';");
  }
  
  final searchString = """
  Widget _buildSalesBarChart() {
    final maxVal = _weeklySales.isEmpty ? 10.0 : _weeklySales
        .map((e) => JsonUtils.parseDouble(e['total']))
        .fold(0.0, (a, b) => a > b ? a : b);
    final finalMaxVal = maxVal == 0 ? 10.0 : maxVal;
""";

  final replaceString = """
  Widget _buildSalesBarChart() {
    final maxVal = _weeklySales.isEmpty ? 10.0 : _weeklySales
        .map((e) => JsonUtils.parseDouble(e['total']))
        .fold(0.0, (a, b) => a > b ? a : b);
    final finalMaxVal = maxVal == 0 ? 10.0 : maxVal;
    
    final totalSales = _weeklySales.isEmpty ? 0.0 : _weeklySales
        .map((e) => JsonUtils.parseDouble(e['total']))
        .fold(0.0, (a, b) => a + b);
""";

  content = content.replaceFirst(searchString, replaceString);
  content = content.replaceFirst(searchString.replaceAll('\n', '\r\n'), replaceString);

  final searchString2 = """
                  child: Text(
                    '\${AppConstants.currencySymbol} 71,650 total',
                    style: GoogleFonts.poppins(
""";

  final replaceString2 = """
                  child: Text(
                    '\${Formatters.formatCurrencyCompact(totalSales)} total',
                    style: GoogleFonts.poppins(
""";

  content = content.replaceFirst(searchString2, replaceString2);
  content = content.replaceFirst(searchString2.replaceAll('\n', '\r\n'), replaceString2);

  // Fallback if the replacement string is different due to earlier currency replacement script
  final searchString3 = """
                  child: Text(
                    'Rs.71,650 total',
                    style: GoogleFonts.poppins(
""";
  content = content.replaceFirst(searchString3, replaceString2);
  content = content.replaceFirst(searchString3.replaceAll('\n', '\r\n'), replaceString2);

  file.writeAsStringSync(content);
  print('Fixed dashboard_screen.dart sales trend total');
}
