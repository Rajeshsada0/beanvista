<?php
/**
 * EMERGENCY PATCH: Fix Settings Save Bug
 * 
 * 1. Upload this file to your server root (same folder as artisan/composer.json)
 * 2. Open: https://cafe.kitetool.com/fix_settings.php?token=fix2026
 * 3. DELETE THIS FILE after running it.
 */

define('SECRET', 'fix2026');

if (($_GET['token'] ?? '') !== SECRET) {
    die('Access denied. Add ?token=fix2026 to the URL.');
}

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

echo "<pre style='font-family:monospace;font-size:14px;padding:20px;background:#111;color:#0f0'>\n";

try {
    echo "=== SETTINGS FIX PATCH STARTED ===\n\n";

    // 1. Check indexes
    $indexes = DB::select("SHOW INDEX FROM settings");
    echo "Current indexes:\n";
    foreach ($indexes as $idx) {
        echo "  {$idx->Key_name} | {$idx->Column_name} | Unique=" . ($idx->Non_unique == 0 ? 'YES' : 'NO') . "\n";
    }

    $hasOldUnique = false;
    $hasNewUnique = false;
    foreach ($indexes as $idx) {
        if ($idx->Key_name === 'settings_key_unique' && $idx->Non_unique == 0) $hasOldUnique = true;
        if ($idx->Key_name === 'settings_tenant_id_key_unique' && $idx->Non_unique == 0) $hasNewUnique = true;
    }

    // 2. Fix constraint
    if ($hasOldUnique) {
        echo "\nDropping old UNIQUE(key) constraint...";
        DB::statement('ALTER TABLE settings DROP INDEX settings_key_unique');
        echo " DONE\n";
    } else {
        echo "\nOld UNIQUE(key) constraint not found - OK\n";
    }

    if (!$hasNewUnique) {
        echo "Adding UNIQUE(tenant_id, key) constraint...";
        DB::statement('ALTER TABLE settings ADD UNIQUE KEY settings_tenant_id_key_unique (tenant_id, `key`)');
        echo " DONE\n";
    } else {
        echo "UNIQUE(tenant_id, key) already exists - OK\n";
    }

    // 3. Test save + read for tenant 1
    echo "\n=== TESTING SAVE ===\n";
    $testKey = '_patch_test_' . time();
    $testVal = 'works_' . rand(1000,9999);

    $updated = DB::table('settings')
        ->where('tenant_id', 1)->where('key', $testKey)
        ->update(['value' => $testVal, 'updated_at' => now()]);

    if (!$updated) {
        DB::table('settings')->insert([
            'tenant_id' => 1, 'key' => $testKey,
            'value' => $testVal, 'type' => 'text',
            'created_at' => now(), 'updated_at' => now(),
        ]);
    }

    $read = DB::table('settings')->where('tenant_id', 1)->where('key', $testKey)->value('value');
    echo "Write+Read test: " . ($read === $testVal ? "PASSED ($read)" : "FAILED (got: $read)") . "\n";
    DB::table('settings')->where('key', $testKey)->delete();

    // 4. Show current settings for tenant 1
    echo "\n=== CURRENT TENANT 1 SETTINGS ===\n";
    $rows = DB::table('settings')->where('tenant_id', 1)->get(['key','value']);
    foreach ($rows as $r) {
        echo "  {$r->key}: " . substr($r->value ?? 'NULL', 0, 50) . "\n";
    }

    echo "\n=== PATCH COMPLETE! ===\n";
    echo "IMPORTANT: Delete this file (fix_settings.php) from the server now!\n";

} catch (Exception $e) {
    echo "\nERROR: " . $e->getMessage() . "\n";
}

echo "</pre>";
