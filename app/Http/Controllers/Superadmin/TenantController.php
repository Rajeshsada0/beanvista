<?php

namespace App\Http\Controllers\Superadmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class TenantController extends Controller
{
    public function index()
    {
        $tenants = \App\Models\Tenant::with(['subscription.plan', 'users'])->latest()->get();
        
        // Manually count users for MongoDB compatibility
        $tenants = $tenants->map(function ($tenant) {
            $tenant->users_count = $tenant->users->count();
            unset($tenant->users);
            return $tenant;
        });
        
        return \Inertia\Inertia::render('Superadmin/Tenants/Index', [
            'tenants' => $tenants
        ]);
    }

    public function create()
    {
        return \Inertia\Inertia::render('Superadmin/Tenants/CreateEdit', [
            'plans' => \App\Models\Plan::where('is_active', true)->get()
        ]);
    }

    public function store(\Illuminate\Http\Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:tenants,slug',
            'is_active' => 'boolean',
            'subscription.plan_id' => 'nullable|exists:plans,id',
            'subscription.status' => 'nullable|string|in:trialing,active,past_due,canceled,expired',
            'subscription.billing_cycle' => 'nullable|string|in:monthly,3_months,6_months,yearly',
            'subscription.amount_paid' => 'nullable|numeric|min:0',
        ]);

        $tenant = \App\Models\Tenant::create($request->only(['name', 'slug', 'is_active']));

        if ($request->filled('subscription.plan_id')) {
            $this->saveSubscription($tenant, $request->input('subscription'));
        }

        return redirect()->route('superadmin.tenants.index')->with('success', 'Cafe created successfully.');
    }

    public function edit(\App\Models\Tenant $tenant)
    {
        $tenant->load('subscription');
        return \Inertia\Inertia::render('Superadmin/Tenants/CreateEdit', [
            'tenant' => $tenant,
            'plans' => \App\Models\Plan::where('is_active', true)->get()
        ]);
    }

    public function update(\Illuminate\Http\Request $request, \App\Models\Tenant $tenant)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:tenants,slug,' . $tenant->id,
            'is_active' => 'boolean',
            'subscription.plan_id' => 'nullable|exists:plans,id',
            'subscription.status' => 'nullable|string|in:trialing,active,past_due,canceled,expired',
            'subscription.billing_cycle' => 'nullable|string|in:monthly,3_months,6_months,yearly',
            'subscription.amount_paid' => 'nullable|numeric|min:0',
        ]);

        $tenant->update($request->only(['name', 'slug', 'is_active']));

        if ($request->filled('subscription.plan_id')) {
            $this->saveSubscription($tenant, $request->input('subscription'));
        }

        return redirect()->route('superadmin.tenants.index')->with('success', 'Cafe updated successfully.');
    }

    protected function saveSubscription(\App\Models\Tenant $tenant, array $subData)
    {
        $plan = \App\Models\Plan::find($subData['plan_id']);
        if (!$plan) return;

        $startDate = now();
        $trialEndsAt = $subData['status'] === 'trialing' ? $startDate->copy()->addDays($plan->trial_days) : null;
        
        $endsAt = $startDate->copy();
        switch ($subData['billing_cycle']) {
            case 'monthly': $endsAt->addMonth(); break;
            case '3_months': $endsAt->addMonths(3); break;
            case '6_months': $endsAt->addMonths(6); break;
            case 'yearly': $endsAt->addYear(); break;
        }

        $tenant->subscription()->updateOrCreate(
            ['tenant_id' => $tenant->id],
            [
                'plan_id' => $plan->id,
                'status' => $subData['status'] ?? 'trialing',
                'billing_cycle' => $subData['billing_cycle'] ?? 'monthly',
                'amount_paid' => $subData['amount_paid'] ?? 0,
                'start_date' => $startDate,
                'trial_ends_at' => $trialEndsAt,
                'ends_at' => $endsAt,
            ]
        );

        if (($subData['status'] ?? '') === 'active') {
            $tenant->update(['trial_ends_at' => null]);
        }

        cache()->forget('tenant_trial_' . $tenant->id);
    }

    public function toggleStatus(\App\Models\Tenant $tenant)
    {
        $tenant->is_active = !$tenant->is_active;
        $tenant->save();

        return back()->with('success', 'Cafe status toggled successfully.');
    }

    public function destroy(\App\Models\Tenant $tenant)
    {
        try {
            $tenantId = $tenant->id;
            $tenant->purgeAllData();

            return redirect()->route('superadmin.tenants.index')->with('success', "Cafe ID {$tenantId} and all associated data deleted successfully.");
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error("Failed to delete tenant {$tenant->id}: " . $e->getMessage());

            return redirect()->route('superadmin.tenants.index')->with('error', 'Failed to delete cafe: ' . $e->getMessage());
        }
    }

    public function impersonate(\App\Models\Tenant $tenant)
    {
        // Find the admin user for this tenant
        $admin = $tenant->users()->where('role', 'admin')->first();
        if ($admin) {
            session(['original_user_id' => auth()->id()]);
            \Illuminate\Support\Facades\Auth::login($admin);
            return redirect()->route('dashboard');
        }
        
        return back()->with('error', 'No admin user found for this cafe. You cannot impersonate a cafe without an admin.');
    }

    public function stopImpersonating()
    {
        if (session()->has('original_user_id')) {
            $originalUserId = session('original_user_id');
            
            // We must bypass the TenantScope because the current user is a cafe admin
            // and the scope would prevent them from finding the superadmin user.
            $superAdmin = \App\Models\User::withoutGlobalScope(\App\Models\Scopes\TenantScope::class)->find($originalUserId);
            
            if ($superAdmin) {
                \Illuminate\Support\Facades\Auth::login($superAdmin);
                session()->forget('original_user_id');
                return redirect()->route('superadmin.tenants.index')->with('success', 'Restored Superadmin session.');
            }
        }
        
        return redirect()->route('dashboard');
    }
}
