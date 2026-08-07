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
                $q->where(function($query) {
                    $query->whereNotIn('status', ['completed', 'cancelled'])
                          ->orWhere(function($sub) {
                              $sub->where('status', 'completed')
                                  ->where('created_at', '>=', now()->subHours(24))
                                  ->whereHas('items', function($ki) {
                                      $ki->where(function($k) {
                                          $k->whereNull('kds_status')
                                            ->orWhereNotIn('kds_status', ['delivered']);
                                      });
                                  });
                          });
                })->with(['customer', 'items']);
            },
            'reservations' => function($q) {
                $q->where('status', 'active');
            }
        ])->get();

        // Auto-cleanup: If an occupied table has no actual order items, free it
        foreach ($tables as $table) {
            if ($table->status === 'occupied') {
                // If there's a completed order with pending kitchen items, don't clean it up
                $hasCompletedWithPendingItems = \App\Models\Order::where('table_id', $table->id)
                    ->where('status', 'completed')
                    ->where('created_at', '>=', now()->subHours(24))
                    ->whereHas('items', function ($query) {
                        $query->where(function ($q) {
                            $q->whereNull('kds_status')
                              ->orWhereNotIn('kds_status', ['delivered']);
                        });
                    })
                    ->exists();

                if ($hasCompletedWithPendingItems) {
                    continue;
                }

                $activeOrder = $table->orders->first();
                if (!$activeOrder || $activeOrder->items->count() === 0) {
                    if ($activeOrder) $activeOrder->delete();
                    $table->update(['status' => 'available']);
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
                'required',
                'string',
                \Illuminate\Validation\Rule::unique('tables')->ignore($table->id)->where(function ($query) use ($branchId) {
                    return $query->where('tenant_id', auth()->user()->tenant_id)
                                 ->where('branch_id', $branchId);
                })
            ],
            'capacity' => 'required|integer|min:1',
            'status' => 'required|in:available,reserved,occupied'
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
