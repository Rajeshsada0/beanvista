<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\CreditTransaction;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CreditController extends Controller
{
    /**
     * Record a credit payment (reduces the customer's due_amount).
     */
    public function recordPayment(Request $request, Customer $customer)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'note'   => 'nullable|string|max:500',
            'date'   => 'nullable|date',
        ]);

        return DB::transaction(function () use ($validated, $customer) {
            $amount = (float)$validated['amount'];

            // Deduct from due_amount
            $customer->due_amount = max(0, round($customer->due_amount - $amount, 2));
            $customer->save();

            $branchId = session('active_branch_id') ?: (auth()->user()->primary_branch_id ?? $customer->branch_id);

            // Log the transaction
            $tx = CreditTransaction::create([
                'tenant_id'   => $customer->tenant_id,
                'branch_id'   => $branchId,
                'customer_id' => $customer->id,
                'order_id'    => null,
                'type'        => 'payment',
                'amount'      => $amount,
                'note'        => $validated['note'] ?? 'Manual credit payment',
            ]);

            if (!empty($validated['date'])) {
                $tx->created_at = $validated['date'];
                $tx->save();
            }

            ActivityLog::record(
                'payment',
                "Credit payment of {$amount} received from {$customer->name}. Remaining due: {$customer->due_amount}",
                $customer
            );

            return back()->with('success', 'Payment recorded successfully.');
        });
    }

    /**
     * Store a manual credit transaction (charge or payment).
     */
    public function store(Request $request, Customer $customer)
    {
        $validated = $request->validate([
            'type'   => 'required|in:charge,payment',
            'amount' => 'required|numeric|min:0.01',
            'note'   => 'nullable|string|max:500',
            'date'   => 'nullable|date',
        ]);

        return DB::transaction(function () use ($validated, $customer) {
            $amount = (float)$validated['amount'];

            if ($validated['type'] === 'charge') {
                $customer->due_amount = round($customer->due_amount + $amount, 2);
            } else {
                $customer->due_amount = max(0, round($customer->due_amount - $amount, 2));
            }
            $customer->save();

            $branchId = session('active_branch_id') ?: (auth()->user()->primary_branch_id ?? $customer->branch_id);

            $tx = CreditTransaction::create([
                'tenant_id'   => $customer->tenant_id,
                'branch_id'   => $branchId,
                'customer_id' => $customer->id,
                'order_id'    => null,
                'type'        => $validated['type'],
                'amount'      => $amount,
                'note'        => $validated['note'] ?? ($validated['type'] === 'charge' ? 'Manual credit charge' : 'Manual credit payment'),
            ]);

            if (!empty($validated['date'])) {
                $tx->created_at = $validated['date'];
                $tx->save();
            }

            ActivityLog::record(
                $validated['type'] === 'charge' ? 'credit_charge' : 'credit_payment',
                "Manual credit {$validated['type']} of {$amount} recorded for {$customer->name}. Updated due: {$customer->due_amount}",
                $customer
            );

            return back()->with('success', ucfirst($validated['type']) . ' entry added successfully.');
        });
    }

    /**
     * Update an existing credit transaction and adjust the customer's due_amount.
     */
    public function update(Request $request, CreditTransaction $transaction)
    {
        $validated = $request->validate([
            'type'       => 'required|in:charge,payment',
            'amount'     => 'required|numeric|min:0.01',
            'note'       => 'nullable|string|max:500',
            'created_at' => 'nullable|date',
        ]);

        return DB::transaction(function () use ($validated, $transaction) {
            $customer = $transaction->customer;
            $oldType = $transaction->type;
            $oldAmount = (float)$transaction->amount;
            $newType = $validated['type'];
            $newAmount = (float)$validated['amount'];

            // 1. Revert the old transaction effect
            if ($oldType === 'charge') {
                $customer->due_amount -= $oldAmount;
            } else {
                $customer->due_amount += $oldAmount;
            }

            // 2. Apply the new transaction effect
            if ($newType === 'charge') {
                $customer->due_amount += $newAmount;
            } else {
                $customer->due_amount -= $newAmount;
            }

            $customer->due_amount = max(0, round($customer->due_amount, 2));
            $customer->save();

            // 3. Update the transaction record
            $transaction->type = $newType;
            $transaction->amount = $newAmount;
            $transaction->note = $validated['note'] ?? null;
            if (!empty($validated['created_at'])) {
                $transaction->created_at = $validated['created_at'];
            }
            $transaction->save();

            ActivityLog::record(
                'credit_ledger_updated',
                "Credit transaction #{$transaction->id} updated for {$customer->name} ({$oldType} {$oldAmount} -> {$newType} {$newAmount}). Updated due: {$customer->due_amount}",
                $customer
            );

            return back()->with('success', 'Credit transaction updated successfully.');
        });
    }

    /**
     * Delete a credit transaction and revert its impact on customer's due_amount.
     */
    public function destroy(CreditTransaction $transaction)
    {
        return DB::transaction(function () use ($transaction) {
            $customer = $transaction->customer;
            $amount = (float)$transaction->amount;
            $type = $transaction->type;

            // Revert impact: if charge deleted, customer owes less; if payment deleted, customer owes more
            if ($type === 'charge') {
                $customer->due_amount = max(0, round($customer->due_amount - $amount, 2));
            } else {
                $customer->due_amount = round($customer->due_amount + $amount, 2);
            }
            $customer->save();

            ActivityLog::record(
                'credit_ledger_deleted',
                "Credit transaction #{$transaction->id} ({$type} of {$amount}) deleted for {$customer->name}. Updated due: {$customer->due_amount}",
                $customer
            );

            $transaction->delete();

            return back()->with('success', 'Credit transaction deleted successfully.');
        });
    }
}
