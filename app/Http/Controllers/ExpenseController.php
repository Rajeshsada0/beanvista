<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\ExpenseCategory;
use App\Models\PaymentMethod;
use App\Models\JournalEntry;
use App\Models\Account;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class ExpenseController extends Controller
{
    public function index()
    {
        $expenses = Expense::with(['category', 'paymentMethod'])->orderBy('date', 'desc')->get();
        $categories = ExpenseCategory::all();
        $paymentMethods = PaymentMethod::all();
        
        return Inertia::render('Finance/Expenses', [
            'expenses' => $expenses,
            'categories' => $categories,
            'paymentMethods' => $paymentMethods,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'expense_category_id' => 'required|exists:expense_categories,id',
            'amount' => 'required|numeric|min:0.01',
            'date' => 'required|date',
            'payment_method_id' => 'nullable|exists:payment_methods,id',
            'reference' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        DB::transaction(function () use ($request) {
            $expense = Expense::create($request->all());

            $category = ExpenseCategory::find($request->expense_category_id);
            $cashAccount = Account::where('tenant_id', auth()->user()->tenant_id)->where('code', '1001')->first(); 
            
            if ($cashAccount && $category->account_id) {
                $journalEntry = JournalEntry::create([
                    'tenant_id' => auth()->user()->tenant_id,
                    'reference_number' => 'EXP-' . $expense->id,
                    'date' => $request->date,
                    'description' => 'Expense: ' . $category->name . ($request->notes ? ' - ' . $request->notes : ''),
                    'status' => 'posted',
                ]);

                $journalEntry->lines()->create([
                    'account_id' => $category->account_id,
                    'debit' => $request->amount,
                    'credit' => 0,
                    'description' => 'Expense Recorded',
                ]);

                $journalEntry->lines()->create([
                    'account_id' => $cashAccount->id,
                    'debit' => 0,
                    'credit' => $request->amount,
                    'description' => 'Payment for Expense',
                ]);
            }
        });

        return back()->with('success', 'Expense recorded successfully.');
    }

    public function destroy(Expense $expense)
    {
        $expense->delete();
        return back()->with('success', 'Expense deleted successfully.');
    }

    public function storeCategory(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
        ]);
        
        $generalExpenseAccount = Account::firstOrCreate(
            ['tenant_id' => auth()->user()->tenant_id, 'code' => '6004'],
            ['name' => 'General Expenses', 'type' => 'expense', 'description' => 'Default general expenses account']
        );

        ExpenseCategory::create([
            'name' => $request->name,
            'account_id' => $generalExpenseAccount->id,
        ]);

        return back()->with('success', 'Category added successfully.');
    }

    public function updateCategory(Request $request, ExpenseCategory $category)
    {
        $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $category->update([
            'name' => $request->name,
        ]);

        return back()->with('success', 'Category updated successfully.');
    }

    public function destroyCategory(ExpenseCategory $category)
    {
        if ($category->expenses()->count() > 0) {
            return back()->with('error', 'Cannot delete category with associated expenses.');
        }

        $category->delete();

        return back()->with('success', 'Category deleted successfully.');
    }
}
