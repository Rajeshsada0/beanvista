<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    protected $scopedTables = [
        'tables', 'floor_areas', 'orders', 'reservations',
        'shifts', 'cash_register_sessions', 'expenses', 'bank_accounts', 'journal_entries'
    ];

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Add primary_branch_id to users first
        if (Schema::hasTable('users')) {
            Schema::table('users', function (Blueprint $table) {
                if (!Schema::hasColumn('users', 'primary_branch_id')) {
                    $table->unsignedBigInteger('primary_branch_id')->nullable()->after('tenant_id');
                }
            });
        }

        // 2. Add branch_id to other business tables
        foreach ($this->scopedTables as $tableName) {
            if (Schema::hasTable($tableName)) {
                Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                    if (!Schema::hasColumn($tableName, 'branch_id')) {
                        // Safely position after tenant_id if it exists, otherwise after id
                        $col = $table->unsignedBigInteger('branch_id')->nullable();
                        if (Schema::hasColumn($tableName, 'tenant_id')) {
                            $col->after('tenant_id');
                        } else {
                            $col->after('id');
                        }
                    }
                });
            }
        }

        // 3. Create branch_user pivot table
        if (!Schema::hasTable('branch_user')) {
            Schema::create('branch_user', function (Blueprint $table) {
                $table->foreignId('branch_id')->constrained('branches')->cascadeOnDelete();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->primary(['branch_id', 'user_id']);
            });
        }

        // 4. Create default branch for each tenant and link existing data
        $tenants = DB::table('tenants')->get();
        foreach ($tenants as $tenant) {
            // Check if default branch already exists for this tenant to avoid double inserts
            $branchId = DB::table('branches')
                ->where('tenant_id', $tenant->id)
                ->value('id');

            if (!$branchId) {
                $branchId = DB::table('branches')->insertGetId([
                    'tenant_id' => $tenant->id,
                    'name' => 'Main Outlet',
                    'code' => 'MAIN',
                    'address' => $tenant->name . ' - Central Location',
                    'is_active' => true,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            // Assign existing rows of this tenant to this default branch
            foreach ($this->scopedTables as $tableName) {
                if (Schema::hasTable($tableName) && Schema::hasColumn($tableName, 'tenant_id')) {
                    DB::table($tableName)
                        ->where('tenant_id', $tenant->id)
                        ->whereNull('branch_id')
                        ->update(['branch_id' => $branchId]);
                }
            }

            // Link existing users to default branch
            if (Schema::hasTable('users')) {
                DB::table('users')
                    ->where('tenant_id', $tenant->id)
                    ->whereNull('primary_branch_id')
                    ->update(['primary_branch_id' => $branchId]);

                $users = DB::table('users')->where('tenant_id', $tenant->id)->get();
                foreach ($users as $user) {
                    // Check if already assigned
                    $exists = DB::table('branch_user')
                        ->where('branch_id', $branchId)
                        ->where('user_id', $user->id)
                        ->exists();

                    if (!$exists) {
                        DB::table('branch_user')->insert([
                            'branch_id' => $branchId,
                            'user_id' => $user->id
                        ]);
                    }
                }
            }
        }

        // 5. Add foreign keys where supported
        if (DB::getDriverName() !== 'sqlite') {
            Schema::table('users', function (Blueprint $table) {
                $table->foreign('primary_branch_id')->references('id')->on('branches')->nullOnDelete();
            });

            foreach ($this->scopedTables as $tableName) {
                if (Schema::hasTable($tableName)) {
                    Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                        $table->foreign('branch_id')->references('id')->on('branches')->cascadeOnDelete();
                    });
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Drop pivot table first
        Schema::dropIfExists('branch_user');

        // Drop foreign keys if supported
        if (DB::getDriverName() !== 'sqlite') {
            if (Schema::hasTable('users') && Schema::hasColumn('users', 'primary_branch_id')) {
                Schema::table('users', function (Blueprint $table) {
                    $table->dropForeign(['primary_branch_id']);
                });
            }

            foreach ($this->scopedTables as $tableName) {
                if (Schema::hasTable($tableName) && Schema::hasColumn($tableName, 'branch_id')) {
                    Schema::table($tableName, function (Blueprint $table) {
                        $table->dropForeign(['branch_id']);
                    });
                }
            }
        }

        // Drop columns
        if (Schema::hasTable('users') && Schema::hasColumn('users', 'primary_branch_id')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('primary_branch_id');
            });
        }

        foreach ($this->scopedTables as $tableName) {
            if (Schema::hasTable($tableName) && Schema::hasColumn($tableName, 'branch_id')) {
                Schema::table($tableName, function (Blueprint $table) {
                    $table->dropColumn('branch_id');
                });
            }
        }
    }
};
