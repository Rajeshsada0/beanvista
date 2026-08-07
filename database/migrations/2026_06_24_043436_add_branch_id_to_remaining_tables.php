<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    protected $scopedTables = [
        'menus', 'categories', 'addons', 'loyalty_rewards', 'customers',
        'credit_transactions', 'taxes', 'inventory_purchases', 'inventory_usages',
        'suppliers', 'measuring_units', 'stock_groups', 'accounts',
        'expense_categories', 'supplier_bills', 'customer_invoices',
        'bank_transactions', 'budgets', 'inventory_items'
    ];

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Add branch_id to scoped tables if not exists
        foreach ($this->scopedTables as $tableName) {
            if (Schema::hasTable($tableName)) {
                Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                    if (!Schema::hasColumn($tableName, 'branch_id')) {
                        $table->unsignedBigInteger('branch_id')->nullable()->after('tenant_id');
                    }
                });
            }
        }

        // 2. Add current_stock and low_stock_threshold to inventory_items
        if (Schema::hasTable('inventory_items')) {
            Schema::table('inventory_items', function (Blueprint $table) {
                if (!Schema::hasColumn('inventory_items', 'current_stock')) {
                    $table->decimal('current_stock', 12, 4)->default(0);
                }
                if (!Schema::hasColumn('inventory_items', 'low_stock_threshold')) {
                    $table->decimal('low_stock_threshold', 12, 4)->default(0);
                }
            });
        }

        // 3. Handle settings table unique key conversion
        if (Schema::hasTable('settings')) {
            Schema::table('settings', function (Blueprint $table) {
                if (DB::getDriverName() !== 'sqlite') {
                    try {
                        $table->dropForeign(['tenant_id']);
                    } catch (\Exception $e) {}
                    try {
                        $table->dropUnique('settings_tenant_id_key_unique');
                    } catch (\Exception $e) {}
                }
                if (!Schema::hasColumn('settings', 'branch_id')) {
                    $table->unsignedBigInteger('branch_id')->nullable()->after('tenant_id');
                }
            });
        }

        // 4. Backfill default branch and restore inventory stocks data
        $tenants = DB::table('tenants')->get();
        foreach ($tenants as $tenant) {
            // Find or create default branch
            $branchId = DB::table('branches')
                ->where('tenant_id', $tenant->id)
                ->value('id');

            if (!$branchId) {
                $branchId = DB::table('branches')->insertGetId([
                    'tenant_id' => $tenant->id,
                    'name' => 'Main Outlet',
                    'code' => 'MAIN',
                    'address' => $tenant->name . ' - Central Location',
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // Assign existing rows of this tenant to this default branch
            foreach ($this->scopedTables as $tableName) {
                if (Schema::hasTable($tableName)) {
                    DB::table($tableName)
                        ->where('tenant_id', $tenant->id)
                        ->whereNull('branch_id')
                        ->update(['branch_id' => $branchId]);
                }
            }

            // Also assign existing settings rows of this tenant to this default branch
            if (Schema::hasTable('settings')) {
                DB::table('settings')
                    ->where('tenant_id', $tenant->id)
                    ->whereNull('branch_id')
                    ->update(['branch_id' => $branchId]);
            }
        }

        // 5. Restore stock data from inventory_stocks to inventory_items
        if (Schema::hasTable('inventory_stocks') && Schema::hasTable('inventory_items')) {
            $stocks = DB::table('inventory_stocks')->get();
            foreach ($stocks as $stock) {
                // Find corresponding inventory item
                $item = DB::table('inventory_items')->where('id', $stock->inventory_item_id)->first();
                if ($item) {
                    $defaultBranchId = DB::table('branches')
                        ->where('tenant_id', $item->tenant_id)
                        ->orderBy('id', 'asc')
                        ->value('id');

                    if ($stock->branch_id == $defaultBranchId || $stock->branch_id == $item->branch_id) {
                        DB::table('inventory_items')
                            ->where('id', $item->id)
                            ->update([
                                'current_stock' => $stock->current_stock,
                                'low_stock_threshold' => $stock->low_stock_threshold,
                                'branch_id' => $stock->branch_id,
                            ]);
                    } else {
                        // Duplicate the inventory item for this branch
                        $itemArray = (array) $item;
                        unset($itemArray['id']); // Remove ID to allow auto-increment
                        $itemArray['branch_id'] = $stock->branch_id;
                        $itemArray['current_stock'] = $stock->current_stock;
                        $itemArray['low_stock_threshold'] = $stock->low_stock_threshold;
                        $itemArray['created_at'] = now();
                        $itemArray['updated_at'] = now();
                        
                        DB::table('inventory_items')->insert($itemArray);
                    }
                }
            }

            // 6. Drop inventory_stocks table
            Schema::dropIfExists('inventory_stocks');
        }

        // 7. Add foreign keys and unique constraints where supported
        if (DB::getDriverName() !== 'sqlite') {
            foreach ($this->scopedTables as $tableName) {
                if (Schema::hasTable($tableName)) {
                    Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                        try {
                            $table->foreign('branch_id')->references('id')->on('branches')->cascadeOnDelete();
                        } catch (\Exception $e) {
                            // Foreign key might already exist
                        }
                    });
                }
            }

            if (Schema::hasTable('settings')) {
                Schema::table('settings', function (Blueprint $table) {
                    try {
                        $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
                    } catch (\Exception $e) {}
                    try {
                        $table->foreign('branch_id')->references('id')->on('branches')->cascadeOnDelete();
                    } catch (\Exception $e) {}
                    try {
                        $table->unique(['tenant_id', 'branch_id', 'key'], 'settings_tenant_branch_key_unique');
                    } catch (\Exception $e) {}
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 1. Drop unique and foreign keys if not SQLite
        if (DB::getDriverName() !== 'sqlite') {
            if (Schema::hasTable('settings') && Schema::hasColumn('settings', 'branch_id')) {
                Schema::table('settings', function (Blueprint $table) {
                    try {
                        $table->dropUnique('settings_tenant_branch_key_unique');
                    } catch (\Exception $e) {}
                    try {
                        $table->dropForeign(['tenant_id']);
                    } catch (\Exception $e) {}
                    try {
                        $table->dropForeign(['branch_id']);
                    } catch (\Exception $e) {}
                });
            }

            foreach ($this->scopedTables as $tableName) {
                if (Schema::hasTable($tableName) && Schema::hasColumn($tableName, 'branch_id')) {
                    Schema::table($tableName, function (Blueprint $table) {
                        try {
                            $table->dropForeign(['branch_id']);
                        } catch (\Exception $e) {}
                    });
                }
            }
        }

        // 2. Re-create inventory_stocks table
        if (!Schema::hasTable('inventory_stocks')) {
            Schema::create('inventory_stocks', function (Blueprint $table) {
                $table->id();
                $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
                $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
                $table->foreignId('inventory_item_id')->constrained('inventory_items')->cascadeOnDelete();
                $table->decimal('current_stock', 12, 4)->default(0);
                $table->decimal('low_stock_threshold', 12, 4)->default(0);
                $table->timestamps();

                $table->unique(['branch_id', 'inventory_item_id'], 'branch_item_unique');
            });
        }

        // 3. Move stock data back to inventory_stocks and delete duplicated inventory items
        if (Schema::hasTable('inventory_items')) {
            $items = DB::table('inventory_items')->get();
            foreach ($items as $item) {
                if (Schema::hasColumn('inventory_items', 'current_stock') && Schema::hasColumn('inventory_items', 'branch_id')) {
                    if ($item->branch_id) {
                        DB::table('inventory_stocks')->insert([
                            'tenant_id' => $item->tenant_id,
                            'branch_id' => $item->branch_id,
                            'inventory_item_id' => $item->id,
                            'current_stock' => $item->current_stock ?? 0,
                            'low_stock_threshold' => $item->low_stock_threshold ?? 0,
                            'created_at' => now(),
                            'updated_at' => now(),
                        ]);
                    }
                }
            }

            // Remove duplicated inventory items that don't belong to the default branch
            $tenants = DB::table('tenants')->get();
            foreach ($tenants as $tenant) {
                $defaultBranchId = DB::table('branches')
                    ->where('tenant_id', $tenant->id)
                    ->orderBy('id', 'asc')
                    ->value('id');

                if ($defaultBranchId) {
                    DB::table('inventory_items')
                        ->where('tenant_id', $tenant->id)
                        ->where('branch_id', '!=', $defaultBranchId)
                        ->delete();
                }
            }
        }

        // 4. Drop branch_id column from scoped tables
        foreach ($this->scopedTables as $tableName) {
            if (Schema::hasTable($tableName) && Schema::hasColumn($tableName, 'branch_id')) {
                Schema::table($tableName, function (Blueprint $table) {
                    $table->dropColumn('branch_id');
                });
            }
        }

        // 5. Drop stock columns from inventory_items
        if (Schema::hasTable('inventory_items')) {
            Schema::table('inventory_items', function (Blueprint $table) {
                if (Schema::hasColumn('inventory_items', 'current_stock')) {
                    $table->dropColumn('current_stock');
                }
                if (Schema::hasColumn('inventory_items', 'low_stock_threshold')) {
                    $table->dropColumn('low_stock_threshold');
                }
            });
        }

        // 6. Drop branch_id and restore original unique key on settings
        if (Schema::hasTable('settings')) {
            Schema::table('settings', function (Blueprint $table) {
                if (Schema::hasColumn('settings', 'branch_id')) {
                    $table->dropColumn('branch_id');
                }
                if (DB::getDriverName() !== 'sqlite') {
                    try {
                        $table->unique(['tenant_id', 'key'], 'settings_tenant_id_key_unique');
                    } catch (\Exception $e) {}
                    try {
                        $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
                    } catch (\Exception $e) {}
                }
            });
        }
    }
};
