<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('inventory_items', function (Blueprint $table) {
            if (!Schema::hasColumn('inventory_items', 'stock_group_id')) {
                $table->foreignId('stock_group_id')->nullable()->constrained()->nullOnDelete();
            }
            if (!Schema::hasColumn('inventory_items', 'measuring_unit_id')) {
                $table->foreignId('measuring_unit_id')->nullable()->constrained()->nullOnDelete();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('inventory_items', function (Blueprint $table) {
            $table->dropForeign(['stock_group_id']);
            $table->dropForeign(['measuring_unit_id']);
            $table->dropColumn(['stock_group_id', 'measuring_unit_id']);
        });
    }
};
