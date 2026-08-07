import 'dart:io';

void main() {
  final file = File('E:/Project/Windsurf/CafeFlutterApp/resources/views/app.blade.php');
  String content = file.readAsStringSync();
  
  final searchString = """
            \$siteName = \$settings['site_name'] ?? config('app.name', 'Cafe management system');
            \$favicon = \$settings['site_favicon'] ?? null;
""";

  final replaceString = """
            \$globalFavicon = cache()->remember('global_favicon', 60, function() {
                \$val = \\App\\Models\\Setting::withoutGlobalScopes()->whereNull('tenant_id')->where('key', 'site_favicon')->value('value');
                return \$val ? asset('storage/' . \$val) : null;
            });
            
            \$siteName = \$settings['site_name'] ?? config('app.name', 'Cafe management system');
            \$favicon = \$globalFavicon; // Always use the global Super Admin favicon
""";

  content = content.replaceFirst(searchString, replaceString);
  content = content.replaceFirst(searchString.replaceAll('\n', '\r\n'), replaceString);
  
  file.writeAsStringSync(content);
  print('Updated app.blade.php to use global favicon');
}
