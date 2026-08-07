<?php

namespace App\Http\Controllers;

use App\Models\Plan;
use App\Models\PaymentMethod;
use App\Models\PaymentRequest;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;
use Inertia\Inertia;

class TenantPlanController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $tenant = Tenant::with('subscription.plan')->findOrFail($user->tenant_id);
        
        $pendingRequest = PaymentRequest::where('tenant_id', $user->tenant_id)
            ->where('status', 'pending')
            ->with(['plan', 'paymentMethod'])
            ->first();
            
        $paymentMethods = PaymentMethod::where('is_active', true)->get();
        $plans = Plan::where('is_active', true)->get();

        $trial = null;
        if ($tenant->trial_ends_at) {
            $now = Carbon::now();
            $endsAt = Carbon::parse($tenant->trial_ends_at);
            $isExpired = $now->greaterThan($endsAt);
            $trial = [
                'ends_at' => $endsAt->toIso8601String(),
                'days_remaining' => $isExpired ? 0 : (int) ceil($now->floatDiffInDays($endsAt)),
                'is_expired' => $isExpired,
            ];
        }

        $subscription = null;
        if ($tenant->subscription) {
            $subscription = [
                'id' => $tenant->subscription->id,
                'plan_name' => $tenant->subscription->plan ? $tenant->subscription->plan->name : 'N/A',
                'status' => $tenant->subscription->status,
                'billing_cycle' => $tenant->subscription->billing_cycle,
                'amount_paid' => $tenant->subscription->amount_paid,
                'start_date' => $tenant->subscription->start_date ? $tenant->subscription->start_date->format('Y-m-d') : null,
                'ends_at' => $tenant->subscription->ends_at ? $tenant->subscription->ends_at->format('Y-m-d') : null,
                'is_expired' => $tenant->subscription->is_expired,
            ];
        }

        return Inertia::render('Admin/MyPlan', [
            'plans' => $plans,
            'paymentMethods' => $paymentMethods,
            'pendingRequest' => $pendingRequest,
            'subscription' => $subscription,
            'tenantTrial' => $trial,
        ]);
    }

    public function checkout(Request $request)
    {
        $user = auth()->user();
        $tenantId = $user->tenant_id;

        // Check if there is already a pending request
        $existing = PaymentRequest::where('tenant_id', $tenantId)
            ->where('status', 'pending')
            ->first();

        if ($existing) {
            return back()->with('error', 'You already have a pending verification request. Please cancel it before submitting a new one.');
        }

        $request->validate([
            'plan_id' => 'required|exists:plans,id',
            'billing_cycle' => 'required|string|in:monthly,3_months,6_months,yearly,24_months',
            'amount' => 'required|numeric|min:0',
            'payment_method_id' => 'required|exists:payment_methods,id',
            'reference_number' => 'required|string|max:255',
            'receipt' => 'required|image|max:5120', // Max 5MB
            'notes' => 'nullable|string|max:1000',
        ]);

        $receiptPath = null;
        if ($request->hasFile('receipt')) {
            $receiptPath = $request->file('receipt')->store("tenants/{$tenantId}/receipts", 'public');
        }

        PaymentRequest::create([
            'tenant_id' => $tenantId,
            'plan_id' => $request->plan_id,
            'billing_cycle' => $request->billing_cycle,
            'amount' => $request->amount,
            'payment_method_id' => $request->payment_method_id,
            'reference_number' => $request->reference_number,
            'receipt_path' => $receiptPath,
            'notes' => $request->notes,
            'status' => 'pending',
        ]);

        return back()->with('success', 'Your payment verification request has been submitted successfully.');
    }

    public function cancelRequest($id)
    {
        $user = auth()->user();
        $request = PaymentRequest::where('tenant_id', $user->tenant_id)
            ->where('status', 'pending')
            ->findOrFail($id);

        if ($request->receipt_path) {
            Storage::disk('public')->delete($request->receipt_path);
        }

        $request->delete();

        return back()->with('success', 'Your verification request has been cancelled.');
    }
}
