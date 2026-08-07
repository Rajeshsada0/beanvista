<?php

namespace App\Http\Controllers\Superadmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class PlanController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $plans = \App\Models\Plan::latest()->get();
        return \Inertia\Inertia::render('Superadmin/Plans/Index', [
            'plans' => $plans
        ]);
    }

    public function create()
    {
        return \Inertia\Inertia::render('Superadmin/Plans/CreateEdit');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price_monthly' => 'required|numeric|min:0',
            'price_3_months' => 'required|numeric|min:0',
            'price_6_months' => 'required|numeric|min:0',
            'price_yearly' => 'required|numeric|min:0',
            'trial_days' => 'required|integer|min:0',
            'max_branches' => 'required|integer|min:-1',
            'max_tables' => 'required|integer|min:-1',
            'max_accounts' => 'required|integer|min:-1',
            'max_users' => 'required|integer|min:-1',
            'max_orders_per_month' => 'required|integer|min:-1',
            'features' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        \App\Models\Plan::create($validated);

        return redirect()->route('superadmin.plans.index')->with('success', 'Plan created successfully.');
    }

    public function edit(string $id)
    {
        $plan = \App\Models\Plan::findOrFail($id);
        return \Inertia\Inertia::render('Superadmin/Plans/CreateEdit', [
            'plan' => $plan
        ]);
    }

    public function update(Request $request, string $id)
    {
        $plan = \App\Models\Plan::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price_monthly' => 'required|numeric|min:0',
            'price_3_months' => 'required|numeric|min:0',
            'price_6_months' => 'required|numeric|min:0',
            'price_yearly' => 'required|numeric|min:0',
            'trial_days' => 'required|integer|min:0',
            'max_branches' => 'required|integer|min:-1',
            'max_tables' => 'required|integer|min:-1',
            'max_accounts' => 'required|integer|min:-1',
            'max_users' => 'required|integer|min:-1',
            'max_orders_per_month' => 'required|integer|min:-1',
            'features' => 'nullable|array',
            'is_active' => 'boolean',
        ]);

        $plan->update($validated);

        return redirect()->route('superadmin.plans.index')->with('success', 'Plan updated successfully.');
    }

    public function destroy(string $id)
    {
        $plan = \App\Models\Plan::findOrFail($id);
        
        if ($plan->subscriptions()->count() > 0) {
            return back()->with('error', 'Cannot delete plan because it has active subscriptions.');
        }

        $plan->delete();

        return redirect()->route('superadmin.plans.index')->with('success', 'Plan deleted successfully.');
    }
}
