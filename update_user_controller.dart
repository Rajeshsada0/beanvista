import 'dart:io';

void main() {
  final file = File('E:/Project/Windsurf/CafeFlutterApp/app/Http/Controllers/Superadmin/UserController.php');
  String content = file.readAsStringSync();
  
  // 1. Update index method
  final searchString1 = """
        \$appName = \\App\\Models\\Setting::withoutGlobalScopes()->whereNull('tenant_id')->where('key', 'app_name')->value('value') ?? 'iCafe';
        \$appVersion = \\App\\Models\\Setting::withoutGlobalScopes()->whereNull('tenant_id')->where('key', 'app_version')->value('value') ?? 'v1.0';
            
        return \\Inertia\\Inertia::render('Superadmin/Users/Index', [
            'users' => \$users,
            'app_name' => \$appName,
            'app_version' => \$appVersion,
        ]);
""";

  final replaceString1 = """
        \$appName = \\App\\Models\\Setting::withoutGlobalScopes()->whereNull('tenant_id')->where('key', 'app_name')->value('value') ?? 'iCafe';
        \$appVersion = \\App\\Models\\Setting::withoutGlobalScopes()->whereNull('tenant_id')->where('key', 'app_version')->value('value') ?? 'v1.0';
        \$siteFavicon = \\App\\Models\\Setting::withoutGlobalScopes()->whereNull('tenant_id')->where('key', 'site_favicon')->value('value');
            
        return \\Inertia\\Inertia::render('Superadmin/Users/Index', [
            'users' => \$users,
            'app_name' => \$appName,
            'app_version' => \$appVersion,
            'site_favicon' => \$siteFavicon ? '/storage/' . \$siteFavicon : null,
        ]);
""";

  // 2. Update updateAppSettings method
  final searchString2 = """
    public function updateAppSettings(\\Illuminate\\Http\\Request \$request)
    {
        \$request->validate([
            'app_name' => 'required|string|max:255',
            'app_version' => 'required|string|max:255',
        ]);

        \\App\\Models\\Setting::withoutGlobalScopes()->updateOrCreate(
            ['key' => 'app_name', 'tenant_id' => null, 'branch_id' => null],
            ['value' => \$request->app_name, 'type' => 'text']
        );

        \\App\\Models\\Setting::withoutGlobalScopes()->updateOrCreate(
            ['key' => 'app_version', 'tenant_id' => null, 'branch_id' => null],
            ['value' => \$request->app_version, 'type' => 'text']
        );

        return back()->with('success', 'App settings updated successfully.');
    }
""";

  final replaceString2 = """
    public function updateAppSettings(\\Illuminate\\Http\\Request \$request)
    {
        \$request->validate([
            'app_name' => 'required|string|max:255',
            'app_version' => 'required|string|max:255',
            'favicon' => 'nullable|image|max:2048',
        ]);

        \\App\\Models\\Setting::withoutGlobalScopes()->updateOrCreate(
            ['key' => 'app_name', 'tenant_id' => null, 'branch_id' => null],
            ['value' => \$request->app_name, 'type' => 'text']
        );

        \\App\\Models\\Setting::withoutGlobalScopes()->updateOrCreate(
            ['key' => 'app_version', 'tenant_id' => null, 'branch_id' => null],
            ['value' => \$request->app_version, 'type' => 'text']
        );

        if (\$request->hasFile('favicon')) {
            \$path = \$request->file('favicon')->store('settings', 'public');
            \\App\\Models\\Setting::withoutGlobalScopes()->updateOrCreate(
                ['key' => 'site_favicon', 'tenant_id' => null, 'branch_id' => null],
                ['value' => \$path, 'type' => 'file']
            );
        }

        return back()->with('success', 'App settings updated successfully.');
    }
""";

  content = content.replaceFirst(searchString1, replaceString1);
  content = content.replaceFirst(searchString1.replaceAll('\n', '\r\n'), replaceString1);
  
  content = content.replaceFirst(searchString2, replaceString2);
  content = content.replaceFirst(searchString2.replaceAll('\n', '\r\n'), replaceString2);
  
  file.writeAsStringSync(content);
  print('Updated UserController.php');
}
