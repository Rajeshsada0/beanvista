<?php
/**
 * Cash Counter & Drawer Model/Database Auto-Fixer for Live Server (cPanel)
 * 
 * Instructions:
 * 1. Upload or pull this file to your live server's public/ folder.
 * 2. Access it in your browser: https://cafe.kitetool.com/fix-cash-counter.php
 * 3. It will verify and restore missing models, tables, and clear caches.
 */

header('Content-Type: text/html; charset=utf-8');
echo '<!DOCTYPE html>
<html>
<head>
    <title>Cash Counter Fixer - BeanVista</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; line-height: 1.5; padding: 40px 20px; }
        .container { max-width: 650px; margin: 0 auto; background: white; padding: 30px; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01); border: 1px solid #e2e8f0; }
        h1 { color: #0f172a; font-size: 22px; margin-bottom: 20px; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px; font-weight: 800; display: flex; items-center; gap: 8px; }
        .step { margin-bottom: 12px; padding: 14px; border-radius: 10px; border-left: 4px solid #cbd5e1; background-color: #f8fafc; font-size: 14px; }
        .step.success { border-left-color: #10b981; background-color: #f0fdf4; color: #166534; }
        .step.error { border-left-color: #ef4444; background-color: #fef2f2; color: #991b1b; }
        .step.info { border-left-color: #3b82f6; background-color: #eff6ff; color: #1e40af; }
        .log-title { font-weight: 700; margin-bottom: 4px; }
        .log-details { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px; white-space: pre-wrap; opacity: 0.85; margin-top: 4px; }
        .btn { display: inline-block; background-color: #e11d48; color: white; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: 700; margin-top: 20px; font-size: 14px; text-align: center; }
        .btn-green { background-color: #10b981; }
    </style>
</head>
<body>
<div class="container">
    <h1>Cash Counter &amp; Daily Expenses Fixer</h1>';

function addLog($title, $status, $details = '') {
    $class = 'info';
    if ($status === 'success') $class = 'success';
    if ($status === 'error') $class = 'error';
    
    echo '<div class="step ' . $class . '">';
    echo '<div class="log-title">' . htmlspecialchars($title) . '</div>';
    if ($details) {
        echo '<div class="log-details">' . htmlspecialchars($details) . '</div>';
    }
    echo '</div>';
}

try {
    // 1. Bootstrap Laravel
    $laravelRoot = dirname(__DIR__);
    if (!file_exists($laravelRoot . '/vendor/autoload.php')) {
        throw new Exception("Cannot locate vendor/autoload.php at $laravelRoot");
    }

    require $laravelRoot . '/vendor/autoload.php';
    $app = require_once $laravelRoot . '/bootstrap/app.php';
    $kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
    $kernel->bootstrap();

    addLog("1. Laravel Framework Bootstrapped", "success", "Environment: " . app()->environment() . " | Root: " . $laravelRoot);

    // 2. Verify / Restore Model File
    $modelPath = $laravelRoot . '/app/Models/CashRegisterTransaction.php';
    if (!file_exists($modelPath)) {
        $modelCode = <<<'PHP'
<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use App\Traits\BelongsToBranch;
use Illuminate\Database\Eloquent\Model;

class CashRegisterTransaction extends Model
{
    use BelongsToTenant, BelongsToBranch;

    protected $fillable = [
        'tenant_id',
        'branch_id',
        'cash_register_session_id',
        'user_id',
        'type',
        'amount',
        'notes',
        'expense_category_id',
        'expense_id',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'created_at' => 'datetime',
    ];

    public function session()
    {
        return $this->belongsTo(CashRegisterSession::class, 'cash_register_session_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function category()
    {
        return $this->belongsTo(ExpenseCategory::class, 'expense_category_id');
    }

    public function expense()
    {
        return $this->belongsTo(Expense::class, 'expense_id');
    }
}
PHP;
        if (file_put_contents($modelPath, $modelCode)) {
            addLog("2. Created Missing Model File", "success", "Created: app/Models/CashRegisterTransaction.php");
        } else {
            addLog("2. Failed to create model file automatically", "error", "Please ensure app/Models/ is writable.");
        }
    } else {
        addLog("2. Model File Exists", "success", "Found: app/Models/CashRegisterTransaction.php");
    }

    // Require model file explicitly in case classmap is not yet refreshed
    if (file_exists($modelPath)) {
        require_once $modelPath;
    }

    // 3. Verify / Run Database Migrations
    if (!Illuminate\Support\Facades\Schema::hasTable('cash_register_transactions')) {
        addLog("3. Database Table 'cash_register_transactions' Missing", "info", "Running pending migrations via Artisan...");
        try {
            Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
            $migrateOutput = Illuminate\Support\Facades\Artisan::output();
            addLog("Migration Output", "info", $migrateOutput ?: "Migrate command executed.");
        } catch (\Throwable $mEx) {
            addLog("Artisan migrate notice", "info", $mEx->getMessage());
        }

        // Check again, if still missing, create table directly
        if (!Illuminate\Support\Facades\Schema::hasTable('cash_register_transactions')) {
            Illuminate\Support\Facades\Schema::create('cash_register_transactions', function (Illuminate\Database\Schema\Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('tenant_id')->index();
                $table->unsignedBigInteger('branch_id')->nullable()->index();
                $table->unsignedBigInteger('cash_register_session_id')->index();
                $table->unsignedBigInteger('user_id')->index();
                $table->enum('type', ['cash_out', 'cash_in'])->default('cash_out');
                $table->decimal('amount', 12, 2);
                $table->string('notes', 500);
                $table->unsignedBigInteger('expense_category_id')->nullable();
                $table->unsignedBigInteger('expense_id')->nullable()->index();
                $table->timestamps();
            });
            addLog("3. Table Created Directly via Schema Builder", "success", "Table 'cash_register_transactions' is now live.");
        } else {
            addLog("3. Table Created Successfully via Migration", "success", "Table 'cash_register_transactions' verified.");
        }
    } else {
        addLog("3. Database Table Exists", "success", "Table 'cash_register_transactions' verified in database.");
    }

    // 4. Test CashRegisterSession Relationship
    $testSession = new App\Models\CashRegisterSession();
    $relation = $testSession->transactions();
    $relatedClass = get_class($relation->getRelated());
    addLog("4. Eloquent Relationship Verified", "success", "Relationship points cleanly to: " . $relatedClass);

    // 5. Clear Caches
    try {
        Illuminate\Support\Facades\Artisan::call('optimize:clear');
        addLog("5. Application Cache Cleared", "success", "Configuration, views, and routes cleared.");
    } catch (\Throwable $cEx) {
        addLog("5. Cache Clear Notice", "info", $cEx->getMessage());
    }

    echo '<div style="margin-top: 25px; text-align: center;">
        <a href="/dashboard" class="btn btn-green">Go to Dashboard &rarr;</a>
        <a href="/finance/cash-counter" class="btn" style="margin-left: 10px;">Go to Cash Counter &rarr;</a>
    </div>';

} catch (\Throwable $e) {
    addLog("Diagnostic Error", "error", $e->getMessage() . "\n\nFile: " . $e->getFile() . ":" . $e->getLine());
}

echo '</div></body></html>';
