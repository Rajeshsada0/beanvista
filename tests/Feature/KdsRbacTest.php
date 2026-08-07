<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

class KdsRbacTest extends TestCase
{
    // Use DatabaseTransactions so we run against the real DB but roll back the changes
    use DatabaseTransactions;

    public function test_admin_can_create_kds_user()
    {
        $admin = User::where('role', 'admin')->first();
        if (!$admin) {
            $tenant = Tenant::first() ?? Tenant::create(['name' => 'Test Cafe', 'slug' => 'test-cafe']);
            $admin = User::create([
                'name' => 'Admin User',
                'email' => 'admin_test@cafe.com',
                'password' => bcrypt('password'),
                'role' => 'admin',
                'tenant_id' => $tenant->id,
            ]);
        }

        $response = $this->actingAs($admin)
            ->post(route('staff.store'), [
                'name' => 'Kitchen User',
                'email' => 'kitchen_test@cafe.com',
                'password' => 'password123',
                'role' => 'kitchen',
            ]);

        $response->assertRedirect();
        
        $this->assertDatabaseHas('users', [
            'email' => 'kitchen_test@cafe.com',
            'role' => 'kitchen',
        ]);
    }

    public function test_kitchen_user_is_redirected_to_kds_on_dashboard()
    {
        $kitchen = User::where('role', 'kitchen')->first();
        if (!$kitchen) {
            $tenant = Tenant::first() ?? Tenant::create(['name' => 'Test Cafe', 'slug' => 'test-cafe']);
            $kitchen = User::create([
                'name' => 'Kitchen User',
                'email' => 'kitchen_test@cafe.com',
                'password' => bcrypt('password'),
                'role' => 'kitchen',
                'tenant_id' => $tenant->id,
            ]);
        }

        $response = $this->actingAs($kitchen)
            ->get(route('dashboard'));

        $response->assertRedirect(route('orders.kds'));
    }

    public function test_kitchen_user_cannot_access_staff_performance()
    {
        $kitchen = User::where('role', 'kitchen')->first();
        if (!$kitchen) {
            $tenant = Tenant::first() ?? Tenant::create(['name' => 'Test Cafe', 'slug' => 'test-cafe']);
            $kitchen = User::create([
                'name' => 'Kitchen User',
                'email' => 'kitchen_test@cafe.com',
                'password' => bcrypt('password'),
                'role' => 'kitchen',
                'tenant_id' => $tenant->id,
            ]);
        }

        $response = $this->actingAs($kitchen)
            ->get(route('staff.performance'));

        $response->assertRedirect(route('orders.kds'));
    }
}
