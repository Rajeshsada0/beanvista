<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BranchController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $tenantId = auth()->user()->tenant_id;
        $branches = Branch::where('tenant_id', $tenantId)->get();

        return Inertia::render('Settings/Branches', [
            'branches' => $branches
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $tenant = auth()->user()->tenant;
        if ($tenant->hasLimitReached('max_branches')) {
            return back()->with('error', 'You have reached the maximum number of branches allowed by your subscription plan.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:500',
            'phone' => 'nullable|string|max:50',
            'is_active' => 'required|boolean',
        ]);

        $tenantId = auth()->user()->tenant_id;

        Branch::create(array_merge($validated, ['tenant_id' => $tenantId]));

        return back()->with('success', 'Branch created successfully.');
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Branch $branch)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:500',
            'phone' => 'nullable|string|max:50',
            'is_active' => 'required|boolean',
        ]);

        $branch->update($validated);

        return back()->with('success', 'Branch updated successfully.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Branch $branch)
    {
        // Check if there are tables, orders or shifts associated
        if ($branch->tables()->exists() || $branch->orders()->exists()) {
            return back()->with('error', 'Cannot delete branch because it has associated tables or orders.');
        }

        $branch->delete();

        return back()->with('success', 'Branch deleted successfully.');
    }

    /**
     * Switch the active branch session context.
     */
    public function switchBranch(Request $request)
    {
        $request->validate([
            'branch_id' => 'required|exists:branches,id',
        ]);

        $branchId = $request->branch_id;
        $user = auth()->user();

        // Security check: Verify that user has access to this branch
        $hasAccess = false;
        if ($user->role === 'super_admin') {
            $hasAccess = true;
        } elseif ($user->role === 'admin') {
            // Admins can access any branch within their tenant
            $hasAccess = Branch::where('id', $branchId)->where('tenant_id', $user->tenant_id)->exists();
        } else {
            // Staff must be explicitly assigned to the branch
            $hasAccess = $user->branches()->where('branches.id', $branchId)->exists();
        }

        if (!$hasAccess) {
            return back()->with('error', 'You do not have permission to access this branch.');
        }

        // Update active branch in session
        session(['active_branch_id' => (int) $branchId]);

        return back()->with('success', 'Switched branch successfully.');
    }
}
