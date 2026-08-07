<?php

namespace App\Http\Controllers\Superadmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index()
    {
        $stats = [
            'total_cafes' => \App\Models\Tenant::count(),
            'active_cafes' => \App\Models\Tenant::where('is_active', true)->count(),
            'total_users' => \App\Models\User::count(),
            'total_super_admins' => \App\Models\User::where('role', 'super_admin')->count(),
        ];

        // Fetch tenants with their orders for manual counting (MongoDB compatibility)
        $tenants = \App\Models\Tenant::with(['orders' => function ($query) {
            $query->withoutGlobalScopes();
        }])->get();
        
        $cafe_activity = $tenants->map(function ($tenant) {
            $tenant->today_orders = $tenant->orders->where('created_at', '>=', \Carbon\Carbon::today())->count();
            $tenant->weekly_orders = $tenant->orders->where('created_at', '>=', \Carbon\Carbon::now()->startOfWeek())->count();
            unset($tenant->orders);
            return $tenant;
        });

        return \Inertia\Inertia::render('Superadmin/Dashboard', [
            'stats' => $stats,
            'cafe_activity' => $cafe_activity
        ]);
    }
}
