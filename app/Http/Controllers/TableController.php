<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class TableController extends Controller
{
    public function index()
    {
        $tables = \App\Models\Table::with([
            'orders' => function($q) {
                $q->withoutGlobalScope(\App\Models\Scopes\BranchScope::class)
                  ->whereNotIn('status', ['completed', 'cancelled'])
                  ->with(['customer', 'items']);
            },
            'reservations' => function($q) {
                $q->withoutGlobalScope(\App\Models\Scopes\BranchScope::class)
                  ->where('status', 'active');
            }
        ])->get();

        $currentBranchId = session('active_branch_id') ?: auth()->user()->primary_branch_id;

        // Auto-heal status and missing branch_id for any desynchronized table or order
        foreach ($tables as $table) {
            $activeOrder = $table->orders->first();
            if ($activeOrder) {
                // If active order lacks branch_id, heal it immediately with table's branch or current user branch
                if (!$activeOrder->branch_id) {
                    $targetBranchId = $table->branch_id ?: $currentBranchId;
                    if ($targetBranchId) {
                        $activeOrder->update(['branch_id' => $targetBranchId]);
                        $activeOrder->branch_id = $targetBranchId;
                    }
                }
                if ($table->status !== 'occupied') {
                    $table->update(['status' => 'occupied']);
                    $table->status = 'occupied';
                }
            } else {
                if ($table->status === 'occupied') {
                    $table->update(['status' => 'available']);
                    $table->status = 'available';
                }
            }
        }

        $activeSession = \App\Models\CashRegisterSession::where('tenant_id', auth()->user()->tenant_id)
            ->where('status', 'open')
            ->first();

        $cashSales = 0;
        $cashDeposits = 0;
        $cashWithdrawals = 0;

        if ($activeSession) {
            $tenantId = auth()->user()->tenant_id;
            // Find all cash orders completed after opened_at
            $cashSales = \App\Models\Order::where('tenant_id', $tenantId)
                ->where('status', 'completed')
                ->where('payment_method', 'cash')
                ->where('created_at', '>=', $activeSession->opened_at)
                ->sum('grand_total');

            // Find all cash drawer transactions (deposits/withdrawals) after opened_at
            $cashDrawerIds = \App\Models\BankAccount::where('tenant_id', $tenantId)
                ->where('account_type', 'cash')
                ->pluck('id');

            if ($cashDrawerIds->isNotEmpty()) {
                $cashDeposits = \App\Models\BankTransaction::whereIn('bank_account_id', $cashDrawerIds)
                    ->where('type', 'deposit')
                    ->where('created_at', '>=', $activeSession->opened_at)
                    ->sum('amount');

                $cashWithdrawals = \App\Models\BankTransaction::whereIn('bank_account_id', $cashDrawerIds)
                    ->where('type', 'withdrawal')
                    ->where('created_at', '>=', $activeSession->opened_at)
                    ->sum('amount');
            }
        }

        return \Inertia\Inertia::render('TableBook', [
            'tables' => $tables,
            'activeSession' => $activeSession,
            'cashSales' => (float)$cashSales,
            'cashDeposits' => (float)$cashDeposits,
            'cashWithdrawals' => (float)$cashWithdrawals,
        ]);
    }

    public function store(Request $request)
    {
        $tenant = auth()->user()->tenant;
        if ($tenant->hasLimitReached('max_tables')) {
            return back()->with('error', 'You have reached the maximum number of tables allowed by your subscription plan.');
        }

        $branchId = session('active_branch_id') ?: auth()->user()->primary_branch_id;
        $validated = $request->validate([
            'table_number' => [
                'required',
                'string',
                \Illuminate\Validation\Rule::unique('tables')->where(function ($query) use ($branchId) {
                    return $query->where('tenant_id', auth()->user()->tenant_id)
                                 ->where('branch_id', $branchId);
                })
            ],
            'capacity' => 'required|integer|min:1',
            'status' => 'required|in:available,reserved,occupied'
        ]);

        \App\Models\Table::create($validated);
        return back()->with('success', 'Table created successfully.');
    }

    public function update(Request $request, \App\Models\Table $table)
    {
        $branchId = session('active_branch_id') ?: auth()->user()->primary_branch_id;
        $validated = $request->validate([
            'table_number' => [
                'sometimes',
                'required',
                'string',
                \Illuminate\Validation\Rule::unique('tables')->ignore($table->id)->where(function ($query) use ($branchId) {
                    return $query->where('tenant_id', auth()->user()->tenant_id)
                                 ->where('branch_id', $branchId);
                })
            ],
            'capacity' => 'sometimes|required|integer|min:1',
            'status' => 'sometimes|required|in:available,reserved,occupied'
        ]);

        $table->update($validated);
        return back()->with('success', 'Table updated successfully.');
    }

    public function destroy(\App\Models\Table $table)
    {
        $table->delete();
        return back()->with('success', 'Table deleted successfully.');
    }
}
