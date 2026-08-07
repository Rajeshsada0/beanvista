<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tenant extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'slug', 'is_active', 'trial_ends_at'];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'trial_ends_at' => 'datetime',
        ];
    }

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function subscription()
    {
        return $this->hasOne(Subscription::class);
    }

    public function paymentRequests()
    {
        return $this->hasMany(PaymentRequest::class);
    }

    public function branches()
    {
        return $this->hasMany(Branch::class);
    }

    public function tables()
    {
        return $this->hasMany(Table::class);
    }

    public function accounts()
    {
        return $this->hasMany(Account::class);
    }

    /**
     * Get the resolved limit for a specific resource type based on subscription or trial.
     */
    public function getPlanLimit(string $field): int
    {
        if ($field === 'max_orders') {
            $field = 'max_orders_per_month';
        }

        // 1. Check active subscription
        $sub = $this->subscription;
        if ($sub && $sub->status === 'active' && !$sub->is_expired) {
            $plan = $sub->plan;
            if ($plan && isset($plan->$field)) {
                return (int) $plan->$field;
            }
        }

        // 2. Check active free trial
        if ($this->trial_ends_at && $this->trial_ends_at->isFuture()) {
            $trialOrdersLimit = (int) (\App\Models\Setting::withoutGlobalScopes()
                ->whereNull('tenant_id')
                ->where('key', 'default_trial_max_orders')
                ->value('value') ?? 50);

            // Free trial defaults
            $defaults = [
                'max_branches' => 2,
                'max_tables' => 10,
                'max_accounts' => 20,
                'max_users' => 5,
                'max_orders_per_month' => $trialOrdersLimit,
            ];
            return $defaults[$field] ?? -1;
        }

        // 3. Expired or no plan
        return 0;
    }

    /**
     * Get the current usage count for a specific limit type.
     */
    public function getCurrentUsage(string $field): int
    {
        if ($field === 'max_orders') {
            $field = 'max_orders_per_month';
        }

        switch ($field) {
            case 'max_branches':
                return $this->branches()->count();
            case 'max_tables':
                return $this->tables()->count();
            case 'max_accounts':
                return $this->accounts()->count();
            case 'max_users':
                return $this->users()->count();
            case 'max_orders_per_month':
                return $this->orders()
                    ->whereMonth('created_at', now()->month)
                    ->whereYear('created_at', now()->year)
                    ->count();
            default:
                return 0;
        }
    }

    /**
     * Determine if the limit for a specific resource type has been reached.
     */
    public function hasLimitReached(string $field): bool
    {
        $limit = $this->getPlanLimit($field);
        if ($limit === -1) {
            return false; // Unlimited
        }

        return $this->getCurrentUsage($field) >= $limit;
    }

    /**
     * Comprehensive details about the tenant's subscription and trial state.
     */
    public function getSubscriptionDetails(): array
    {
        $sub = $this->subscription;
        $isSubActive = $sub && $sub->status === 'active' && !$sub->is_expired;
        $isTrialActive = !$isSubActive && $this->trial_ends_at && $this->trial_ends_at->isFuture();

        $status = 'none';
        if ($isSubActive) {
            $status = 'active';
        } elseif ($isTrialActive) {
            $status = 'trial';
        } elseif ($this->trial_ends_at || ($sub && $sub->is_expired)) {
            $status = 'expired';
        }

        $now = \Carbon\Carbon::now();
        $trialDaysRemaining = 0;
        if ($this->trial_ends_at && $this->trial_ends_at->isFuture()) {
            $trialDaysRemaining = (int) ceil($now->floatDiffInDays($this->trial_ends_at));
        }

        $maxOrders = $this->getPlanLimit('max_orders_per_month');
        $usedOrders = $this->getCurrentUsage('max_orders_per_month');
        $isOrderLimitReached = $maxOrders !== -1 && $usedOrders >= $maxOrders;

        $planName = 'Free Trial';
        if ($isSubActive && $sub->plan) {
            $planName = $sub->plan->name;
        } elseif ($status === 'expired') {
            $planName = 'Plan Expired';
        }

        return [
            'status' => $status,
            'plan_name' => $planName,
            'is_trial' => $isTrialActive,
            'trial_ends_at' => $this->trial_ends_at ? $this->trial_ends_at->toIso8601String() : null,
            'trial_days_remaining' => $trialDaysRemaining,
            'orders_used_this_month' => $usedOrders,
            'max_orders_per_month' => $maxOrders,
            'orders_remaining_this_month' => $maxOrders === -1 ? null : max(0, $maxOrders - $usedOrders),
            'is_order_limit_reached' => $isOrderLimitReached,
            'can_take_orders' => ($isSubActive || $isTrialActive) && !$isOrderLimitReached,
        ];
    }

    /**
     * Purge this tenant and ALL associated database records & stored assets permanently.
     */
    public function purgeAllData(): void
    {
        $tenantId = $this->id;

        \Illuminate\Support\Facades\DB::transaction(function () use ($tenantId) {
            // 1. Delete via Eloquent Models without global scopes
            $models = [
                \App\Models\TicketMessage::class,
                \App\Models\Ticket::class,
                \App\Models\JournalEntryLine::class,
                \App\Models\JournalEntry::class,
                \App\Models\BudgetItem::class,
                \App\Models\Budget::class,
                \App\Models\BankTransaction::class,
                \App\Models\BankAccount::class,
                \App\Models\CreditTransaction::class,
                \App\Models\CustomerInvoice::class,
                \App\Models\Customer::class,
                \App\Models\OrderItem::class,
                \App\Models\Order::class,
                \App\Models\CashRegisterSession::class,
                \App\Models\Reservation::class,
                \App\Models\Table::class,
                \App\Models\SupplierBill::class,
                \App\Models\Expense::class,
                \App\Models\ExpenseCategory::class,
                \App\Models\InventoryUsage::class,
                \App\Models\InventoryPurchase::class,
                \App\Models\MenuRecipe::class,
                \App\Models\InventoryItem::class,
                \App\Models\MeasuringUnit::class,
                \App\Models\StockGroup::class,
                \App\Models\Supplier::class,
                \App\Models\Addon::class,
                \App\Models\Menu::class,
                \App\Models\Category::class,
                \App\Models\LoyaltyReward::class,
                \App\Models\Shift::class,
                \App\Models\Tax::class,
                \App\Models\Account::class,
                \App\Models\Branch::class,
                \App\Models\PaymentRequest::class,
                \App\Models\Subscription::class,
                \App\Models\Setting::class,
                \App\Models\ActivityLog::class,
                \App\Models\User::class,
            ];

            foreach ($models as $model) {
                if (class_exists($model)) {
                    try {
                        $model::withoutGlobalScopes()->where('tenant_id', $tenantId)->delete();
                    } catch (\Throwable $e) {
                        \Illuminate\Support\Facades\Log::warning("Could not delete {$model} for tenant {$tenantId}: " . $e->getMessage());
                    }
                }
            }

            // 2. Direct database table cleanup as safety net for all tenant tables
            $tables = [
                'users', 'subscriptions', 'payment_requests', 'branches', 'tables',
                'accounts', 'orders', 'order_items', 'customers', 'reservations',
                'settings', 'tickets', 'ticket_messages', 'activity_logs', 'bank_accounts',
                'bank_transactions', 'budgets', 'budget_items', 'cash_register_sessions',
                'customer_invoices', 'credit_transactions', 'expenses', 'expense_categories',
                'inventory_items', 'inventory_purchases', 'inventory_usages', 'journal_entries',
                'journal_entry_lines', 'loyalty_rewards', 'measuring_units', 'menus',
                'menu_recipes', 'shifts', 'stock_groups', 'suppliers', 'supplier_bills',
                'taxes', 'categories', 'addons'
            ];

            foreach ($tables as $table) {
                if (\Illuminate\Support\Facades\Schema::hasTable($table) && \Illuminate\Support\Facades\Schema::hasColumn($table, 'tenant_id')) {
                    try {
                        \Illuminate\Support\Facades\DB::table($table)->where('tenant_id', $tenantId)->delete();
                    } catch (\Throwable $e) {
                        // Suppress if already purged
                    }
                }
            }

            // 3. Clear trial cache
            cache()->forget('tenant_trial_' . $tenantId);

            // 4. Delete tenant storage directory if exists
            try {
                \Illuminate\Support\Facades\Storage::disk('public')->deleteDirectory("tenants/{$tenantId}");
            } catch (\Throwable $e) {}

            // 5. Delete tenant record itself
            $this->delete();
        });
    }
}
