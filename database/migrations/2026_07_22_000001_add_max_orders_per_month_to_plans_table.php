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
        if (!Schema::hasColumn('plans', 'max_orders_per_month')) {
            Schema::table('plans', function (Blueprint $table) {
                $table->integer('max_orders_per_month')->default(-1)->after('max_users');
            });
        }

        // Backfill order limits for existing plans if available
        if (Schema::hasTable('plans')) {
            DB::table('plans')->where('id', 1)->update(['max_orders_per_month' => 50]);
            DB::table('plans')->where('id', 2)->update(['max_orders_per_month' => 500]);
            DB::table('plans')->where('id', 3)->update(['max_orders_per_month' => 100]);
            DB::table('plans')->where('id', 4)->update(['max_orders_per_month' => 1000]);
            DB::table('plans')->where('id', 5)->update(['max_orders_per_month' => 5000]);
            DB::table('plans')->where('id', 6)->update(['max_orders_per_month' => -1]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('plans', 'max_orders_per_month')) {
            Schema::table('plans', function (Blueprint $table) {
                $table->dropColumn('max_orders_per_month');
            });
        }
    }
};
