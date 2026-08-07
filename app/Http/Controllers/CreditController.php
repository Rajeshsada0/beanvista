<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\CreditTransaction;
use App\Models\ActivityLog;
use Illuminate\Http\Request;

class CreditController extends Controller
{
    /**
     * Record a credit payment (reduces the customer's due_amount).
     */
    public function recordPayment(Request $request, Customer $customer)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01|max:' . $customer->due_amount,
            'note'   => 'nullable|string|max:500',
        ]);

        // Deduct from due_amount
        $customer->due_amount = max(0, $customer->due_amount - $validated['amount']);
        $customer->save();

        // Log the transaction
        CreditTransaction::create([
            'customer_id' => $customer->id,
            'order_id'    => null,
            'type'        => 'payment',
            'amount'      => $validated['amount'],
            'note'        => $validated['note'] ?? 'Manual credit payment',
        ]);

        ActivityLog::record(
            'payment',
            "Credit payment of {$validated['amount']} received from {$customer->name}. Remaining due: {$customer->due_amount}",
            $customer
        );

        return back()->with('success', 'Payment recorded successfully.');
    }
}
