<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use App\Models\Tenant;

return new class extends Migration
{
    protected $tables = [
        'users', 'tables', 'orders', 'order_items', 'menus', 'categories', 'addons',
        'customers', 'reservations', 'inventory_items', 'inventory_purchases', 'inventory_usages',
        'suppliers', 'measuring_units', 'stock_groups', 'loyalty_rewards', 'credit_transactions',
        'activity_logs', 'taxes', 'shifts', 'settings'
    ];

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Create a default tenant for existing records
        $defaultTenantId = null;
        if (Schema::hasTable('tenants')) {
            $defaultTenant = DB::table('tenants')->first();
            if (!$defaultTenant) {
                $defaultTenantId = DB::table('tenants')->insertGetId([
                    'name' => 'Default Cafe',
                    'slug' => 'default-cafe',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } else {
                $defaultTenantId = $defaultTenant->id;
            }
        }

        // 2. Add tenant_id to all tables
        foreach ($this->tables as $tableName) {
            if (Schema::hasTable($tableName)) {
                Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                    if (!Schema::hasColumn($tableName, 'tenant_id')) {
                        // Create column as nullable first to avoid constraint errors on existing data
                        $table->foreignId('tenant_id')->nullable()->constrained('tenants')->cascadeOnDelete();
                    }
                });
            }
        }

        // 3. Assign existing records to default tenant
        if ($defaultTenantId) {
            foreach ($this->tables as $tableName) {
                if (Schema::hasTable($tableName) && Schema::hasColumn($tableName, 'tenant_id')) {
                    DB::table($tableName)->whereNull('tenant_id')->update(['tenant_id' => $defaultTenantId]);
                }
            }
            
            // Now make it not nullable if possible, but actually leaving it nullable is okay for some transition or it might be easier.
            // Let's just leave it nullable for now or alter it to be not null if there are no nulls.
            // SQLite might complain about altering a column to not null, so we'll just leave it nullable but enforce it at the application level.
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        foreach ($this->tables as $tableName) {
            if (Schema::hasTable($tableName)) {
                Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                    if (Schema::hasColumn($tableName, 'tenant_id')) {
                        if (DB::getDriverName() !== 'sqlite') {
                            $table->dropForeign(['tenant_id']);
                        }
                        $table->dropColumn('tenant_id');
                    }
                });
            }
        }
    }
};
