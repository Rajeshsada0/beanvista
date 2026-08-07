<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class StaffController extends Controller
{
    public function store(Request $request)
    {
        $tenant = auth()->user()->tenant;
        if ($tenant->hasLimitReached('max_users')) {
            return back()->with('error', 'You have reached the maximum number of staff users allowed by your subscription plan.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role' => ['required', Rule::in(['admin', 'staff', 'cashier', 'waiter', 'kitchen'])],
        ]);

        $branchId = session('active_branch_id') ?: auth()->user()->primary_branch_id;

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'],
            'primary_branch_id' => $branchId,
        ]);

        ActivityLog::record('created', "Added new staff member: {$user->name} ({$user->role})", $user);

        return back()->with('success', 'Staff member added successfully.');
    }

    public function update(Request $request, User $staff)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')->ignore($staff->id)],
            'role' => ['required', Rule::in(['admin', 'staff', 'cashier', 'waiter', 'kitchen'])],
            'password' => 'nullable|string|min:8',
        ]);

        $staff->name = $validated['name'];
        $staff->email = $validated['email'];
        $staff->role = $validated['role'];

        if ($request->filled('password')) {
            $staff->password = Hash::make($validated['password']);
        }

        $staff->save();

        ActivityLog::record('updated', "Updated staff member details: {$staff->name}", $staff);

        return back()->with('success', 'Staff member updated successfully.');
    }

    public function destroy(User $staff)
    {
        // Prevent deleting yourself if you are the current user
        if (auth()->id() === $staff->id) {
            return back()->with('error', 'You cannot delete your own account.');
        }

        $name = $staff->name;
        $staff->delete();

        ActivityLog::record('deleted', "Removed staff member: {$name}");

        return back()->with('success', 'Staff member removed successfully.');
    }
}
