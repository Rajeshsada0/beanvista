<?php

namespace App\Http\Controllers\Superadmin;

use App\Http\Controllers\Controller;
use App\Models\PaymentRequest;
use App\Models\PaymentMethod;
use App\Models\Tenant;
use App\Models\Subscription;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Inertia\Inertia;

class PaymentVerificationController extends Controller
{
    public function index()
    {
        // Fetch all payment requests (ordered by pending first, then latest)
        $requests = PaymentRequest::with(['tenant', 'plan', 'paymentMethod'])
            ->orderByRaw("CASE WHEN status = 'pending' THEN 0 ELSE 1 END")
            ->latest()
            ->get();

        $methods = PaymentMethod::latest()->get();

        return Inertia::render('Superadmin/VerifyPayments/Index', [
            'requests' => $requests,
            'methods' => $methods,
        ]);
    }

    public function approve($id)
    {
        $paymentRequest = PaymentRequest::findOrFail($id);

        if ($paymentRequest->status !== 'pending') {
            return back()->with('error', 'This request has already been processed.');
        }

        $paymentRequest->update([
            'status' => 'approved',
        ]);

        // Create or update subscription
        $startDate = Carbon::now();
        $endsAt = $startDate->copy();
        switch ($paymentRequest->billing_cycle) {
            case 'monthly':
                $endsAt->addMonth();
                break;
            case '3_months':
                $endsAt->addMonths(3);
                break;
            case '6_months':
                $endsAt->addMonths(6);
                break;
            case 'yearly':
            case '12_months':
                $endsAt->addYear();
                break;
            case '24_months':
                $endsAt->addYears(2);
                break;
            default:
                $endsAt->addYear();
                break;
        }

        Subscription::updateOrCreate(
            ['tenant_id' => $paymentRequest->tenant_id],
            [
                'plan_id' => $paymentRequest->plan_id,
                'status' => 'active',
                'billing_cycle' => $paymentRequest->billing_cycle,
                'amount_paid' => $paymentRequest->amount,
                'start_date' => $startDate,
                'trial_ends_at' => null,
                'ends_at' => $endsAt,
            ]
        );

        // Update tenant trial_ends_at to null so they are no longer in trialing mode
        $tenant = Tenant::find($paymentRequest->tenant_id);
        if ($tenant) {
            $tenant->update(['trial_ends_at' => null]);
        }

        // Clear trial cache
        cache()->forget('tenant_trial_' . $paymentRequest->tenant_id);

        return back()->with('success', 'Payment request approved successfully. Subscription activated.');
    }

    public function reject(Request $request, $id)
    {
        $paymentRequest = PaymentRequest::findOrFail($id);

        if ($paymentRequest->status !== 'pending') {
            return back()->with('error', 'This request has already been processed.');
        }

        $request->validate([
            'rejection_reason' => 'required|string|max:1000',
        ]);

        $paymentRequest->update([
            'status' => 'rejected',
            'rejection_reason' => $request->rejection_reason,
        ]);

        return back()->with('success', 'Payment request rejected.');
    }
}
