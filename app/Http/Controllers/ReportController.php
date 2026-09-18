<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Inertia\Inertia;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        // ── Period Resolution ──────────────────────────────────────────────
        $period   = $request->input('period', 'today');
        $tableId  = $request->input('table_id');
        $menuId   = $request->input('menu_id');
        $payment  = $request->input('payment');
        $search   = $request->input('search');

        switch ($period) {
            case 'today':
                $startDate = Carbon::now()->startOfDay();
                $endDate   = Carbon::now()->endOfDay();
                break;
            case 'yesterday':
                $startDate = Carbon::yesterday()->startOfDay();
                $endDate   = Carbon::yesterday()->endOfDay();
                break;
            case 'week':
                $startDate = Carbon::now()->startOfWeek();
                $endDate   = Carbon::now()->endOfWeek();
                break;
            case 'month':
                $startDate = Carbon::now()->startOfMonth();
                $endDate   = Carbon::now()->endOfMonth();
                break;
            case 'custom':
            default:
                $startDate = $request->input('start_date')
                    ? Carbon::parse($request->input('start_date'))->startOfDay()
                    : Carbon::now()->startOfMonth();
                $endDate = $request->input('end_date')
                    ? Carbon::parse($request->input('end_date'))->endOfDay()
                    : Carbon::now()->endOfDay();
                break;
        }

        // ── Base Query ─────────────────────────────────────────────────────────────
        $baseQuery = Order::with(['table', 'items.menu', 'customer', 'bankAccount'])
            ->where('status', 'completed')
            ->whereBetween('updated_at', [$startDate, $endDate]);

        if ($tableId) {
            $baseQuery->where('table_id', $tableId);
        }

        if ($menuId) {
            $baseQuery->whereHas('items', fn($q) => $q->where('menu_id', $menuId));
        }

        if ($search) {
            $cleanSearchId = ltrim($search, '#');
            $baseQuery->where(function ($q) use ($search, $cleanSearchId) {
                $q->where('id', 'like', "%{$cleanSearchId}%")
                  ->orWhereHas('table', fn($tq) => $tq->where('table_number', 'like', "%{$search}%"))
                  ->orWhereHas('customer', fn($cq) => $cq->where('name', 'like', "%{$search}%"));
            });
        }

        if ($payment) {
            if ($payment === 'cash') {
                $baseQuery->where('cash_amount', '>', 0);
            } elseif ($payment === 'online') {
                $baseQuery->where('online_amount', '>', 0);
            } elseif ($payment === 'due') {
                // MongoDB-compatible: filter in PHP later
                // Cannot use whereColumn with MongoDB
            }
        }

        // ── Summary Stats (MongoDB-compatible) ────────────────────────────
        $allOrders = (clone $baseQuery)->get();
        
        // Apply due filter in PHP if needed
        if ($payment === 'due') {
            $allOrders = $allOrders->filter(function($order) {
                return $order->grand_total > ($order->cash_amount + $order->online_amount);
            });
        }
        
        $totalRevenue    = $allOrders->sum('grand_total');
        $totalCash       = $allOrders->sum('cash_amount');
        $totalOnline     = $allOrders->sum('online_amount');
        
        // Calculate due amount in PHP
        $totalDue        = $allOrders->sum(function($order) {
            return max(0, $order->grand_total - $order->cash_amount - $order->online_amount);
        });

        $totalTax        = $allOrders->sum('tax_amount');
        $totalTips       = $allOrders->sum('tip_amount');
        $totalDiscount   = $allOrders->sum('discount_amount');
        $totalOrders     = $allOrders->count();
        $avgOrderValue   = $totalOrders > 0 ? $totalRevenue / $totalOrders : 0;

        // ── Efficiency (MongoDB-compatible) ────────────────────────────────
        $avgSittingMins = $allOrders->avg(function($order) {
            $created = Carbon::parse($order->created_at);
            $updated = Carbon::parse($order->updated_at);
            return $created->diffInMinutes($updated);
        }) ?? 0;

        // Calculate busiest hour
        $hourCounts = $allOrders->groupBy(function($order) {
            return Carbon::parse($order->created_at)->hour;
        })->map->count();
        
        $busiestHour = $hourCounts->sortDesc()->keys()->first();

        // ── Top Items / All Items (MongoDB-compatible) ─────────────────────
        $orderIds = $allOrders->pluck('id');
        $allItems = OrderItem::whereIn('order_id', $orderIds)->with('menu')->get();
        
        $topItems = $allItems->groupBy('menu_id')->map(function($items) {
            $menu = $items->first()->menu;
            return [
                'menu_id' => $items->first()->menu_id,
                'menu' => $menu,
                'total_quantity' => (int) $items->sum('quantity'),
                'total_revenue' => (float) $items->sum(function($item) {
                    return $item->quantity * $item->price;
                })
            ];
        })->sortByDesc('total_quantity')->values();

        // ── Sales by Table (MongoDB-compatible) ────────────────────────────
        $tableSales = $allOrders->filter(function($order) {
            return $order->table_id !== null;
        })->groupBy('table_id')->map(function($orders) {
            $table = $orders->first()->table;
            $totalRevenue = $orders->sum('grand_total');
            return [
                'table_id' => $orders->first()->table_id,
                'table_number' => $table ? $table->table_number : 'N/A',
                'order_count' => $orders->count(),
                'total_revenue' => (float) $totalRevenue,
                'avg_order_value' => (float) $orders->avg('grand_total')
            ];
        })->sortByDesc('total_revenue')->values();

        // ── Sales by Payment Method (Comprehensive) ────────────────────────
        // 1. Group orders linked to specific bank accounts
        $accountSales = $allOrders->filter(fn($o) => !empty($o->bank_account_id))
            ->groupBy('bank_account_id')
            ->map(function($orders, $bankAccountId) {
                $bankAccount = $orders->first()->bankAccount;
                $name = $bankAccount ? $bankAccount->account_name . ($bankAccount->bank_name ? ' (' . $bankAccount->bank_name . ')' : '') : 'Bank Account #' . $bankAccountId;
                $type = $bankAccount?->account_type ?: 'online';
                
                return [
                    'id' => 'account_' . $bankAccountId,
                    'name' => $name,
                    'type' => $type,
                    'filter_key' => $type === 'cash' ? 'cash' : 'online',
                    'order_count' => $orders->count(),
                    'total_revenue' => (float) $orders->sum('grand_total'),
                    'avg_order_value' => (float) $orders->avg('grand_total')
                ];
            });

        // 2. Group orders without bank_account_id
        $unassignedSales = $allOrders->filter(fn($o) => empty($o->bank_account_id))
            ->groupBy(function($order) {
                $hasCash = ($order->cash_amount ?? 0) > 0;
                $hasOnline = ($order->online_amount ?? 0) > 0;
                $due = max(0, $order->grand_total - ($order->cash_amount ?? 0) - ($order->online_amount ?? 0));
                
                if ($hasCash && $hasOnline) return 'split';
                if ($hasCash) return 'cash';
                if ($hasOnline) return 'online';
                if ($due > 0.01) return 'due';
                return $order->payment_method ?: 'cash';
            })
            ->map(function($orders, $key) {
                $label = match($key) {
                    'cash' => 'Cash Counter (Unassigned)',
                    'online' => 'Online Payment (Direct / QR)',
                    'split' => 'Split Payment (Cash + Online)',
                    'due' => 'Customer Due / Credit',
                    default => ucfirst($key) . ' (Unassigned)',
                };
                
                return [
                    'id' => 'method_' . $key,
                    'name' => $label,
                    'type' => $key,
                    'filter_key' => in_array($key, ['cash', 'online', 'due']) ? $key : null,
                    'order_count' => $orders->count(),
                    'total_revenue' => (float) $orders->sum('grand_total'),
                    'avg_order_value' => (float) $orders->avg('grand_total')
                ];
            });

        $paymentSales = $accountSales->concat($unassignedSales)->sortByDesc('total_revenue')->values();

        // ── Daily Counter Cash Transactions (Cash Out & Cash In) ───────────
        $counterCashOut = 0;
        $counterCashIn = 0;
        $counterTransactions = collect();

        if (class_exists(\App\Models\CashRegisterTransaction::class) && \Illuminate\Support\Facades\Schema::hasTable('cash_register_transactions')) {
            $tenantId = auth()->user()?->tenant_id;
            $counterQuery = \App\Models\CashRegisterTransaction::with(['user:id,name', 'category:id,name', 'session:id,opened_at,closed_at'])
                ->whereBetween('created_at', [$startDate, $endDate]);

            if ($tenantId) {
                $counterQuery->where('tenant_id', $tenantId);
            }

            $allCounterTx = $counterQuery->orderBy('created_at', 'desc')->get();
            $counterCashOut = (float) $allCounterTx->where('type', 'cash_out')->sum('amount');
            $counterCashIn  = (float) $allCounterTx->where('type', 'cash_in')->sum('amount');
            $counterTransactions = $allCounterTx->map(function($tx) {
                return [
                    'id' => $tx->id,
                    'type' => $tx->type, // 'cash_out' or 'cash_in'
                    'amount' => (float) $tx->amount,
                    'notes' => $tx->notes,
                    'category' => $tx->category ? $tx->category->name : ($tx->type === 'cash_out' ? 'General Expense' : 'Cash In'),
                    'user' => $tx->user ? $tx->user->name : 'Staff',
                    'session_id' => $tx->cash_register_session_id,
                    'created_at' => $tx->created_at ? $tx->created_at->toIso8601String() : null,
                ];
            });
        }

        // ── All tables & menus for filter dropdowns ────────────────────────────────
        $allTables = \App\Models\Table::orderBy('table_number')->get(['id', 'table_number']);
        $allMenus  = \App\Models\Menu::orderBy('name')->get(['id', 'name']);

        // ── Paginated transactions ─────────────────────────────────────────
        // For 'due' payment filter, we need to fetch all and filter in PHP (MongoDB limitation)
        if ($payment === 'due') {
            // Get all orders, filter in collection, then manually paginate
            $allPaginationOrders = (clone $baseQuery)->latest('updated_at')->get();
            $filteredOrders = $allPaginationOrders->filter(function($order) {
                return $order->grand_total > ($order->cash_amount + $order->online_amount);
            })->values();
            
            // Manual pagination
            $perPage = 20;
            $currentPage = (int) $request->get('page', 1);
            $total = $filteredOrders->count();
            $items = $filteredOrders->slice(($currentPage - 1) * $perPage, $perPage)->values();
            
            $orders = new \Illuminate\Pagination\LengthAwarePaginator(
                $items,
                $total,
                $perPage,
                $currentPage,
                [
                    'path' => $request->url(),
                    'query' => $request->query()
                ]
            );
        } else {
            $orders = (clone $baseQuery)->latest('updated_at')->paginate(20)->withQueryString();
        }

        return Inertia::render('Reports/Index', [
            'orders'      => $orders,
            'filters'     => [
                'period'     => $period,
                'start_date' => $startDate->format('Y-m-d'),
                'end_date'   => $endDate->format('Y-m-d'),
                'table_id'   => $tableId,
                'menu_id'    => $menuId,
                'payment'    => $payment,
                'search'     => $search,
            ],
            'stats'       => [
                'total_revenue'    => (float) $totalRevenue,
                'total_cash'       => (float) $totalCash,
                'total_online'     => (float) $totalOnline,
                'total_due'        => (float) $totalDue,
                'total_tax'        => (float) $totalTax,
                'total_tips'       => (float) $totalTips,
                'total_discount'   => (float) $totalDiscount,
                'total_orders'     => $totalOrders,
                'avg_order_value'  => (float) $avgOrderValue,
                'avg_sitting_mins' => (float) round($avgSittingMins),
                'busiest_hour'     => $busiestHour !== null ? (int) $busiestHour : null,
                'counter_cash_out' => (float) $counterCashOut,
                'counter_cash_in'  => (float) $counterCashIn,
                'counter_net'      => (float) ($counterCashIn - $counterCashOut),
            ],
            'top_items'   => Inertia::defer(fn() => $topItems),
            'table_sales' => Inertia::defer(fn() => $tableSales),
            'payment_sales' => Inertia::defer(fn() => $paymentSales),
            'counter_transactions' => Inertia::defer(fn() => $counterTransactions),
            'all_tables'  => $allTables,
            'all_menus'   => $allMenus,
        ]);
    }

    public function export(Request $request)
    {
        // ── Period Resolution ──────────────────────────────────────────────
        $period   = $request->input('period', 'today');
        $tableId  = $request->input('table_id');
        $menuId   = $request->input('menu_id');
        $payment  = $request->input('payment');
        $search   = $request->input('search');

        switch ($period) {
            case 'today':
                $startDate = Carbon::now()->startOfDay();
                $endDate   = Carbon::now()->endOfDay();
                break;
            case 'yesterday':
                $startDate = Carbon::yesterday()->startOfDay();
                $endDate   = Carbon::yesterday()->endOfDay();
                break;
            case 'week':
                $startDate = Carbon::now()->startOfWeek();
                $endDate   = Carbon::now()->endOfWeek();
                break;
            case 'month':
                $startDate = Carbon::now()->startOfMonth();
                $endDate   = Carbon::now()->endOfMonth();
                break;
            case 'custom':
            default:
                $startDate = $request->input('start_date')
                    ? Carbon::parse($request->input('start_date'))->startOfDay()
                    : Carbon::now()->startOfMonth();
                $endDate = $request->input('end_date')
                    ? Carbon::parse($request->input('end_date'))->endOfDay()
                    : Carbon::now()->endOfDay();
                break;
        }

        // ── Base Query ─────────────────────────────────────────────────────
        $baseQuery = Order::with(['table', 'customer'])
            ->where('status', 'completed')
            ->whereBetween('updated_at', [$startDate, $endDate]);

        if ($tableId) {
            $baseQuery->where('table_id', $tableId);
        }

        if ($menuId) {
            $baseQuery->whereHas('items', fn($q) => $q->where('menu_id', $menuId));
        }

        if ($search) {
            $cleanSearchId = ltrim($search, '#');
            $baseQuery->where(function ($q) use ($search, $cleanSearchId) {
                $q->where('id', 'like', "%{$cleanSearchId}%")
                  ->orWhereHas('table', fn($tq) => $tq->where('table_number', 'like', "%{$search}%"))
                  ->orWhereHas('customer', fn($cq) => $cq->where('name', 'like', "%{$search}%"));
            });
        }

        if ($payment) {
            if ($payment === 'cash') {
                $baseQuery->where('cash_amount', '>', 0);
            } elseif ($payment === 'online') {
                $baseQuery->where('online_amount', '>', 0);
            } elseif ($payment === 'due') {
                // MongoDB-compatible: filter later in PHP
                // Cannot use whereColumn
            }
        }

        $orders = $baseQuery->latest('updated_at')->get();
        
        // Apply due filter if needed
        if ($payment === 'due') {
            $orders = $orders->filter(function($order) {
                return $order->grand_total > ($order->cash_amount + $order->online_amount);
            });
        }

        $filename = "financial_report_{$period}_" . now()->format('Ymd_His') . ".csv";

        $headers = [
            "Content-type"        => "text/csv",
            "Content-Disposition" => "attachment; filename=$filename",
            "Pragma"              => "no-cache",
            "Cache-Control"       => "must-revalidate, post-check=0, pre-check=0",
            "Expires"             => "0"
        ];

        $columns = [
            'Order #', 'Table', 'Customer', 'Ordered At', 'Completed At',
            'Duration (Mins)', 'Discount', 'Tax', 'Grand Total', 'Cash Amount', 'Online Amount', 'Due Amount'
        ];

        $callback = function() use($orders, $columns) {
            $file = fopen('php://output', 'w');
            // Add BOM for Excel to read UTF-8 correctly
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));
            fputcsv($file, $columns);

            foreach ($orders as $order) {
                $duration = $order->created_at && $order->updated_at
                    ? max(0, (new Carbon($order->updated_at))->diffInMinutes(new Carbon($order->created_at)))
                    : 0;

                $due = max(0, $order->grand_total - ($order->cash_amount ?? 0) - ($order->online_amount ?? 0));

                $row = [
                    $order->id,
                    $order->table ? 'Table ' . $order->table->table_number : '-',
                    $order->customer ? $order->customer->name : '-',
                    $order->created_at ? $order->created_at->format('Y-m-d h:i A') : '-',
                    $order->updated_at ? $order->updated_at->format('Y-m-d h:i A') : '-',
                    $duration,
                    $order->discount_amount,
                    $order->tax_amount,
                    $order->grand_total,
                    $order->cash_amount ?? 0,
                    $order->online_amount ?? 0,
                    $due > 0.01 ? round($due, 2) : 0
                ];

                fputcsv($file, $row);
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function analytics(Request $request)
    {
        $days = $request->input('days', 30);
        $startDate = $request->input('start_date') 
            ? Carbon::parse($request->input('start_date'))->startOfDay() 
            : Carbon::now()->subDays($days)->startOfDay();
        $endDate = $request->input('end_date') 
            ? Carbon::parse($request->input('end_date'))->endOfDay() 
            : Carbon::now()->endOfDay();

        // 1. Daily Revenue & Profit Trend (MongoDB-compatible)
        $orders = Order::where('status', 'completed')
            ->whereBetween('updated_at', [$startDate, $endDate])
            ->get();

        $trend = $orders->groupBy(function ($order) {
            return Carbon::parse($order->updated_at)->format('Y-m-d');
        })->map(function ($dayOrders, $date) {
            return [
                'date' => $date,
                'revenue' => $dayOrders->sum('grand_total'),
                'tips' => $dayOrders->sum('tip_amount')
            ];
        })->sortBy('date')->values();

        // 2. Sales by Category (MongoDB-compatible)
        $orderIds = $orders->pluck('id');
        $orderItems = OrderItem::whereIn('order_id', $orderIds)->with('menu')->get();
        
        $categorySales = $orderItems->groupBy(function ($item) {
            return $item->menu->category ?? 'Uncategorized';
        })->map(function ($items, $category) {
            return [
                'category' => $category,
                'value' => $items->sum(function ($item) {
                    return $item->quantity * $item->price;
                })
            ];
        })->values();

        // 3. Top Profitable Items (MongoDB-compatible)
        $profitableItems = $orderItems->groupBy('menu_id')->map(function ($items) {
            $menu = $items->first()->menu;
            $qty = $items->sum('quantity');
            $revenue = $items->sum(function ($item) {
                return $item->quantity * $item->price;
            });
            $cost = $items->sum(function ($item) use ($menu) {
                return $item->quantity * ($menu->cost_price ?? 0);
            });
            
            return [
                'menu_id' => $menu->_id ?? $menu->id,
                'menu' => $menu,
                'qty' => $qty,
                'revenue' => $revenue,
                'cost' => $cost,
                'profit' => $revenue - $cost
            ];
        })->sortByDesc('profit')->take(10)->values();

        // 4. Overall Stats
        $totalRevenue = $orders->sum('grand_total');
        $totalTips = $orders->sum('tip_amount');
        
        $totalCost = $orderItems->sum(function ($item) {
            return $item->quantity * ($item->menu->cost_price ?? 0);
        });

        return Inertia::render('Reports/Analytics', [
            'trend' => Inertia::defer(fn() => $trend),
            'categorySales' => Inertia::defer(fn() => $categorySales),
            'profitableItems' => Inertia::defer(fn() => $profitableItems),
            'stats' => [
                'total_revenue' => (float)$totalRevenue,
                'total_tips' => (float)$totalTips,
                'total_cost' => (float)$totalCost,
                'total_profit' => (float)($totalRevenue - $totalCost),
                'margin' => $totalRevenue > 0 ? (($totalRevenue - $totalCost) / $totalRevenue) * 100 : 0
            ],
            'filters' => [
                'days' => (int)$days,
                'start_date' => $request->input('start_date'),
                'end_date' => $request->input('end_date')
            ]
        ]);
    }
}
