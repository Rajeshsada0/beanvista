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
        Schema::table('menus', function (Blueprint $table) {
            // Add missing columns if they don't exist
            if (!Schema::hasColumn('menus', 'category_id')) {
                $table->foreignId('category_id')->nullable()->after('category');
            }
            
            if (!Schema::hasColumn('menus', 'tenant_id')) {
                $table->foreignId('tenant_id')->after('category_id');
            }
            
            if (!Schema::hasColumn('menus', 'original_price')) {
                $table->decimal('original_price', 10, 2)->nullable()->after('price');
            }
            
            if (!Schema::hasColumn('menus', 'cost_price')) {
                $table->decimal('cost_price', 10, 2)->default(0)->after('original_price');
            }
            
            if (!Schema::hasColumn('menus', 'image_path')) {
                $table->string('image_path')->nullable()->after('status');
            }
            
            if (!Schema::hasColumn('menus', 'icon_path')) {
                $table->string('icon_path')->nullable()->after('image_path');
            }
            
            // Make category nullable as it's now legacy
            $table->string('category')->nullable()->change();
            
            // Update price precision
            $table->decimal('price', 10, 2)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('menus', function (Blueprint $table) {
            $table->dropColumn([
                'category_id',
                'tenant_id',
                'original_price',
                'cost_price',
                'image_path',
                'icon_path'
            ]);
        });
    }
};
