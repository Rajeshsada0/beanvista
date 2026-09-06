<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;
use App\Models\User;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Table;
use App\Models\Menu;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Reservation;
use App\Models\InventoryItem;
use App\Models\InventoryPurchase;
use App\Models\InventoryUsage;
use App\Models\Supplier;
use App\Models\Expense;
use App\Models\BankAccount;
use App\Models\BankTransaction;
use App\Models\LoyaltyReward;
use App\Models\ActivityLog;
use App\Models\Setting;

use App\Traits\CompressesImages;

class ApiController extends Controller
{
    use CompressesImages;
    /**
     * Authenticate user and issue custom cache-based API token.
     */
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::withoutGlobalScopes()->where('email', strtolower($validated['email']))->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return response()->json(['message' => 'Invalid email or password'], 401);
        }

        // Validate tenant status for non-superadmin users
        if ($user->role !== 'super_admin') {
            $tenant = $user->tenant_id ? \App\Models\Tenant::find($user->tenant_id) : null;
            if (!$tenant) {
                return response()->json(['message' => 'Your cafe account has been deleted. Access denied.'], 401);
            }
            if (!$tenant->is_active) {
                return response()->json(['message' => 'Your cafe account has been disabled. Please contact support.'], 403);
            }
        }

        // Auto-correct primary_branch_id
        if ($user->tenant_id && !$user->primary_branch_id) {
            $firstBranch = \App\Models\Branch::withoutGlobalScopes()->where('tenant_id', $user->tenant_id)->first();
            if ($firstBranch) {
                $user->update(['primary_branch_id' => $firstBranch->id]);
            }
        }

        $token = Str::random(60);
        
        // Cache token mapped to user ID for 30 days
        Cache::put('api_token_' . $token, $user->id, now()->addDays(30));

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'tenant_id' => $user->tenant_id,
                'primary_branch_id' => $user->primary_branch_id,
                'email_verified_at' => $user->email_verified_at ? $user->email_verified_at->toIso8601String() : null,
                'is_verified' => $user->hasVerifiedEmail(),
            ],
            'subscription' => $user->tenant ? $user->tenant->getSubscriptionDetails() : null,
        ]);
    }
    
    /**
     * Send a password reset email via API.
     */
    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $status = \Illuminate\Support\Facades\Password::sendResetLink(
            $request->only('email')
        );

        if ($status == \Illuminate\Support\Facades\Password::RESET_LINK_SENT) {
            return response()->json([
                'message' => trans($status)
            ]);
        }

        return response()->json([
            'message' => trans($status)
        ], 400);
    }

    /**
     * Register a new user and tenant, and return an API token.
     */
    public function register(Request $request)
    {
        $validated = $request->validate([
            'cafe_name' => 'required|string|max:255|unique:tenants,name',
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'phone_code' => 'required|string|max:10',
            'phone' => 'required|string|max:20',
            'password' => 'required|string|min:6',
        ]);

        if (User::isDisposableEmail($validated['email'])) {
            return response()->json([
                'message' => 'Disposable or temporary email addresses are not allowed. Please use a valid email address.'
            ], 422);
        }

        $tenantSlug = Str::slug($validated['cafe_name']);
        
        // Ensure slug is unique
        $originalSlug = $tenantSlug;
        $counter = 1;
        while (\App\Models\Tenant::where('slug', $tenantSlug)->exists()) {
            $tenantSlug = $originalSlug . '-' . $counter;
            $counter++;
        }

        $tenant = \App\Models\Tenant::create([
            'name' => $validated['cafe_name'],
            'slug' => $tenantSlug,
            'trial_ends_at' => now()->addDays(30),
            'is_active' => true,
        ]);

        $phone = $validated['phone_code'] . $validated['phone'];

        $user = User::create([
            'name' => $validated['name'],
            'email' => strtolower($validated['email']),
            'phone' => $phone,
            'password' => Hash::make($validated['password']),
            'role' => 'admin', // the creator is the admin of the tenant
        ]);
        
        $user->tenant_id = $tenant->id;
        $user->save();

        event(new \Illuminate\Auth\Events\Registered($user));

        $token = Str::random(60);
        Cache::put('api_token_' . $token, $user->id, now()->addDays(30));

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'tenant_id' => $user->tenant_id,
                'primary_branch_id' => $user->primary_branch_id,
                'email_verified_at' => $user->email_verified_at ? $user->email_verified_at->toIso8601String() : null,
                'is_verified' => $user->hasVerifiedEmail(),
            ]
        ], 201);
    }

    /**
     * Resend the email verification notification.
     */
    public function resendVerificationEmail(Request $request)
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return response()->json([
                'message' => 'Email is already verified.'
            ]);
        }

        $user->sendEmailVerificationNotification();

        return response()->json([
            'message' => 'Verification link sent.'
        ]);
    }

    /**
     * Get the authenticated user details.
     */
    public function getUser(Request $request)
    {
        $user = $request->user();

        if ($user && $user->role !== 'super_admin') {
            $tenantId = $user->tenant_id;
            $tenant = $tenantId ? \App\Models\Tenant::find($tenantId) : null;
            if (!$tenant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Your cafe account has been deleted.',
                    'code' => 'TENANT_DELETED'
                ], 401);
            }
            if (!$tenant->is_active) {
                return response()->json([
                    'success' => false,
                    'message' => 'Your cafe account has been disabled.',
                    'code' => 'TENANT_DISABLED'
                ], 403);
            }
        }

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'tenant_id' => $user->tenant_id,
                'primary_branch_id' => $user->primary_branch_id,
                'email_verified_at' => $user->email_verified_at ? $user->email_verified_at->toIso8601String() : null,
                'is_verified' => $user->hasVerifiedEmail(),
            ],
            'subscription' => $user->tenant ? $user->tenant->getSubscriptionDetails() : null,
        ]);
    }

    /**
     * Get global settings for guest / unauthenticated users.
     */
    public function getPublicSettings()
    {
        $settings = [
            'app_name' => Setting::withoutGlobalScopes()->whereNull('tenant_id')->where('key', 'app_name')->value('value') ?? 'iCafe',
            'app_version' => Setting::withoutGlobalScopes()->whereNull('tenant_id')->where('key', 'app_version')->value('value') ?? 'v1.0',
            'site_favicon' => Setting::withoutGlobalScopes()->whereNull('tenant_id')->where('key', 'site_favicon')->value('value'),
            'enable_biometric' => Setting::withoutGlobalScopes()->whereNull('tenant_id')->where('key', 'enable_biometric')->value('value') ?? 'true',
            'enable_contact_call' => Setting::withoutGlobalScopes()->whereNull('tenant_id')->where('key', 'enable_contact_call')->value('value') ?? 'true',
            'contact_call_number' => Setting::withoutGlobalScopes()->whereNull('tenant_id')->where('key', 'contact_call_number')->value('value') ?? '',
            'enable_contact_email' => Setting::withoutGlobalScopes()->whereNull('tenant_id')->where('key', 'enable_contact_email')->value('value') ?? 'true',
            'contact_email_address' => Setting::withoutGlobalScopes()->whereNull('tenant_id')->where('key', 'contact_email_address')->value('value') ?? '',
            'enable_contact_whatsapp' => Setting::withoutGlobalScopes()->whereNull('tenant_id')->where('key', 'enable_contact_whatsapp')->value('value') ?? 'true',
            'contact_whatsapp_number' => Setting::withoutGlobalScopes()->whereNull('tenant_id')->where('key', 'contact_whatsapp_number')->value('value') ?? '',
        ];

        if (!empty($settings['site_favicon'])) {
            $settings['site_favicon_url'] = url('storage/' . $settings['site_favicon']);
        } else {
            $settings['site_favicon_url'] = null;
        }

        return response()->json([
            'success' => true,
            'data' => $settings,
        ]);
    }

    /**
     * Invalidate cached API token.
     */
    public function logout(Request $request)
    {
        $token = $request->bearerToken();
        
        if ($token) {
            Cache::forget('api_token_' . $token);
        }

        return response()->json(['message' => 'Logged out successfully']);
    }

    /**
     * Fetch dashboard statistics.
     */
    public function dashboard(Request $request)
    {
        $startDate = $request->input('start_date') ? Carbon::parse($request->input('start_date'))->startOfDay() : Carbon::today()->subDays(6)->startOfDay();
        $endDate = $request->input('end_date') ? Carbon::parse($request->input('end_date'))->endOfDay() : Carbon::today()->endOfDay();

        $today = Carbon::today();
        $yesterday = Carbon::yesterday();
        $startOfMonth = Carbon::now()->startOfMonth();

        // Metrics
        $totalItems = Menu::where('status', true)->count();
        $totalTables = Table::count();
        $activeTables = Table::where('status', 'occupied')->count();
        $totalCustomers = Customer::count();
        
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

        $todayOrders = Order::whereDate('created_at', $today)->count();

        $completedOrders = Order::where('status', 'completed')
            ->whereBetween('updated_at', [$startDate, $endDate])
            ->count();

        // Weekly Sales Trend
        $orders = Order::where('status', 'completed')
            ->whereBetween('updated_at', [$startDate, $endDate])
            ->get(['updated_at', 'grand_total']);

        $rawWeeklySales = $orders->groupBy(function($order) {
            return Carbon::parse($order->updated_at)->toDateString();
        })->map(function($dayOrders) {
            return (object)[
                'total' => $dayOrders->sum('grand_total')
            ];
        });

        $weeklySales = [];
        $diffInDays = $startDate->diffInDays($endDate);
        
        for ($i = 0; $i <= $diffInDays; $i++) {
            $dateObj = (clone $startDate)->addDays($i);
            $dateString = $dateObj->toDateString();
            
            $weeklySales[] = [
                'day' => $dateObj->format('D'),
                'total' => (float)($rawWeeklySales[$dateString]->total ?? 0),
                'date' => $dateObj->format('M d'),
            ];
        }

        $todayCash = Order::where('status', 'completed')
            ->whereDate('updated_at', $today)
            ->sum('cash_amount');

        $todayOnline = Order::where('status', 'completed')
            ->whereDate('updated_at', $today)
            ->sum('online_amount');

        // Top Selling Products
        $topSellingItems = OrderItem::whereHas('order', function ($query) {
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
        $lowStockItems = InventoryItem::with('measuringUnit')
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

        // Recent Activity
        $recentLogs = ActivityLog::with('user')
            ->latest()
            ->take(8)
            ->get();

        $recentActivity = $recentLogs->map(function($log) {
            return [
                'action' => $log->action,
                'desc' => $log->description,
                'time' => Carbon::parse($log->created_at)->diffForHumans(),
                'user' => $log->user ? $log->user->name : (auth()->user()?->name ?? 'System'),
                'icon_type' => $log->icon_type,
            ];
        });

        // Dynamic Notifications for Dashboard
        $notifications = [];



        // 2. Unpaid Bills (Pending/Preparing/Served Orders)
        $unpaidOrders = Order::with('table')
            ->whereNotIn('status', ['completed', 'cancelled'])
            ->latest()
            ->take(5)
            ->get();

        foreach ($unpaidOrders as $order) {
            $isLarge = $order->grand_total >= 4000;
            $tableNum = $order->table ? $order->table->table_number : 'N/A';
            $notifications[] = [
                'id' => 'order_' . $order->id,
                'title' => $isLarge ? 'Large Bill Unpaid' : 'Unpaid Bill Alert',
                'body' => "Table {$tableNum} generated an unpaid bill of Rs. " . number_format($order->grand_total) . ".",
                'time' => Carbon::parse($order->created_at)->diffForHumans(),
                'type' => 'payment',
                'isRead' => false,
                'route' => 'Orders',
            ];
        }

        // 3. Active Reservations for Today/Future
        $recentReservations = Reservation::with('table')
            ->where('status', 'active')
            ->where('booking_time', '>=', Carbon::today())
            ->latest()
            ->take(5)
            ->get();

        foreach ($recentReservations as $res) {
            $tableNum = $res->table ? $res->table->table_number : 'N/A';
            $bookingTimeStr = Carbon::parse($res->booking_time)->format('g:i A');
            $notifications[] = [
                'id' => 'res_' . $res->id,
                'title' => 'New Reservation Alert',
                'body' => "Table {$tableNum} has been reserved for {$bookingTimeStr} today by {$res->customer_name}.",
                'time' => Carbon::parse($res->created_at)->diffForHumans(),
                'type' => 'reservation',
                'isRead' => false,
                'route' => 'Tables',
            ];
        }

        return response()->json([
            'stats' => [
                'total_items' => $totalItems,
                'total_tables' => $totalTables,
                'active_tables' => $activeTables,
                'today_sales' => (float)$todaySales,
                'today_cash' => (float)$todayCash,
                'today_online' => (float)$todayOnline,
                'yesterday_sales' => (float)$yesterdaySales,
                'monthly_sales' => (float)$monthlySales,
                'total_sales' => (float)$totalSales,
                'total_customers' => $totalCustomers,
                'today_orders' => (int)$todayOrders,
                'completed_orders' => (int)$completedOrders,
            ],
            'weekly_sales' => $weeklySales,
            'top_selling' => $topSelling,
            'low_stock' => $lowStock,
            'recent_activity' => $recentActivity,
            'notifications' => $notifications,
        ]);
    }

    /**
     * Get tables list.
     */
    public function tables()
    {
        $tables = Table::with(['activeOrders.items'])->get();
        
        $tablesData = $tables->map(function($t) {
            $activeOrder = $t->activeOrders->first();
            return [
                'id' => $t->id,
                'number' => $t->table_number,
                'capacity' => $t->capacity,
                'status' => $t->status,
                'order' => $activeOrder ? [
                    'id' => $activeOrder->id,
                    'number' => $activeOrder->order_number,
                    'items' => $activeOrder->items->sum('quantity'),
                    'total' => (float)$activeOrder->grand_total,
                    'waiter' => $activeOrder->waiter ? $activeOrder->waiter->name : 'N/A',
                ] : null,
            ];
        });

        return response()->json($tablesData);
    }

    public function createTable(Request $request)
    {
        try {
            $tenant = auth()->user()->tenant;
            if ($tenant->hasLimitReached('max_tables')) {
                return response()->json([
                    'success' => false,
                    'message' => 'You have reached the maximum number of tables allowed by your subscription plan.'
                ], 403);
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

            $table = \App\Models\Table::create([
                'table_number' => $validated['table_number'],
                'capacity' => $validated['capacity'],
                'status' => $validated['status'],
                'branch_id' => $branchId,
                'tenant_id' => auth()->user()->tenant_id,
            ]);

            ActivityLog::record('created', "Table {$table->table_number} added ({$table->capacity} seats)", $table);

            return response()->json([
                'success' => true,
                'message' => 'Table created successfully.',
                'data' => [
                    'id' => $table->id,
                    'number' => $table->table_number,
                    'capacity' => $table->capacity,
                    'status' => $table->status,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create table: ' . $e->getMessage()
            ], 500);
        }
    }

    public function updateTable(Request $request, $id)
    {
        try {
            $table = \App\Models\Table::findOrFail($id);

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

            $table->update([
                'table_number' => $validated['table_number'],
                'capacity' => $validated['capacity'],
                'status' => $validated['status'],
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Table updated successfully.',
                'data' => [
                    'id' => $table->id,
                    'number' => $table->table_number,
                    'capacity' => $table->capacity,
                    'status' => $table->status,
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update table: ' . $e->getMessage()
            ], 500);
        }
    }

    public function deleteTable($id)
    {
        try {
            $table = \App\Models\Table::findOrFail($id);
            $table->delete();

            return response()->json([
                'success' => true,
                'message' => 'Table deleted successfully.'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete table: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get categories and menu items.
     */
    public function menus(Request $request)
    {
        $categories = Category::where('status', true)->get(['id', 'name']);
        
        $includeInactive = filter_var($request->query('include_inactive', false), FILTER_VALIDATE_BOOLEAN);
        $menus = Menu::query()
            ->when(!$includeInactive, fn($q) => $q->where('status', true))
            ->with('recipes.inventoryItem')
            ->get();

        return response()->json([
            'categories' => $categories->map(fn($c) => ['id' => $c->id, 'name' => $c->name]),
            'menus' => $menus->map(function($m) {
                // Calculate out of stock based on recipes and ingredients stock
                $outOfStock = false;
                if ($m->recipes && $m->recipes->isNotEmpty()) {
                    foreach ($m->recipes as $recipe) {
                        if ($recipe->inventoryItem) {
                            $currentStock = (float)$recipe->inventoryItem->current_stock;
                            $needed = (float)$recipe->quantity_per_serving;
                            if ($currentStock < $needed) {
                                $outOfStock = true;
                                break;
                            }
                        }
                    }
                }

                return [
                    'id' => $m->id,
                    'name' => $m->name,
                    'category' => $m->category,
                    'category_id' => $m->category_id,
                    'price' => (float)$m->price,
                    'cost_price' => (float)$m->cost_price,
                    'image_url' => $m->image_url,
                    'icon_url' => $m->icon_url,
                    'out_of_stock' => $outOfStock,
                    'status' => $m->status,
                    'send_to_kitchen' => $m->send_to_kitchen,
                ];
            }),
        ]);
    }

    /**
     * List orders.
     */
    public function orders(Request $request)
    {
        $status = $request->input('status', 'all');
        $query = Order::with(['table', 'items.menu', 'items.addons', 'customer', 'waiter']);

        if ($status === 'active') {
            $query->where(function($q) {
                $q->whereNotIn('status', ['completed', 'cancelled'])
                  ->orWhere(function($sub) {
                      $sub->where('status', 'completed')
                          ->where('created_at', '>=', now()->subHours(24))
                          ->whereHas('items', function($ki) {
                              $ki->where(function($k) {
                                  $k->whereNull('kds_status')
                                    ->orWhereNotIn('kds_status', ['delivered', 'cancelled']);
                              });
                          });
                  });
            });
        } elseif ($status === 'completed') {
            $query->where('status', 'completed');
        } elseif ($status === 'cancelled') {
            $query->where('status', 'cancelled');
        }

        $orders = $query->latest()->take(100)->get();

        return response()->json([
            'success' => true,
            'data' => $orders->map(function($o) {
                return [
                    'id' => $o->id,
                    'number' => $o->order_number,
                    'type' => $o->order_type,
                    'typeIcon' => $o->order_type === 'Dine-In' ? '🍽️' : ($o->order_type === 'Takeaway' ? '🥡' : '🚚'),
                    'table' => $o->table ? $o->table->table_number : 'Takeaway',
                    'customer' => $o->customer ? $o->customer->name : null,
                    'waiter' => $o->waiter ? $o->waiter->name : null,
                    'status' => $o->status,
                    'total' => (float)$o->grand_total,
                    'time' => Carbon::parse($o->created_at)->diffForHumans(),
                    'created_at' => $o->created_at->toIso8601String(),
                    'items_count' => $o->items->sum('quantity'),
                    'items' => $o->items->map(function($item) {
                        return [
                            'id' => $item->id,
                            'kds_status' => $item->kds_status ?? 'pending',
                            'quantity' => $item->quantity,
                            'created_at' => $item->created_at ? $item->created_at->toIso8601String() : null,
                            'menu' => [
                                'name' => $item->menu ? $item->menu->name : 'Unknown Item',
                                'image_url' => $item->menu ? $item->menu->image_url : null,
                            ],
                            'addons' => $item->addons->map(function($addon) {
                                return $addon->pivot->addon_name ?? $addon->name;
                            }),
                        ];
                    }),
                    'items_list' => $o->items->map(function($item) {
                        return [
                            'menu_id' => $item->menu_id,
                            'name' => $item->menu ? $item->menu->name : 'Unknown Item',
                            'qty' => $item->quantity,
                            'price' => (float)$item->price,
                            'kds_status' => $item->kds_status ?? 'pending',
                        ];
                    }),
                ];
            })
        ]);
    }

    /**
     * Store new order from POS checkout.
     */
    public function createOrder(Request $request)
    {
        try {
            \Log::info('createOrder request payload: ' . json_encode($request->all()));

            $tenant = auth()->user()?->tenant;
            if ($tenant && $tenant->hasLimitReached('max_orders_per_month')) {
                $limit = $tenant->getPlanLimit('max_orders_per_month');
                return response()->json([
                    'success' => false,
                    'code' => 'ORDER_LIMIT_REACHED',
                    'message' => "Monthly order taking limit of {$limit} orders reached for your current plan or free trial. Please upgrade your subscription plan to continue taking orders.",
                    'subscription' => $tenant->getSubscriptionDetails(),
                ], 422);
            }
            $validated = $request->validate([
                'order_id' => 'nullable|integer|exists:orders,id',
                'table_id' => 'nullable|exists:tables,id',
                'items' => 'required|array|min:1',
                'items.*.menu_id' => 'required|exists:menus,id',
                'items.*.quantity' => 'required|integer|min:1',
                'items.*.kds_status' => 'nullable|string',
                'order_type' => 'nullable|string',
                'customer_id' => 'nullable',
                'payment_method' => 'sometimes|string|nullable',
                'cash_amount' => 'sometimes|numeric',
                'online_amount' => 'sometimes|numeric',
                'status' => 'sometimes|string',
                'bank_account_id' => 'nullable|integer|exists:bank_accounts,id',
            ]);

            if (isset($validated['status']) && $validated['status'] === 'completed' && auth()->user()->role === 'waiter') {
                return response()->json([
                    'success' => false,
                    'message' => 'Waiters are not authorized to complete payments. Please ask a cashier or administrator.'
                ], 403);
            }

            $customerId = null;
            if (!empty($validated['customer_id'])) {
                if (\App\Models\Customer::where('id', $validated['customer_id'])->exists()) {
                    $customerId = $validated['customer_id'];
                }
            }

            $isEdit = !empty($validated['order_id']);
            
            // Dynamic Table Occupied Guard: Check if the table is already occupied by another active order
            if (!$isEdit && !empty($validated['table_id']) && ($validated['order_type'] ?? 'Dine-In') === 'Dine-In') {
                $activeTableOrder = Order::where('table_id', $validated['table_id'])
                    ->whereIn('status', ['pending', 'preparing', 'served'])
                    ->first();
                if ($activeTableOrder) {
                    // Instead of creating a duplicate order, automatically switch to modifying the existing active order
                    $isEdit = true;
                    $validated['order_id'] = $activeTableOrder->id;
                }
            }

            if ($isEdit) {
                $order = Order::findOrFail($validated['order_id']);

                if ($order->status === 'completed') {
                    $tenantId = auth()->user()?->tenant_id ?? $order->tenant_id;
                    $allowEdit = Setting::where('tenant_id', $tenantId)
                        ->where('key', 'enable_completed_order_edit')
                        ->value('value');
                    $canEditCompleted = in_array($allowEdit, ['true', '1', true, 1], true);

                    if (!$canEditCompleted) {
                        return response()->json([
                            'success' => false,
                            'message' => 'Completed orders cannot be modified. You can enable this in Settings.'
                        ], 422);
                    }
                }
                $order->update([
                    'table_id' => $validated['table_id'] ?? $order->table_id,
                    'customer_id' => $customerId ?? $order->customer_id,
                    'order_type' => $validated['order_type'] ?? $order->order_type,
                    'status' => $validated['status'] ?? $order->status,
                    'cash_amount' => $validated['cash_amount'] ?? $order->cash_amount,
                    'online_amount' => $validated['online_amount'] ?? $order->online_amount,
                    'payment_method' => $validated['payment_method'] ?? $order->payment_method,
                    'bank_account_id' => $validated['bank_account_id'] ?? $order->bank_account_id,
                ]);
            } else {
                $order = Order::create([
                    'table_id' => $validated['table_id'] ?? null,
                    'customer_id' => $customerId,
                    'waiter_id' => Auth::id(),
                    'order_type' => $validated['order_type'] ?? 'Dine-In',
                    'status' => $validated['status'] ?? 'pending',
                    'total_amount' => 0,
                    'grand_total' => 0,
                    'cash_amount' => $validated['cash_amount'] ?? 0,
                    'online_amount' => $validated['online_amount'] ?? 0,
                    'payment_method' => $validated['payment_method'] ?? 'cash',
                    'bank_account_id' => $validated['bank_account_id'] ?? null,
                ]);
            }

            $total = 0;
            $keepItemIds = [];
            $existingItems = $isEdit ? $order->items : collect();

            foreach($validated['items'] as $item) {
                $menu = Menu::findOrFail($item['menu_id']);
                $reqQty = (int)$item['quantity'];
                
                // Track total amount
                $itemTotal = $menu->price * $reqQty;
                $total += $itemTotal;

                if ($isEdit) {
                    // Find existing database records for this menu_id in this order
                    $dbItems = $existingItems->where('menu_id', $menu->id)->values();
                    $dbQtySum = $dbItems->sum('quantity');

                    if ($dbQtySum == 0) {
                        // Brand new item in the order
                        $newItem = $order->items()->create([
                            'menu_id' => $menu->id,
                            'quantity' => $reqQty,
                            'price' => $menu->price,
                            'kds_status' => $menu->send_to_kitchen ? ($item['kds_status'] ?? 'pending') : 'delivered',
                        ]);
                        $keepItemIds[] = $newItem->id;
                    } else if ($reqQty == $dbQtySum) {
                        // Quantity is the same, preserve status of all items
                        foreach ($dbItems as $dbItem) {
                            $dbItem->update([
                                'price' => $menu->price,
                                'kds_status' => $dbItem->kds_status ?? ($menu->send_to_kitchen ? ($item['kds_status'] ?? 'pending') : 'delivered'),
                            ]);
                            $keepItemIds[] = $dbItem->id;
                        }
                    } else if ($reqQty < $dbQtySum) {
                        // Quantity reduced: reduce from pending/preparing items first
                        $remainingToKeep = $reqQty;
                        
                        // Sort so that delivered items are kept first, then ready, preparing, pending
                        $sortedDbItems = $dbItems->sortByDesc(function($dbIt) {
                            if ($dbIt->kds_status === 'delivered') return 4;
                            if ($dbIt->kds_status === 'ready') return 3;
                            if ($dbIt->kds_status === 'preparing') return 2;
                            return 1; // pending
                        });
                        
                        foreach ($sortedDbItems as $dbItem) {
                            if ($remainingToKeep <= 0) {
                                continue;
                            }
                            if ($dbItem->quantity <= $remainingToKeep) {
                                $remainingToKeep -= $dbItem->quantity;
                                $keepItemIds[] = $dbItem->id;
                            } else {
                                $dbItem->update([
                                    'quantity' => $remainingToKeep,
                                    'price' => $menu->price,
                                ]);
                                $remainingToKeep = 0;
                                $keepItemIds[] = $dbItem->id;
                            }
                        }
                    } else {
                        // Quantity increased: preserve existing items and add new pending row for additional qty
                        foreach ($dbItems as $dbItem) {
                            $dbItem->update([
                                'price' => $menu->price,
                                'kds_status' => $dbItem->kds_status ?? ($menu->send_to_kitchen ? 'pending' : 'delivered'),
                            ]);
                            $keepItemIds[] = $dbItem->id;
                        }
                        
                        $extraQty = $reqQty - $dbQtySum;
                        $newItem = $order->items()->create([
                            'menu_id' => $menu->id,
                            'quantity' => $extraQty,
                            'price' => $menu->price,
                            'kds_status' => $menu->send_to_kitchen ? 'pending' : 'delivered',
                        ]);
                        $keepItemIds[] = $newItem->id;
                    }
                } else {
                    $newItem = $order->items()->create([
                        'menu_id' => $menu->id,
                        'quantity' => $reqQty,
                        'price' => $menu->price,
                        'kds_status' => $menu->send_to_kitchen ? ($item['kds_status'] ?? 'pending') : 'delivered',
                    ]);
                }
            }

            if ($isEdit) {
                // Delete old items that were removed in the POS cart
                $order->items()->whereNotIn('id', $keepItemIds)->delete();
            }

            $order->total_amount = $total;
            $order->grand_total = $total;
            $order->save();

            // Handle Customer Updates (Due Amount, Total Spent, and Loyalty Points)
            if ($order->customer_id) {
                $customer = \App\Models\Customer::find($order->customer_id);
                if ($customer) {
                    // 1. If payment method is Credit, add grand_total to due_amount and register a CreditTransaction
                    if (strtolower($order->payment_method ?? '') === 'credit') {
                        $customer->increment('due_amount', $order->grand_total);
                        
                        // Create a CreditTransaction record
                        \App\Models\CreditTransaction::create([
                            'tenant_id' => $customer->tenant_id,
                            'branch_id' => $customer->branch_id,
                            'customer_id' => $customer->id,
                            'order_id' => $order->id,
                            'type' => 'charge',
                            'amount' => $order->grand_total,
                            'note' => "Credit purchase for Order {$order->display_number}",
                        ]);
                    }
                    
                    // 2. Award loyalty points & total spent on completed checkout
                    if ($order->status === 'completed') {
                        $customer->increment('total_spent', $order->grand_total);

                        $pointsPerCurrency = \App\Models\Setting::where('tenant_id', auth()->user()->tenant_id)->where('key', 'points_per_currency')->value('value') ?? 0;
                        if ($pointsPerCurrency > 0) {
                            $earned = floor($order->grand_total * $pointsPerCurrency);
                            if ($earned > 0) {
                                $customer->increment('loyalty_points', $earned);
                                $customer->increment('lifetime_points', $earned);
                                
                                // Record the loyalty points transaction history
                                \App\Models\ActivityLog::record(
                                    'earned',
                                    "Earned {$earned} loyalty points for Order {$order->display_number}",
                                    $customer,
                                    ['points' => $earned]
                                );
                            }
                        }
                    }
                }
            }

            if ($order->table_id) {
                Table::syncStatus($order->table_id);
            }

            // Sync Banking & Accounting entries for completed orders
            if ($order->status === 'completed') {
                self::syncCompletedOrderBanking($order);
                if (method_exists($this, 'recordAccountingEntries')) {
                    $this->recordAccountingEntries($order);
                }
            }

            ActivityLog::record(
                $isEdit ? 'updated' : 'created',
                "Order {$order->display_number} " . ($isEdit ? 'updated' : 'placed') . " ({$order->order_type})",
                $order
            );

            return response()->json([
                'success' => true,
                'order_id' => $order->id,
                'order_number' => $order->order_number,
            ]);
        } catch (\Exception $e) {
            \Log::error("createOrder failed: " . $e->getMessage() . "\n" . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'error' => true,
                'message' => 'Failed to save order: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update KDS item preparation state.
     */
    public function updateItemStatus(Request $request, $id)
    {
        $validated = $request->validate([
            'status' => 'required|in:pending,preparing,ready,delivered'
        ]);

        $item = OrderItem::findOrFail($id);
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

        // Update main order status
        $order = $item->order;
        if ($order) {
            $nonDelivered = $order->items()->whereNotIn('kds_status', ['delivered'])->count();
            if ($nonDelivered === 0 && $order->status !== 'completed') {
                $order->update(['status' => 'served']);
            }
            if ($order->table_id) {
                Table::syncStatus($order->table_id);
            }
        }

        return response()->json(['success' => true]);
    }

    /**
     * Update KDS bulk items status.
     */
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
            return response()->json(['success' => false, 'message' => 'No items selected.'], 400);
        }

        $items = OrderItem::whereIn('id', $itemIds)->with('order')->get();

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
        }

        // Auto-update order statuses based on item statuses
        $orders = Order::whereIn('id', $items->pluck('order_id')->unique())->get();
        foreach ($orders as $order) {
            $nonDelivered = $order->items()->whereNotIn('kds_status', ['delivered'])->count();
            $readyCount   = $order->items()->where('kds_status', 'ready')->count();
            $preparingCount = $order->items()->where('kds_status', 'preparing')->count();

            if ($nonDelivered === 0) {
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

            if ($order->table_id) {
                Table::syncStatus($order->table_id);
            }
        }

        return response()->json(['success' => true]);
    }

    /**
     * Get customers list.
     */
    public function customers()
    {
        $customers = Customer::withCount('orders')->get(['id', 'name', 'phone', 'email', 'loyalty_points', 'due_amount', 'total_spent']);
        return response()->json($customers->map(fn($c) => [
            'id' => $c->id,
            'name' => $c->name,
            'phone' => $c->phone,
            'email' => $c->email,
            'points' => (int)$c->loyalty_points,
            'due' => (float)$c->due_amount,
            'orders' => $c->orders_count,
            'spent' => (float)$c->total_spent,
        ]));
    }

    /**
     * Create customer.
     */
    public function createCustomer(Request $request)
    {
        $branchId = Auth::user()->primary_branch_id;
        $validated = $request->validate([
            'name'  => 'required|string|max:255',
            'phone' => [
                'required',
                'digits:10',
                \Illuminate\Validation\Rule::unique('customers')->where(function ($query) use ($branchId) {
                    return $query->where('tenant_id', Auth::user()->tenant_id)
                                 ->where('branch_id', $branchId);
                })
            ],
            'email' => 'nullable|email|max:255',
        ]);

        $customer = Customer::create([
            'branch_id' => $branchId,
            'tenant_id' => Auth::user()->tenant_id,
            'name' => $validated['name'],
            'phone' => $validated['phone'],
            'email' => $validated['email'] ?? null,
            'loyalty_points' => 0,
            'total_spent' => 0,
            'due_amount' => 0,
        ]);

        ActivityLog::record('created', "Customer '{$customer->name}' created", $customer);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $customer->id,
                'name' => $customer->name,
                'phone' => $customer->phone,
                'email' => $customer->email,
                'points' => 0,
                'orders' => 0,
                'spent' => 0,
                'due' => 0,
            ]
        ]);
    }

    /**
     * Update customer.
     */
    public function updateCustomer(Request $request, $id)
    {
        $customer = Customer::findOrFail($id);
        $branchId = Auth::user()->primary_branch_id;
        $validated = $request->validate([
            'name'  => 'required|string|max:255',
            'phone' => [
                'required',
                'digits:10',
                \Illuminate\Validation\Rule::unique('customers')->ignore($customer->id)->where(function ($query) use ($branchId) {
                    return $query->where('tenant_id', Auth::user()->tenant_id)
                                 ->where('branch_id', $branchId);
                })
            ],
            'email' => 'nullable|email|max:255',
        ]);

        $customer->update($validated);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $customer->id,
                'name' => $customer->name,
                'phone' => $customer->phone,
                'email' => $customer->email,
                'points' => (int)$customer->loyalty_points,
                'due' => (float)$customer->due_amount,
            ]
        ]);
    }

    /**
     * Serve uploaded media files with CORS headers.
     */
    public function serveMedia(Request $request)
    {
        $path = $request->query('path');
        if (!$path) {
            abort(400, 'Path is required');
        }

        // Clean path to prevent directory traversal
        $path = str_replace(['..', '\\'], ['', '/'], $path);
        
        if (!\Illuminate\Support\Facades\Storage::disk('public')->exists($path)) {
            abort(404, 'File not found');
        }

        $file = \Illuminate\Support\Facades\Storage::disk('public')->get($path);
        $type = \Illuminate\Support\Facades\Storage::disk('public')->mimeType($path);

        return response($file, 200)
            ->header('Content-Type', $type)
            ->header('Access-Control-Allow-Origin', '*');
    }

    /**
     * Create a new menu item.
     */
    public function createMenu(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'cost_price' => 'required|numeric|min:0',
            'send_to_kitchen' => 'boolean|sometimes',
            'image' => 'nullable',
        ]);

        $tenantId = Auth::user()->tenant_id;
        $branchId = Auth::user()->primary_branch_id;

        $category = Category::firstOrCreate(
            ['name' => $validated['category'], 'tenant_id' => $tenantId],
            ['status' => true]
        );

        $imagePath = null;
        if ($request->hasFile('image')) {
            $imagePath = $this->compressAndSaveImage($request->file('image'), "tenants/{$tenantId}/menus/images");
        } elseif ($request->has('image') && is_string($request->input('image'))) {
            $val = trim($request->input('image'));
            $imagePath = $val !== '' ? $val : null;
        }

        $menu = Menu::create([
            'tenant_id' => $tenantId,
            'branch_id' => $branchId,
            'name' => $validated['name'],
            'category' => $validated['category'],
            'category_id' => $category->id,
            'price' => $validated['price'],
            'cost_price' => $validated['cost_price'],
            'image_path' => $imagePath,
            'status' => true,
            'send_to_kitchen' => $request->has('send_to_kitchen') ? $request->boolean('send_to_kitchen') : true,
        ]);

        ActivityLog::record('created', "Menu item '{$menu->name}' created", $menu);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $menu->id,
                'name' => $menu->name,
                'category' => $menu->category,
                'category_id' => $menu->category_id,
                'price' => (float)$menu->price,
                'cost_price' => (float)$menu->cost_price,
                'image_url' => $menu->image_url,
                'status' => $menu->status,
                'send_to_kitchen' => $menu->send_to_kitchen,
            ]
        ]);
    }

    /**
     * Update an existing menu item.
     */
    public function updateMenu(Request $request, $id)
    {
        $menu = Menu::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'cost_price' => 'required|numeric|min:0',
            'status' => 'boolean',
            'send_to_kitchen' => 'boolean',
            'image' => 'nullable',
        ]);

        $tenantId = Auth::user()->tenant_id;
        
        $category = Category::firstOrCreate(
            ['name' => $validated['category'], 'tenant_id' => $tenantId],
            ['status' => true]
        );

        $imagePath = $menu->image_path;
        if ($request->hasFile('image')) {
            $imagePath = $this->compressAndSaveImage($request->file('image'), "tenants/{$tenantId}/menus/images");
        } elseif ($request->has('image') && is_string($request->input('image'))) {
            $val = trim($request->input('image'));
            $imagePath = $val !== '' ? $val : null;
        }

        $menu->update([
            'name' => $validated['name'],
            'category' => $validated['category'],
            'category_id' => $category->id,
            'price' => $validated['price'],
            'cost_price' => $validated['cost_price'],
            'image_path' => $imagePath,
            'status' => $request->has('status') ? $request->boolean('status') : $menu->status,
            'send_to_kitchen' => $request->has('send_to_kitchen') ? $request->boolean('send_to_kitchen') : $menu->send_to_kitchen,
        ]);

        ActivityLog::record('updated', "Menu item '{$menu->name}' updated", $menu);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $menu->id,
                'name' => $menu->name,
                'category' => $menu->category,
                'category_id' => $menu->category_id,
                'price' => (float)$menu->price,
                'cost_price' => (float)$menu->cost_price,
                'image_url' => $menu->image_url,
                'status' => $menu->status,
                'send_to_kitchen' => $menu->send_to_kitchen,
            ]
        ]);
    }

    /**
     * Delete a menu item.
     */
    public function deleteMenu($id)
    {
        $menu = Menu::findOrFail($id);
        $menu->delete();

        return response()->json([
            'success' => true
        ]);
    }

    /**
     * Get all categories.
     */
    public function categories()
    {
        $categories = Category::where('status', true)->get(['id', 'name']);
        return response()->json([
            'data' => $categories->map(fn($c) => ['id' => $c->id, 'name' => $c->name])
        ]);
    }

    /**
     * Create a new category.
     */
    public function createCategory(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $tenantId = Auth::user()->tenant_id;

        $category = Category::create([
            'tenant_id' => $tenantId,
            'name' => $validated['name'],
            'status' => true,
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $category->id,
                'name' => $category->name,
            ]
        ]);
    }

    /**
     * Update an existing category.
     */
    public function updateCategory(Request $request, $id)
    {
        $category = Category::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $category->update([
            'name' => $validated['name'],
        ]);

        // Also update all menus associated with this category to reflect name changes
        Menu::withoutGlobalScopes()
            ->where('category_id', $category->id)
            ->update(['category' => $validated['name']]);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $category->id,
                'name' => $category->name,
            ]
        ]);
    }

    /**
     * Delete a category.
     */
    public function deleteCategory($id)
    {
        $category = Category::findOrFail($id);
        $category->delete();

        return response()->json([
            'success' => true
        ]);
    }

    /**
     * Fetch bank accounts list.
     */
    public function bankAccounts()
    {
        $tenantId = Auth::user()->tenant_id;
        $accounts = BankAccount::where('tenant_id', $tenantId)->get();
        return response()->json([
            'success' => true,
            'data' => $accounts->map(function($acc) {
                return [
                    'id' => $acc->id,
                    'account_name' => $acc->account_name,
                    'account_number' => $acc->account_number,
                    'bank_name' => $acc->bank_name,
                    'account_type' => $acc->account_type,
                    'balance' => (float)$acc->balance,
                    'qr_code' => $acc->qr_code,
                    'qr_code_url' => $acc->qr_code_url,
                ];
            })
        ]);
    }

    /**
     * Get single order details.
     */
    public function showOrder($id)
    {
        $order = Order::with(['table', 'items.menu', 'customer'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $order->id,
                'number' => $order->order_number,
                'type' => $order->order_type,
                'typeIcon' => $order->order_type === 'Dine-In' ? '🍽️' : ($order->order_type === 'Takeaway' ? '🥡' : '🚚'),
                'table' => $order->table ? $order->table->table_number : 'Takeaway',
                'customer' => $order->customer ? $order->customer->name : null,
                'status' => $order->status,
                'total' => (float)$order->grand_total,
                'time' => Carbon::parse($order->created_at)->diffForHumans(),
                'created_at' => $order->created_at->toIso8601String(),
                'items_count' => $order->items->sum('quantity'),
                'items' => $order->items->map(function($item) {
                    return [
                        'id' => $item->id,
                        'kds_status' => $item->kds_status ?? 'pending',
                        'quantity' => $item->quantity,
                        'created_at' => $item->created_at ? $item->created_at->toIso8601String() : null,
                        'menu' => [
                            'name' => $item->menu ? $item->menu->name : 'Unknown Item',
                        ]
                    ];
                }),
                'items_list' => $order->items->map(function($item) {
                    return [
                        'menu_id' => $item->menu_id,
                        'name' => $item->menu ? $item->menu->name : 'Unknown Item',
                        'qty' => $item->quantity,
                        'price' => (float)$item->price,
                        'kds_status' => $item->kds_status ?? 'pending',
                    ];
                }),
            ]
        ]);
    }

    /**
     * Update an order (e.g. complete / pay).
     */
    public function updateOrder(Request $request, $id)
    {
        try {
            $order = Order::findOrFail($id);

            $validated = $request->validate([
                'status' => 'sometimes|string',
                'payment_method' => 'sometimes|string|nullable',
                'bank_account_id' => 'sometimes|nullable|exists:bank_accounts,id',
                'cash_amount' => 'sometimes|numeric',
                'online_amount' => 'sometimes|numeric',
            ]);

            if (isset($validated['status']) && $validated['status'] === 'completed' && auth()->user()->role === 'waiter') {
                return response()->json([
                    'success' => false,
                    'message' => 'Waiters are not authorized to complete payments. Please ask a cashier or administrator.'
                ], 403);
            }

            $wasCompleted = $order->status === 'completed';

            if ($wasCompleted && isset($validated['status']) && $validated['status'] !== 'completed') {
                $tenantId = auth()->user()?->tenant_id ?? $order->tenant_id;
                $allowEdit = Setting::where('tenant_id', $tenantId)
                    ->where('key', 'enable_completed_order_edit')
                    ->value('value');
                $canEditCompleted = in_array($allowEdit, ['true', '1', true, 1], true);

                if (!$canEditCompleted) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Completed orders cannot be modified. You can enable this in Settings.'
                    ], 422);
                }
            }

            if (isset($validated['status'])) {
                $order->status = $validated['status'];
                if ($validated['status'] === 'completed') {
                    $order->payment_method = $validated['payment_method'] ?? 'cash';
                    $order->bank_account_id = $validated['bank_account_id'] ?? null;

                    // Auto-assign cash drawer if payment method is cash and no bank account is provided
                    if (strtolower($order->payment_method) === 'cash' && !$order->bank_account_id) {
                        $cashAccount = BankAccount::where('tenant_id', $order->tenant_id)
                            ->where('account_type', 'cash')
                            ->first();
                        if ($cashAccount) {
                            $order->bank_account_id = $cashAccount->id;
                        }
                    }

                    // Set total paid amounts
                    if (strtolower($order->payment_method) === 'cash') {
                        $order->cash_amount = $order->grand_total;
                        $order->online_amount = 0;
                    } else if (strtolower($order->payment_method) === 'card') {
                        $order->online_amount = $order->grand_total;
                        $order->cash_amount = 0;
                    }

                    // Global Tax Calculation
                    $activeTaxes = \App\Models\Tax::where('status', true)->get();
                    $totalTaxRate = $activeTaxes->sum('rate');
                    $taxableAmount = $order->total_amount - $order->discount_amount - $order->points_redeemed;
                    $order->tax_amount = ($taxableAmount * $totalTaxRate) / 100;
                    $order->grand_total = $taxableAmount + $order->tax_amount + $order->tip_amount;

                    // Award loyalty points
                    if (!$wasCompleted && $order->status === 'completed' && $order->customer_id) {
                        $pointsPerCurrency = \App\Models\Setting::where('tenant_id', auth()->user()->tenant_id)->where('key', 'points_per_currency')->value('value') ?? 0;
                        if ($pointsPerCurrency > 0) {
                            $earned = floor($order->grand_total * $pointsPerCurrency);
                            if ($earned > 0) {
                                $customer = \App\Models\Customer::find($order->customer_id);
                                if ($customer) {
                                    $customer->increment('loyalty_points', $earned);
                                    $customer->increment('lifetime_points', $earned);
                                }
                            }
                        }
                    }

                    // Sync table status
                    if ($order->table_id) {
                        $table = Table::find($order->table_id);
                        if ($table) {
                            $table->update(['status' => 'available']);
                        }
                    }

                    // Inventory deductions
                    $order->loadMissing(['items.menu.recipes.inventoryItem']);
                    foreach ($order->items as $orderItem) {
                        if (!$orderItem->menu) continue;
                        foreach ($orderItem->menu->recipes as $recipe) {
                            $invItem = $recipe->inventoryItem;
                            if (!$invItem) continue;

                            $qtyUsed = $recipe->quantity_per_serving * $orderItem->quantity;
                            $invItem->current_stock = max(0, (float)$invItem->current_stock - $qtyUsed);
                            $invItem->save();

                            InventoryUsage::create([
                                'inventory_item_id' => $invItem->id,
                                'quantity_used'     => $qtyUsed,
                                'usage_date'        => now()->toDateString(),
                                'notes'             => "Auto API: Order {$order->display_number} — {$orderItem->menu->name} × {$orderItem->quantity}",
                            ]);
                        }
                    }

                    // Handle Payment Deposit
                    if ($order->bank_account_id) {
                        $bankAccount = \App\Models\BankAccount::find($order->bank_account_id);
                        if ($bankAccount && class_exists(\App\Models\BankTransaction::class)) {
                            $depositAmount = $order->online_amount > 0 ? $order->online_amount : $order->cash_amount;
                            if ($depositAmount == 0) $depositAmount = $order->grand_total;

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

                    // Record Accounting Journal Entries for Sales and COGS
                    $this->recordAccountingEntries($order);
                }
            }

            $order->save();

            ActivityLog::record('updated', "Order {$order->display_number} updated to status '{$order->status}'", $order);

            if ($order->table_id) {
                Table::syncStatus($order->table_id);
            }

            return response()->json([
                'success' => true,
                'message' => 'Order updated successfully',
            ]);
        } catch (\Exception $e) {
            \Log::error("updateOrder failed: " . $e->getMessage() . "\n" . $e->getTraceAsString());
            return response()->json([
                'success' => false,
                'error' => true,
                'message' => 'Failed to update order: ' . $e->getMessage(),
            ], 500);
        }
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

    /**
     * Get single customer details with histories.
     */
    public function showCustomer($id)
    {
        $customer = Customer::findOrFail($id);

        $orders = $customer->orders()
            ->with(['items.menu', 'table'])
            ->latest()
            ->get();

        $pointHistory = ActivityLog::where('subject_type', Customer::class)
            ->where('subject_id', $customer->id)
            ->whereIn('action', ['earned', 'redeemed', 'refunded'])
            ->latest()
            ->get();

        $creditTransactions = $customer->creditTransactions()->with('order')->latest()->get();

        return response()->json([
            'success' => true,
            'data' => [
                'customer' => [
                    'id' => $customer->id,
                    'name' => $customer->name,
                    'email' => $customer->email,
                    'phone' => $customer->phone,
                    'loyalty_points' => (int)$customer->loyalty_points,
                    'lifetime_points' => (int)($customer->lifetime_points ?? $customer->loyalty_points),
                    'due_amount' => (float)$customer->due_amount,
                    'credit_limit' => (float)$customer->credit_limit,
                ],
                'orders' => $orders->map(function($o) {
                    return [
                        'id' => $o->id,
                        'number' => $o->order_number,
                        'total' => (float)$o->grand_total,
                        'status' => $o->status,
                        'created_at' => $o->created_at->toIso8601String(),
                        'time' => Carbon::parse($o->created_at)->diffForHumans(),
                        'items_count' => $o->items->sum('quantity'),
                        'items' => $o->items->map(function($item) {
                            return [
                                'name' => $item->menu ? $item->menu->name : 'Unknown Item',
                                'qty' => $item->quantity,
                                'price' => (float)$item->price,
                            ];
                        }),
                    ];
                }),
                'point_history' => $pointHistory->map(function($log) {
                    return [
                        'id' => $log->id,
                        'action' => $log->action,
                        'description' => $log->description,
                        'points' => isset($log->properties['points']) ? (int)$log->properties['points'] : 0,
                        'created_at' => $log->created_at->toIso8601String(),
                        'time' => Carbon::parse($log->created_at)->diffForHumans(),
                    ];
                }),
                'credit_transactions' => $creditTransactions->map(function($tx) {
                    return [
                        'id' => $tx->id,
                        'type' => $tx->type,
                        'amount' => (float)$tx->amount,
                        'note' => $tx->note,
                        'order_number' => $tx->order ? $tx->order->order_number : null,
                        'created_at' => $tx->created_at->toIso8601String(),
                        'time' => Carbon::parse($tx->created_at)->diffForHumans(),
                    ];
                }),
                'stats' => [
                    'total_orders' => $orders->count(),
                    'total_spent' => (float)$orders->sum('grand_total'),
                    'avg_order_value' => $orders->count() > 0 ? (float)($orders->sum('grand_total') / $orders->count()) : 0.0,
                    'last_order_date' => $orders->first() ? $orders->first()->created_at->toIso8601String() : null,
                ]
            ]
        ]);
    }

    /**
     * Get all app settings.
     */
    public function getSettings()
    {
        $user = auth()->user();

        if ($user && $user->role !== 'super_admin') {
            $tenantId = $user->tenant_id;
            $tenant = $tenantId ? \App\Models\Tenant::find($tenantId) : null;
            if (!$tenant) {
                return response()->json([
                    'success' => false,
                    'message' => 'Your cafe account has been deleted.',
                    'code' => 'TENANT_DELETED'
                ], 401);
            }
            if (!$tenant->is_active) {
                return response()->json([
                    'success' => false,
                    'message' => 'Your cafe account has been disabled.',
                    'code' => 'TENANT_DISABLED'
                ], 403);
            }
        }

        $tenantId = $user?->tenant_id;
        $tenant = $tenantId ? \App\Models\Tenant::find($tenantId) : null;
        $tenantName = $tenant?->name ?? 'My Cafe';

        // Fetch settings scoped to this tenant explicitly (bypassing TenantScope to avoid issues
        // on servers where the old UNIQUE(key) constraint may still be in place)
        $tenantSettings = Setting::withoutGlobalScopes()
            ->where('tenant_id', $tenantId)
            ->pluck('value', 'key')
            ->toArray();

        // Also get settings with no tenant (global/superadmin) as fallback
        $globalSettings = Setting::withoutGlobalScopes()
            ->whereNull('tenant_id')
            ->pluck('value', 'key')
            ->toArray();

        // Merge: tenant settings take priority over global settings
        $settings = array_merge($globalSettings, $tenantSettings);

        $settings['app_name'] = Setting::withoutGlobalScopes()->whereNull('tenant_id')->where('key', 'app_name')->value('value') ?? 'iCafe';
        $settings['app_version'] = Setting::withoutGlobalScopes()->whereNull('tenant_id')->where('key', 'app_version')->value('value') ?? 'v1.0';

        // Always expose the canonical tenant cafe name
        $settings['tenant_name'] = $tenantName;

        $defaults = [
            // Default site_name falls back to the tenant's actual cafe name
            'site_name' => $tenantName,
            'site_description' => 'Premium Table Booking & Order Management System',
            'currency_symbol' => 'रू.',
            'contact_phone' => '',
            'contact_email' => '',
            'support_phone' => '',
            'points_per_currency' => '0.01',
            'points_to_currency_rate' => '1',
            'kds_warning_mins' => '10',
            'kds_critical_mins' => '20',
            'theme' => 'brand',
            'receipt_header' => '',
            'receipt_footer' => 'Thank you for visiting! Please come again.',
            'show_tax_breakdown' => 'false',
            'show_customer_info' => 'false',
            'auto_print_receipt' => 'false',
            'address' => '',
            'enable_guest_qr' => 'false',
            'enable_completed_order_edit' => 'false',
        ];

        foreach ($defaults as $k => $v) {
            if (!isset($settings[$k])) {
                $settings[$k] = $v;
            }
        }

        if (!empty($settings['site_logo'])) {
            $settings['site_logo_url'] = url('storage/' . $settings['site_logo']);
        } else {
            $settings['site_logo_url'] = null;
        }

        if (!empty($settings['site_favicon'])) {
            $settings['site_favicon_url'] = url('storage/' . $settings['site_favicon']);
        } else {
            $settings['site_favicon_url'] = null;
        }

        return response()->json([
            'success' => true,
            'data' => $settings,
        ]);
    }

    /**
     * Update app settings.
     */
    public function updateSettings(Request $request)
    {
        $validated = $request->validate([
            'settings' => 'required|array',
        ]);

        $tenantId = auth()->check() ? auth()->user()->tenant_id : null;

        foreach ($validated['settings'] as $key => $value) {
            // If it's a boolean value, convert it to string 'true' / 'false'
            if (is_bool($value)) {
                $value = $value ? 'true' : 'false';
            }

            // Use withoutGlobalScopes + explicit tenant_id to bypass TenantScope.
            // This safely handles the case where UNIQUE(key) constraint still exists on
            // the live server (before the fix_settings_unique_key_for_tenants migration ran).
            // We do a direct UPDATE first; if no rows updated, INSERT a new one.
            $updated = Setting::withoutGlobalScopes()
                ->where('tenant_id', $tenantId)
                ->where('key', $key)
                ->update(['value' => $value, 'updated_at' => now()]);

            if (!$updated) {
                // No existing tenant-scoped record found — insert a new one
                Setting::withoutGlobalScopes()->insert([
                    'tenant_id' => $tenantId,
                    'key'       => $key,
                    'value'     => $value,
                    'type'      => 'text',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }

        if ($tenantId) {
            cache()->forget('settings_tenant_' . $tenantId);
        }

        return response()->json([
            'success' => true,
            'message' => 'Settings updated successfully',
        ]);
    }

    /**
     * Get inventory lists.
     */
    public function getInventory()
    {
        $items = \App\Models\InventoryItem::with(['stockGroup', 'measuringUnit'])->orderBy('name')->get();
        $purchases = \App\Models\InventoryPurchase::with(['inventoryItem', 'supplier'])->latest()->take(100)->get();
        $usages = \App\Models\InventoryUsage::with('inventoryItem')->latest()->take(100)->get();
        $suppliers = \App\Models\Supplier::orderBy('name')->get();
        $groups = \App\Models\StockGroup::orderBy('name')->get();
        $units = \App\Models\MeasuringUnit::orderBy('name')->get();
        $menus = \App\Models\Menu::orderBy('name')->get(['id', 'name', 'category']);
        $recipes = \App\Models\MenuRecipe::with(['menu:id,name', 'inventoryItem:id,name,unit'])->get();

        return response()->json([
            'success' => true,
            'items' => $items->map(fn($item) => [
                'id' => $item->id,
                'name' => $item->name,
                'unit' => $item->measuringUnit ? $item->measuringUnit->short_name : ($item->unit ?? '-'),
                'stock' => (float)$item->current_stock,
                'threshold' => (float)$item->low_stock_threshold,
                'group' => $item->stockGroup ? $item->stockGroup->name : ($item->category ?? '-'),
                'stock_group_id' => $item->stock_group_id,
                'measuring_unit_id' => $item->measuring_unit_id,
            ]),
            'purchases' => $purchases->map(fn($p) => [
                'id' => $p->id,
                'inventory_item_id' => $p->inventory_item_id,
                'supplier_id' => $p->supplier_id,
                'item' => $p->inventoryItem ? $p->inventoryItem->name : 'Item',
                'supplier' => $p->supplier ? $p->supplier->name : 'Walk-in',
                'qty' => (float)$p->quantity,
                'unit' => $p->inventoryItem && $p->inventoryItem->measuringUnit ? $p->inventoryItem->measuringUnit->short_name : ($p->inventoryItem->unit ?? '-'),
                'cost' => (float)$p->total_price,
                'unit_price' => (float)$p->unit_price,
                'date' => $p->purchase_date ? $p->purchase_date->format('M d, Y') : '',
                'notes' => $p->notes ?? '',
            ]),
            'usages' => $usages->map(fn($u) => [
                'id' => $u->id,
                'inventory_item_id' => $u->inventory_item_id,
                'ingredient' => $u->inventoryItem ? $u->inventoryItem->name : 'Item',
                'menu' => $u->notes ?? 'Manual Usage',
                'qty' => (float)$u->quantity_used,
                'unit' => $u->inventoryItem && $u->inventoryItem->measuringUnit ? $u->inventoryItem->measuringUnit->short_name : ($u->inventoryItem->unit ?? '-'),
                'date' => $u->usage_date ? $u->usage_date->format('M d, Y') : '',
                'notes' => $u->notes ?? '',
            ]),
            'suppliers' => $suppliers->map(fn($s) => [
                'id' => $s->id,
                'name' => $s->name,
                'contact' => $s->phone ?? ($s->contact_person ?? ''),
                'contact_person' => $s->contact_person ?? '',
                'phone' => $s->phone ?? '',
                'email' => $s->email ?? '',
                'address' => $s->address ?? '',
                'items' => \App\Models\InventoryPurchase::where('supplier_id', $s->id)->distinct('inventory_item_id')->count('inventory_item_id'),
                'outstanding' => 0.0,
            ]),
            'groups' => $groups->map(fn($g) => [
                'id' => $g->id,
                'name' => $g->name,
            ]),
            'units' => $units->map(fn($u) => [
                'id' => $u->id,
                'name' => $u->name,
                'short_name' => $u->short_name,
            ]),
            'menus' => $menus->map(fn($m) => [
                'id' => $m->id,
                'name' => $m->name,
                'category' => $m->category,
            ]),
            'recipes' => $recipes->map(fn($r) => [
                'id' => $r->id,
                'menu_id' => $r->menu_id,
                'inventory_item_id' => $r->inventory_item_id,
                'qty' => (float)$r->quantity_per_serving,
                'item_name' => $r->inventoryItem ? $r->inventoryItem->name : 'Item',
                'unit' => $r->inventoryItem ? ($r->inventoryItem->measuringUnit ? $r->inventoryItem->measuringUnit->short_name : ($r->inventoryItem->unit ?? '-')) : '-',
            ]),
            'recentWastes' => \App\Models\InventoryWaste::with(['inventoryItem', 'menu'])->latest()->take(100)->get()->map(fn($w) => [
                'id' => $w->id,
                'inventory_item_id' => $w->inventory_item_id,
                'menu_id' => $w->menu_id,
                'item_name' => $w->inventoryItem ? $w->inventoryItem->name : ($w->menu ? $w->menu->name : 'Item'),
                'type' => $w->inventoryItem ? 'raw' : 'menu',
                'qty' => (float)$w->quantity,
                'unit' => $w->inventoryItem && $w->inventoryItem->measuringUnit ? $w->inventoryItem->measuringUnit->short_name : ($w->inventoryItem->unit ?? '-'),
                'cost_per_unit' => (float)$w->cost_per_unit,
                'total_loss' => (float)$w->total_loss,
                'date' => $w->waste_date ? $w->waste_date->format('M d, Y') : '',
                'reason' => $w->reason,
                'notes' => $w->notes ?? '',
            ]),
        ]);
    }

    /**
     * Store inventory item.
     */
    public function storeInventoryItem(Request $request)
    {
        $validated = $request->validate([
            'name'                => 'required|string|max:255',
            'low_stock_threshold' => 'nullable|numeric|min:0',
            'current_stock'       => 'nullable|numeric|min:0',
            'stock_group_id'      => 'nullable|exists:stock_groups,id',
            'measuring_unit_id'   => 'nullable|exists:measuring_units,id',
        ]);

        if (!empty($validated['measuring_unit_id'])) {
            $validated['unit'] = \App\Models\MeasuringUnit::find($validated['measuring_unit_id'])->short_name ?? '-';
        } else {
            $validated['unit'] = '-';
        }

        if (!empty($validated['stock_group_id'])) {
            $validated['category'] = \App\Models\StockGroup::find($validated['stock_group_id'])->name;
        } else {
            $validated['category'] = 'Default';
        }

        $validated['branch_id'] = Auth::user()->primary_branch_id;
        $validated['tenant_id'] = Auth::user()->tenant_id;

        $item = \App\Models\InventoryItem::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Item created successfully',
            'data' => $item,
        ]);
    }

    /**
     * Update inventory item.
     */
    public function updateInventoryItem(Request $request, $id)
    {
        $item = \App\Models\InventoryItem::findOrFail($id);

        $validated = $request->validate([
            'name'                => 'required|string|max:255',
            'low_stock_threshold' => 'nullable|numeric|min:0',
            'current_stock'       => 'required|numeric|min:0',
            'stock_group_id'      => 'nullable|exists:stock_groups,id',
            'measuring_unit_id'   => 'nullable|exists:measuring_units,id',
        ]);

        if (!empty($validated['measuring_unit_id'])) {
            $validated['unit'] = \App\Models\MeasuringUnit::find($validated['measuring_unit_id'])->short_name ?? '-';
        }

        if (!empty($validated['stock_group_id'])) {
            $validated['category'] = \App\Models\StockGroup::find($validated['stock_group_id'])->name;
        }

        $item->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Item updated successfully',
            'data' => $item,
        ]);
    }

    /**
     * Delete inventory item.
     */
    public function deleteInventoryItem($id)
    {
        $item = \App\Models\InventoryItem::findOrFail($id);
        $item->delete();

        return response()->json([
            'success' => true,
            'message' => 'Item deleted successfully',
        ]);
    }

    /**
     * Store inventory purchase.
     */
    public function storeInventoryPurchase(Request $request)
    {
        $validated = $request->validate([
            'inventory_item_id' => 'required|exists:inventory_items,id',
            'supplier_id'       => 'nullable|exists:suppliers,id',
            'quantity'          => 'required|numeric|min:0.01',
            'unit_price'        => 'required|numeric|min:0',
            'total_price'       => 'required|numeric|min:0',
            'purchase_date'     => 'required|date',
            'notes'             => 'nullable|string',
        ]);

        $validated['branch_id'] = Auth::user()->primary_branch_id;
        $validated['tenant_id'] = Auth::user()->tenant_id;

        $purchase = \App\Models\InventoryPurchase::create($validated);

        $item = \App\Models\InventoryItem::find($validated['inventory_item_id']);
        if ($item) {
            $item->current_stock += $validated['quantity'];
            $item->save();
        }

        // Link to Finance: Create Journal Entry
        $tenantId = Auth::user()->tenant_id;
        $inventoryAssetAccount = \App\Models\Account::firstOrCreate(
            ['tenant_id' => $tenantId, 'code' => '1004'],
            ['name' => 'Inventory Asset', 'type' => 'asset', 'description' => 'Value of inventory on hand']
        );
        $cashAccount = \App\Models\Account::firstOrCreate(
            ['tenant_id' => $tenantId, 'code' => '1001'],
            ['name' => 'Cash', 'type' => 'asset', 'description' => 'Cash on hand']
        );

        if (class_exists(\App\Models\JournalEntry::class)) {
            $journalEntry = \App\Models\JournalEntry::create([
                'tenant_id' => $tenantId,
                'reference_number' => 'PUR-' . $purchase->id,
                'date' => $validated['purchase_date'],
                'description' => 'Inventory Purchase: ' . ($item ? $item->name : 'Item'),
                'status' => 'posted',
            ]);

            $journalEntry->lines()->create([
                'account_id' => $inventoryAssetAccount->id,
                'debit' => $validated['total_price'],
                'credit' => 0,
                'description' => 'Increase in Inventory Asset',
            ]);

            $journalEntry->lines()->create([
                'account_id' => $cashAccount->id,
                'debit' => 0,
                'credit' => $validated['total_price'],
                'description' => 'Payment for Inventory',
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Purchase logged successfully',
            'data' => $purchase,
        ]);
    }

    /**
     * Store inventory usage.
     */
    public function storeInventoryUsage(Request $request)
    {
        $validated = $request->validate([
            'inventory_item_id' => 'required|exists:inventory_items,id',
            'quantity_used'     => 'required|numeric|min:0.01',
            'usage_date'        => 'required|date',
            'notes'             => 'nullable|string',
        ]);

        $validated['branch_id'] = Auth::user()->primary_branch_id;
        $validated['tenant_id'] = Auth::user()->tenant_id;

        $usage = \App\Models\InventoryUsage::create($validated);

        $item = \App\Models\InventoryItem::find($validated['inventory_item_id']);
        if ($item) {
            $item->current_stock -= $validated['quantity_used'];
            $item->save();
        }

        return response()->json([
            'success' => true,
            'message' => 'Usage logged successfully',
            'data' => $usage,
        ]);
    }

    /**
     * Store inventory waste/damage.
     */
    public function storeInventoryWaste(Request $request)
    {
        $validated = $request->validate([
            'inventory_item_id' => 'nullable|exists:inventory_items,id',
            'menu_id'           => 'nullable|exists:menus,id',
            'quantity'          => 'required|numeric|min:0.01',
            'cost_per_unit'     => 'required|numeric|min:0',
            'total_loss'        => 'required|numeric|min:0',
            'waste_date'        => 'required|date',
            'reason'            => 'required|string|max:255',
            'notes'             => 'nullable|string',
        ]);

        if (empty($validated['inventory_item_id']) && empty($validated['menu_id'])) {
            return response()->json([
                'success' => false,
                'message' => 'Select either a raw ingredient or a menu item.'
            ], 422);
        }

        $validated['branch_id'] = Auth::user()->primary_branch_id;
        $validated['tenant_id'] = Auth::user()->tenant_id;
        if (!$validated['branch_id']) {
            $validated['branch_id'] = \App\Models\Branch::value('id');
        }

        $waste = \App\Models\InventoryWaste::create($validated);

        $this->apiDeductStockForWaste($waste);
        $this->apiCreateFinanceJournalForWaste($waste);

        return response()->json([
            'success' => true,
            'message' => 'Waste logged successfully',
            'data' => $waste,
        ]);
    }

    /**
     * Update inventory waste/damage.
     */
    public function updateInventoryWaste(Request $request, $id)
    {
        $waste = \App\Models\InventoryWaste::find($id);
        if (!$waste) {
            return response()->json([
                'success' => false,
                'message' => 'Waste record not found'
            ], 404);
        }

        $validated = $request->validate([
            'inventory_item_id' => 'nullable|exists:inventory_items,id',
            'menu_id'           => 'nullable|exists:menus,id',
            'quantity'          => 'required|numeric|min:0.01',
            'cost_per_unit'     => 'required|numeric|min:0',
            'total_loss'        => 'required|numeric|min:0',
            'waste_date'        => 'required|date',
            'reason'            => 'required|string|max:255',
            'notes'             => 'nullable|string',
        ]);

        if (empty($validated['inventory_item_id']) && empty($validated['menu_id'])) {
            return response()->json([
                'success' => false,
                'message' => 'Select either a raw ingredient or a menu item.'
            ], 422);
        }

        $this->apiRevertStockForWaste($waste);
        $this->apiDeleteFinanceJournalForWaste($waste);

        $waste->update($validated);

        $this->apiDeductStockForWaste($waste);
        $this->apiCreateFinanceJournalForWaste($waste);

        return response()->json([
            'success' => true,
            'message' => 'Waste updated successfully',
            'data' => $waste,
        ]);
    }

    /**
     * Delete inventory waste/damage.
     */
    public function deleteInventoryWaste($id)
    {
        $waste = \App\Models\InventoryWaste::find($id);
        if (!$waste) {
            return response()->json([
                'success' => false,
                'message' => 'Waste record not found'
            ], 404);
        }

        $this->apiRevertStockForWaste($waste);
        $this->apiDeleteFinanceJournalForWaste($waste);
        $waste->delete();

        return response()->json([
            'success' => true,
            'message' => 'Waste record deleted and stock restored',
        ]);
    }

    protected function apiDeductStockForWaste($waste)
    {
        if ($waste->inventory_item_id) {
            \App\Models\InventoryUsage::create([
                'branch_id' => $waste->branch_id,
                'tenant_id' => $waste->tenant_id,
                'inventory_item_id' => $waste->inventory_item_id,
                'quantity_used' => $waste->quantity,
                'usage_date' => $waste->waste_date,
                'notes' => "Waste Ref: {$waste->id} | Raw Material Waste: " . ($waste->notes ?? ''),
            ]);

            $item = \App\Models\InventoryItem::find($waste->inventory_item_id);
            if ($item) {
                $item->current_stock -= $waste->quantity;
                $item->save();
            }
        } elseif ($waste->menu_id) {
            $recipes = \App\Models\MenuRecipe::where('menu_id', $waste->menu_id)->get();
            foreach ($recipes as $ingredient) {
                $qtyToDeduct = $ingredient->quantity_per_serving * $waste->quantity;

                $item = \App\Models\InventoryItem::find($ingredient->inventory_item_id);
                if ($item) {
                    $item->current_stock -= $qtyToDeduct;
                    $item->save();
                }

                \App\Models\InventoryUsage::create([
                    'branch_id' => $waste->branch_id,
                    'tenant_id' => $waste->tenant_id,
                    'inventory_item_id' => $ingredient->inventory_item_id,
                    'quantity_used' => $qtyToDeduct,
                    'usage_date' => $waste->waste_date,
                    'notes' => "Waste Ref: {$waste->id} | Auto deduction for menu item: " . ($waste->menu ? $waste->menu->name : 'Menu Item'),
                ]);
            }
        }
    }

    protected function apiRevertStockForWaste($waste)
    {
        if ($waste->inventory_item_id) {
            $item = \App\Models\InventoryItem::find($waste->inventory_item_id);
            if ($item) {
                $item->current_stock += $waste->quantity;
                $item->save();
            }
        }

        $usages = \App\Models\InventoryUsage::where('notes', 'like', "Waste Ref: {$waste->id}%")->get();
        foreach ($usages as $usage) {
            if ($waste->menu_id) {
                $item = \App\Models\InventoryItem::find($usage->inventory_item_id);
                if ($item) {
                    $item->current_stock += $usage->quantity_used;
                    $item->save();
                }
            }
            $usage->delete();
        }
    }

    protected function apiCreateFinanceJournalForWaste($waste)
    {
        $tenantId = $waste->tenant_id ?? Auth::user()->tenant_id ?? 1;

        $wasteExpenseAccount = \App\Models\Account::firstOrCreate(
            ['tenant_id' => $tenantId, 'code' => '5005'],
            ['name' => 'Food Waste Expense', 'type' => 'expense', 'description' => 'Losses due to spoiled, damaged, or wasted inventory']
        );
        $inventoryAssetAccount = \App\Models\Account::firstOrCreate(
            ['tenant_id' => $tenantId, 'code' => '1004'],
            ['name' => 'Inventory Asset', 'type' => 'asset', 'description' => 'Value of inventory on hand']
        );

        if (class_exists(\App\Models\JournalEntry::class)) {
            $journalEntry = \App\Models\JournalEntry::create([
                'tenant_id' => $tenantId,
                'reference_number' => 'WST-' . $waste->id,
                'date' => $waste->waste_date,
                'description' => 'Food Waste/Damage: ' . ($waste->inventoryItem ? $waste->inventoryItem->name : ($waste->menu ? $waste->menu->name : 'Item')),
                'status' => 'posted',
            ]);

            $journalEntry->lines()->create([
                'account_id' => $wasteExpenseAccount->id,
                'debit' => $waste->total_loss,
                'credit' => 0,
                'description' => 'Food Waste Expense Recognition',
            ]);

            $journalEntry->lines()->create([
                'account_id' => $inventoryAssetAccount->id,
                'debit' => 0,
                'credit' => $waste->total_loss,
                'description' => 'Inventory Write-off due to Waste/Damage',
            ]);
        }
    }

    protected function apiDeleteFinanceJournalForWaste($waste)
    {
        if (class_exists(\App\Models\JournalEntry::class)) {
            \App\Models\JournalEntry::where('reference_number', 'WST-' . $waste->id)->delete();
        }
    }

    /**
     * Store supplier.
     */
    public function storeInventorySupplier(Request $request)
    {
        $validated = $request->validate([
            'name'           => 'required|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'phone'          => 'nullable|string|max:50',
            'email'          => 'nullable|email|max:255',
            'address'        => 'nullable|string',
        ]);

        $validated['branch_id'] = Auth::user()->primary_branch_id;
        $validated['tenant_id'] = Auth::user()->tenant_id;

        $supplier = \App\Models\Supplier::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Supplier created successfully',
            'data' => $supplier,
        ]);
    }

    public function updateInventorySupplier(Request $request, $id)
    {
        $supplier = \App\Models\Supplier::where('tenant_id', Auth::user()->tenant_id)->findOrFail($id);

        $validated = $request->validate([
            'name'           => 'required|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'phone'          => 'nullable|string|max:50',
            'email'          => 'nullable|email|max:255',
            'address'        => 'nullable|string',
        ]);

        $supplier->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Supplier updated successfully',
            'data' => $supplier,
        ]);
    }

    public function deleteInventorySupplier($id)
    {
        $supplier = \App\Models\Supplier::where('tenant_id', Auth::user()->tenant_id)->findOrFail($id);
        $supplier->delete();

        return response()->json([
            'success' => true,
            'message' => 'Supplier deleted successfully',
        ]);
    }

    /**
     * Store recipe for a menu item.
     */
    public function storeInventoryRecipe(Request $request)
    {
        $validated = $request->validate([
            'menu_id'    => 'required|exists:menus,id',
            'ingredients' => 'required|array|min:1',
            'ingredients.*.inventory_item_id' => 'required|exists:inventory_items,id',
            'ingredients.*.quantity_per_serving' => 'required|numeric|min:0.0001',
        ]);

        $tenantId = Auth::user()->tenant_id;

        // Replace all existing recipe rows for this menu (full overwrite)
        \App\Models\MenuRecipe::where('menu_id', $validated['menu_id'])->delete();

        foreach ($validated['ingredients'] as $ingredient) {
            \App\Models\MenuRecipe::create([
                'tenant_id'            => $tenantId,
                'menu_id'              => $validated['menu_id'],
                'inventory_item_id'    => $ingredient['inventory_item_id'],
                'quantity_per_serving' => $ingredient['quantity_per_serving'],
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Recipe saved successfully',
        ]);
    }

    /**
     * Store measuring unit.
     */
    public function storeMeasuringUnit(Request $request)
    {
        $validated = $request->validate([
            'name'       => 'required|string|max:255',
            'short_name' => 'required|string|max:50',
        ]);

        $validated['branch_id'] = Auth::user()->primary_branch_id;
        $validated['tenant_id'] = Auth::user()->tenant_id;

        $unit = \App\Models\MeasuringUnit::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Measuring unit created successfully',
            'data' => $unit,
        ]);
    }

    /**
     * Update measuring unit.
     */
    public function updateMeasuringUnit(Request $request, $id)
    {
        $unit = \App\Models\MeasuringUnit::findOrFail($id);

        $validated = $request->validate([
            'name'       => 'required|string|max:255',
            'short_name' => 'required|string|max:50',
        ]);

        $unit->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Measuring unit updated successfully',
            'data' => $unit,
        ]);
    }

    /**
     * Delete measuring unit.
     */
    public function deleteMeasuringUnit($id)
    {
        $unit = \App\Models\MeasuringUnit::findOrFail($id);
        $unit->delete();

        return response()->json([
            'success' => true,
            'message' => 'Measuring unit deleted successfully',
        ]);
    }

    /**
     * Store stock group.
     */
    public function storeStockGroup(Request $request)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $validated['branch_id'] = Auth::user()->primary_branch_id;
        $validated['tenant_id'] = Auth::user()->tenant_id;

        $group = \App\Models\StockGroup::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Stock group created successfully',
            'data' => $group,
        ]);
    }

    /**
     * Update stock group.
     */
    public function updateStockGroup(Request $request, $id)
    {
        $group = \App\Models\StockGroup::findOrFail($id);

        $validated = $request->validate([
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $group->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Stock group updated successfully',
            'data' => $group,
        ]);
    }

    /**
     * Delete stock group.
     */
    public function deleteStockGroup($id)
    {
        $group = \App\Models\StockGroup::findOrFail($id);
        $group->delete();

        return response()->json([
            'success' => true,
            'message' => 'Stock group deleted successfully',
        ]);
    }

    /**
     * Get reservations list.
     */
    public function getReservations()
    {
        $reservations = \App\Models\Reservation::with('table')->orderBy('booking_time', 'asc')->get();
        $tables = \App\Models\Table::orderBy('table_number')->get();

        return response()->json([
            'success' => true,
            'reservations' => $reservations->map(fn($r) => [
                'id' => $r->id,
                'customer_name' => $r->customer_name,
                'phone' => $r->phone,
                'table_id' => $r->table_id,
                'table_number' => $r->table ? $r->table->table_number : 'N/A',
                'booking_time' => $r->booking_time->toIso8601String(),
                'status' => $r->status,
                'guests_count' => $r->guests_count,
            ]),
            'tables' => $tables->map(fn($t) => [
                'id' => $t->id,
                'number' => $t->table_number,
                'capacity' => $t->capacity,
                'status' => $t->status,
            ]),
        ]);
    }

    /**
     * Store a new reservation.
     */
    public function storeReservation(Request $request)
    {
        $validated = $request->validate([
            'table_id'      => 'required|exists:tables,id',
            'customer_name' => 'required|string|max:255',
            'phone'         => 'required|string|max:50',
            'booking_time'  => 'required|date',
            'guests_count'  => 'required|integer|min:1',
        ]);

        $validated['status'] = 'active';
        $user = Auth::user();
        $validated['tenant_id'] = $user->tenant_id;
        $validated['branch_id'] = $user->primary_branch_id;

        $table = \App\Models\Table::findOrFail($validated['table_id']);
        if ($table->status === 'occupied') {
            return response()->json([
                'success' => false,
                'message' => 'Table is currently occupied.'
            ], 422);
        }

        $reservation = \App\Models\Reservation::create($validated);
        
        \App\Models\ActivityLog::record(
            'created', 
            "New reservation for {$reservation->customer_name} at Table {$table->table_number}", 
            $reservation
        );

        return response()->json([
            'success' => true,
            'message' => 'Reservation created successfully',
            'reservation' => [
                'id' => $reservation->id,
                'customer_name' => $reservation->customer_name,
                'phone' => $reservation->phone,
                'table_id' => $reservation->table_id,
                'table_number' => $table->table_number,
                'booking_time' => $reservation->booking_time->toIso8601String(),
                'status' => $reservation->status,
                'guests_count' => $reservation->guests_count,
            ]
        ]);
    }

    /**
     * Update an existing reservation.
     */
    public function updateReservation(Request $request, $id)
    {
        $reservation = \App\Models\Reservation::findOrFail($id);

        if ($request->has('customer_name')) {
            $validated = $request->validate([
                'table_id'      => 'required|exists:tables,id',
                'customer_name' => 'required|string|max:255',
                'phone'         => 'required|string|max:50',
                'booking_time'  => 'required|date',
                'guests_count'  => 'required|integer|min:1',
            ]);

            if ($reservation->table_id != $validated['table_id']) {
                $newTable = \App\Models\Table::findOrFail($validated['table_id']);
                if ($newTable->status === 'occupied') {
                    return response()->json([
                        'success' => false,
                        'message' => 'Table is currently occupied.'
                    ], 422);
                }
            }

            $reservation->update($validated);
            \App\Models\ActivityLog::record(
                'updated', 
                "Reservation for {$reservation->customer_name} was edited", 
                $reservation
            );
        } else {
            $validated = $request->validate([
                'status' => 'required|in:active,completed,cancelled',
            ]);

            $reservation->update($validated);
            \App\Models\ActivityLog::record(
                'updated', 
                "Reservation for {$reservation->customer_name} marked as {$validated['status']}", 
                $reservation
            );
        }

        return response()->json([
            'success' => true,
            'message' => 'Reservation updated successfully'
        ]);
    }

    /**
     * Delete a reservation.
     */
    public function deleteReservation($id)
    {
        $reservation = \App\Models\Reservation::findOrFail($id);
        $name = $reservation->customer_name;
        $reservation->delete();

        \App\Models\ActivityLog::record(
            'deleted', 
            "Reservation for {$name} was removed"
        );

        return response()->json([
            'success' => true,
            'message' => 'Reservation deleted successfully'
        ]);
    }

    /**
     * Get finance overview (P&L totals, payment sales, recent transactions).
     */
    public function getFinanceOverview(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;
        $startDate = $request->input('start_date', \Carbon\Carbon::now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', \Carbon\Carbon::now()->endOfMonth()->toDateString());

        $revenue = \App\Models\Order::where('tenant_id', $tenantId)
            ->whereIn('status', ['completed'])
            ->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->sum('grand_total');

        $expensesTotal = \App\Models\Expense::where('tenant_id', $tenantId)
            ->whereBetween('date', [$startDate, $endDate])
            ->sum('amount');

        $pendingBills = \App\Models\SupplierBill::where('tenant_id', $tenantId)
            ->whereIn('status', ['unpaid', 'partial'])
            ->count();

        $cashSales = \App\Models\Order::where('tenant_id', $tenantId)
            ->where('status', 'completed')
            ->where('payment_method', 'cash')
            ->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->sum('grand_total');

        $cardSales = \App\Models\Order::where('tenant_id', $tenantId)
            ->where('status', 'completed')
            ->where('payment_method', 'card')
            ->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->sum('grand_total');

        $creditSales = \App\Models\Order::where('tenant_id', $tenantId)
            ->where('status', 'completed')
            ->where('payment_method', 'credit')
            ->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->sum('grand_total');

        // Recent Transactions
        $orders = \App\Models\Order::where('tenant_id', $tenantId)
            ->where('status', 'completed')
            ->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(fn($o) => [
                'desc' => 'Order ' . (str_starts_with($o->display_number, '#') ? $o->display_number : '#' . $o->display_number) . ($o->table ? ' - Table ' . $o->table->table_number : ''),
                'type' => 'credit',
                'amount' => (double)$o->grand_total,
                'time' => $o->created_at->format('M d, h:i A'),
            ]);

        $expenses = \App\Models\Expense::where('tenant_id', $tenantId)
            ->whereBetween('date', [$startDate, $endDate])
            ->orderBy('date', 'desc')
            ->limit(10)
            ->get()
            ->map(fn($e) => [
                'desc' => $e->notes ?: ($e->category ? $e->category->name : 'Expense'),
                'type' => 'debit',
                'amount' => (double)$e->amount,
                'time' => \Carbon\Carbon::parse($e->date)->format('M d'),
            ]);

        $recentTransactions = $orders->concat($expenses)->sortByDesc('time')->values()->take(10);

        return response()->json([
            'success' => true,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'revenue' => (double)$revenue,
            'expensesTotal' => (double)$expensesTotal,
            'grossProfit' => (double)$revenue,
            'netProfit' => (double)($revenue - $expensesTotal),
            'pendingBills' => $pendingBills,
            'cashSales' => (double)$cashSales,
            'cardSales' => (double)$cardSales,
            'creditSales' => (double)$creditSales,
            'recentTransactions' => $recentTransactions,
        ]);
    }

    /**
     * Get Profit & Loss details.
     */
    public function getProfitLoss(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;
        $startDate = $request->input('start_date', \Carbon\Carbon::now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', \Carbon\Carbon::now()->endOfMonth()->toDateString());

        $revenue = \App\Models\Order::where('tenant_id', $tenantId)
            ->whereIn('status', ['completed'])
            ->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->sum('grand_total');

        $expensesTotal = \App\Models\Expense::where('tenant_id', $tenantId)
            ->whereBetween('date', [$startDate, $endDate])
            ->sum('amount');

        $expensesByCategory = \App\Models\Expense::withoutGlobalScope(\App\Models\Scopes\TenantScope::class)
            ->where('expenses.tenant_id', $tenantId)
            ->whereBetween('date', [$startDate, $endDate])
            ->join('expense_categories', 'expenses.expense_category_id', '=', 'expense_categories.id')
            ->select('expense_categories.name', DB::raw('SUM(expenses.amount) as total'))
            ->groupBy('expense_categories.name')
            ->get()
            ->map(fn($item) => [
                'name' => $item->name,
                'total' => (double)$item->total
            ]);

        return response()->json([
            'success' => true,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'revenue' => (double)$revenue,
            'expensesTotal' => (double)$expensesTotal,
            'expensesByCategory' => $expensesByCategory,
            'grossProfit' => (double)$revenue,
            'netProfit' => (double)($revenue - $expensesTotal),
        ]);
    }

    /**
     * Get Balance Sheet.
     */
    public function getBalanceSheet(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;
        $endDate = $request->input('end_date', \Carbon\Carbon::now()->toDateString());

        $lines = \App\Models\JournalEntryLine::whereHas('journalEntry', function($q) use ($tenantId, $endDate) {
                $q->where('tenant_id', $tenantId)
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

        // Retained Earnings
        $revenueAndExpenses = \App\Models\JournalEntryLine::whereHas('journalEntry', function($q) use ($tenantId, $endDate) {
                $q->where('tenant_id', $tenantId)
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

        $assets = array_values(array_filter($accounts, fn($a) => $a['type'] === 'asset'));
        $liabilities = array_values(array_filter($accounts, fn($a) => $a['type'] === 'liability'));
        $equity = array_values(array_filter($accounts, fn($a) => $a['type'] === 'equity'));

        return response()->json([
            'success' => true,
            'endDate' => $endDate,
            'assets' => $assets,
            'liabilities' => $liabilities,
            'equity' => $equity,
            'retainedEarnings' => (double)$retainedEarnings,
        ]);
    }

    /**
     * Get Trial Balance.
     */
    public function getTrialBalance(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;
        $startDate = $request->input('start_date', \Carbon\Carbon::now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', \Carbon\Carbon::now()->endOfMonth()->toDateString());

        $lines = \App\Models\JournalEntryLine::whereHas('journalEntry', function($q) use ($tenantId, $startDate, $endDate) {
                $q->where('tenant_id', $tenantId)
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

        foreach($accounts as $id => $account) {
            if (in_array($account['type'], ['asset', 'expense'])) {
                $net = $account['debit'] - $account['credit'];
                if ($net >= 0) {
                    $accounts[$id]['debit'] = $net;
                    $accounts[$id]['credit'] = 0;
                } else {
                    $accounts[$id]['debit'] = 0;
                    $accounts[$id]['credit'] = abs($net);
                }
            } else {
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

        usort($accounts, fn($a, $b) => strcmp($a['code'], $b['code']));

        $netTotalDebit = array_sum(array_column($accounts, 'debit'));
        $netTotalCredit = array_sum(array_column($accounts, 'credit'));

        return response()->json([
            'success' => true,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'accounts' => $accounts,
            'totalDebit' => (double)$netTotalDebit,
            'totalCredit' => (double)$netTotalCredit,
        ]);
    }

    /**
     * Get Cash Flow.
     */
    public function getCashFlow(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;
        $startDate = $request->input('start_date', \Carbon\Carbon::now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', \Carbon\Carbon::now()->endOfMonth()->toDateString());

        $cashAccountIds = \App\Models\Account::where('tenant_id', $tenantId)
            ->where('type', 'asset')
            ->where(function($q) {
                $q->where('name', 'like', '%cash%')
                  ->orWhere('name', 'like', '%bank%');
            })
            ->pluck('id');

        $cashEntries = \App\Models\JournalEntry::where('tenant_id', $tenantId)
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

        foreach($cashEntries as $entry) {
            $cashEffect = 0;
            $otherAccountName = 'Unknown';
            $activityType = 'operating';

            foreach($entry->lines as $line) {
                if ($cashAccountIds->contains($line->account_id)) {
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
                    $result[] = ['description' => $desc, 'amount' => (double)$amount];
                }
            }
            return $result;
        };

        return response()->json([
            'success' => true,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'operatingActivities' => $summarize($operatingActivities),
            'investingActivities' => $summarize($investingActivities),
            'financingActivities' => $summarize($financingActivities),
            'netCashFlow' => (double)$netCashFlow,
        ]);
    }

    /**
     * Get General Ledger.
     */
    public function getGeneralLedger(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;
        $startDate = $request->input('start_date', \Carbon\Carbon::now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', \Carbon\Carbon::now()->endOfMonth()->toDateString());

        $accounts = \App\Models\Account::where('tenant_id', $tenantId)
            ->with(['journalEntryLines' => function($q) use ($startDate, $endDate) {
                $q->whereHas('journalEntry', function($je) use ($startDate, $endDate) {
                    $je->whereBetween('date', [$startDate, $endDate]);
                })->with('journalEntry');
            }])
            ->orderBy('code')
            ->get()
            ->map(function($account) use ($startDate, $endDate) {
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
                        'debit' => (double)$line->debit,
                        'credit' => (double)$line->credit,
                        'balance' => (double)$runningBalance
                    ];
                });

                return [
                    'id' => $account->id,
                    'code' => $account->code,
                    'name' => $account->name,
                    'type' => $account->type,
                    'lines' => $formattedLines,
                    'ending_balance' => (double)$runningBalance
                ];
            })->filter(function($account) {
                return count($account['lines']) > 0;
            })->values();

        return response()->json([
            'success' => true,
            'startDate' => $startDate,
            'endDate' => $endDate,
            'accounts' => $accounts,
        ]);
    }

    /**
     * Chart of Accounts CRUD.
     */
    public function getChartOfAccounts()
    {
        $tenantId = auth()->user()->tenant_id;
        $accounts = \App\Models\Account::where('tenant_id', $tenantId)->orderBy('code')->get();

        return response()->json([
            'success' => true,
            'accounts' => $accounts,
        ]);
    }

    public function storeAccount(Request $request)
    {
        $tenant = auth()->user()->tenant;
        if ($tenant->hasLimitReached('max_accounts')) {
            return response()->json([
                'success' => false,
                'message' => 'You have reached the maximum number of financial accounts allowed by your subscription plan.'
            ], 422);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:accounts,code',
            'type' => 'required|string|in:asset,liability,equity,revenue,expense',
            'description' => 'nullable|string'
        ]);

        $account = \App\Models\Account::create([
            'tenant_id' => auth()->user()->tenant_id,
            'name' => $validated['name'],
            'code' => $validated['code'],
            'type' => $validated['type'],
            'description' => $validated['description']
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Account created successfully',
            'account' => $account,
        ]);
    }

    /**
     * Journal Entries CRUD.
     */
    public function getJournalEntries()
    {
        $tenantId = auth()->user()->tenant_id;
        $entries = \App\Models\JournalEntry::where('tenant_id', $tenantId)
            ->with('lines.account')
            ->orderBy('date', 'desc')
            ->orderBy('id', 'desc')
            ->get();

        $accounts = \App\Models\Account::where('tenant_id', $tenantId)->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'entries' => $entries,
            'accounts' => $accounts,
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
            return response()->json([
                'success' => false,
                'message' => 'Total Debits must equal Total Credits.'
            ], 422);
        }

        $entry = DB::transaction(function() use ($validated) {
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
            return $entry;
        });

        return response()->json([
            'success' => true,
            'message' => 'Journal entry created successfully',
            'entry' => $entry,
        ]);
    }

    /**
     * Expenses API endpoints.
     */
    public function getExpenses(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;
        $expenses = \App\Models\Expense::where('tenant_id', $tenantId)
            ->with('category')
            ->orderBy('date', 'desc')
            ->get();
        $categories = \App\Models\ExpenseCategory::where('tenant_id', $tenantId)->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'expenses' => $expenses,
            'categories' => $categories,
        ]);
    }

    public function storeExpense(Request $request)
    {
        $validated = $request->validate([
            'expense_category_id' => 'required|exists:expense_categories,id',
            'amount' => 'required|numeric|min:0.01',
            'date' => 'required|date',
            'reference' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:500',
        ]);

        $validated['tenant_id'] = auth()->user()->tenant_id;

        $expense = \App\Models\Expense::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Expense created successfully',
            'expense' => $expense,
        ]);
    }

    public function destroyExpense($id)
    {
        $tenantId = auth()->user()->tenant_id;
        $expense = \App\Models\Expense::where('tenant_id', $tenantId)->find($id);

        if (!$expense) {
            return response()->json([
                'success' => false,
                'message' => 'Expense not found.'
            ], 404);
        }

        $expense->delete();

        return response()->json([
            'success' => true,
            'message' => 'Expense deleted successfully.'
        ]);
    }

    public function storeExpenseCategory(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $generalExpenseAccount = \App\Models\Account::firstOrCreate(
            ['tenant_id' => $tenantId, 'code' => '6004'],
            ['name' => 'General Expenses', 'type' => 'expense', 'description' => 'Default general expenses account']
        );

        $category = \App\Models\ExpenseCategory::create([
            'tenant_id' => $tenantId,
            'name' => $validated['name'],
            'account_id' => $generalExpenseAccount->id,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Category added successfully.',
            'category' => $category
        ]);
    }

    public function updateExpenseCategory(Request $request, $id)
    {
        $tenantId = auth()->user()->tenant_id;
        $category = \App\Models\ExpenseCategory::where('tenant_id', $tenantId)->find($id);

        if (!$category) {
            return response()->json([
                'success' => false,
                'message' => 'Category not found.'
            ], 404);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $category->update([
            'name' => $validated['name'],
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Category updated successfully.',
            'category' => $category
        ]);
    }

    public function destroyExpenseCategory($id)
    {
        $tenantId = auth()->user()->tenant_id;
        $category = \App\Models\ExpenseCategory::where('tenant_id', $tenantId)->find($id);

        if (!$category) {
            return response()->json([
                'success' => false,
                'message' => 'Category not found.'
            ], 404);
        }

        if ($category->expenses()->count() > 0) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete category with associated expenses.'
            ], 400);
        }

        $category->delete();

        return response()->json([
            'success' => true,
            'message' => 'Category deleted successfully.'
        ]);
    }

    public function getExpenseCategories()
    {
        $tenantId = auth()->user()->tenant_id;
        $categories = \App\Models\ExpenseCategory::where('tenant_id', $tenantId)->orderBy('name')->get();

        return response()->json([
            'success' => true,
            'categories' => $categories,
        ]);
    }

    /**
     * Supplier Bills API.
     */
    public function getSupplierBills()
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

        return response()->json([
            'success' => true,
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

        $bill = DB::transaction(function () use ($validated, $tenantId) {
            $supplier = \App\Models\Supplier::find($validated['supplier_id']);
            $category = \App\Models\ExpenseCategory::find($validated['expense_category_id']);

            $bill = \App\Models\SupplierBill::create([
                'tenant_id' => $tenantId,
                'supplier_id' => $validated['supplier_id'],
                'bill_number' => $validated['bill_number'],
                'date' => $validated['bill_date'],
                'due_date' => $validated['due_date'],
                'total_amount' => $validated['total_amount'],
                'status' => 'unpaid'
            ]);

            $expense = \App\Models\Expense::create([
                'tenant_id' => $tenantId,
                'expense_category_id' => $validated['expense_category_id'],
                'amount' => $validated['total_amount'],
                'date' => $validated['bill_date'],
                'reference' => $validated['bill_number'],
                'notes' => 'Bill logged for ' . $supplier->name
            ]);

            $apAccount = \App\Models\Account::where('tenant_id', $tenantId)->where('code', '2000')->first();
            if ($apAccount && $category->account_id) {
                $journalEntry = \App\Models\JournalEntry::create([
                    'tenant_id' => $tenantId,
                    'reference_number' => 'BILL-' . $bill->id,
                    'date' => $validated['bill_date'],
                    'description' => 'Supplier Bill: ' . $bill->bill_number . ' from ' . $supplier->name,
                    'status' => 'posted',
                ]);

                $journalEntry->lines()->create([
                    'account_id' => $category->account_id,
                    'debit' => $validated['total_amount'],
                    'credit' => 0,
                    'description' => 'Expense Recognized (Accrual)',
                ]);

                $journalEntry->lines()->create([
                    'account_id' => $apAccount->id,
                    'debit' => 0,
                    'credit' => $validated['total_amount'],
                    'description' => 'Accounts Payable (Liability)',
                ]);
            }
            return $bill;
        });

        return response()->json([
            'success' => true,
            'message' => 'Supplier bill logged successfully',
            'bill' => $bill,
        ]);
    }

    public function paySupplierBill(Request $request, $id)
    {
        $bill = \App\Models\SupplierBill::findOrFail($id);
        $remaining = $bill->total_amount - $bill->paid_amount;
        if ($remaining <= 0) {
            return response()->json(['success' => false, 'message' => 'This bill is already fully paid.'], 422);
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
                $bill->notes = $bill->notes ? $bill->notes . "\n" . $validated['notes'] : $validated['notes'];
            }
            $bill->status = ($bill->paid_amount >= $bill->total_amount) ? 'paid' : 'partial';
            $bill->save();

            $apAccount = \App\Models\Account::where('tenant_id', $tenantId)->where('code', '2000')->first();
            $cashAccount = \App\Models\Account::find($validated['cash_account_id']);

            if ($apAccount && $cashAccount) {
                $journalEntry = \App\Models\JournalEntry::create([
                    'tenant_id' => $tenantId,
                    'reference_number' => 'PAY-' . $bill->id . '-' . time(),
                    'date' => \Carbon\Carbon::now()->toDateString(),
                    'description' => 'Supplier Bill Payment: Bill ' . $bill->bill_number,
                    'status' => 'posted',
                ]);

                $journalEntry->lines()->create([
                    'account_id' => $apAccount->id,
                    'debit' => $validated['amount'],
                    'credit' => 0,
                    'description' => 'Accounts Payable Settled',
                ]);

                $journalEntry->lines()->create([
                    'account_id' => $cashAccount->id,
                    'debit' => 0,
                    'credit' => $validated['amount'],
                    'description' => 'Cash/Bank Payment',
                ]);
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Payment recorded successfully',
        ]);
    }

    /**
     * Budgets API.
     */
    public function getBudgets()
    {
        $tenantId = auth()->user()->tenant_id;
        $budgets = \App\Models\Budget::where('tenant_id', $tenantId)
            ->with(['items.account'])
            ->orderBy('start_date', 'desc')
            ->get();

        foreach($budgets as $budget) {
            $totalBudget = 0;
            $totalActual = 0;

            foreach($budget->items as $item) {
                $lines = \App\Models\JournalEntryLine::where('account_id', $item->account_id)
                    ->whereHas('journalEntry', function($q) use ($tenantId, $budget) {
                        $q->where('tenant_id', $tenantId)
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

                $item->actual = (double)$actual;
                $item->variance = (double)($item->amount - $actual);

                $totalBudget += $item->amount;
                $totalActual += $actual;
            }

            $budget->total_budget = (double)$totalBudget;
            $budget->total_actual = (double)$totalActual;
            $budget->total_variance = (double)($totalBudget - $totalActual);
        }

        $accounts = \App\Models\Account::where('tenant_id', $tenantId)
            ->whereIn('type', ['revenue', 'expense', 'cogs'])
            ->orderBy('type')
            ->orderBy('name')
            ->get();

        return response()->json([
            'success' => true,
            'budgets' => $budgets,
            'accounts' => $accounts,
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

        $budget = DB::transaction(function() use ($validated) {
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
            return $budget;
        });

        return response()->json([
            'success' => true,
            'message' => 'Budget created successfully',
            'budget' => $budget,
        ]);
    }

    public static function syncCompletedOrderBanking($order)
    {
        if (!$order || $order->status !== 'completed') return;

        $tenantId = $order->tenant_id;
        $bankAccountId = $order->bank_account_id;

        // If bank_account_id is missing, auto-assign default bank account by payment method
        if (!$bankAccountId) {
            $accountType = strtolower($order->payment_method ?? '') === 'cash' ? 'cash' : 'online';
            $defaultAccount = \App\Models\BankAccount::where('tenant_id', $tenantId)
                ->where(function($q) use ($accountType) {
                    $q->where('account_type', $accountType)
                      ->orWhere('account_type', 'checking');
                })
                ->first();
            if ($defaultAccount) {
                $bankAccountId = $defaultAccount->id;
                $order->bank_account_id = $bankAccountId;
                $order->save();
            }
        }

        if ($bankAccountId) {
            $bankAccount = \App\Models\BankAccount::find($bankAccountId);
            if ($bankAccount && class_exists(\App\Models\BankTransaction::class)) {
                $depositAmount = (float)($order->online_amount > 0 ? $order->online_amount : $order->cash_amount);
                if ($depositAmount <= 0) {
                    $depositAmount = (float)$order->grand_total;
                }
                if ($depositAmount <= 0) return;

                $refNo = $order->display_number ?: ($order->order_number ?: "#{$order->id}");

                // Check if BankTransaction already recorded for this order
                $existingTxn = \App\Models\BankTransaction::where('tenant_id', $tenantId)
                    ->where(function($q) use ($refNo, $order) {
                        $q->where('reference', $refNo)
                          ->orWhere('reference', "#{$order->id}")
                          ->orWhere('reference', $order->order_number);
                    })->first();

                if (!$existingTxn) {
                    $bankAccount->balance += $depositAmount;
                    $bankAccount->save();

                    \App\Models\BankTransaction::create([
                        'tenant_id' => $tenantId,
                        'bank_account_id' => $bankAccount->id,
                        'type' => 'deposit',
                        'amount' => $depositAmount,
                        'date' => $order->created_at ? $order->created_at->toDateString() : now()->toDateString(),
                        'reference' => $refNo,
                        'notes' => "POS Order Payment {$refNo} via " . strtoupper($bankAccount->account_type ?? 'ONLINE'),
                        'status' => 'reconciled'
                    ]);
                }
            }
        }
    }

    public static function syncAllPendingOrderBanking($tenantId)
    {
        if (!$tenantId) return;
        $orders = \App\Models\Order::where('tenant_id', $tenantId)->where('status', 'completed')->get();
        foreach ($orders as $order) {
            self::syncCompletedOrderBanking($order);
        }
    }

    /**
     * Banking API.
     */
    public function getBanking()
    {
        $tenantId = auth()->user()->tenant_id;
        self::syncAllPendingOrderBanking($tenantId);

        $accounts = \App\Models\BankAccount::where('tenant_id', $tenantId)->with('glAccount')->get();
        $transactions = \App\Models\BankTransaction::where('tenant_id', $tenantId)
            ->with('bankAccount')
            ->orderBy('created_at', 'desc')
            ->orderBy('date', 'desc')
            ->get()
            ->map(function($t) {
                return [
                    'id' => $t->id,
                    'bank_account_id' => $t->bank_account_id,
                    'type' => $t->type,
                    'amount' => (float)$t->amount,
                    'date' => $t->created_at ? $t->created_at->toIso8601String() : ($t->date ? \Carbon\Carbon::parse($t->date)->toIso8601String() : ''),
                    'reference' => $t->reference,
                    'notes' => $t->notes,
                    'status' => $t->status,
                    'bank_account' => $t->bankAccount,
                ];
            });

        return response()->json([
            'success' => true,
            'accounts' => $accounts,
            'transactions' => $transactions,
        ]);
    }

    public function storeBankAccount(Request $request)
    {
        try {
            $validated = $request->validate([
                'account_name' => 'required|string|max:255',
                'account_number' => 'nullable|string|max:255',
                'bank_name' => 'nullable|string|max:255',
                'account_type' => 'required|in:checking,cash,online',
                'balance' => 'required|numeric|min:0',
                'qr_code' => 'nullable|image|max:3072',
            ]);

            $tenantId = auth()->user()->tenant_id;

            $qrPath = null;
            if ($request->hasFile('qr_code')) {
                $qrPath = $request->file('qr_code')->store("tenants/{$tenantId}/bank_qrs", 'public');
            }

            if (!\Illuminate\Support\Facades\Schema::hasColumn('bank_accounts', 'qr_code')) {
                try {
                    \Illuminate\Support\Facades\Schema::table('bank_accounts', function (\Illuminate\Database\Schema\Blueprint $table) {
                        $table->string('qr_code')->nullable()->after('account_type');
                    });
                } catch (\Throwable $e) {}
            }

            $account = DB::transaction(function() use ($validated, $tenantId, $qrPath) {
                $glAccount = \App\Models\Account::create([
                    'tenant_id' => $tenantId,
                    'name' => $validated['account_name'] . ' (Bank)',
                    'code' => '100' . rand(10, 99),
                    'type' => 'asset',
                    'description' => 'Bank account for ' . ($validated['bank_name'] ?? '')
                ]);

                $data = [
                    'tenant_id' => $tenantId,
                    'account_name' => $validated['account_name'],
                    'account_number' => $validated['account_number'],
                    'bank_name' => $validated['bank_name'],
                    'account_type' => $validated['account_type'],
                    'gl_account_id' => $glAccount->id,
                    'balance' => $validated['balance'],
                ];

                if (\Illuminate\Support\Facades\Schema::hasColumn('bank_accounts', 'qr_code')) {
                    $data['qr_code'] = $qrPath;
                }

                return \App\Models\BankAccount::create($data);
            });

            return response()->json([
                'success' => true,
                'message' => 'Bank account created successfully',
                'account' => $account,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Server Error: ' . $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }

    public function updateBankAccount(Request $request, $id)
    {
        $account = \App\Models\BankAccount::findOrFail($id);

        $validated = $request->validate([
            'account_name' => 'required|string|max:255',
            'account_number' => 'nullable|string|max:255',
            'bank_name' => 'nullable|string|max:255',
            'account_type' => 'required|in:checking,cash,online',
            'balance' => 'required|numeric|min:0',
            'qr_code' => 'nullable|image|max:3072',
            'remove_qr' => 'nullable|boolean',
        ]);

        $tenantId = auth()->user()->tenant_id ?? $account->tenant_id;

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
        } else {
            unset($validated['qr_code']);
        }

        unset($validated['remove_qr']);

        if (array_key_exists('qr_code', $validated)) {
            if (!\Illuminate\Support\Facades\Schema::hasColumn('bank_accounts', 'qr_code')) {
                try {
                    \Illuminate\Support\Facades\Schema::table('bank_accounts', function (\Illuminate\Database\Schema\Blueprint $table) {
                        $table->string('qr_code')->nullable()->after('account_type');
                    });
                } catch (\Throwable $e) {
                    unset($validated['qr_code']);
                }
            }
        }

        DB::transaction(function() use ($account, $validated) {
            $account->update($validated);

            if ($account->glAccount) {
                $account->glAccount->update([
                    'name' => $validated['account_name'] . ' (Bank)',
                    'description' => 'Bank account for ' . ($validated['bank_name'] ?? '')
                ]);
            }
        });

        return response()->json([
            'success' => true,
            'message' => 'Bank account updated successfully',
            'account' => $account->fresh(),
        ]);
    }

    public function deleteBankAccount($id)
    {
        $account = \App\Models\BankAccount::findOrFail($id);

        if ($account->transactions()->exists()) {
            return response()->json(['success' => false, 'message' => 'Cannot delete account with existing transactions.'], 422);
        }

        if ($account->qr_code && \Illuminate\Support\Facades\Storage::disk('public')->exists($account->qr_code)) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($account->qr_code);
        }

        DB::transaction(function() use ($account) {
            if ($account->glAccount) {
                $account->glAccount->delete();
            }
            $account->delete();
        });

        return response()->json([
            'success' => true,
            'message' => 'Bank account deleted successfully',
        ]);
    }

    /**
     * Cash Register Counter API.
     */
    public function getCashCounter()
    {
        $tenantId = auth()->user()->tenant_id;
        $activeSession = \App\Models\CashRegisterSession::where('tenant_id', $tenantId)
            ->where('status', 'open')
            ->first();

        $cashSales = 0;
        $cashDeposits = 0;
        $cashWithdrawals = 0;

        if ($activeSession) {
            $cashSales = \App\Models\Order::where('tenant_id', $tenantId)
                ->where('status', 'completed')
                ->where('payment_method', 'cash')
                ->where('created_at', '>=', $activeSession->opened_at)
                ->sum('grand_total');

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

        return response()->json([
            'success' => true,
            'activeSession' => $activeSession,
            'cashSales' => (double)$cashSales,
            'cashDeposits' => (double)$cashDeposits,
            'cashWithdrawals' => (double)$cashWithdrawals,
            'previousSessions' => $previousSessions,
        ]);
    }

    public function openCashCounter(Request $request)
    {
        if (auth()->user()->role === 'waiter') {
            return response()->json(['success' => false, 'message' => 'Waiters are not authorized to manage cash counter sessions.'], 403);
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
            return response()->json(['success' => false, 'message' => 'A cash register session is already open.'], 422);
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

        return response()->json([
            'success' => true,
            'message' => 'Cash register opened successfully',
            'session' => $session,
        ]);
    }

    public function closeCashCounter(Request $request, $id)
    {
        if (auth()->user()->role === 'waiter') {
            return response()->json(['success' => false, 'message' => 'Waiters are not authorized to manage cash counter sessions.'], 403);
        }

        $session = \App\Models\CashRegisterSession::findOrFail($id);
        $request->validate([
            'closing_balance' => 'required|numeric|min:0',
            'notes' => 'nullable|string|max:500',
        ]);

        if ($session->status !== 'open') {
            return response()->json(['success' => false, 'message' => 'This register session is already closed.'], 422);
        }

        $tenantId = auth()->user()->tenant_id;

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
                $session->notes = $session->notes ? $session->notes . "\nClosing Notes: " . $request->notes : "Closing Notes: " . $request->notes;
            }
            $session->save();

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

        return response()->json([
            'success' => true,
            'message' => 'Cash register session closed successfully',
        ]);
    }

    /**
     * Fetch reports summary and breakdowns.
     */
    public function getReports(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;
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

        // Base Query scoped to completed orders of this tenant
        $baseQuery = Order::with(['table', 'items.menu', 'customer', 'bankAccount'])
            ->where('tenant_id', $tenantId)
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
                  ->orWhere('order_number', 'like', "%{$search}%")
                  ->orWhereHas('table', fn($tq) => $tq->where('table_number', 'like', "%{$search}%"))
                  ->orWhereHas('customer', fn($cq) => $cq->where('name', 'like', "%{$search}%"));
            });
        }

        if ($payment) {
            if ($payment === 'cash') {
                $baseQuery->where('cash_amount', '>', 0);
            } elseif ($payment === 'online') {
                $baseQuery->where('online_amount', '>', 0);
            }
        }

        $allOrders = (clone $baseQuery)->get();

        if ($payment === 'due') {
            $allOrders = $allOrders->filter(function($order) {
                return $order->grand_total > ($order->cash_amount + $order->online_amount);
            })->values();
        }

        $totalRevenue    = (double) $allOrders->sum('grand_total');
        $totalCash       = (double) $allOrders->sum('cash_amount');
        $totalOnline     = (double) $allOrders->sum('online_amount');
        $totalDue        = (double) $allOrders->sum(function($order) {
            return max(0, $order->grand_total - $order->cash_amount - $order->online_amount);
        });
        $totalTax        = (double) $allOrders->sum('tax_amount');
        $totalTips       = (double) $allOrders->sum('tip_amount');
        $totalDiscount   = (double) $allOrders->sum('discount_amount');
        $totalOrders     = $allOrders->count();
        $avgOrderValue   = $totalOrders > 0 ? $totalRevenue / $totalOrders : 0.0;
        $customersServed = (double) $allOrders->sum(function($order) {
            return max(1, (int)($order->guest_count ?: 1));
        });

        $avgSittingMins = (double) ($allOrders->avg(function($order) {
            $created = Carbon::parse($order->created_at);
            $updated = Carbon::parse($order->updated_at);
            return $created->diffInMinutes($updated);
        }) ?? 0);

        // Hourly Sales
        $hourlySalesRaw = $allOrders->groupBy(function($order) {
            return Carbon::parse($order->created_at)->format('gA');
        })->map(function($orders) {
            return $orders->sum('grand_total');
        });

        $hourlySales = [];
        for ($h = 8; $h <= 21; $h++) {
            $time = Carbon::createFromTime($h, 0, 0)->format('gA');
            $hourlySales[] = [
                'hour' => $time,
                'sales' => (double)($hourlySalesRaw->get($time) ?? 0.0),
            ];
        }

        // Top Items & Category Breakdown
        $orderIds = $allOrders->pluck('id');
        $allItems = OrderItem::whereIn('order_id', $orderIds)->with('menu')->get();

        $categoryBreakdown = $allItems->groupBy(function($item) {
            return $item->menu ? ($item->menu->category ?: 'Uncategorized') : 'Uncategorized';
        })->map(function($items, $categoryName) {
            return [
                'category' => $categoryName,
                'revenue' => (double)$items->sum(function($item) {
                    return $item->quantity * $item->price;
                }),
                'orders' => $items->groupBy('order_id')->count(),
            ];
        })->sortByDesc('revenue')->values()->toArray();

        $topItems = $allItems->groupBy('menu_id')->map(function($items) {
            $menu = $items->first()->menu;
            $qty = (double)$items->sum('quantity');
            $rev = (double)$items->sum(function($item) {
                return $item->quantity * $item->price;
            });
            return [
                'menu_id' => $items->first()->menu_id,
                'name' => $menu ? $menu->name : 'Unknown Product',
                'category' => $menu ? ($menu->category ?: 'N/A') : 'N/A',
                'qty' => $qty,
                'total_quantity' => $qty,
                'revenue' => $rev,
                'total_revenue' => $rev,
            ];
        })->sortByDesc('qty')->take(10)->values()->toArray();

        // Table Sales
        $tableSales = $allOrders->filter(function($order) {
            return $order->table_id !== null;
        })->groupBy('table_id')->map(function($orders) {
            $table = $orders->first()->table;
            $revenue = (double)$orders->sum('grand_total');
            return [
                'table_id' => $orders->first()->table_id,
                'table_number' => $table ? $table->table_number : 'N/A',
                'order_count' => $orders->count(),
                'total_revenue' => $revenue,
                'avg_order_value' => $orders->count() > 0 ? $revenue / $orders->count() : 0.0,
            ];
        })->sortByDesc('total_revenue')->values()->toArray();

        // Payment Sales
        $paymentSales = $allOrders->groupBy(function($order) {
            if ($order->bank_account_id && $order->bankAccount) {
                return $order->bankAccount->account_name;
            }
            if ($order->cash_amount > 0 && $order->online_amount == 0) return 'Cash';
            if ($order->online_amount > 0 && $order->cash_amount == 0) return 'Online / Digital';
            if ($order->grand_total > ($order->cash_amount + $order->online_amount)) return 'Customer Credit / Due';
            return 'Split Payment';
        })->map(function($orders, $name) {
            $revenue = (double)$orders->sum('grand_total');
            return [
                'name' => $name,
                'order_count' => $orders->count(),
                'total_revenue' => $revenue,
                'avg_order_value' => $orders->count() > 0 ? $revenue / $orders->count() : 0.0,
            ];
        })->sortByDesc('total_revenue')->values()->toArray();

        // Transactions List
        $transactions = $allOrders->map(function($o) {
            $created = Carbon::parse($o->created_at);
            $updated = Carbon::parse($o->updated_at);
            $diffMins = $created->diffInMinutes($updated);
            $durationStr = $diffMins < 60 ? "{$diffMins}m" : floor($diffMins / 60) . 'h ' . ($diffMins % 60) . 'm';

            $due = max(0, $o->grand_total - $o->cash_amount - $o->online_amount);
            $payLabel = 'Cash';
            if ($due > 0.01) {
                $payLabel = 'Due: Rs. ' . number_format($due, 2);
            } elseif ($o->online_amount > 0 && $o->cash_amount > 0) {
                $payLabel = 'Split: Cash/Online';
            } elseif ($o->online_amount > 0) {
                $payLabel = 'Online: Rs. ' . number_format($o->online_amount, 2);
            } else {
                $payLabel = 'Cash: Rs. ' . number_format($o->cash_amount, 2);
            }

            return [
                'id' => $o->id,
                'order_number' => $o->display_number,
                'table_number' => $o->table ? 'Table ' . $o->table->table_number : '-',
                'customer_name' => $o->customer ? $o->customer->name : '-',
                'ordered_at' => $created->format('M d, Y, h:i A'),
                'completed_at' => $updated->format('M d, Y, h:i A'),
                'duration' => $durationStr,
                'discount' => (double)$o->discount_amount,
                'tax' => (double)$o->tax_amount,
                'total' => (double)$o->grand_total,
                'payment' => $payLabel,
            ];
        })->values()->toArray();

        // All Tables & Menus for filter dropdowns
        $allTables = \App\Models\Table::where('tenant_id', $tenantId)->orderBy('table_number')->get(['id', 'table_number'])->map(fn($t) => [
            'id' => $t->id,
            'table_number' => 'Table ' . $t->table_number,
        ]);

        $allMenus = \App\Models\Menu::where('tenant_id', $tenantId)->orderBy('name')->get(['id', 'name'])->map(fn($m) => [
            'id' => $m->id,
            'name' => $m->name,
        ]);

        return response()->json([
            'success' => true,
            'stats' => [
                'revenue' => (double)$totalRevenue,
                'total_revenue' => (double)$totalRevenue,
                'cash_collected' => (double)$totalCash,
                'total_cash' => (double)$totalCash,
                'online_payments' => (double)$totalOnline,
                'total_online' => (double)$totalOnline,
                'customer_due' => (double)$totalDue,
                'total_due' => (double)$totalDue,
                'total_tax' => (double)$totalTax,
                'tips_collected' => (double)$totalTips,
                'total_tips' => (double)$totalTips,
                'discounts' => (double)$totalDiscount,
                'total_discount' => (double)$totalDiscount,
                'orders' => (double)$totalOrders,
                'total_orders' => (double)$totalOrders,
                'avgOrderValue' => (double)$avgOrderValue,
                'avg_sitting_mins' => $avgSittingMins,
                'customersServed' => (double)$customersServed,
            ],
            'hourly_sales' => $hourlySales,
            'category_breakdown' => $categoryBreakdown,
            'payment_split' => [
                'cash_amount' => (double)$totalCash,
                'cash_pct' => $totalRevenue > 0 ? (double)($totalCash / $totalRevenue) : 0.0,
                'card_amount' => (double)$totalOnline,
                'card_pct' => $totalRevenue > 0 ? (double)($totalOnline / $totalRevenue) : 0.0,
                'credit_amount' => (double)$totalDue,
                'credit_pct' => $totalRevenue > 0 ? (double)($totalDue / $totalRevenue) : 0.0,
            ],
            'top_items' => $topItems,
            'table_sales' => $tableSales,
            'payment_sales' => $paymentSales,
            'transactions' => $transactions,
            'all_tables' => $allTables,
            'all_menus' => $allMenus,
        ]);
    }

    /**
     * Export reports details to CSV formatted text payload.
     */
    public function exportReports(Request $request)
    {
        $tenantId = auth()->user()->tenant_id;
        $period   = $request->input('period', 'today');

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
                $endDate   = Carbon::now()->endOfDay();
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

        $orders = Order::with(['table', 'customer'])
            ->where('status', 'completed')
            ->whereBetween('updated_at', [$startDate, $endDate])
            ->latest('updated_at')
            ->get();

        $columns = [
            'Order #', 'Table', 'Customer', 'Ordered At', 'Completed At',
            'Duration (Mins)', 'Discount', 'Tax', 'Grand Total', 'Cash Amount', 'Online Amount', 'Due Amount'
        ];

        $csvContent = implode(',', $columns) . "\n";

        foreach ($orders as $order) {
            $duration = $order->created_at && $order->updated_at
                ? max(0, (new Carbon($order->updated_at))->diffInMinutes(new Carbon($order->created_at)))
                : 0;

            $due = max(0, $order->grand_total - ($order->cash_amount ?? 0) - ($order->online_amount ?? 0));

            $row = [
                $order->order_number ?: $order->id,
                $order->table ? 'Table ' . $order->table->table_number : '-',
                $order->customer ? $order->customer->name : '-',
                $order->created_at ? $order->created_at->format('Y-m-d h:i A') : '-',
                $order->updated_at ? $order->updated_at->format('Y-m-d h:i A') : '-',
                $duration,
                $order->discount_amount ?: 0,
                $order->tax_amount ?: 0,
                $order->grand_total ?: 0,
                $order->cash_amount ?? 0,
                $order->online_amount ?? 0,
                $due > 0.01 ? round($due, 2) : 0
            ];

            // Quote values to prevent CSV issues
            $quotedRow = array_map(function($val) {
                return '"' . str_replace('"', '""', $val) . '"';
            }, $row);

            $csvContent .= implode(',', $quotedRow) . "\n";
        }

        return response()->json([
            'success' => true,
            'csv' => $csvContent,
            'filename' => "financial_report_{$period}_" . now()->format('Ymd_His') . ".csv"
        ]);
    }

    /**
     * Get taxes list.
     */
    public function getTaxes()
    {
        $taxes = \App\Models\Tax::latest()->get();
        return response()->json([
            'success' => true,
            'taxes' => $taxes,
        ]);
    }

    /**
     * Store new tax.
     */
    public function storeTax(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'rate' => 'required|numeric|min:0|max:100',
            'status' => 'boolean',
        ]);

        $validated['tenant_id'] = auth()->user()->tenant_id;
        $validated['branch_id'] = auth()->user()->primary_branch_id;

        $tax = \App\Models\Tax::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Tax created successfully',
            'tax' => $tax,
        ]);
    }

    /**
     * Update tax.
     */
    public function updateTax(Request $request, $id)
    {
        $tax = \App\Models\Tax::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'rate' => 'required|numeric|min:0|max:100',
            'status' => 'boolean',
        ]);

        $tax->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Tax updated successfully',
            'tax' => $tax,
        ]);
    }

    /**
     * Delete tax.
     */
    public function deleteTax($id)
    {
        $tax = \App\Models\Tax::findOrFail($id);
        $tax->delete();

        return response()->json([
            'success' => true,
            'message' => 'Tax deleted successfully',
        ]);
    }

    /**
     * Get tenant subscription info, plans, payment methods, and pending requests.
     */
    public function getSubscription()
    {
        $user = auth()->user();
        $tenant = \App\Models\Tenant::with('subscription.plan')->findOrFail($user->tenant_id);
        
        $pendingRequest = \App\Models\PaymentRequest::where('tenant_id', $user->tenant_id)
            ->where('status', 'pending')
            ->with(['plan', 'paymentMethod'])
            ->first();
            
        $paymentMethods = \App\Models\PaymentMethod::where('is_active', true)->get()->map(function ($pm) {
            $qrUrl = null;
            if ($pm->qr_code) {
                // Use API proxy URL to avoid CORS issues on Flutter Web
                // The proxy endpoint serves the image with Access-Control-Allow-Origin: *
                $qrUrl = rtrim(config('app.url'), '/') . '/api/payment-method/' . $pm->id . '/qr';
            }
            return [
                'id'         => $pm->id,
                'type'       => $pm->type,
                'title'      => $pm->title,
                'details'    => $pm->details,
                'is_active'  => $pm->is_active,
                'qr_code_url'=> $qrUrl,
            ];
        });
        $plans = \App\Models\Plan::where('is_active', true)->get();

        $trial = null;
        if ($tenant->trial_ends_at) {
            $now = \Carbon\Carbon::now();
            $endsAt = \Carbon\Carbon::parse($tenant->trial_ends_at);
            $isExpired = $now->greaterThan($endsAt);
            $trial = [
                'ends_at' => $endsAt->toIso8601String(),
                'days_remaining' => $isExpired ? 0 : (int) ceil($now->floatDiffInDays($endsAt)),
                'is_expired' => $isExpired,
            ];
        }

        $subscription = null;
        if ($tenant->subscription) {
            $subscription = [
                'id' => $tenant->subscription->id,
                'plan_id' => $tenant->subscription->plan_id,
                'plan_name' => $tenant->subscription->plan ? $tenant->subscription->plan->name : 'N/A',
                'status' => $tenant->subscription->status,
                'billing_cycle' => $tenant->subscription->billing_cycle,
                'amount_paid' => $tenant->subscription->amount_paid,
                'start_date' => $tenant->subscription->start_date ? $tenant->subscription->start_date->format('Y-m-d') : null,
                'ends_at' => $tenant->subscription->ends_at ? $tenant->subscription->ends_at->format('Y-m-d') : null,
                'is_expired' => $tenant->subscription->is_expired,
            ];
        }

        return response()->json([
            'success' => true,
            'plans' => $plans,
            'payment_methods' => $paymentMethods,
            'pending_request' => $pendingRequest,
            'subscription' => $subscription,
            'trial' => $trial,
        ]);
    }

    /**
     * Submit a payment verification checkout request.
     */
    public function checkoutSubscription(\Illuminate\Http\Request $request)
    {
        $user = auth()->user();
        $tenantId = $user->tenant_id;

        // Check if there is already a pending request
        $existing = \App\Models\PaymentRequest::where('tenant_id', $tenantId)
            ->where('status', 'pending')
            ->first();

        if ($existing) {
            return response()->json([
                'success' => false,
                'message' => 'You already have a pending verification request. Please cancel it before submitting a new one.',
            ], 422);
        }

        $request->validate([
            'plan_id' => 'required|exists:plans,id',
            'billing_cycle' => 'required|string|in:monthly,3_months,6_months,yearly,24_months',
            'amount' => 'required|numeric|min:0',
            'payment_method_id' => 'required|exists:payment_methods,id',
            'reference_number' => 'required|string|max:255',
            'receipt' => 'required|image|max:5120', // Max 5MB
            'notes' => 'nullable|string|max:1000',
        ]);

        $receiptPath = null;
        if ($request->hasFile('receipt')) {
            $receiptPath = $request->file('receipt')->store("tenants/{$tenantId}/receipts", 'public');
        }

        $paymentRequest = \App\Models\PaymentRequest::create([
            'tenant_id' => $tenantId,
            'plan_id' => $request->plan_id,
            'billing_cycle' => $request->billing_cycle,
            'amount' => $request->amount,
            'payment_method_id' => $request->payment_method_id,
            'reference_number' => $request->reference_number,
            'receipt_path' => $receiptPath,
            'notes' => $request->notes,
            'status' => 'pending',
        ]);

        // Load relations for response
        $paymentRequest->load(['plan', 'paymentMethod']);

        return response()->json([
            'success' => true,
            'message' => 'Your payment verification request has been submitted successfully.',
            'pending_request' => $paymentRequest,
        ]);
    }

    /**
     * Cancel a pending checkout request.
     */
    public function cancelSubscriptionRequest($id)
    {
        $user = auth()->user();
        $request = \App\Models\PaymentRequest::where('tenant_id', $user->tenant_id)
            ->where('status', 'pending')
            ->findOrFail($id);

        if ($request->receipt_path) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($request->receipt_path);
        }

        $request->delete();

        return response()->json([
            'success' => true,
            'message' => 'Your verification request has been cancelled.',
        ]);
    }

    /**
     * Proxy payment method QR image through API to bypass CORS on Flutter Web.
     */
    public function getPaymentMethodQr($id)
    {
        $pm = \App\Models\PaymentMethod::findOrFail($id);

        if (!$pm->qr_code) {
            return response()->json(['error' => 'No QR code'], 404);
        }

        $path = storage_path('app/public/' . $pm->qr_code);

        if (!file_exists($path)) {
            return response()->json(['error' => 'QR image not found'], 404);
        }

        $mime = mime_content_type($path) ?: 'image/png';

        return response()->file($path, [
            'Content-Type'                => $mime,
            'Access-Control-Allow-Origin' => '*',
            'Cache-Control'               => 'public, max-age=86400',
        ]);
    }

    /**
     * Get branches.
     */
    public function getBranches()
    {
        $tenantId = auth()->user()->tenant_id;
        $branches = \App\Models\Branch::where('tenant_id', $tenantId)->get();

        return response()->json([
            'success' => true,
            'branches' => $branches,
            'primary_branch_id' => auth()->user()->primary_branch_id,
        ]);
    }

    /**
     * Store new branch.
     */
    public function storeBranch(\Illuminate\Http\Request $request)
    {
        $tenant = auth()->user()->tenant;
        if ($tenant->hasLimitReached('max_branches')) {
            return response()->json([
                'success' => false,
                'message' => 'You have reached the maximum number of branches allowed by your subscription plan.',
            ], 422);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:500',
            'phone' => 'nullable|string|max:50',
            'is_active' => 'required|boolean',
        ]);

        $tenantId = auth()->user()->tenant_id;
        $branch = \App\Models\Branch::create(array_merge($validated, ['tenant_id' => $tenantId]));

        return response()->json([
            'success' => true,
            'message' => 'Branch created successfully.',
            'branch' => $branch,
        ]);
    }

    /**
     * Update branch.
     */
    public function updateBranch(\Illuminate\Http\Request $request, $id)
    {
        $branch = \App\Models\Branch::where('tenant_id', auth()->user()->tenant_id)->findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50',
            'address' => 'nullable|string|max:500',
            'phone' => 'nullable|string|max:50',
            'is_active' => 'required|boolean',
        ]);

        $branch->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Branch updated successfully.',
            'branch' => $branch,
        ]);
    }

    /**
     * Delete branch.
     */
    public function deleteBranch($id)
    {
        $branch = \App\Models\Branch::where('tenant_id', auth()->user()->tenant_id)->findOrFail($id);

        // Check if there are tables or orders associated
        if ($branch->tables()->exists() || $branch->orders()->exists()) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete branch because it has associated tables or orders.',
            ], 422);
        }

        $branch->delete();

        return response()->json([
            'success' => true,
            'message' => 'Branch deleted successfully.',
        ]);
    }

    /**
     * Switch active branch context.
     */
    public function switchBranch(\Illuminate\Http\Request $request)
    {
        $request->validate([
            'branch_id' => 'required|exists:branches,id',
        ]);

        $user = auth()->user();
        $branchId = $request->branch_id;

        // Security check
        $hasAccess = false;
        if ($user->role === 'super_admin') {
            $hasAccess = true;
        } elseif ($user->role === 'admin') {
            $hasAccess = \App\Models\Branch::where('id', $branchId)->where('tenant_id', $user->tenant_id)->exists();
        } else {
            $hasAccess = $user->branches()->where('branches.id', $branchId)->exists();
        }

        if (!$hasAccess) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to access this branch.',
            ], 403);
        }

        $user->update(['primary_branch_id' => $branchId]);

        return response()->json([
            'success' => true,
            'message' => 'Switched branch successfully.',
            'primary_branch_id' => $branchId,
        ]);
    }

    /**
     * Get support tickets.
     */
    public function getSupportTickets()
    {
        $tickets = \App\Models\Ticket::with(['latestMessage', 'user'])
            ->where('tenant_id', auth()->user()->tenant_id)
            ->latest()
            ->get();

        return response()->json([
            'success' => true,
            'tickets' => $tickets,
        ]);
    }

    /**
     * Store new support ticket.
     */
    public function storeSupportTicket(\Illuminate\Http\Request $request)
    {
        $request->validate([
            'subject' => 'required|string|max:255',
            'priority' => 'required|in:low,medium,high',
            'message' => 'required|string',
        ]);

        $ticket = \App\Models\Ticket::create([
            'tenant_id' => auth()->user()->tenant_id,
            'user_id' => auth()->id(),
            'subject' => $request->subject,
            'priority' => $request->priority,
            'status' => 'open',
        ]);

        $ticket->messages()->create([
            'user_id' => auth()->id(),
            'message' => $request->message,
            'is_superadmin_reply' => false,
        ]);

        $ticket->load(['messages.user', 'user']);

        return response()->json([
            'success' => true,
            'message' => 'Support ticket opened successfully.',
            'ticket' => $ticket,
        ]);
    }

    /**
     * Show ticket.
     */
    public function showSupportTicket($id)
    {
        $ticket = \App\Models\Ticket::where('tenant_id', auth()->user()->tenant_id)
            ->with(['messages.user', 'user'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'ticket' => $ticket,
        ]);
    }

    /**
     * Reply to ticket.
     */
    public function replySupportTicket(\Illuminate\Http\Request $request, $id)
    {
        $ticket = \App\Models\Ticket::where('tenant_id', auth()->user()->tenant_id)->findOrFail($id);

        if ($ticket->status === 'closed') {
            return response()->json([
                'success' => false,
                'message' => 'Cannot reply to a closed ticket.',
            ], 422);
        }

        $request->validate([
            'message' => 'required|string',
        ]);

        $reply = $ticket->messages()->create([
            'user_id' => auth()->id(),
            'message' => $request->message,
            'is_superadmin_reply' => false,
        ]);

        if ($ticket->status === 'resolved') {
            $ticket->update(['status' => 'open']);
        }

        $reply->load('user');

        return response()->json([
            'success' => true,
            'message' => 'Reply sent successfully.',
            'reply' => $reply,
        ]);
    }

    /**
     * Update ticket status.
     */
    public function updateSupportTicketStatus(\Illuminate\Http\Request $request, $id)
    {
        $ticket = \App\Models\Ticket::where('tenant_id', auth()->user()->tenant_id)->findOrFail($id);

        $request->validate([
            'status' => 'required|in:open,in_progress,resolved,closed',
        ]);

        $ticket->update(['status' => $request->status]);

        return response()->json([
            'success' => true,
            'message' => 'Ticket status updated successfully.',
            'ticket' => $ticket,
        ]);
    }

    /**
     * Get staff performance analytics.
     */
    public function getStaffPerformance()
    {
        // MongoDB-compatible approach - fetch and calculate in PHP
        $staff = \App\Models\User::with(['shifts' => function($q) {
                $q->whereNotNull('clock_out_at');
            }])
            ->where('tenant_id', auth()->user()->tenant_id)
            ->get()
            ->map(function($user) {
                $totalMinutes = $user->shifts->reduce(function($carry, $shift) {
                    return $carry + \Carbon\Carbon::parse($shift->clock_in_at)->diffInMinutes($shift->clock_out_at);
                }, 0);

                $orders = \App\Models\Order::where('waiter_id', $user->id)->where('status', 'completed')->get();

                // Calculate average order duration in PHP instead of SQL
                $avgOrderMins = 0;
                if ($orders->count() > 0) {
                    $avgOrderMins = $orders->avg(function($order) {
                        $created = \Carbon\Carbon::parse($order->created_at);
                        $updated = \Carbon\Carbon::parse($order->updated_at);
                        return $created->diffInMinutes($updated);
                    });
                }
                
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'shifts_count' => $user->shifts->count(),
                    'total_hours' => round($totalMinutes / 60, 2),
                    'total_orders' => $orders->count(),
                    'total_sales' => (float)$orders->sum('grand_total'),
                    'total_tips' => (float)$orders->sum('tip_amount'),
                    'avg_order_duration' => (float)round($avgOrderMins),
                ];
            });

        return response()->json([
            'success' => true,
            'staff' => $staff,
        ]);
    }

    /**
     * Create a new staff member.
     */
    public function createStaff(Request $request)
    {
        $tenant = auth()->user()->tenant;
        if ($tenant->hasLimitReached('max_users')) {
            return response()->json([
                'success' => false,
                'message' => 'You have reached the maximum number of staff users allowed by your subscription plan.'
            ], 403);
        }

        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users',
                'password' => 'required|string|min:8',
                'role' => ['required', \Illuminate\Validation\Rule::in(['admin', 'staff', 'cashier', 'waiter', 'kitchen'])],
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        }

        $user = \App\Models\User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => \Illuminate\Support\Facades\Hash::make($validated['password']),
            'role' => $validated['role'],
            'primary_branch_id' => auth()->user()->primary_branch_id,
        ]);

        \App\Models\ActivityLog::record('created', "Added new staff member: {$user->name} ({$user->role})", $user);

        return response()->json([
            'success' => true,
            'message' => 'Staff member added successfully.',
            'staff' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'shifts_count' => 0,
                'total_hours' => 0.0,
                'total_orders' => 0,
                'total_sales' => 0.0,
                'total_tips' => 0.0,
                'avg_order_duration' => 0.0,
            ]
        ]);
    }

    /**
     * Update an existing staff member.
     */
    public function updateStaff(Request $request, $id)
    {
        $staff = \App\Models\User::find($id);
        if (!$staff) {
            return response()->json([
                'success' => false,
                'message' => 'Staff member not found.'
            ], 404);
        }

        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => ['required', 'string', 'email', 'max:255', \Illuminate\Validation\Rule::unique('users')->ignore($staff->id)],
                'role' => ['required', \Illuminate\Validation\Rule::in(['admin', 'staff', 'cashier', 'waiter', 'kitchen'])],
                'password' => 'nullable|string|min:8',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        }

        $staff->name = $validated['name'];
        $staff->email = $validated['email'];
        $staff->role = $validated['role'];

        if ($request->filled('password')) {
            $staff->password = \Illuminate\Support\Facades\Hash::make($validated['password']);
        }

        $staff->save();

        \App\Models\ActivityLog::record('updated', "Updated staff member details: {$staff->name}", $staff);

        return response()->json([
            'success' => true,
            'message' => 'Staff member updated successfully.',
            'staff' => [
                'id' => $staff->id,
                'name' => $staff->name,
                'email' => $staff->email,
                'role' => $staff->role,
            ]
        ]);
    }

    /**
     * Delete an existing staff member.
     */
    public function deleteStaff($id)
    {
        $staff = \App\Models\User::find($id);
        if (!$staff) {
            return response()->json([
                'success' => false,
                'message' => 'Staff member not found.'
            ], 404);
        }

        // Prevent deleting yourself if you are the current user
        if (auth()->id() === $staff->id) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot delete your own account.'
            ], 403);
        }

        $name = $staff->name;
        $staff->delete();

        \App\Models\ActivityLog::record('deleted', "Removed staff member: {$name}");

        return response()->json([
            'success' => true,
            'message' => 'Staff member removed successfully.'
        ]);
    }
    // ==========================================
    // LOYALTY REWARDS API
    // ==========================================

    public function loyaltyRewards(Request $request)
    {
        $rewards = \App\Models\LoyaltyReward::latest()->get();
        return response()->json([
            'success' => true,
            'data' => $rewards
        ]);
    }

    public function createLoyaltyReward(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'description' => 'nullable|string',
            'points_required' => 'required_if:type,gift|nullable|integer|min:0',
            'type' => 'required|in:gift,discount,voucher',
            'menu_item_id' => 'required_if:type,gift|nullable|exists:menus,id',
            'discount_type' => 'required_if:type,discount,voucher|nullable|in:percentage,fixed',
            'discount_value' => 'required_if:type,discount,voucher|nullable|numeric|min:0.01',
            'code' => 'required_if:type,voucher|nullable|string',
            'status' => 'boolean',
            'image' => 'nullable'
        ]);

        if ($validated['type'] === 'gift') {
            $validated['discount_type'] = null;
            $validated['discount_value'] = null;
            $validated['code'] = null;
        }

        $reward = \App\Models\LoyaltyReward::create($validated);
        
        return response()->json([
            'success' => true,
            'message' => 'Reward created successfully',
            'data' => $reward->load('menuItem')
        ]);
    }

    public function updateLoyaltyReward(Request $request, $id)
    {
        $reward = \App\Models\LoyaltyReward::findOrFail($id);
        $validated = $request->validate([
            'name' => 'sometimes|string',
            'description' => 'nullable|string',
            'points_required' => 'nullable|integer|min:0',
            'type' => 'sometimes|in:gift,discount,voucher',
            'menu_item_id' => 'nullable|exists:menus,id',
            'discount_type' => 'nullable|in:percentage,fixed',
            'discount_value' => 'nullable|numeric|min:0.01',
            'code' => 'nullable|string',
            'status' => 'boolean',
        ]);

        if (isset($validated['type']) && $validated['type'] === 'gift') {
            $validated['discount_type'] = null;
            $validated['discount_value'] = null;
            $validated['code'] = null;
        }

        $reward->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Reward updated successfully',
            'data' => $reward->load('menuItem')
        ]);
    }

    public function deleteLoyaltyReward($id)
    {
        $reward = \App\Models\LoyaltyReward::findOrFail($id);
        $reward->delete();
        return response()->json([
            'success' => true,
            'message' => 'Reward deleted successfully'
        ]);
    }

    public function toggleLoyaltyRewardStatus($id)
    {
        $reward = \App\Models\LoyaltyReward::findOrFail($id);
        $reward->update(['status' => !$reward->status]);
        return response()->json([
            'success' => true,
            'message' => 'Reward status toggled successfully',
            'data' => $reward->load('menuItem')
        ]);
    }

    public function redeemLoyaltyReward(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'required|exists:customers,id',
            'reward_id' => 'required|exists:loyalty_rewards,id',
        ]);

        $customer = \App\Models\Customer::findOrFail($validated['customer_id']);
        $reward = \App\Models\LoyaltyReward::findOrFail($validated['reward_id']);

        if (!$reward->status) {
            return response()->json(['success' => false, 'message' => 'Reward is currently inactive.'], 400);
        }

        if ($customer->loyalty_points < $reward->points_required) {
            return response()->json(['success' => false, 'message' => 'Insufficient loyalty points.'], 400);
        }

        // Deduct points
        $customer->decrement('loyalty_points', $reward->points_required);

        \App\Models\ActivityLog::record('redeemed', "Customer {$customer->name} redeemed reward: {$reward->name}");

        return response()->json([
            'success' => true,
            'message' => 'Reward redeemed successfully',
            'data' => [
                'customer_points' => $customer->loyalty_points,
                'reward' => $reward
            ]
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = Auth::user();
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:20',
            'password' => 'nullable|string|min:6',
        ]);

        $user->name = $validated['name'];
        $user->email = $validated['email'];
        if (isset($validated['phone'])) {
            $user->phone = $validated['phone'];
        }
        if (!empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }
        $user->save();

        // Record activity log
        \App\Models\ActivityLog::record('updated', "Updated profile details", $user);

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'tenant_id' => $user->tenant_id,
                'primary_branch_id' => $user->primary_branch_id,
                'email_verified_at' => $user->email_verified_at ? $user->email_verified_at->toIso8601String() : null,
                'is_verified' => $user->hasVerifiedEmail(),
            ]
        ]);
    }

    public function recordCustomerPayment(Request $request, $id)
    {
        $customer = \App\Models\Customer::findOrFail($id);
        
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'note' => 'nullable|string|max:255',
        ]);

        $amount = (float)$validated['amount'];

        // Deduct from customer due_amount
        $customer->decrement('due_amount', $amount);

        // Record a CreditTransaction record of type 'payment'
        $transaction = \App\Models\CreditTransaction::create([
            'tenant_id' => $customer->tenant_id,
            'branch_id' => $customer->branch_id,
            'customer_id' => $customer->id,
            'order_id' => null,
            'type' => 'payment',
            'amount' => $amount,
            'note' => $validated['note'] ?? "Payment received",
        ]);

        // Record ActivityLog
        \App\Models\ActivityLog::record(
            'payment',
            "Recorded payment of Rs. {$amount} from customer {$customer->name}",
            $customer,
            ['amount' => $amount]
        );

        return response()->json([
            'success' => true,
            'message' => 'Payment recorded successfully',
            'data' => [
                'due_amount' => (float)$customer->due_amount,
                'transaction' => [
                    'id' => $transaction->id,
                    'type' => $transaction->type,
                    'amount' => (float)$transaction->amount,
                    'note' => $transaction->note,
                    'created_at' => $transaction->created_at->toIso8601String(),
                    'time' => $transaction->created_at->diffForHumans(),
                ]
            ]
        ]);
    }

    public function getTableQr(Request $request, $id)
    {
        $table = \App\Models\Table::findOrFail($id);
        $tenant = auth()->user()->tenant;
        $slug = $tenant->slug ?? 'default';

        // URL format: https://cafe.kitetool.com/{slug}/qro/{table_number}
        $appUrl = config('app.url', 'https://cafe.kitetool.com');
        $qrUrl = rtrim($appUrl, '/') . "/{$slug}/qro/{$table->table_number}";

        return response()->json([
            'success' => true,
            'table_id' => $table->id,
            'table_number' => $table->table_number,
            'qr_url' => $qrUrl,
            'qr_image_url' => "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=" . urlencode($qrUrl),
        ]);
    }

    /**
     * Delete tenant and purge all associated data (Superadmin API)
     */
    public function deleteTenant(Request $request, $id)
    {
        $user = Auth::user();
        if ($user->role !== 'super_admin') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Superadmin permission required.',
            ], 403);
        }

        $tenant = \App\Models\Tenant::find($id);
        if (!$tenant) {
            return response()->json([
                'success' => false,
                'message' => 'Cafe/Tenant not found.',
            ], 404);
        }

        try {
            $tenantName = $tenant->name;
            $tenantId = $tenant->id;
            $tenant->purgeAllData();

            return response()->json([
                'success' => true,
                'message' => "Cafe '{$tenantName}' (ID: {$tenantId}) and all associated data were successfully purged from the database.",
            ]);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error("Failed to delete tenant {$id} via API: " . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete cafe: ' . $e->getMessage(),
            ], 500);
        }
    }
}



