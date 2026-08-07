<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Customer;
use Inertia\Inertia;

class CustomerController extends Controller
{
    public function index()
    {
        // MongoDB-compatible: Load relationships and count in PHP
        $customers = Customer::with('orders')
            ->orderBy('loyalty_points', 'desc')
            ->get()
            ->map(function($customer) {
                return [
                    'id' => $customer->id,
                    'name' => $customer->name,
                    'email' => $customer->email,
                    'phone' => $customer->phone,
                    'loyalty_points' => $customer->loyalty_points,
                    'due_amount' => $customer->due_amount,
                    'credit_limit' => $customer->credit_limit,
                    'created_at' => $customer->created_at,
                    'updated_at' => $customer->updated_at,
                    'orders_count' => $customer->orders->count(),
                ];
            });
            
        return Inertia::render('Customers/Index', [
            'customers' => $customers,
        ]);
    }

    public function show(Customer $customer)
    {
        $orders = $customer->orders()
            ->with(['items.menu', 'table'])
            ->latest()
            ->paginate(20);

        $pointHistory = \App\Models\ActivityLog::where('subject_type', \App\Models\Customer::class)
            ->where('subject_id', $customer->id)
            ->whereIn('action', ['earned', 'redeemed', 'refunded'])
            ->latest()
            ->get();

        $creditTransactions = $customer->creditTransactions()->with('order')->get();

        return Inertia::render('Customers/Show', [
            'customer'           => $customer,
            'orders'             => $orders,
            'pointHistory'       => $pointHistory,
            'creditTransactions' => $creditTransactions,
            'stats' => [
                'total_orders'        => $customer->orders()->count(),
                'total_spent'         => $customer->orders()->sum('grand_total'),
                'average_order_value' => $customer->orders()->count() > 0
                    ? $customer->orders()->sum('grand_total') / $customer->orders()->count()
                    : 0,
                'last_order_date'     => $customer->orders()->latest()->first()?->created_at,
                'due_amount'          => $customer->due_amount,
                'credit_limit'        => $customer->credit_limit,
            ],
            'settings' => \App\Models\Setting::all()->pluck('value', 'key'),
        ]);
    }

    public function store(Request $request)
    {
        $branchId = session('active_branch_id') ?: auth()->user()->primary_branch_id;
        $validated = $request->validate([
            'name'          => 'required|string|max:255',
            'phone'         => [
                'required',
                'digits:10',
                \Illuminate\Validation\Rule::unique('customers')->where(function ($query) use ($branchId) {
                    return $query->where('tenant_id', auth()->user()->tenant_id)
                                 ->where('branch_id', $branchId);
                })
            ],
            'email'         => 'nullable|email|max:255',
            'birthday'      => 'nullable|date',
        ]);

        Customer::create($validated);

        return back()->with('success', 'Customer registered successfully.');
    }

    public function update(Request $request, Customer $customer)
    {
        $branchId = session('active_branch_id') ?: auth()->user()->primary_branch_id;
        $validated = $request->validate([
            'name'          => 'required|string|max:255',
            'phone'         => [
                'required',
                'digits:10',
                \Illuminate\Validation\Rule::unique('customers')->ignore($customer->id)->where(function ($query) use ($branchId) {
                    return $query->where('tenant_id', auth()->user()->tenant_id)
                                 ->where('branch_id', $branchId);
                })
            ],
            'email'         => 'nullable|email|max:255',
            'birthday'      => 'nullable|date',
            'loyalty_points'=> 'nullable|numeric',
            'credit_limit'  => 'nullable|numeric|min:0',
        ]);

        $customer->update($validated);

        return back()->with('success', 'Customer updated successfully.');
    }

    public function destroy(Customer $customer)
    {
        $customer->delete();
        return back()->with('success', 'Customer deleted successfully.');
    }
}
