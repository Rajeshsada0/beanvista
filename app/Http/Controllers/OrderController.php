<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Customer;
use App\Models\Menu;
use App\Models\Table;
use App\Models\ActivityLog;
use App\Models\CreditTransaction;

class OrderController extends Controller
{
    public function kds()
    {
        // Fetch all pending/preparing items with their relations (MongoDB compatible)
        $items = OrderItem::with([
                'order', 
                'order.table', 
                'order.customer',
                'order.waiter',
                'menu', 
                'addons'
            ])
            ->oldest('created_at')
            ->get();

        // Filter for pending/preparing items, treating null/missing kds_status as 'pending'
        // Allow completed orders to show if their items are not delivered yet (Pay & Fire)
        $items = $items->filter(function($item) {
            if (!$item->order || $item->order->status === 'cancelled') {
                return false;
            }
            $status = $item->kds_status ?? 'pending';
            return in_array($status, ['pending', 'preparing']);
        })->values();

        // Ensure kds_status is set for display
        $items = $items->map(function($item) {
            if (!isset($item->kds_status) || $item->kds_status === null) {
                $item->kds_status = 'pending';
            }
            return $item;
        });

        $warningMins = (int)(\App\Models\Setting::where('key', 'kds_warning_mins')->first()?->value ?? 10);
        $criticalMins = (int)(\App\Models\Setting::where('key', 'kds_critical_mins')->first()?->value ?? 20);

        return inertia('Orders/KDS', [
            'items' => $items,
            'kds_warning_mins' => $warningMins,
            'kds_critical_mins' => $criticalMins,
        ]);
    }

    public function updateItemStatus(Request $request, OrderItem $item)
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,preparing,ready,delivered'
        ]);

        $item->kds_status = $validated['status'];
        
        if ($validated['status'] === 'preparing' && !$item->started_at) {
            $item->started_at = now();
        }
        
        if ($validated['status'] === 'ready' && !$item->finished_at) {
            $item->finished_at = now();
        }

        if ($validated['status'] === 'delivered' && !$item->delivered_at) {
            $item->delivered_at = now();
        }

        $item->save();

        ActivityLog::record('updated', "Order item #{$item->id} ({$item->menu->name}) status updated to {$item->kds_status}", $item->order);

        // Auto-update order status based on item statuses
        $order = $item->order;
        $nonDelivered = $order->items()->whereNotIn('kds_status', ['delivered'])->count();
        $readyCount   = $order->items()->where('kds_status', 'ready')->count();
        $preparingCount = $order->items()->where('kds_status', 'preparing')->count();

        if ($nonDelivered === 0) {
            // All items delivered — mark order as served (only if not completed)
            if ($order->status !== 'completed') {
                $order->update(['status' => 'served']);
            }
        } elseif ($readyCount > 0 || $preparingCount > 0) {
            if ($preparingCount > 0) {
                if ($order->status !== 'completed') {
                    $order->update(['status' => 'preparing']);
                }
            }
        }

        // Sync table status
        if ($order->table_id) {
            \App\Models\Table::syncStatus($order->table_id);
        }

        return back()->with('success', 'Item status updated.');
    }

    public function bulkUpdateItemStatus(Request $request)
    {
        $validated = $request->validate([
            'item_ids' => 'required|array',
            'item_ids.*' => 'required',
            'status' => 'required|in:pending,preparing,ready,delivered'
        ]);

        $status = $validated['status'];
        $itemIds = $validated['item_ids'];

        if (empty($itemIds)) {
            return back()->with('error', 'No items selected.');
        }

        $items = OrderItem::whereIn('id', $itemIds)->with('order', 'menu')->get();

        foreach ($items as $item) {
            $item->kds_status = $status;
            
            if ($status === 'preparing' && !$item->started_at) {
                $item->started_at = now();
            }
            
            if ($status === 'ready' && !$item->finished_at) {
                $item->finished_at = now();
            }

            if ($status === 'delivered' && !$item->delivered_at) {
                $item->delivered_at = now();
            }

            $item->save();

            ActivityLog::record('updated', "Order item #{$item->id} ({$item->menu->name}) status bulk updated to {$status}", $item->order);
        }

        // Auto-update order statuses based on item statuses
        $orders = Order::whereIn('id', $items->pluck('order_id')->unique())->get();
        foreach ($orders as $order) {
            $nonDelivered = $order->items()->whereNotIn('kds_status', ['delivered'])->count();
            $readyCount   = $order->items()->where('kds_status', 'ready')->count();
            $preparingCount = $order->items()->where('kds_status', 'preparing')->count();

            if ($nonDelivered === 0) {
                // All items delivered — mark order as served (only if not completed)
                if ($order->status !== 'completed') {
                    $order->update(['status' => 'served']);
                }
            } elseif ($readyCount > 0 || $preparingCount > 0) {
                if ($preparingCount > 0) {
                    if ($order->status !== 'completed') {
                        $order->update(['status' => 'preparing']);
                    }
                }
            }

            // Sync table status
            if ($order->table_id) {
                \App\Models\Table::syncStatus($order->table_id);
            }
        }

        return back()->with('success', 'Bulk items status updated.');
    }

    public function serviceView()
    {
        // Load all active (non-completed) orders and completed orders with undelivered items (MongoDB compatible)
        $orders = Order::with([
                'table', 
                'items',
                'items.menu', 
                'items.addons', 
                'customer'
            ])
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
            ->latest('updated_at')
            ->get();

        // Group by table for the waiter view. If no table, group by order ID so they get their own card.
        $tables = $orders->groupBy(function ($order) {
            return $order->table_id ? 'table_' . $order->table_id : 'order_' . $order->id;
        })->map(function ($tableOrders) {
            $table = $tableOrders->first()->table;
            $allItems = $tableOrders->flatMap(fn($o) => $o->items->map(fn($i) => array_merge($i->toArray(), [
                'order_id'     => $o->id,
                'order_number' => $o->order_number,
                'order_status' => $o->status,
                // Ensure kds_status has a default value if not set
                'kds_status'   => $i->kds_status ?? 'pending',
            ])));

            return [
                'table'      => $table,
                'orders'     => $tableOrders->values(),
                'remaining'  => $allItems->whereIn('kds_status', ['pending', 'preparing'])->values(),
                'ready'      => $allItems->where('kds_status', 'ready')->values(),
                'delivered'  => $allItems->where('kds_status', 'delivered')->values(),
            ];
        })->values();

        return inertia('Orders/ServiceView', [
            'tables' => $tables,
        ]);
    }

    public function index(Request $request)
    {
        $baseQuery = \App\Models\Order::query();
        $filter = $request->input('filter', 'all');
        $startDate = $request->input('start_date');
        $endDate = $request->input('end_date');
        $status = $request->input('status', 'all');
        $sortBy = $request->input('sort_by', 'created_at');
        $sortDir = $request->input('sort_dir', 'desc');

        // Whitelist sortable columns
        $allowedSorts = ['created_at', 'order_number', 'status', 'grand_total'];
        if (!in_array($sortBy, $allowedSorts)) {
            $sortBy = 'created_at';
        }
        $sortDir = $sortDir === 'asc' ? 'asc' : 'desc';

        switch($filter) {
            case 'today':
                $baseQuery->whereDate('created_at', \Carbon\Carbon::today());
                break;
            case 'yesterday':
                $baseQuery->whereDate('created_at', \Carbon\Carbon::yesterday());
                break;
            case 'week':
                $baseQuery->whereBetween('created_at', [\Carbon\Carbon::now()->startOfWeek(), \Carbon\Carbon::now()->endOfWeek()]);
                break;
            case 'month':
                $baseQuery->whereMonth('created_at', \Carbon\Carbon::now()->month)
                      ->whereYear('created_at', \Carbon\Carbon::now()->year);
                break;
            case 'custom':
                if ($startDate && $endDate) {
                    $baseQuery->whereBetween('created_at', [
                        \Carbon\Carbon::parse($startDate)->startOfDay(),
                        \Carbon\Carbon::parse($endDate)->endOfDay()
                    ]);
                }
                break;
            case 'all':
            default:
                break;
        }

        $counts = [
            'all' => (clone $baseQuery)->count(),
            'active' => (clone $baseQuery)->whereNotIn('status', ['completed', 'cancelled'])->count(),
            'completed' => (clone $baseQuery)->where('status', 'completed')->count(),
            'cancelled' => (clone $baseQuery)->where('status', 'cancelled')->count(),
        ];

        $query = clone $baseQuery;
        $query->with(['table', 'items.menu', 'customer']);

        if ($status === 'active') {
            $query->whereNotIn('status', ['completed', 'cancelled']);
        } elseif ($status === 'completed') {
            $query->where('status', 'completed');
        } elseif ($status === 'cancelled') {
            $query->where('status', 'cancelled');
        }

        $orders = $query->orderBy($sortBy, $sortDir)->paginate(10)->withQueryString();

        return inertia('Orders/Index', [
            'orders' => $orders,
            'counts' => $counts,
            'filters' => [
                'filter'     => $filter,
                'start_date' => $startDate,
                'end_date'   => $endDate,
                'status'     => $status,
                'sort_by'    => $sortBy,
                'sort_dir'   => $sortDir,
            ]
        ]);
    }

    public function show(\App\Models\Order $order)
    {
        $order->load(['table', 'items.menu', 'customer']);
        return inertia('Orders/Receipt', [
            'order' => $order,
            'taxes' => \App\Models\Tax::where('status', true)->get()
        ]);
    }

    public function receipt(\App\Models\Order $order)
    {
        $order->load(['table', 'items.menu', 'customer']);
        return inertia('Orders/Receipt', [
            'order' => $order,
            'taxes' => \App\Models\Tax::where('status', true)->get()
        ]);
    }

    public function edit(\App\Models\Order $order)
    {
        if ($order->status === 'completed') {
            $tenantId = auth()->user()?->tenant_id ?? $order->tenant_id;
            $allowEdit = \App\Models\Setting::where('tenant_id', $tenantId)
                ->where('key', 'enable_completed_order_edit')
                ->value('value');
            $canEditCompleted = in_array($allowEdit, ['true', '1', true, 1], true);

            if (!$canEditCompleted) {
                return redirect()->route('orders.index')->with('error', 'Completed orders cannot be modified. You can enable this in Cafe Settings.');
            }
        }

        $order->load([
            'table', 
            'items', 
            'items.menu', 
            'items.addons'
        ]);

        return inertia('Orders/Edit', [
            'order' => $order,
            'menus' => \Inertia\Inertia::defer(fn() => \App\Models\Menu::where('status', true)->with('recipes.inventoryItem')->get()),
            'customers' => \Inertia\Inertia::defer(fn() => \App\Models\Customer::get()),
            'categories' => \Inertia\Inertia::defer(fn() => \App\Models\Category::where('status', true)->get()),
            'addons' => \Inertia\Inertia::defer(fn() => \App\Models\Addon::where('status', true)->get()),
            'taxes' => \Inertia\Inertia::defer(fn() => \App\Models\Tax::where('status', true)->get()),
            'bankAccounts' => \Inertia\Inertia::defer(fn() => \App\Models\BankAccount::where('tenant_id', auth()->user()->tenant_id)->get())
        ]);
    }

    public function create(Request $request)
    {
        $table = \App\Models\Table::find($request->table_id);
        if (!$table) {
            return redirect()->route('pos.viewer')->with('error', 'Table not found or access denied.');
        }
        return inertia('Orders/Edit', [
            'table' => $table,
            'menus' => \Inertia\Inertia::defer(fn() => \App\Models\Menu::where('status', true)->with('recipes.inventoryItem')->get()),
            'customers' => \Inertia\Inertia::defer(fn() => \App\Models\Customer::get()),
            'categories' => \Inertia\Inertia::defer(fn() => \App\Models\Category::where('status', true)->get()),
            'addons' => \Inertia\Inertia::defer(fn() => \App\Models\Addon::where('status', true)->get()),
            'taxes' => \Inertia\Inertia::defer(fn() => \App\Models\Tax::where('status', true)->get()),
            'bankAccounts' => \Inertia\Inertia::defer(fn() => \App\Models\BankAccount::where('tenant_id', auth()->user()->tenant_id)->get()),
            'order' => null,
            'reservation_id' => $request->reservation_id
        ]);
    }

    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'table_id' => 'nullable|exists:tables,id',
                'items' => 'required|array|min:1',
                'items.*.menu_id' => 'required|exists:menus,id',
                'items.*.quantity' => 'required|integer|min:1',
                'items.*.addons' => 'sometimes|array',
                'status' => 'sometimes|in:pending,preparing,served,completed',
                'customer_id' => 'nullable|exists:customers,id',
                'waiter_id' => 'nullable|exists:users,id',
                'order_type' => 'nullable|string',
                'car_plate' => 'nullable|string|max:255',
                'car_description' => 'nullable|string|max:255',
                'notes' => 'nullable|string',
                'scheduled_at' => 'nullable|date',
                'guest_count' => 'nullable|integer|min:1',
                'discount_percentage' => 'sometimes|numeric|min:0|max:100',
                'discount_amount' => 'sometimes|numeric|min:0',
                'tip_amount' => 'sometimes|numeric|min:0',
                'cash_amount' => 'sometimes|numeric|min:0',
                'online_amount' => 'sometimes|numeric|min:0',
                'payment_method' => 'sometimes|string|nullable',
                'bank_account_id' => 'sometimes|nullable|exists:bank_accounts,id',
                'points_redeemed' => 'sometimes|numeric|min:0',
                'credit_amount' => 'sometimes|numeric|min:0',
                'due_payment_amount' => 'sometimes|numeric|min:0',
                'quick_complete' => 'sometimes|boolean',
            ]);

            $tenant = auth()->user()?->tenant;
            if ($tenant && $tenant->hasLimitReached('max_orders_per_month')) {
                $limit = $tenant->getPlanLimit('max_orders_per_month');
                return back()->with('error', "Monthly order taking limit of {$limit} orders reached for your current plan or free trial. Please upgrade your subscription plan to continue taking orders.");
            }

            $table = null;
            if (!empty($validated['table_id'])) {
                $table = \App\Models\Table::find($validated['table_id']);
                if (!$table) {
                    return redirect()->route('pos.viewer')->with('error', 'Table not found or access denied.');
                }
            }

            $order = Order::create([
                'table_id' => $table ? $table->id : null,
                'customer_id' => $validated['customer_id'] ?? null,
                'waiter_id' => $validated['waiter_id'] ?? auth()->id(),
                'order_type' => $validated['order_type'] ?? 'Dine-In',
                'car_plate' => $validated['car_plate'] ?? null,
                'car_description' => $validated['car_description'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'scheduled_at' => $validated['scheduled_at'] ?? null,
                'guest_count' => $validated['guest_count'] ?? 1,
                'status' => 'pending',
                'total_amount' => 0,
                'grand_total' => 0,
            ]);

            // Table status update is now handled by Order model's created hook

            $total = 0;
            foreach($validated['items'] as $item) {
                $menu = \App\Models\Menu::find($item['menu_id']);
                $itemPrice = $menu->price;
                $addonData = [];
                
                if (isset($item['addons']) && is_array($item['addons'])) {
                    foreach($item['addons'] as $addonId) {
                        $addon = \App\Models\Addon::find($addonId);
                        if ($addon) {
                            $itemPrice += $addon->price;
                            $addonData[$addon->id] = [
                                'addon_name' => $addon->name,
                                'price' => $addon->price
                            ];
                        }
                    }
                }

                $orderItem = $order->items()->create([
                    'menu_id' => $menu->id,
                    'quantity' => $item['quantity'],
                    'price' => $itemPrice,
                    'kds_status' => $menu->send_to_kitchen ? 'pending' : 'delivered',
                ]);
                
                if (!empty($addonData)) {
                    $orderItem->addons()->sync($addonData);
                }
                
                $total += $itemPrice * $item['quantity'];
            }
            $order->total_amount = $total;
            $order->grand_total = $total;
            $order->save();

            if ($request->reservation_id) {
                \App\Models\Reservation::where('id', $request->reservation_id)
                    ->where('table_id', $table->id)
                    ->update(['status' => 'completed']);
            }

            $tableStr = $table ? "Table {$table->table_number}" : "Drive-Thru/Takeaway";
            ActivityLog::record('created', "New order started for {$tableStr} (Price: \${$total})", $order);

            if (isset($validated['status']) && $validated['status'] === 'completed') {
                $this->processCompletion($order, $validated);
                $autoPrint = \App\Models\Setting::where('tenant_id', $order->tenant_id)->where('key', 'auto_print_receipt')->value('value');
                if (filter_var($autoPrint, FILTER_VALIDATE_BOOLEAN)) {
                    return redirect()->route('orders.receipt', $order->id)->with('success', 'Order completed successfully.');
                }
                if ($request->source === 'pos_viewer') {
                    return back()->with('success', 'Order completed successfully.');
                }
                return redirect()->route('orders.index')->with('success', 'Order completed successfully.');
            }

            if ($request->source === 'pos_viewer') {
                return back()->with('success', 'Order saved successfully.');
            }
            return redirect()->route('orders.index')->with('success', 'Order saved successfully.');
        } catch (\Exception $e) {
            \Log::error("OrderController store failed: " . $e->getMessage() . "\n" . $e->getTraceAsString());
            if ($request->source === 'pos_viewer') {
                return back()->with('error', 'Failed to save order: ' . $e->getMessage());
            }
            return redirect()->route('pos.viewer')->with('error', 'Failed to save order: ' . $e->getMessage());
        }
    }

    public function update(Request $request, \App\Models\Order $order)
    {
        if ($order->status === 'completed') {
            $tenantId = auth()->user()?->tenant_id ?? $order->tenant_id;
            $allowEdit = \App\Models\Setting::where('tenant_id', $tenantId)
                ->where('key', 'enable_completed_order_edit')
                ->value('value');
            $canEditCompleted = in_array($allowEdit, ['true', '1', true, 1], true);

            if (!$canEditCompleted) {
                return back()->with('error', 'Completed orders cannot be modified. You can enable this in Cafe Settings.');
            }
        }

        $validated = $request->validate([
            'status'                  => 'sometimes|in:pending,preparing,served,completed',
            'items'                   => 'sometimes|array',
            'items.*.menu_id'         => 'required|exists:menus,id',
            'items.*.quantity'        => 'required|integer|min:1',
            'items.*.addons'          => 'sometimes|array',
            'items.*.order_item_id'   => 'sometimes|nullable',  // MongoDB ObjectId can be string
            'items.*.kds_status'      => 'sometimes|nullable|string',
            'items.*.price'           => 'sometimes|numeric',  // Added for frontend compatibility
            'discount_percentage'     => 'sometimes|numeric|min:0|max:100',
            'discount_amount'         => 'sometimes|numeric|min:0',
            'tip_amount'              => 'sometimes|numeric|min:0',
            'cash_amount'             => 'sometimes|numeric|min:0',
            'online_amount'           => 'sometimes|numeric|min:0',
            'payment_method'          => 'sometimes|string|nullable',
            'bank_account_id'         => 'sometimes|nullable|exists:bank_accounts,id',
            'customer_id'             => 'nullable|exists:customers,id',
            'waiter_id'               => 'nullable|exists:users,id',
            'order_type'              => 'nullable|string',
            'car_plate'               => 'nullable|string|max:255',
            'car_description'         => 'nullable|string|max:255',
            'notes'                   => 'nullable|string',
            'guest_count'             => 'nullable|integer|min:1',
            'points_redeemed'         => 'sometimes|numeric|min:0',
            'credit_amount'           => 'sometimes|numeric|min:0',
            'due_payment_amount'      => 'sometimes|numeric|min:0',
            'scheduled_at'            => 'nullable|date',
            'quick_complete'          => 'sometimes|boolean',
        ]);

        if (isset($validated['status']) && $validated['status'] === 'completed' && auth()->user()->role === 'waiter') {
            return back()->with('error', 'Waiters are not authorized to complete payments. Please ask a cashier or administrator.');
        }

        if (array_key_exists('customer_id', $validated)) $order->customer_id = $validated['customer_id'];
        if (array_key_exists('waiter_id', $validated)) $order->waiter_id = $validated['waiter_id'];
        if (array_key_exists('order_type', $validated)) $order->order_type = $validated['order_type'];
        if (array_key_exists('car_plate', $validated)) $order->car_plate = $validated['car_plate'];
        if (array_key_exists('car_description', $validated)) $order->car_description = $validated['car_description'];
        if (array_key_exists('notes', $validated)) $order->notes = $validated['notes'];
        if (array_key_exists('guest_count', $validated)) $order->guest_count = $validated['guest_count'];
        if (array_key_exists('scheduled_at', $validated)) $order->scheduled_at = $validated['scheduled_at'];

        if (isset($validated['items'])) {
            // Collect the IDs of existing items the front-end is still showing
            $keptItemIds = collect($validated['items'])
                ->pluck('order_item_id')
                ->filter()
                ->values()
                ->all();

            // Delete only items that are NOT delivered AND are not being kept
            // (Delivered items are always preserved regardless)
            $order->items()
                ->where('kds_status', '!=', 'delivered')
                ->when(!empty($keptItemIds), fn($q) => $q->whereNotIn('id', $keptItemIds))
                ->delete();

            $total = 0;

            foreach ($validated['items'] as $item) {
                $existingItemId = $item['order_item_id'] ?? null;
                $existingStatus = $item['kds_status']    ?? null;

                // ── Already-delivered item: just count its price toward total ──
                if ($existingItemId && $existingStatus === 'delivered') {
                    $existing = OrderItem::find($existingItemId);
                    if ($existing) {
                        $total += $existing->price * $existing->quantity;
                    }
                    continue; // skip — do NOT touch the kitchen record
                }

                // ── Existing non-delivered item: update quantity / addons in place ──
                if ($existingItemId) {
                    $existing = OrderItem::find($existingItemId);
                    if ($existing) {
                        $menu      = \App\Models\Menu::find($item['menu_id']);
                        $itemPrice = $menu->price;
                        $addonData = [];

                        if (isset($item['addons']) && is_array($item['addons'])) {
                            foreach ($item['addons'] as $addonId) {
                                $addon = \App\Models\Addon::find($addonId);
                                if ($addon) {
                                    $itemPrice               += $addon->price;
                                    $addonData[$addon->id]    = [
                                        'addon_name' => $addon->name,
                                        'price'      => $addon->price,
                                    ];
                                }
                            }
                        }

                        $existing->update([
                            'quantity' => $item['quantity'],
                            'price'    => $itemPrice,
                        ]);

                        if (!empty($addonData)) {
                            $existing->addons()->sync($addonData);
                        }

                        $total += $itemPrice * $item['quantity'];
                        continue;
                    }
                }

                // ── Brand-new item: create with pending kds_status → goes to kitchen ──
                $menu      = \App\Models\Menu::find($item['menu_id']);
                $itemPrice = $menu->price;
                $addonData = [];

                if (isset($item['addons']) && is_array($item['addons'])) {
                    foreach ($item['addons'] as $addonId) {
                        $addon = \App\Models\Addon::find($addonId);
                        if ($addon) {
                            $itemPrice             += $addon->price;
                            $addonData[$addon->id]  = [
                                'addon_name' => $addon->name,
                                'price'      => $addon->price,
                            ];
                        }
                    }
                }

                $orderItem = $order->items()->create([
                    'menu_id'    => $menu->id,
                    'quantity'   => $item['quantity'],
                    'price'      => $itemPrice,
                    'kds_status' => $menu->send_to_kitchen ? 'pending' : 'delivered',
                ]);

                if (!empty($addonData)) {
                    $orderItem->addons()->sync($addonData);
                }

                $total += $itemPrice * $item['quantity'];
            }

            $order->total_amount = $total;
            if ($order->status !== 'completed') {
                $order->grand_total = $total;
            }
        }

        if (isset($validated['status'])) {
            $order->status = $validated['status'];
            if ($validated['status'] === 'completed') {
                $this->processCompletion($order, $validated);
            }
        }
        $order->save();

        // If the order now has 0 items, cancel it completely to free the table
        if ($order->items()->count() === 0) {
            $order->update(['status' => 'cancelled']);
            
            return redirect()->route('table-book')->with('success', 'Order was empty and has been cancelled.');
        }

        $tableStr = $order->table ? "Table {$order->table->table_number}" : "{$order->order_type}";
        ActivityLog::record('updated', "Order for {$tableStr} status updated to {$order->status}", $order);

        if ($order->status === 'completed') {
            $autoPrint = \App\Models\Setting::where('tenant_id', $order->tenant_id)->where('key', 'auto_print_receipt')->value('value');
            if (filter_var($autoPrint, FILTER_VALIDATE_BOOLEAN)) {
                return redirect()->route('orders.receipt', $order->id)->with('success', 'Order completed successfully.');
            }
            if ($request->source === 'pos_viewer') {
                return back()->with('success', 'Order completed successfully.');
            }
            return redirect()->route('orders.index')->with('success', 'Order completed successfully.');
        }

        return back()->with('success', 'Order updated successfully.');
    }

    protected function processCompletion(Order $order, array $data)
    {
        // Table status update is now handled by Order model's updated hook
        $tableStr = $order->table ? "Table {$order->table->table_number}" : "{$order->order_type}";

        $order->status = 'completed';
        $order->discount_percentage = $data['discount_percentage'] ?? 0;
        $order->discount_amount = $data['discount_amount'] ?? 0;
        $order->tip_amount = $data['tip_amount'] ?? 0;
        $order->cash_amount = $data['cash_amount'] ?? 0;
        $order->online_amount = $data['online_amount'] ?? 0;
        $order->payment_method = $data['payment_method'] ?? null;
        $order->bank_account_id = $data['bank_account_id'] ?? null;

        // Auto-assign cash drawer if payment method is cash and no bank account is provided
        if ($order->payment_method === 'cash' && !$order->bank_account_id) {
            $cashAccount = \App\Models\BankAccount::where('tenant_id', $order->tenant_id ?? auth()->user()->tenant_id)
                ->where('account_type', 'cash')
                ->first();
            if ($cashAccount) {
                $order->bank_account_id = $cashAccount->id;
            }
        }
        $order->points_redeemed = $data['points_redeemed'] ?? 0;

        // Calculate Global Tax
        $activeTaxes = \App\Models\Tax::where('status', true)->get();
        $totalTaxRate = $activeTaxes->sum('rate');
        $taxableAmount = $order->total_amount - $order->discount_amount - $order->points_redeemed;
        $order->tax_amount = ($taxableAmount * $totalTaxRate) / 100;

        $order->grand_total = $taxableAmount + $order->tax_amount + $order->tip_amount;

        // Handle Quick Complete payment values
        if (!empty($data['quick_complete'])) {
            if ($order->payment_method === 'online') {
                $order->online_amount = $order->grand_total;
                $order->cash_amount = 0;
            } else {
                $order->cash_amount = $order->grand_total;
                $order->online_amount = 0;
                $order->payment_method = 'cash'; // fallback to cash
            }
        }

        $order->save();

        // Handle credit and due payback mechanics
        $creditAmount = floatval($data['credit_amount'] ?? 0);
        $duePaymentAmount = floatval($data['due_payment_amount'] ?? 0);

        if ($order->customer_id && ($creditAmount > 0 || $duePaymentAmount > 0)) {
            $customer = $order->customer;

            if ($duePaymentAmount > 0) {
                // Ensure we don't over-deduct
                $payAmount = min($customer->due_amount, $duePaymentAmount);
                $customer->due_amount -= $payAmount;

                CreditTransaction::create([
                    'customer_id' => $customer->id,
                    'order_id'    => $order->id,
                    'type'        => 'payment',
                    'amount'      => $payAmount,
                    'note'        => "Paid back previous due along with Order {$order->display_number} ({$tableStr})",
                ]);

                ActivityLog::record(
                    'credit_payment',
                    "Paid {$payAmount} towards previous due. Remaining due: {$customer->due_amount}",
                    $customer
                );
            }

            if ($creditAmount > 0) {
                $customer->due_amount += $creditAmount;

                CreditTransaction::create([
                    'customer_id' => $customer->id,
                    'order_id'    => $order->id,
                    'type'        => 'charge',
                    'amount'      => $creditAmount,
                    'note'        => "Charged from Order {$order->display_number} ({$tableStr})",
                ]);

                ActivityLog::record(
                    'credit_charge',
                    "Credit charge of {$creditAmount} added for {$customer->name} from Order {$order->display_number}. Total due: {$customer->due_amount}",
                    $customer
                );
            }

            $customer->save();
        }

        // Award loyalty points
        if ($order->customer_id) {
            $customer = $order->customer()->first(); // Re-fetch after possible credit update

            if ($order->points_redeemed > 0) {
                $customer->loyalty_points -= $order->points_redeemed;
            }

            $pointsPerCurrency = \App\Models\Setting::where('key', 'points_per_currency')->first()?->value ?? 0.01;
            $pointsToAward = floor($order->grand_total * $pointsPerCurrency);
            
            $order->update(['points_earned' => $pointsToAward]);

            $customer->loyalty_points += $pointsToAward;
            $customer->lifetime_points += $pointsToAward;
            $customer->total_spent += $order->grand_total;
            $customer->save();

            ActivityLog::record('earned', "Earned {$pointsToAward} pts from Order {$order->display_number}", $customer, ['order_id' => $order->id, 'points' => $pointsToAward]);
        }

        ActivityLog::record('completed', "Order for {$tableStr} completed. Total: {$order->grand_total}", $order);

        // ── Auto-deduct inventory ingredients ──────────────────────────────────
        // Load menu recipes for all ordered items and deduct stock per serving consumed
        $order->loadMissing(['items.menu.recipes.inventoryItem']);
        foreach ($order->items as $orderItem) {
            if (!$orderItem->menu) continue;
            foreach ($orderItem->menu->recipes as $recipe) {
                $invItem = $recipe->inventoryItem;
                if (!$invItem) continue;

                $qtyUsed = $recipe->quantity_per_serving * $orderItem->quantity;

                // Deduct from stock (never go below zero)
                $invItem->current_stock = max(0, (float)$invItem->current_stock - $qtyUsed);
                $invItem->save();

                // Create audit trail entry
                \App\Models\InventoryUsage::create([
                    'inventory_item_id' => $invItem->id,
                    'quantity_used'     => $qtyUsed,
                    'usage_date'        => now()->toDateString(),
                    'notes'             => "Auto: Order {$order->display_number} — {$orderItem->menu->name} × {$orderItem->quantity}",
                ]);
            }
        }

        // ── Handle Payment Deposit ───────────────────────────────────────────────
        if ($order->bank_account_id && $order->status === 'completed') {
            $bankAccount = \App\Models\BankAccount::find($order->bank_account_id);
            if ($bankAccount && class_exists(\App\Models\BankTransaction::class)) {
                // Determine deposit amount
                $depositAmount = $order->online_amount > 0 ? $order->online_amount : $order->cash_amount;
                if ($depositAmount == 0) $depositAmount = $order->grand_total; // Fallback

                // Check if we already deposited for this exact order to avoid duplicates on update
                $existingTxn = \App\Models\BankTransaction::where('reference', $order->order_number)->first();
                if (!$existingTxn) {
                    $bankAccount->balance += $depositAmount;
                    $bankAccount->save();

                    \App\Models\BankTransaction::create([
                        'tenant_id' => $order->tenant_id,
                        'bank_account_id' => $bankAccount->id,
                        'type' => 'deposit',
                        'amount' => $depositAmount,
                        'date' => now()->toDateString(),
                        'reference' => $order->order_number,
                        'notes' => "POS Order Payment #{$order->order_number} via " . strtoupper($bankAccount->account_type),
                        'status' => 'reconciled'
                    ]);
                }
            }
        }

        // ── Record Accounting Journal Entries for Sales and COGS ──────────────────
        $this->recordAccountingEntries($order);
    }

    protected function recordAccountingEntries(\App\Models\Order $order)
    {
        $tenantId = $order->tenant_id ?? auth()->user()->tenant_id ?? 1;

        // 1. Ensure required accounts exist
        $salesRevenueAccount = \App\Models\Account::firstOrCreate(
            ['tenant_id' => $tenantId, 'code' => '4000'],
            ['name' => 'Sales Revenue', 'type' => 'revenue', 'is_system_account' => true, 'description' => 'Revenue from POS and online orders']
        );

        $cogsAccount = \App\Models\Account::firstOrCreate(
            ['tenant_id' => $tenantId, 'code' => '5000'],
            ['name' => 'Cost of Goods Sold', 'type' => 'expense', 'is_system_account' => true, 'description' => 'Cost of inventory items sold']
        );

        $inventoryAssetAccount = \App\Models\Account::firstOrCreate(
            ['tenant_id' => $tenantId, 'code' => '1004'],
            ['name' => 'Inventory Asset', 'type' => 'asset', 'is_system_account' => true, 'description' => 'Value of inventory on hand']
        );

        // Determine the Asset account to debit for the sale (Bank or Cash)
        $assetAccountId = null;
        if ($order->bank_account_id) {
            $bankAccount = \App\Models\BankAccount::find($order->bank_account_id);
            if ($bankAccount && $bankAccount->gl_account_id) {
                $assetAccountId = $bankAccount->gl_account_id;
            }
        }
        
        if (!$assetAccountId) {
            // Fallback to default Cash account
            $cashAccount = \App\Models\Account::firstOrCreate(
                ['tenant_id' => $tenantId, 'code' => '1001'],
                ['name' => 'Cash', 'type' => 'asset', 'is_system_account' => true, 'description' => 'Cash on hand']
            );
            $assetAccountId = $cashAccount->id;
        }

        // --- Generate Sales Journal Entry ---
        if ($order->grand_total > 0 && class_exists(\App\Models\JournalEntry::class)) {
            // Prevent duplicate entries by checking reference_number
            $existingEntry = \App\Models\JournalEntry::where('reference_number', 'SALE-' . $order->order_number)
                                                     ->where('description', 'like', 'POS Sale%')->first();
            if (!$existingEntry) {
                $salesEntry = \App\Models\JournalEntry::create([
                    'tenant_id' => $tenantId,
                    'reference_number' => 'SALE-' . $order->order_number,
                    'date' => now()->toDateString(),
                    'description' => "POS Sale #{$order->order_number}",
                    'status' => 'posted',
                ]);

                // Debit Asset (Cash/Bank)
                $salesEntry->lines()->create([
                    'account_id' => $assetAccountId,
                    'debit' => $order->grand_total,
                    'credit' => 0,
                    'description' => "Payment received for Order #{$order->order_number}",
                ]);

                // Credit Tax Payable if applicable
                $taxAmount = $order->tax_amount ?? 0;
                $revenueAmount = $order->grand_total - $taxAmount;

                if ($taxAmount > 0) {
                    $taxPayableAccount = \App\Models\Account::firstOrCreate(
                        ['tenant_id' => $tenantId, 'code' => '2001'],
                        ['name' => 'Sales Tax Payable', 'type' => 'liability', 'is_system_account' => true, 'description' => 'Taxes collected to be paid']
                    );
                    $salesEntry->lines()->create([
                        'account_id' => $taxPayableAccount->id,
                        'debit' => 0,
                        'credit' => $taxAmount,
                        'description' => "Tax collected for Order #{$order->order_number}",
                    ]);
                }

                // Credit Sales Revenue
                $salesEntry->lines()->create([
                    'account_id' => $salesRevenueAccount->id,
                    'debit' => 0,
                    'credit' => $revenueAmount,
                    'description' => "Revenue from Order #{$order->order_number}",
                ]);
            }
        }

        // --- Generate COGS Journal Entry ---
        // Calculate total cost of inventory used
        $totalCogs = 0;
        $order->loadMissing(['items.menu.recipes.inventoryItem']);
        foreach ($order->items as $orderItem) {
            if (!$orderItem->menu) continue;
            foreach ($orderItem->menu->recipes as $recipe) {
                $invItem = $recipe->inventoryItem;
                if (!$invItem) continue;

                $qtyUsed = $recipe->quantity_per_serving * $orderItem->quantity;
                $latestPurchase = \App\Models\InventoryPurchase::where('inventory_item_id', $invItem->id)->orderBy('purchase_date', 'desc')->first();
                $unitCost = $latestPurchase ? $latestPurchase->unit_price : 0;
                
                $totalCogs += ($qtyUsed * $unitCost);
            }
        }

        if ($totalCogs > 0 && class_exists(\App\Models\JournalEntry::class)) {
            $existingCogsEntry = \App\Models\JournalEntry::where('reference_number', 'COGS-' . $order->order_number)
                                                         ->where('description', 'like', 'COGS%')->first();
            if (!$existingCogsEntry) {
                $cogsEntry = \App\Models\JournalEntry::create([
                    'tenant_id' => $tenantId,
                    'reference_number' => 'COGS-' . $order->order_number,
                    'date' => now()->toDateString(),
                    'description' => "COGS for Order #{$order->order_number}",
                    'status' => 'posted',
                ]);

                // Debit COGS Expense
                $cogsEntry->lines()->create([
                    'account_id' => $cogsAccount->id,
                    'debit' => $totalCogs,
                    'credit' => 0,
                    'description' => "Cost of goods sold for Order #{$order->order_number}",
                ]);

                // Credit Inventory Asset
                $cogsEntry->lines()->create([
                    'account_id' => $inventoryAssetAccount->id,
                    'debit' => 0,
                    'credit' => $totalCogs,
                    'description' => "Inventory depletion for Order #{$order->order_number}",
                ]);
            }
        }
    }

    public function destroy(\App\Models\Order $order)
    {
        $tableStr = $order->table ? "Table {$order->table->table_number}" : "{$order->order_type}";

        // Revert loyalty points for any redemptions in the order
        if ($order->customer_id) {
            $customer = $order->customer;
            $pointsToRevert = $order->items()->where('is_redeemed', true)->sum('points_cost');

            if ($pointsToRevert > 0) {
                $customer->loyalty_points += $pointsToRevert;
                $customer->save();
                ActivityLog::record('refunded', "Loyalty points restored: {$pointsToRevert} pts (Order for {$tableStr} cancelled)", $customer);
            }
        }

        // Automatic table status update is now handled by Order model's deleting hook
        $order->update(['status' => 'cancelled']);
        ActivityLog::record('deleted', "Order for {$tableStr} was cancelled");
        return redirect()->back()->with('success', 'Order cancelled successfully.');
    }

}
