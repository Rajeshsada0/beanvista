<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Order;
use App\Models\Table;
use App\Models\Menu;
use App\Models\Reservation;
use App\Models\ActivityLog;
use Carbon\Carbon;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        if (auth()->check() && auth()->user()->role === 'super_admin') {
            return redirect()->route('superadmin.dashboard');
        }

        if (auth()->check() && auth()->user()->role === 'kitchen') {
            return redirect()->route('orders.kds');
        }

        $startDate = $request->input('start_date') ? Carbon::parse($request->input('start_date'))->startOfDay() : Carbon::today()->subDays(6)->startOfDay();
        $endDate = $request->input('end_date') ? Carbon::parse($request->input('end_date'))->endOfDay() : Carbon::today()->endOfDay();

        $today = Carbon::today();
        $yesterday = Carbon::yesterday();
        $startOfMonth = Carbon::now()->startOfMonth();

        // Metrics
        $totalItems = Menu::where('status', true)->count();
        $totalTables = Table::count();
        $activeTables = Table::where('status', 'occupied')->count();
        $totalCustomers = \App\Models\Customer::count();
        
        $todaySales = Order::where('status', 'completed')
            ->whereDate('updated_at', $today)
            ->sum('grand_total');

        $yesterdaySales = Order::where('status', 'completed')
            ->whereDate('updated_at', $yesterday)
            ->sum('grand_total');

        $monthlySales = Order::where('status', 'completed')
            ->where('updated_at', '>=', $startOfMonth)
            ->sum('grand_total');

        $totalSales = Order::where('status', 'completed')
            ->whereBetween('updated_at', [$startDate, $endDate])
            ->sum('grand_total');

        // Weekly Sales Trend (Based on Filtered Period)
        // MongoDB-compatible: Get all orders and group in PHP
        $orders = Order::where('status', 'completed')
            ->whereBetween('updated_at', [$startDate, $endDate])
            ->get(['updated_at', 'grand_total']);

        // Group by date in PHP
        $rawWeeklySales = $orders->groupBy(function($order) {
            return Carbon::parse($order->updated_at)->toDateString();
        })->map(function($dayOrders) {
            return (object)[
                'total' => $dayOrders->sum('grand_total')
            ];
        });

        $weeklySales = [];
        $diffInDays = $startDate->diffInDays($endDate);
        
        // Loop from the oldest date to the newest (startDate to endDate)
        for ($i = 0; $i <= $diffInDays; $i++) {
            $dateString = (clone $startDate)->addDays($i)->toDateString();
            $dateObj = (clone $startDate)->addDays($i);
            
            $weeklySales[] = [
                'day' => $dateObj->format('D'),
                'total' => (float)($rawWeeklySales[$dateString]->total ?? 0),
                'date' => $dateObj->format('M d'),
            ];
        }

        // Recent Activity (Audit Timeline)
        $recentActivity = ActivityLog::with('user')
            ->latest()
            ->take(15)
            ->get();

        $todayCash = Order::where('status', 'completed')
            ->whereDate('updated_at', $today)
            ->sum('cash_amount');

        $todayOnline = Order::where('status', 'completed')
            ->whereDate('updated_at', $today)
            ->sum('online_amount');

        // Avg Turnaround Time Today (created_at → updated_at, in minutes)
        // MongoDB-compatible: Calculate in PHP
        $completedOrders = Order::where('status', 'completed')
            ->whereDate('updated_at', $today)
            ->get(['created_at', 'updated_at']);

        $avgTurnaround = 0;
        if ($completedOrders->count() > 0) {
            $totalMinutes = $completedOrders->sum(function($order) {
                $created = Carbon::parse($order->created_at);
                $updated = Carbon::parse($order->updated_at);
                return $created->diffInMinutes($updated);
            });
            $avgTurnaround = $totalMinutes / $completedOrders->count();
        }

        // Top Selling Products
        $topSellingItems = \App\Models\OrderItem::whereHas('order', function ($query) {
                $query->where('status', 'completed');
            })
            ->groupBy('menu_id')
            ->selectRaw('menu_id, sum(quantity) as total_qty, sum(quantity * price) as total_revenue')
            ->orderByDesc('total_qty')
            ->take(5)
            ->with('menu')
            ->get();

        $topSelling = $topSellingItems->map(function ($item) {
            return [
                'name' => $item->menu ? $item->menu->name : 'Unknown Product',
                'category' => $item->menu ? $item->menu->category : 'N/A',
                'quantity' => (int)$item->total_qty,
                'revenue' => (float)$item->total_revenue,
                'image_url' => $item->menu ? $item->menu->image_url : null,
            ];
        });

        // Low Stock Alerts
        $lowStockItems = \App\Models\InventoryItem::with('measuringUnit')
            ->whereRaw('current_stock <= low_stock_threshold')
            ->get();

        $lowStock = $lowStockItems->map(function ($item) {
            return [
                'name' => $item->name,
                'stock' => (float)$item->current_stock,
                'threshold' => (float)$item->low_stock_threshold,
                'unit' => $item->measuringUnit ? $item->measuringUnit->name : ($item->unit ?: 'pcs'),
            ];
        });

        // Daily Cash Counter calculations
        $tenantId = auth()->user()->tenant_id;
        $activeSession = \App\Models\CashRegisterSession::where('tenant_id', $tenantId)
            ->where('status', 'open')
            ->first();

        $cashSales = 0;
        $cashDeposits = 0;
        $cashWithdrawals = 0;
        $counterExpenses = 0;
        $counterCashIn = 0;

        if ($activeSession) {
            // Find all cash orders completed after opened_at
            $cashSales = \App\Models\Order::where('tenant_id', $tenantId)
                ->where('status', 'completed')
                ->where('payment_method', 'cash')
                ->where('created_at', '>=', $activeSession->opened_at)
                ->sum('grand_total');

            $counterExpenses = 0;
            $counterCashIn = 0;

            if (class_exists(\App\Models\CashRegisterTransaction::class) && \Illuminate\Support\Facades\Schema::hasTable('cash_register_transactions')) {
                $counterExpenses = \App\Models\CashRegisterTransaction::where('cash_register_session_id', $activeSession->id)
                    ->where('type', 'cash_out')
                    ->sum('amount');

                $counterCashIn = \App\Models\CashRegisterTransaction::where('cash_register_session_id', $activeSession->id)
                    ->where('type', 'cash_in')
                    ->sum('amount');
            }

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

        // Today's counter cash out / expenses
        $todayCashExpenses = 0;
        $todayCounterExpenses = collect();

        if (class_exists(\App\Models\CashRegisterTransaction::class) && \Illuminate\Support\Facades\Schema::hasTable('cash_register_transactions')) {
            $todayCashExpenses = \App\Models\CashRegisterTransaction::where('tenant_id', $tenantId)
                ->whereDate('created_at', $today)
                ->where('type', 'cash_out')
                ->sum('amount');

            $todayCounterExpenses = \App\Models\CashRegisterTransaction::where('tenant_id', $tenantId)
                ->whereDate('created_at', $today)
                ->where('type', 'cash_out')
                ->with(['user:id,name', 'category:id,name'])
                ->latest()
                ->take(10)
                ->get();
        }

        $expenseCategories = \App\Models\ExpenseCategory::all(['id', 'name']);

        return Inertia::render('Dashboard', [
            'stats' => [
                'total_items' => $totalItems,
                'total_tables' => $totalTables,
                'active_tables' => $activeTables,
                'today_sales' => (float)$todaySales,
                'today_cash' => (float)$todayCash,
                'today_online' => (float)$todayOnline,
                'today_cash_expenses' => (float)$todayCashExpenses,
                'yesterday_sales' => (float)$yesterdaySales,
                'monthly_sales' => (float)$monthlySales,
                'total_sales' => (float)$totalSales,
                'avg_turnaround_mins' => (float)round($avgTurnaround),
                'total_customers' => $totalCustomers,
            ],
            'filters' => [
                'start_date' => $startDate->format('Y-m-d'),
                'end_date' => $endDate->format('Y-m-d'),
            ],
            'recent_activity' => Inertia::defer(fn() => $recentActivity),
            'weekly_sales' => Inertia::defer(fn() => $weeklySales),
            'top_selling' => Inertia::defer(fn() => $topSelling),
            'low_stock' => Inertia::defer(fn() => $lowStock),
            'activeSession' => $activeSession,
            'cashSales' => (float)$cashSales,
            'cashDeposits' => (float)$cashDeposits,
            'cashWithdrawals' => (float)$cashWithdrawals,
            'counterExpenses' => (float)$counterExpenses,
            'counterCashIn' => (float)$counterCashIn,
            'todayCounterExpenses' => $todayCounterExpenses,
            'expenseCategories' => $expenseCategories,
        ]);
    }
}
