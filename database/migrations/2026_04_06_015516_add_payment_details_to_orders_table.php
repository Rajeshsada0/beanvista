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
            if (!Schema::hasColumn('orders', 'discount_percentage')) {
                $table->decimal('discount_percentage', 5, 2)->default(0)->after('total_amount');
            }
            if (!Schema::hasColumn('orders', 'tip_amount')) {
                $table->decimal('tip_amount', 10, 2)->default(0)->after('grand_total');
            }
            if (!Schema::hasColumn('orders', 'cash_amount')) {
                $table->decimal('cash_amount', 10, 2)->default(0)->after('tip_amount');
            }
            if (!Schema::hasColumn('orders', 'online_amount')) {
                $table->decimal('online_amount', 10, 2)->default(0)->after('cash_amount');
            }
            if (!Schema::hasColumn('orders', 'payment_method')) {
                $table->string('payment_method')->nullable()->after('online_amount');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'discount_percentage',
                'tip_amount',
                'cash_amount',
                'online_amount',
                'payment_method'
            ]);
        });
    }
};
