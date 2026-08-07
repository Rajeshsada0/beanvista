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

        // ── Top Items (MongoDB-compatible) ─────────────────────────────────
        $orderIds = $allOrders->pluck('id');
        $allItems = OrderItem::whereIn('order_id', $orderIds)->with('menu')->get();
        
        $topItems = $allItems->groupBy('menu_id')->map(function($items) {
            return [
                'menu_id' => $items->first()->menu_id,
                'menu' => $items->first()->menu,
                'total_quantity' => $items->sum('quantity'),
                'total_revenue' => $items->sum(function($item) {
                    return $item->quantity * $item->price;
                })
            ];
        })->sortByDesc('total_quantity')->take(10)->values();

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
                'total_revenue' => $totalRevenue,
                'avg_order_value' => $orders->avg('grand_total')
            ];
        })->sortByDesc('total_revenue')->values();

        // ── Sales by Payment Method (Bank Accounts) ────────────────────────────────
        $paymentSales = $allOrders->groupBy('bank_account_id')->map(function($orders, $bankAccountId) {
            $bankAccount = $orders->first()->bankAccount;
            $name = $bankAccount ? $bankAccount->account_name . ($bankAccount->bank_name ? ' (' . $bankAccount->bank_name . ')' : '') : 'Uncategorized / ' . ucfirst($orders->first()->payment_method ?: 'Cash');
            
            return [
                'bank_account_id' => $bankAccountId,
                'name' => $name,
                'order_count' => $orders->count(),
                'total_revenue' => $orders->sum('grand_total'),
                'avg_order_value' => $orders->avg('grand_total')
            ];
        })->sortByDesc('total_revenue')->values();

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
            ],
            'top_items'   => Inertia::defer(fn() => $topItems),
            'table_sales' => Inertia::defer(fn() => $tableSales),
            'payment_sales' => Inertia::defer(fn() => $paymentSales),
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
