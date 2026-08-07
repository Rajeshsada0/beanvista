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
        Schema::table('plans', function (Blueprint $table) {
            $table->integer('max_branches')->default(-1)->after('trial_days');
            $table->integer('max_tables')->default(-1)->after('max_branches');
            $table->integer('max_accounts')->default(-1)->after('max_tables');
            $table->integer('max_users')->default(-1)->after('max_accounts');
        });

        // Backfill limits for existing plans
        DB::table('plans')->where('id', 1)->update([
            'max_branches' => 1,
            'max_tables' => 3,
            'max_accounts' => 10,
            'max_users' => 2,
        ]);

        DB::table('plans')->where('id', 2)->update([
            'max_branches' => 3,
            'max_tables' => 15,
            'max_accounts' => 30,
            'max_users' => 10,
        ]);

        DB::table('plans')->where('id', 3)->update([
            'max_branches' => 1,
            'max_tables' => 5,
            'max_accounts' => 15,
            'max_users' => 3,
        ]);

        DB::table('plans')->where('id', 4)->update([
            'max_branches' => 3,
            'max_tables' => 20,
            'max_accounts' => 40,
            'max_users' => 15,
        ]);

        DB::table('plans')->where('id', 5)->update([
            'max_branches' => 5,
            'max_tables' => 50,
            'max_accounts' => 100,
            'max_users' => 30,
        ]);

        DB::table('plans')->where('id', 6)->update([
            'max_branches' => -1,
            'max_tables' => -1,
            'max_accounts' => -1,
            'max_users' => -1,
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->dropColumn(['max_branches', 'max_tables', 'max_accounts', 'max_users']);
        });
    }
};
