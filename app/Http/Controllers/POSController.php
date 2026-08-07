<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Menu;
use App\Models\Category;
use App\Models\Table;
use App\Models\Addon;
use App\Models\Tax;
use App\Models\Customer;
use App\Models\Order;

class POSController extends Controller
{
    public function viewer()
    {
        return Inertia::render('POS/Viewer', [
            'menus' => Menu::where('status', true)->with('recipes.inventoryItem')->get(),
            'categories' => Category::where('status', true)->get(),
            'tables' => Table::with(['activeOrders' => function($q) {
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
                })->with('items');
            }])->get(),
            'addons' => Addon::where('status', true)->get(),
            'taxes' => Tax::where('status', true)->get(),
            'customers' => Customer::get(),
            'waiters' => \App\Models\User::all(),
            'activeOrders' => Order::with(['table', 'items.menu', 'items.addons', 'customer'])
                                ->where(function($q) {
                                    $q->whereNotIn('status', ['completed', 'cancelled'])
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
                                })
                                ->get(),
            'bankAccounts' => \App\Models\BankAccount::get(),
            'discounts' => \App\Models\LoyaltyReward::where('status', true)->where('type', 'discount')->get(),
            'vouchers' => \App\Models\LoyaltyReward::where('status', true)->where('type', 'voucher')->get()
        ]);
    }

    public function cashMovement(Request $request)
    {
        $validated = $request->validate([
            'bank_account_id' => 'required|exists:bank_accounts,id',
            'type' => 'required|in:deposit,withdrawal',
            'amount' => 'required|numeric|min:0.001',
            'notes' => 'required|string|max:500',
        ]);

        $account = \App\Models\BankAccount::findOrFail($validated['bank_account_id']);
        
        \App\Models\BankTransaction::create([
            'bank_account_id' => $account->id,
            'type' => $validated['type'],
            'amount' => $validated['amount'],
            'date' => now(),
            'reference' => 'POS Movement',
            'status' => 'reconciled',
            'notes' => $validated['notes'],
            'tenant_id' => auth()->user()->tenant_id ?? 1
        ]);

        if ($validated['type'] === 'deposit') {
            $account->increment('balance', $validated['amount']);
        } else {
            $account->decrement('balance', $validated['amount']);
        }

        return redirect()->back()->with('success', 'Cash movement recorded successfully.');
    }
}
