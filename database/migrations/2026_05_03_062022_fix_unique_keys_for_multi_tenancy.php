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
        Schema::table('categories', function (Blueprint $table) {
            $table->dropUnique('categories_name_unique');
            $table->unique(['tenant_id', 'name'], 'categories_tenant_id_name_unique');
        });

        Schema::table('addons', function (Blueprint $table) {
            $table->dropUnique('addons_name_unique');
            $table->unique(['tenant_id', 'name'], 'addons_tenant_id_name_unique');
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->dropUnique('customers_phone_unique');
            $table->unique(['tenant_id', 'phone'], 'customers_tenant_id_phone_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('categories', function (Blueprint $table) {
            $table->dropUnique('categories_tenant_id_name_unique');
            $table->unique('name', 'categories_name_unique');
        });

        Schema::table('addons', function (Blueprint $table) {
            $table->dropUnique('addons_tenant_id_name_unique');
            $table->unique('name', 'addons_name_unique');
        });

        Schema::table('customers', function (Blueprint $table) {
            $table->dropUnique('customers_tenant_id_phone_unique');
            $table->unique('phone', 'customers_phone_unique');
        });
    }
};
