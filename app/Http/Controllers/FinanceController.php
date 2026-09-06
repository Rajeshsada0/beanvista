<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Expense;
use App\Models\BankAccount;
use App\Models\BankTransaction;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class FinanceController extends Controller
{
    public function profitLoss(Request $request)
    {
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', Carbon::now()->endOfMonth()->toDateString());

        // Calculate Revenue from Orders (Global Scope automatically handles tenant_id)
        $revenue = Order::whereIn('status', ['completed'])
            ->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->sum('grand_total');

        // Calculate Expenses (Global Scope automatically handles tenant_id)
        $expensesTotal = Expense::whereBetween('date', [$startDate, $endDate])
            ->sum('amount');
            
        // For joined query, bypass Global Scope to avoid ambiguous 'tenant_id'
        $expensesByCategory = Expense::withoutGlobalScope(\App\Models\Scopes\TenantScope::class)
            ->where('expenses.tenant_id', auth()->user()->tenant_id)
            ->whereBetween('date', [$startDate, $endDate])
            ->join('expense_categories', 'expenses.expense_category_id', '=', 'expense_categories.id')
            ->select('expense_categories.name', DB::raw('SUM(expenses.amount) as total'))
            ->groupBy('expense_categories.name')
            ->get();

        $grossProfit = $revenue; // Simplified, usually Revenue - COGS
        $netProfit = $grossProfit - $expensesTotal;

        return Inertia::render('Finance/ProfitLoss', [
            'startDate' => $startDate,
            'endDate' => $endDate,
            'revenue' => $revenue,
            'expensesTotal' => $expensesTotal,
            'expensesByCategory' => $expensesByCategory,
            'grossProfit' => $grossProfit,
            'netProfit' => $netProfit,
        ]);
    }

    public function banking(Request $request)
    {
        $tenantId = auth()->user()->tenant_id ?? 1;
        \App\Http\Controllers\ApiController::syncAllPendingOrderBanking($tenantId);

        $accounts = BankAccount::with('glAccount')->get();
        $transactions = BankTransaction::with('bankAccount')
            ->orderBy('date', 'desc')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Finance/Banking', [
            'accounts' => $accounts,
            'transactions' => $transactions,
        ]);
    }

    public function storeBankAccount(Request $request)
    {
        $validated = $request->validate([
            'account_name' => 'required|string|max:255',
            'account_number' => 'nullable|string|max:255',
            'bank_name' => 'nullable|string|max:255',
            'account_type' => 'required|in:checking,cash,online',
            'balance' => 'required|numeric|min:0',
            'qr_code' => 'nullable|image|max:3072',
        ]);

        $tenantId = auth()->user()->tenant_id ?? 1;

        $qrPath = null;
        if ($request->hasFile('qr_code')) {
            $qrPath = $request->file('qr_code')->store("tenants/{$tenantId}/bank_qrs", 'public');
        }

        // Create a GL Account for this bank
        $glAccount = \App\Models\Account::create([
            'tenant_id' => $tenantId,
            'name' => $validated['account_name'] . ' (Bank)',
            'code' => '100' . rand(10, 99), // Simple code generation
            'type' => 'asset',
            'description' => 'Bank account for ' . ($validated['bank_name'] ?? '')
        ]);

        BankAccount::create([
            'tenant_id' => $tenantId,
            'account_name' => $validated['account_name'],
            'account_number' => $validated['account_number'],
            'bank_name' => $validated['bank_name'],
            'account_type' => $validated['account_type'],
            'qr_code' => $qrPath,
            'gl_account_id' => $glAccount->id,
            'balance' => $validated['balance'],
        ]);

        return back()->with('success', 'Bank account added successfully.');
    }

    public function updateBankAccount(Request $request, \App\Models\BankAccount $account)
    {
        $validated = $request->validate([
            'account_name' => 'required|string|max:255',
            'account_number' => 'nullable|string|max:255',
            'bank_name' => 'nullable|string|max:255',
            'account_type' => 'required|in:checking,cash,online',
            'balance' => 'required|numeric|min:0',
            'qr_code' => 'nullable|image|max:3072',
            'remove_qr' => 'nullable|boolean',
        ]);

        $tenantId = auth()->user()->tenant_id ?? $account->tenant_id ?? 1;

        if ($request->hasFile('qr_code')) {
            if ($account->qr_code && \Illuminate\Support\Facades\Storage::disk('public')->exists($account->qr_code)) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($account->qr_code);
            }
            $validated['qr_code'] = $request->file('qr_code')->store("tenants/{$tenantId}/bank_qrs", 'public');
        } elseif ($request->boolean('remove_qr')) {
            if ($account->qr_code && \Illuminate\Support\Facades\Storage::disk('public')->exists($account->qr_code)) {
                \Illuminate\Support\Facades\Storage::disk('public')->delete($account->qr_code);
            }
            $validated['qr_code'] = null;
        }

        unset($validated['remove_qr']);
        $account->update($validated);
        
        if ($account->glAccount) {
            $account->glAccount->update([
                'name' => $validated['account_name'] . ' (Bank)',
                'description' => 'Bank account for ' . ($validated['bank_name'] ?? '')
            ]);
        }

        return back()->with('success', 'Bank account updated successfully.');
    }

    public function destroyBankAccount(\App\Models\BankAccount $account)
    {
        if ($account->transactions()->exists()) {
            return back()->with('error', 'Cannot delete account with existing transactions.');
        }

        if ($account->qr_code && \Illuminate\Support\Facades\Storage::disk('public')->exists($account->qr_code)) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($account->qr_code);
        }

        if ($account->glAccount) {
            $account->glAccount->delete();
        }
        $account->delete();

        return back()->with('success', 'Bank account deleted successfully.');
    }

    public function accounts(Request $request) 
    { 
        $accounts = \App\Models\Account::where('tenant_id', auth()->user()->tenant_id)
            ->orderBy('code')
            ->get();
            
        return Inertia::render('Finance/ChartOfAccounts', [
            'accounts' => $accounts
        ]); 
    }

    public function storeAccount(Request $request)
    {
        $tenant = auth()->user()->tenant;
        if ($tenant->hasLimitReached('max_accounts')) {
            return back()->with('error', 'You have reached the maximum number of financial accounts allowed by your subscription plan.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:accounts,code',
            'type' => 'required|string|in:asset,liability,equity,revenue,expense',
            'description' => 'nullable|string'
        ]);

        \App\Models\Account::create([
            'tenant_id' => auth()->user()->tenant_id,
            'name' => $validated['name'],
            'code' => $validated['code'],
            'type' => $validated['type'],
            'description' => $validated['description']
        ]);

        return back()->with('success', 'Account added successfully.');
    }
    public function journalEntries(Request $request) 
    { 
        $tenantId = auth()->user()->tenant_id;
        
        $entries = \App\Models\JournalEntry::where('tenant_id', $tenantId)
            ->with('lines.account')
            ->orderBy('date', 'desc')
            ->orderBy('id', 'desc')
            ->paginate(20);
            
        $accounts = \App\Models\Account::where('tenant_id', $tenantId)->orderBy('name')->get();
            
        return Inertia::render('Finance/JournalEntries', [
            'entries' => $entries,
            'accounts' => $accounts
        ]); 
    }

    public function storeJournalEntry(Request $request)
    {
        $validated = $request->validate([
            'date' => 'required|date',
            'reference' => 'nullable|string|max:255',
            'description' => 'required|string|max:255',
            'lines' => 'required|array|min:2',
            'lines.*.account_id' => 'required|exists:accounts,id',
            'lines.*.description' => 'nullable|string',
            'lines.*.debit' => 'required|numeric|min:0',
            'lines.*.credit' => 'required|numeric|min:0',
        ]);

        $totalDebit = collect($validated['lines'])->sum('debit');
        $totalCredit = collect($validated['lines'])->sum('credit');

        if (abs($totalDebit - $totalCredit) > 0.01) {
            return back()->withErrors(['lines' => 'Total Debits must equal Total Credits.']);
        }

        $entry = \App\Models\JournalEntry::create([
            'tenant_id' => auth()->user()->tenant_id,
            'date' => $validated['date'],
            'reference' => $validated['reference'],
            'description' => $validated['description']
        ]);

        foreach ($validated['lines'] as $line) {
            $entry->lines()->create([
                'account_id' => $line['account_id'],
                'description' => $line['description'],
                'debit' => $line['debit'],
                'credit' => $line['credit']
            ]);
        }

        return back()->with('success', 'Journal entry created successfully.');
    }
    public function supplierBills(Request $request) 
    { 
        $tenantId = auth()->user()->tenant_id;
        
        $bills = \App\Models\SupplierBill::where('tenant_id', $tenantId)
            ->with('supplier')
            ->orderBy('due_date', 'asc')
            ->get();
            
        $suppliers = \App\Models\Supplier::where('tenant_id', $tenantId)->orderBy('name')->get();
        $categories = \App\Models\ExpenseCategory::where('tenant_id', $tenantId)->orderBy('name')->get();
        $cashAccounts = \App\Models\Account::where('tenant_id', $tenantId)
            ->where('type', 'asset')
            ->where(function($q) {
                $q->where('name', 'like', '%cash%')
                  ->orWhere('name', 'like', '%bank%');
            })
            ->orderBy('name')
            ->get();
            
        return Inertia::render('Finance/SupplierBills', [
            'bills' => $bills,
            'suppliers' => $suppliers,
            'categories' => $categories,
            'cashAccounts' => $cashAccounts,
        ]); 
    }

    public function storeSupplierBill(Request $request)
    {
        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'bill_number' => 'required|string|max:255',
            'bill_date' => 'required|date',
            'due_date' => 'required|date|after_or_equal:bill_date',
            'total_amount' => 'required|numeric|min:0.01',
            'expense_category_id' => 'required|exists:expense_categories,id',
        ]);

        $tenantId = auth()->user()->tenant_id;

        DB::transaction(function () use ($validated, $tenantId) {
            $supplier = \App\Models\Supplier::find($validated['supplier_id']);
            $category = \App\Models\ExpenseCategory::find($validated['expense_category_id']);

            // 1. Create Supplier Bill
            $bill = \App\Models\SupplierBill::create([
                'tenant_id' => $tenantId,
                'supplier_id' => $validated['supplier_id'],
                'bill_number' => $validated['bill_number'],
                'date' => $validated['bill_date'],
                'due_date' => $validated['due_date'],
                'total_amount' => $validated['total_amount'],
                'status' => 'unpaid'
            ]);

            // 2. Create Expense record (so it shows in P&L)
            $expense = \App\Models\Expense::create([
                'tenant_id' => $tenantId,
                'expense_category_id' => $validated['expense_category_id'],
                'amount' => $validated['total_amount'],
                'date' => $validated['bill_date'],
                'reference' => $validated['bill_number'],
                'notes' => 'Bill logged for ' . $supplier->name
            ]);

            // 3. Create Journal Entry (Accrual: Debit Expense, Credit Accounts Payable)
            $apAccount = \App\Models\Account::where('tenant_id', $tenantId)->where('code', '2000')->first();
            
            if ($apAccount && $category->account_id) {
                $journalEntry = \App\Models\JournalEntry::create([
                    'tenant_id' => $tenantId,
                    'reference_number' => 'BILL-' . $bill->id,
                    'date' => $validated['bill_date'],
                    'description' => 'Supplier Bill: ' . $bill->bill_number . ' from ' . $supplier->name,
                    'status' => 'posted',
                ]);

                // Debit Expense Account
                $journalEntry->lines()->create([
                    'account_id' => $category->account_id,
                    'debit' => $validated['total_amount'],
                    'credit' => 0,
                    'description' => 'Expense Recognized (Accrual)',
                ]);

                // Credit Accounts Payable
                $journalEntry->lines()->create([
                    'account_id' => $apAccount->id,
                    'debit' => 0,
                    'credit' => $validated['total_amount'],
                    'description' => 'Accounts Payable (Liability)',
                ]);
            }
        });

        return back()->with('success', 'Supplier bill logged successfully.');
    }

    public function paySupplierBill(Request $request, \App\Models\SupplierBill $bill)
    {
        $remaining = $bill->total_amount - $bill->paid_amount;
        if ($remaining <= 0) {
            return back()->withErrors(['amount' => 'This bill is already fully paid.']);
        }

        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01|max:' . $remaining,
            'cash_account_id' => 'required|exists:accounts,id',
            'notes' => 'nullable|string|max:1000'
        ]);

        $tenantId = auth()->user()->tenant_id;

        DB::transaction(function () use ($validated, $tenantId, $bill) {
            $bill->paid_amount += $validated['amount'];
            
            if (!empty($validated['notes'])) {
                $bill->notes = $bill->notes 
                    ? $bill->notes . "\n" . $validated['notes'] 
                    : $validated['notes'];
            }

            if ($bill->paid_amount >= $bill->total_amount) {
                $bill->status = 'paid';
            } else {
                $bill->status = 'partial';
            }

            $bill->save();

            // Create Journal Entry (Payment: Debit Accounts Payable, Credit Cash/Bank)
            $apAccount = \App\Models\Account::where('tenant_id', $tenantId)->where('code', '2000')->first();
            $cashAccount = \App\Models\Account::find($validated['cash_account_id']);

            if ($apAccount && $cashAccount) {
                $journalEntry = \App\Models\JournalEntry::create([
                    'tenant_id' => $tenantId,
                    'reference_number' => 'PAY-' . $bill->id . '-' . time(),
                    'date' => Carbon::now()->toDateString(),
                    'description' => 'Supplier Bill Payment: Bill ' . $bill->bill_number,
                    'status' => 'posted',
                ]);

                // Debit Accounts Payable (reduces liability)
                $journalEntry->lines()->create([
                    'account_id' => $apAccount->id,
                    'debit' => $validated['amount'],
                    'credit' => 0,
                    'description' => 'Accounts Payable Settled',
                ]);

                // Credit Cash/Bank (reduces asset)
                $journalEntry->lines()->create([
                    'account_id' => $cashAccount->id,
                    'debit' => 0,
                    'credit' => $validated['amount'],
                    'description' => 'Cash/Bank Payment',
                ]);
            }
        });

        return back()->with('success', 'Payment recorded successfully.');
    }
    public function balanceSheet(Request $request) 
    { 
        $endDate = $request->input('end_date', Carbon::now()->toDateString());
        
        $lines = \App\Models\JournalEntryLine::whereHas('journalEntry', function($q) use ($endDate) {
                $q->where('tenant_id', auth()->user()->tenant_id)
                  ->where('date', '<=', $endDate);
            })
            ->whereHas('account', function($q) {
                $q->whereIn('type', ['asset', 'liability', 'equity']);
            })
            ->with('account')
            ->get();
            
        $accounts = [];
        foreach($lines as $line) {
            $acctId = $line->account_id;
            if (!isset($accounts[$acctId])) {
                $accounts[$acctId] = [
                    'id' => $acctId,
                    'name' => $line->account->name,
                    'code' => $line->account->code,
                    'type' => $line->account->type,
                    'balance' => 0
                ];
            }
            
            if ($line->account->type === 'asset') {
                $accounts[$acctId]['balance'] += ($line->debit - $line->credit);
            } else {
                $accounts[$acctId]['balance'] += ($line->credit - $line->debit);
            }
        }
        
        // Retained Earnings (Revenue - Expenses up to end date)
        $revenueAndExpenses = \App\Models\JournalEntryLine::whereHas('journalEntry', function($q) use ($endDate) {
                $q->where('tenant_id', auth()->user()->tenant_id)
                  ->where('date', '<=', $endDate);
            })
            ->whereHas('account', function($q) {
                $q->whereIn('type', ['revenue', 'expense']);
            })
            ->with('account')
            ->get();
            
        $retainedEarnings = 0;
        foreach($revenueAndExpenses as $line) {
            if ($line->account->type === 'revenue') {
                $retainedEarnings += ($line->credit - $line->debit);
            } else {
                $retainedEarnings -= ($line->debit - $line->credit);
            }
        }
        
        $assetAccounts = array_values(array_filter($accounts, fn($a) => $a['type'] === 'asset'));
        $liabilityAccounts = array_values(array_filter($accounts, fn($a) => $a['type'] === 'liability'));
        $equityAccounts = array_values(array_filter($accounts, fn($a) => $a['type'] === 'equity'));
        
        return Inertia::render('Finance/BalanceSheet', [
            'assets' => $assetAccounts,
            'liabilities' => $liabilityAccounts,
            'equity' => $equityAccounts,
            'retainedEarnings' => $retainedEarnings,
            'endDate' => $endDate
        ]); 
    }
    public function trialBalance(Request $request) 
    { 
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', Carbon::now()->endOfMonth()->toDateString());
        
        $lines = \App\Models\JournalEntryLine::whereHas('journalEntry', function($q) use ($startDate, $endDate) {
                $q->where('tenant_id', auth()->user()->tenant_id)
                  ->whereBetween('date', [$startDate, $endDate]);
            })
            ->with('account')
            ->get();
            
        $accounts = [];
        foreach($lines as $line) {
            $acctId = $line->account_id;
            if (!isset($accounts[$acctId])) {
                $accounts[$acctId] = [
                    'id' => $acctId,
                    'name' => $line->account->name,
                    'code' => $line->account->code,
                    'type' => $line->account->type,
                    'debit' => 0,
                    'credit' => 0
                ];
            }
            
            $accounts[$acctId]['debit'] += $line->debit;
            $accounts[$acctId]['credit'] += $line->credit;
        }
        
        // Calculate net balance per account for the trial balance
        foreach($accounts as $id => $account) {
            if (in_array($account['type'], ['asset', 'expense'])) {
                // Debit normal balance
                $net = $account['debit'] - $account['credit'];
                if ($net >= 0) {
                    $accounts[$id]['debit'] = $net;
                    $accounts[$id]['credit'] = 0;
                } else {
                    $accounts[$id]['debit'] = 0;
                    $accounts[$id]['credit'] = abs($net);
                }
            } else {
                // Credit normal balance
                $net = $account['credit'] - $account['debit'];
                if ($net >= 0) {
                    $accounts[$id]['credit'] = $net;
                    $accounts[$id]['debit'] = 0;
                } else {
                    $accounts[$id]['credit'] = 0;
                    $accounts[$id]['debit'] = abs($net);
                }
            }
        }
        
        // Sort by account code
        usort($accounts, fn($a, $b) => strcmp($a['code'], $b['code']));
        
        $netTotalDebit = array_sum(array_column($accounts, 'debit'));
        $netTotalCredit = array_sum(array_column($accounts, 'credit'));
        
        return Inertia::render('Finance/TrialBalance', [
            'accounts' => $accounts,
            'totalDebit' => $netTotalDebit,
            'totalCredit' => $netTotalCredit,
            'startDate' => $startDate,
            'endDate' => $endDate
        ]); 
    }
    public function generalLedger(Request $request) 
    { 
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', Carbon::now()->endOfMonth()->toDateString());
        
        $accounts = \App\Models\Account::where('tenant_id', auth()->user()->tenant_id)
            ->with(['journalEntryLines' => function($q) use ($startDate, $endDate) {
                $q->whereHas('journalEntry', function($je) use ($startDate, $endDate) {
                    $je->whereBetween('date', [$startDate, $endDate]);
                })->with('journalEntry');
            }])
            ->orderBy('code')
            ->get()
            ->map(function($account) {
                $lines = $account->journalEntryLines->sortBy('journalEntry.date')->values();
                $runningBalance = 0;
                $formattedLines = $lines->map(function($line) use (&$runningBalance, $account) {
                    if (in_array($account->type, ['asset', 'expense'])) {
                        $runningBalance += ($line->debit - $line->credit);
                    } else {
                        $runningBalance += ($line->credit - $line->debit);
                    }
                    return [
                        'id' => $line->id,
                        'date' => $line->journalEntry->date,
                        'reference' => $line->journalEntry->reference,
                        'description' => $line->description ?: $line->journalEntry->description,
                        'debit' => $line->debit,
                        'credit' => $line->credit,
                        'balance' => $runningBalance
                    ];
                });
                
                return [
                    'id' => $account->id,
                    'code' => $account->code,
                    'name' => $account->name,
                    'type' => $account->type,
                    'lines' => $formattedLines,
                    'ending_balance' => $runningBalance
                ];
            })->filter(function($account) {
                return count($account['lines']) > 0;
            })->values();

        return Inertia::render('Finance/GeneralLedger', [
            'accounts' => $accounts,
            'startDate' => $startDate,
            'endDate' => $endDate
        ]);
    }
    public function cashFlow(Request $request) 
    { 
        $startDate = $request->input('start_date', Carbon::now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', Carbon::now()->endOfMonth()->toDateString());
        
        // Find all cash/bank accounts
        $cashAccountIds = \App\Models\Account::where('tenant_id', auth()->user()->tenant_id)
            ->where('type', 'asset')
            ->where(function($q) {
                $q->where('name', 'like', '%cash%')
                  ->orWhere('name', 'like', '%bank%');
            })
            ->pluck('id');
            
        // Get all journal entries involving cash within the date range
        $cashEntries = \App\Models\JournalEntry::where('tenant_id', auth()->user()->tenant_id)
            ->whereBetween('date', [$startDate, $endDate])
            ->whereHas('lines', function($q) use ($cashAccountIds) {
                $q->whereIn('account_id', $cashAccountIds);
            })
            ->with('lines.account')
            ->get();
            
        $operatingActivities = [];
        $investingActivities = [];
        $financingActivities = [];
        
        $netCashFlow = 0;
        
        // Categorize based on the offsetting account
        foreach($cashEntries as $entry) {
            $cashEffect = 0;
            $otherAccountName = 'Unknown';
            $activityType = 'operating'; // Default
            
            foreach($entry->lines as $line) {
                if ($cashAccountIds->contains($line->account_id)) {
                    // Debit to cash increases cash flow, Credit decreases
                    $cashEffect += ($line->debit - $line->credit);
                } else {
                    $otherAccountName = $line->account->name;
                    $acctType = $line->account->type;
                    
                    if (in_array($acctType, ['revenue', 'expense', 'cogs'])) {
                        $activityType = 'operating';
                    } elseif ($acctType === 'asset') {
                        $activityType = 'investing';
                    } elseif (in_array($acctType, ['liability', 'equity'])) {
                        $activityType = 'financing';
                    }
                }
            }
            
            if (abs($cashEffect) > 0.01) {
                $item = [
                    'description' => $entry->description ?: $otherAccountName,
                    'amount' => $cashEffect
                ];
                
                if ($activityType === 'operating') $operatingActivities[] = $item;
                elseif ($activityType === 'investing') $investingActivities[] = $item;
                elseif ($activityType === 'financing') $financingActivities[] = $item;
                
                $netCashFlow += $cashEffect;
            }
        }
        
        // Summarize by description to avoid long lists
        $summarize = function($activities) {
            $summary = [];
            foreach($activities as $act) {
                $desc = $act['description'];
                if (!isset($summary[$desc])) {
                    $summary[$desc] = 0;
                }
                $summary[$desc] += $act['amount'];
            }
            
            $result = [];
            foreach($summary as $desc => $amount) {
                if (abs($amount) > 0.01) {
                    $result[] = ['description' => $desc, 'amount' => $amount];
                }
            }
            return $result;
        };
        
        return Inertia::render('Finance/CashFlow', [
            'operatingActivities' => $summarize($operatingActivities),
            'investingActivities' => $summarize($investingActivities),
            'financingActivities' => $summarize($financingActivities),
            'netCashFlow' => $netCashFlow,
            'startDate' => $startDate,
            'endDate' => $endDate
        ]); 
    }
    public function budgets(Request $request) 
    { 
        $budgets = \App\Models\Budget::where('tenant_id', auth()->user()->tenant_id)
            ->with(['items.account'])
            ->orderBy('start_date', 'desc')
            ->get();
            
        // Calculate actuals for each budget item
        foreach($budgets as $budget) {
            $totalBudget = 0;
            $totalActual = 0;
            
            foreach($budget->items as $item) {
                // Get net amount from JournalEntryLines for this account within the budget date range
                $lines = \App\Models\JournalEntryLine::where('account_id', $item->account_id)
                    ->whereHas('journalEntry', function($q) use ($budget) {
                        $q->where('tenant_id', auth()->user()->tenant_id)
                          ->whereBetween('date', [$budget->start_date, $budget->end_date]);
                    })
                    ->get();
                    
                $actual = 0;
                foreach($lines as $line) {
                    if (in_array($item->account->type, ['expense', 'cogs', 'asset'])) {
                        $actual += ($line->debit - $line->credit);
                    } else {
                        $actual += ($line->credit - $line->debit);
                    }
                }
                
                $item->actual = $actual;
                $item->variance = $item->amount - $actual; // Positive means under budget (for expenses)
                
                $totalBudget += $item->amount;
                $totalActual += $actual;
            }
            
            $budget->total_budget = $totalBudget;
            $budget->total_actual = $totalActual;
            $budget->total_variance = $totalBudget - $totalActual;
        }
        
        $accounts = \App\Models\Account::where('tenant_id', auth()->user()->tenant_id)
            ->whereIn('type', ['revenue', 'expense', 'cogs'])
            ->orderBy('type')
            ->orderBy('name')
            ->get();
        
        return Inertia::render('Finance/Budgets', [
            'budgets' => $budgets,
            'accounts' => $accounts
        ]); 
    }
    
    public function storeBudget(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'description' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.account_id' => 'required|exists:accounts,id',
            'items.*.amount' => 'required|numeric|min:0',
        ]);
        
        $budget = \App\Models\Budget::create([
            'name' => $validated['name'],
            'start_date' => $validated['start_date'],
            'end_date' => $validated['end_date'],
            'description' => $validated['description'],
            'tenant_id' => auth()->user()->tenant_id,
        ]);
        
        foreach($validated['items'] as $item) {
            $budget->items()->create([
                'account_id' => $item['account_id'],
                'amount' => $item['amount'],
            ]);
        }
        
        return redirect()->back()->with('success', 'Budget created successfully.');
    }

    public function cashCounter(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;

        $activeSession = \App\Models\CashRegisterSession::where('tenant_id', $tenantId)
            ->where('status', 'open')
            ->first();

        $cashSales = 0;
        $cashDeposits = 0;
        $cashWithdrawals = 0;

        if ($activeSession) {
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

        $previousSessions = \App\Models\CashRegisterSession::where('tenant_id', $tenantId)
            ->with(['user', 'closedBy'])
            ->orderBy('opened_at', 'desc')
            ->get();

        return Inertia::render('Finance/CashCounter', [
            'activeSession' => $activeSession,
            'cashSales' => (float)$cashSales,
            'cashDeposits' => (float)$cashDeposits,
            'cashWithdrawals' => (float)$cashWithdrawals,
            'previousSessions' => $previousSessions,
        ]);
    }

    public function openCashCounter(Request $request)
    {
        if (auth()->user()->role === 'waiter') {
            return back()->with('error', 'Waiters are not authorized to manage cash counter sessions.');
        }

        $request->validate([
            'opening_balance' => 'required|numeric|min:0',
            'notes' => 'nullable|string|max:500',
        ]);

        $tenantId = auth()->user()->tenant_id;

        $existing = \App\Models\CashRegisterSession::where('tenant_id', $tenantId)
            ->where('status', 'open')
            ->first();

        if ($existing) {
            return back()->with('error', 'A cash register session is already open.');
        }

        $session = \App\Models\CashRegisterSession::create([
            'tenant_id' => $tenantId,
            'user_id' => auth()->id(),
            'opening_balance' => $request->opening_balance,
            'opened_at' => now(),
            'status' => 'open',
            'notes' => $request->notes,
        ]);

        \App\Models\ActivityLog::record('register_opened', "Opened cash register session with opening balance: " . number_format($request->opening_balance, 2), $session);

        return back()->with('success', 'Cash register opened successfully.');
    }

    public function closeCashCounter(Request $request, \App\Models\CashRegisterSession $session)
    {
        if (auth()->user()->role === 'waiter') {
            return back()->with('error', 'Waiters are not authorized to manage cash counter sessions.');
        }

        $request->validate([
            'closing_balance' => 'required|numeric|min:0',
            'notes' => 'nullable|string|max:500',
        ]);

        if ($session->status !== 'open') {
            return back()->with('error', 'This register session is already closed.');
        }

        $tenantId = auth()->user()->tenant_id;

        // Recalculate values dynamically to ensure accuracy
        $cashSales = \App\Models\Order::where('tenant_id', $tenantId)
            ->where('status', 'completed')
            ->where('payment_method', 'cash')
            ->where('created_at', '>=', $session->opened_at)
            ->sum('grand_total');

        $cashDeposits = 0;
        $cashWithdrawals = 0;
        $cashDrawerIds = \App\Models\BankAccount::where('tenant_id', $tenantId)
            ->where('account_type', 'cash')
            ->pluck('id');

        if ($cashDrawerIds->isNotEmpty()) {
            $cashDeposits = \App\Models\BankTransaction::whereIn('bank_account_id', $cashDrawerIds)
                ->where('type', 'deposit')
                ->where('created_at', '>=', $session->opened_at)
                ->sum('amount');

            $cashWithdrawals = \App\Models\BankTransaction::whereIn('bank_account_id', $cashDrawerIds)
                ->where('type', 'withdrawal')
                ->where('created_at', '>=', $session->opened_at)
                ->sum('amount');
        }

        $expectedBalance = $session->opening_balance + $cashSales + $cashDeposits - $cashWithdrawals;
        $closingBalance = $request->closing_balance;
        $discrepancy = $closingBalance - $expectedBalance;

        DB::transaction(function () use ($session, $expectedBalance, $closingBalance, $discrepancy, $request, $tenantId) {
            $session->closing_balance = $closingBalance;
            $session->expected_balance = $expectedBalance;
            $session->discrepancy = $discrepancy;
            $session->closed_at = now();
            $session->closed_by = auth()->id();
            $session->status = 'closed';
            
            if ($request->filled('notes')) {
                $session->notes = $session->notes 
                    ? $session->notes . "\nClosing Notes: " . $request->notes 
                    : "Closing Notes: " . $request->notes;
            }
            $session->save();

            // Reconcile discrepancy in general ledger
            if (abs($discrepancy) > 0.01) {
                $cashShortOverAccount = \App\Models\Account::firstOrCreate(
                    ['tenant_id' => $tenantId, 'code' => '6005'],
                    ['name' => 'Cash Short/Over', 'type' => 'expense', 'is_system_account' => true, 'description' => 'Discrepancies in cash register counts']
                );
                
                $cashAccount = \App\Models\Account::where('tenant_id', $tenantId)->where('code', '1001')->first();

                if ($cashShortOverAccount && $cashAccount) {
                    $journalEntry = \App\Models\JournalEntry::create([
                        'tenant_id' => $tenantId,
                        'reference_number' => 'RECON-' . $session->id,
                        'date' => \Carbon\Carbon::now()->toDateString(),
                        'description' => 'Cash Drawer Reconcile Discrepancy: Session #' . $session->id,
                        'status' => 'posted',
                    ]);

                    if ($discrepancy < 0) {
                        // Cash Shortage: Debit Expense, Credit Cash Asset
                        $absShortage = abs($discrepancy);
                        $journalEntry->lines()->create([
                            'account_id' => $cashShortOverAccount->id,
                            'debit' => $absShortage,
                            'credit' => 0,
                            'description' => 'Cash Register Shortage',
                        ]);
                        $journalEntry->lines()->create([
                            'account_id' => $cashAccount->id,
                            'debit' => 0,
                            'credit' => $absShortage,
                            'description' => 'Cash Drawer Adjustment (Shortage)',
                        ]);
                    } else {
                        // Cash Overage: Debit Cash Asset, Credit Expense Offset (Revenue)
                        $journalEntry->lines()->create([
                            'account_id' => $cashAccount->id,
                            'debit' => $discrepancy,
                            'credit' => 0,
                            'description' => 'Cash Drawer Adjustment (Overage)',
                        ]);
                        $journalEntry->lines()->create([
                            'account_id' => $cashShortOverAccount->id,
                            'debit' => 0,
                            'credit' => $discrepancy,
                            'description' => 'Cash Register Overage',
                        ]);
                    }
                }
            }
        });

        \App\Models\ActivityLog::record('register_closed', "Closed cash register session. Expected: " . number_format($expectedBalance, 2) . ", Actual: " . number_format($closingBalance, 2) . ", Discrepancy: " . number_format($discrepancy, 2), $session);

        return back()->with('success', 'Cash register session closed and reconciled.');
    }
}
