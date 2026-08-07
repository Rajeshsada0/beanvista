<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Create inventory_stocks table
        Schema::create('inventory_stocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tenant_id')->constrained('tenants')->cascadeOnDelete();
            $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
            $table->foreignId('inventory_item_id')->constrained('inventory_items')->cascadeOnDelete();
            $table->decimal('current_stock', 12, 4)->default(0);
            $table->decimal('low_stock_threshold', 12, 4)->default(0);
            $table->timestamps();

            // Ensure stock record is unique per branch/item
            $table->unique(['branch_id', 'inventory_item_id'], 'branch_item_unique');
        });

        // 2. Transfer existing stock data to the default branch for each item
        if (Schema::hasTable('inventory_items')) {
            $items = DB::table('inventory_items')->get();
            foreach ($items as $item) {
                // Find default branch for this tenant
                $branchId = DB::table('branches')
                    ->where('tenant_id', $item->tenant_id)
                    ->value('id');

                if ($branchId) {
                    DB::table('inventory_stocks')->insert([
                        'tenant_id' => $item->tenant_id,
                        'branch_id' => $branchId,
                        'inventory_item_id' => $item->id,
                        'current_stock' => $item->current_stock ?? 0,
                        'low_stock_threshold' => $item->low_stock_threshold ?? 0,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }
            }

            // 3. Drop columns from inventory_items
            Schema::table('inventory_items', function (Blueprint $table) {
                if (Schema::hasColumn('inventory_items', 'current_stock')) {
                    $table->dropColumn('current_stock');
                }
                if (Schema::hasColumn('inventory_items', 'low_stock_threshold')) {
                    $table->dropColumn('low_stock_threshold');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 1. Add back columns to inventory_items
        if (Schema::hasTable('inventory_items')) {
            Schema::table('inventory_items', function (Blueprint $table) {
                if (!Schema::hasColumn('inventory_items', 'current_stock')) {
                    $table->decimal('current_stock', 12, 4)->default(0)->after('sku');
                }
                if (!Schema::hasColumn('inventory_items', 'low_stock_threshold')) {
                    $table->decimal('low_stock_threshold', 12, 4)->default(0)->after('current_stock');
                }
            });

            // 2. Restore data from inventory_stocks back to inventory_items
            if (Schema::hasTable('inventory_stocks')) {
                $stocks = DB::table('inventory_stocks')->get();
                foreach ($stocks as $stock) {
                    // Check if it's the primary/default branch for the tenant
                    $defaultBranchId = DB::table('branches')
                        ->where('tenant_id', $stock->tenant_id)
                        ->orderBy('id', 'asc') // First branch is the default branch
                        ->value('id');

                    if ($stock->branch_id === $defaultBranchId) {
                        DB::table('inventory_items')
                            ->where('id', $stock->inventory_item_id)
                            ->update([
                                'current_stock' => $stock->current_stock,
                                'low_stock_threshold' => $stock->low_stock_threshold
                            ]);
                    }
                }
            }
        }

        // 3. Drop inventory_stocks table
        Schema::dropIfExists('inventory_stocks');
    }
};
