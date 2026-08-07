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
        Schema::table('orders', function (Blueprint $table) {
            $table->foreignId('table_id')->nullable()->change();
            
            if (!Schema::hasColumn('orders', 'car_plate')) {
                $table->string('car_plate')->nullable();
            }
            if (!Schema::hasColumn('orders', 'car_description')) {
                $table->string('car_description')->nullable();
            }
            if (!Schema::hasColumn('orders', 'guest_count')) {
                $table->integer('guest_count')->default(1);
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['car_plate', 'car_description', 'guest_count']);
            $table->foreignId('table_id')->nullable(false)->change();
        });
    }
};
