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
        // --- Categories ---
        Schema::table('categories', function (Blueprint $table) {
            if (DB::getDriverName() !== 'sqlite') {
                try {
                    $table->dropForeign(['tenant_id']);
                } catch (\Exception $e) {}
                try {
                    $table->dropUnique('categories_tenant_id_name_unique');
                } catch (\Exception $e) {}
            }
        });
        Schema::table('categories', function (Blueprint $table) {
            if (DB::getDriverName() !== 'sqlite') {
                try {
                    $table->unique(['tenant_id', 'branch_id', 'name'], 'categories_tenant_branch_name_unique');
                } catch (\Exception $e) {}
                try {
                    $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
                } catch (\Exception $e) {}
            }
        });

        // --- Addons ---
        Schema::table('addons', function (Blueprint $table) {
            if (DB::getDriverName() !== 'sqlite') {
                try {
                    $table->dropForeign(['tenant_id']);
                } catch (\Exception $e) {}
                try {
                    $table->dropUnique('addons_tenant_id_name_unique');
                } catch (\Exception $e) {}
            }
        });
        Schema::table('addons', function (Blueprint $table) {
            if (DB::getDriverName() !== 'sqlite') {
                try {
                    $table->unique(['tenant_id', 'branch_id', 'name'], 'addons_tenant_branch_name_unique');
                } catch (\Exception $e) {}
                try {
                    $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
                } catch (\Exception $e) {}
            }
        });

        // --- Customers ---
        Schema::table('customers', function (Blueprint $table) {
            if (DB::getDriverName() !== 'sqlite') {
                try {
                    $table->dropForeign(['tenant_id']);
                } catch (\Exception $e) {}
                try {
                    $table->dropUnique('customers_tenant_id_phone_unique');
                } catch (\Exception $e) {}
            }
        });
        Schema::table('customers', function (Blueprint $table) {
            if (DB::getDriverName() !== 'sqlite') {
                try {
                    $table->unique(['tenant_id', 'branch_id', 'phone'], 'customers_tenant_branch_phone_unique');
                } catch (\Exception $e) {}
                try {
                    $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
                } catch (\Exception $e) {}
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // --- Categories ---
        Schema::table('categories', function (Blueprint $table) {
            if (DB::getDriverName() !== 'sqlite') {
                try {
                    $table->dropForeign(['tenant_id']);
                } catch (\Exception $e) {}
                try {
                    $table->dropUnique('categories_tenant_branch_name_unique');
                } catch (\Exception $e) {}
            }
        });
        Schema::table('categories', function (Blueprint $table) {
            if (DB::getDriverName() !== 'sqlite') {
                try {
                    $table->unique(['tenant_id', 'name'], 'categories_tenant_id_name_unique');
                } catch (\Exception $e) {}
                try {
                    $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
                } catch (\Exception $e) {}
            }
        });

        // --- Addons ---
        Schema::table('addons', function (Blueprint $table) {
            if (DB::getDriverName() !== 'sqlite') {
                try {
                    $table->dropForeign(['tenant_id']);
                } catch (\Exception $e) {}
                try {
                    $table->dropUnique('addons_tenant_branch_name_unique');
                } catch (\Exception $e) {}
            }
        });
        Schema::table('addons', function (Blueprint $table) {
            if (DB::getDriverName() !== 'sqlite') {
                try {
                    $table->unique(['tenant_id', 'name'], 'addons_tenant_id_name_unique');
                } catch (\Exception $e) {}
                try {
                    $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
                } catch (\Exception $e) {}
            }
        });

        // --- Customers ---
        Schema::table('customers', function (Blueprint $table) {
            if (DB::getDriverName() !== 'sqlite') {
                try {
                    $table->dropForeign(['tenant_id']);
                } catch (\Exception $e) {}
                try {
                    $table->dropUnique('customers_tenant_branch_phone_unique');
                } catch (\Exception $e) {}
            }
        });
        Schema::table('customers', function (Blueprint $table) {
            if (DB::getDriverName() !== 'sqlite') {
                try {
                    $table->unique(['tenant_id', 'phone'], 'customers_tenant_id_phone_unique');
                } catch (\Exception $e) {}
                try {
                    $table->foreign('tenant_id')->references('id')->on('tenants')->cascadeOnDelete();
                } catch (\Exception $e) {}
            }
        });
    }
};
