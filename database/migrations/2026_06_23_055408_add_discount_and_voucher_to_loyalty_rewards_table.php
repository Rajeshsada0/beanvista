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
        Schema::table('loyalty_rewards', function (Blueprint $table) {
            // Drop foreign key first
            $table->dropForeign(['menu_item_id']);
            
            // Change column definition to nullable
            $table->unsignedBigInteger('menu_item_id')->nullable()->change();
            
            // Re-add foreign key constraint with nullOnDelete
            $table->foreign('menu_item_id')->references('id')->on('menus')->nullOnDelete();
            
            // Add new fields
            $table->string('type')->default('gift'); // gift, discount, voucher
            $table->string('discount_type')->nullable(); // percentage, fixed
            $table->decimal('discount_value', 10, 2)->nullable();
            $table->string('code')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('loyalty_rewards', function (Blueprint $table) {
            $table->dropForeign(['menu_item_id']);
            
            $table->dropColumn(['type', 'discount_type', 'discount_value', 'code']);
            
            // Restore previous foreign key with cascadeOnDelete and not nullable
            $table->unsignedBigInteger('menu_item_id')->nullable(false)->change();
            $table->foreign('menu_item_id')->references('id')->on('menus')->cascadeOnDelete();
        });
    }
};
