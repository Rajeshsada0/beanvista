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
        // Add order_type if it doesn't exist, otherwise modify it to string
        if (!Schema::hasColumn('orders', 'order_type')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->string('order_type')->default('Dine-In')->after('tenant_id');
            });
        } else {
            DB::statement("ALTER TABLE orders MODIFY order_type VARCHAR(255) DEFAULT 'Dine-In'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert to original enum if needed (ensure no strings outside the enum exist first)
        // DB::statement("ALTER TABLE orders MODIFY order_type ENUM('table', 'counter') DEFAULT 'table'");
    }
};
