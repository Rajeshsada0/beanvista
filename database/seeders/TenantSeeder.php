<?php

namespace Database\Seeders;

use App\Models\Tenant;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class TenantSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create default tenant with ID = 1
        Tenant::updateOrCreate(
            ['id' => 1],
            [
                'name' => 'Default Cafe',
                'slug' => 'default-cafe',
                'is_active' => true,
            ]
        );

        // Create additional sample tenants (optional)
        Tenant::updateOrCreate(
            ['slug' => 'cafe-branch-1'],
            [
                'name' => 'Cafe Branch 1',
                'is_active' => true,
            ]
        );

        Tenant::updateOrCreate(
            ['slug' => 'cafe-branch-2'],
            [
                'name' => 'Cafe Branch 2',
                'is_active' => true,
            ]
        );
    }
}
