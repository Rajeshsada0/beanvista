import 'dart:io';

void main() {
  final file = File('E:/Project/Windsurf/CafeFlutterApp/icafe_flutter/lib/screens/reports/reports_screen.dart');
  String content = file.readAsStringSync();
  
  final searchString = """
        builder: (context, child) {
          return Theme(
            data: Theme.of(context).copyWith(
              colorScheme: ColorScheme.dark(
                primary: AppColors.accentAmber,
                surface: AppColors.darkCard,
              ),
            ),
            child: child!,
          );
        },
""";
  
  final replaceString = """
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
""";

  content = content.replaceFirst(searchString, replaceString);
  content = content.replaceFirst(searchString.replaceAll('\n', '\r\n'), replaceString);
  
  file.writeAsStringSync(content);
  print('Fixed reports_screen.dart');
}
