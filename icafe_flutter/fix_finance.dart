import 'dart:io';

void main() {
  final file = File('E:/Project/Windsurf/CafeFlutterApp/icafe_flutter/lib/screens/finance/finance_reports_screens.dart');
  String content = file.readAsStringSync();
  
  final searchString = """
Future<void> selectDateRange(BuildContext context, FinanceProvider provider) async {
  final picked = await showDateRangePicker(
    context: context,
  if (picked != null) {
    provider.setDateRange(picked.start, picked.end);
  }
}
""";
  
  final replaceString = """
Future<void> selectDateRange(BuildContext context, FinanceProvider provider) async {
  final picked = await showDateRangePicker(
    context: context,
    initialDateRange: DateTimeRange(start: provider.startDate, end: provider.endDate),
    firstDate: DateTime(DateTime.now().year - 3),
    lastDate: DateTime(DateTime.now().year + 1),
    builder: (context, child) {
      return Theme(
        data: Theme.of(context).copyWith(
          colorScheme: Theme.of(context).colorScheme.copyWith(
            primary: AppColors.accentAmber,
          ),
        ),
        child: child!,
      );
    },
  );
  if (picked != null) {
    provider.setDateRange(picked.start, picked.end);
  }
}
""";

  content = content.replaceFirst(searchString, replaceString);
  content = content.replaceFirst(searchString.replaceAll('\n', '\r\n'), replaceString);
  
  file.writeAsStringSync(content);
  print('Fixed finance_reports_screens.dart');
}
