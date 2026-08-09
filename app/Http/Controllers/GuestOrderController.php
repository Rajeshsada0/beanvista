<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Menu;
use App\Models\Table;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Reservation;
use App\Models\LoyaltyReward;
use App\Models\ActivityLog;
use Inertia\Inertia;
use Illuminate\Validation\Rule;

class GuestOrderController extends Controller
{
    public function showMenu($tenantSlug, $tableNumber)
    {
        $tenant = \App\Models\Tenant::where('slug', $tenantSlug)->firstOrFail();
        
        $table = Table::withoutGlobalScope(\App\Models\Scopes\TenantScope::class)
            ->where('tenant_id', $tenant->id)
            ->where('table_number', $tableNumber)
            ->firstOrFail();

        $menus = Menu::withoutGlobalScope(\App\Models\Scopes\TenantScope::class)
            ->where('tenant_id', $tenant->id)
            ->where('status', true)
            ->get();

        $rewards = LoyaltyReward::withoutGlobalScope(\App\Models\Scopes\TenantScope::class)
            ->where('tenant_id', $tenant->id)
            ->where('status', true)
            ->with('menuItem')
            ->get();

        $currentOrder = Order::withoutGlobalScope(\App\Models\Scopes\TenantScope::class)
            ->where('tenant_id', $tenant->id)
            ->where('table_id', $table->id)
            ->whereNotIn('status', ['completed', 'cancelled'])
            ->with('items.menu', 'customer')
            ->latest()
            ->first();

        if (!$currentOrder) {
            $currentOrder = Order::withoutGlobalScope(\App\Models\Scopes\TenantScope::class)
                ->where('tenant_id', $tenant->id)
                ->where('table_id', $table->id)
                ->where('status', 'cancelled')
                ->with('items.menu', 'customer')
                ->latest()
                ->first();
        }

        // PERSISTENCE & CLEANUP:
        $persistedCustomer = null;
        $guestSessionId = session('guest_customer_id');

        if (!$currentOrder) {
            // Check if the last order for this table was COMPLETED by this guest
            $lastOrder = Order::where('table_id', $table->id)
                ->latest()
                ->first();

            if ($lastOrder && $lastOrder->status === 'completed' && $guestSessionId == $lastOrder->customer_id) {
                // Clear session so they start fresh (or as a new guest)
                session()->forget('guest_customer_id');
                $guestSessionId = null;
            }

            if ($guestSessionId) {
                $persistedCustomer = Customer::withoutGlobalScope(\App\Models\Scopes\TenantScope::class)->find($guestSessionId);

                if ($persistedCustomer) {
                    $persistedCustomer->load([
                        'orders' => function($q) {
                            $q->withoutGlobalScope(\App\Models\Scopes\TenantScope::class)->with('items.menu')->latest()->take(10);
                        }
                    ]);

                    // Fetch recent point activities
                    $pointActivities = ActivityLog::withoutGlobalScope(\App\Models\Scopes\TenantScope::class)
                        ->where('subject_type', Customer::class)
                        ->where('subject_id', $persistedCustomer->id)
                        ->latest()
                        ->take(15)
                        ->get();

                    $persistedCustomer->point_activities = $pointActivities;
                }
            }
        }

        $banners = \App\Models\Banner::withoutGlobalScope(\App\Models\Scopes\TenantScope::class)
            ->where('tenant_id', $tenant->id)
            ->where('status', true)
            ->orderBy('sort_order')
            ->get();

        return Inertia::render('Menu/GuestMenuView', [
            'table' => $table,
            'menus' => $menus,
            'rewards' => $rewards,
            'banners' => $banners,
            'currentOrder' => $currentOrder,
            'persistedCustomer' => $persistedCustomer,
        ]);
    }

    public function checkLoyalty(Request $request, $tenantSlug)
    {
        $tenant = \App\Models\Tenant::where('slug', $tenantSlug)->firstOrFail();
        
        $request->validate([
            'phone' => 'required|string',
            'name' => 'nullable|string'
        ]);

        $customer = Customer::withoutGlobalScope(\App\Models\Scopes\TenantScope::class)
            ->where('tenant_id', $tenant->id)
            ->where('phone', $request->phone)
            ->first();
        $isNew = false;

        if (!$customer) {
            $isNew = true;
            if ($request->name) {
                $customer = Customer::withoutGlobalScope(\App\Models\Scopes\TenantScope::class)->create([
                    'tenant_id' => $tenant->id,
                    'name' => $request->name,
                    'phone' => $request->phone,
                    'loyalty_points' => 0
                ]);
                session(['guest_customer_id' => $customer->id]);
            }
        } else {
            session(['guest_customer_id' => $customer->id]);
        }

        if ($customer) {
            $customer->load([
                'orders' => function($q) {
                    $q->withoutGlobalScope(\App\Models\Scopes\TenantScope::class)->with('items.menu')->latest()->take(10);
                }
            ]);

            // Fetch recent point activities
            $pointActivities = ActivityLog::withoutGlobalScope(\App\Models\Scopes\TenantScope::class)
                ->where('subject_type', Customer::class)
                ->where('subject_id', $customer->id)
                ->latest()
                ->take(15)
                ->get();

            $customer->point_activities = $pointActivities;
        }

        return response()->json([
            'customer' => $customer,
            'is_new' => $isNew
        ]);
    }

    public function placeOrder(Request $request, $tenantSlug, $tableId)
    {
        $tenant = \App\Models\Tenant::where('slug', $tenantSlug)->firstOrFail();

        // Fail-safe: Use session customer ID if missing from request
        if (!$request->has('customer_id') && session('guest_customer_id')) {
            $request->merge(['customer_id' => session('guest_customer_id')]);
        }

        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.menu_id' => 'required|exists:menus,id',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.is_redemption' => 'sometimes|boolean',
            'items.*.reward_id' => ['nullable', Rule::exists('loyalty_rewards', 'id')->where('status', true)],
            'customer_id' => 'nullable|exists:customers,id'
        ]);

        $table = Table::withoutGlobalScope(\App\Models\Scopes\TenantScope::class)
            ->where('tenant_id', $tenant->id)
            ->findOrFail($tableId);

        // Check if there's already an active order for this table (excluding completed & cancelled)
        $order = Order::withoutGlobalScope(\App\Models\Scopes\TenantScope::class)
            ->where('tenant_id', $tenant->id)
            ->where('table_id', $tableId)
            ->whereNotIn('status', ['completed', 'cancelled'])
            ->first();

        if (!$order) {
            if ($tenant->hasLimitReached('max_orders_per_month')) {
                return back()->with('error', 'This cafe has reached its monthly order limit for the current plan or free trial. Please notify the staff.');
            }

            $order = Order::withoutGlobalScope(\App\Models\Scopes\TenantScope::class)->create([
                'tenant_id' => $tenant->id,
                'table_id' => $tableId,
                'customer_id' => $request->customer_id,
                'status' => 'pending',
                'total_amount' => 0,
                'grand_total' => 0,
            ]);
            // Table status update is now handled by Order model's created hook
        }

        foreach ($validated['items'] as $itemData) {
            $menu = Menu::findOrFail($itemData['menu_id']);
            $isRedeemed = $itemData['is_redemption'] ?? false;
            $price = $isRedeemed ? 0 : $menu->price;

            $pointsCost = 0;
            if ($isRedeemed && isset($itemData['reward_id'])) {
                $reward = LoyaltyReward::withoutGlobalScope(\App\Models\Scopes\TenantScope::class)->findOrFail($itemData['reward_id']);
                $customer = Customer::withoutGlobalScope(\App\Models\Scopes\TenantScope::class)->find($request->customer_id);

                if ($customer && $customer->loyalty_points >= $reward->points_required) {
                    $customer->loyalty_points -= $reward->points_required;
                    $customer->save();

                    $pointsCost = $reward->points_required;
                    ActivityLog::withoutGlobalScope(\App\Models\Scopes\TenantScope::class)->record('redeemed', "{$customer->name} redeemed points for a free {$menu->name} (Cost: {$reward->points_required} pts)", $reward);
                } else {
                    $price = $menu->price;
                    $isRedeemed = false;
                }
            }

            OrderItem::withoutGlobalScope(\App\Models\Scopes\TenantScope::class)->create([
                'tenant_id' => $tenant->id,
                'order_id' => $order->id,
                'menu_id' => $menu->id,
                'quantity' => $itemData['quantity'],
                'price' => $price,
                'is_redeemed' => $isRedeemed,
                'points_cost' => $pointsCost,
            ]);
        }

        // Recalculate order total (MongoDB compatibility)
        $itemsCount = $order->items()->count();
        if ($itemsCount === 0) {
            $order->delete(); // This will also free the table via our new model hook
            return response()->json(['success' => true, 'message' => 'Order cancelled as it was empty.']);
        }

        $total = $order->items->sum(function ($item) {
            return $item->quantity * $item->price;
        });
        $order->update(['total_amount' => $total, 'grand_total' => $total]);

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => 'Order placed successfully!',
                'order' => $order->load('items.menu', 'customer')
            ]);
        }

        return back()->with('success', 'Order placed successfully! Please wait while we prepare it.');
    }

    public function cancelItem($tenantSlug, OrderItem $item)
    {
        $tenant = \App\Models\Tenant::where('slug', $tenantSlug)->firstOrFail();
        
        // Only allow cancellation if order is not completed and item is pending
        if ($item->order->status === 'completed' || $item->kds_status !== 'pending' || $item->tenant_id != $tenant->id) {
            return back()->withErrors(['error' => 'Item cannot be cancelled.']);
        }

        $order = $item->order;

        // Revert loyalty points if it was a redemption
        if ($item->is_redeemed && $item->points_cost > 0 && $order->customer_id) {
            $customer = $order->customer;
            $customer->loyalty_points += $item->points_cost;
            $customer->save();

            ActivityLog::record('refunded', "Loyalty points restored: {$item->points_cost} pts for cancelled {$item->menu->name}", $customer);
        }

        $item->delete();

        // Recalculate order total
        $itemsCount = $order->items()->count();
        if ($itemsCount === 0) {
            $tableId = $order->table_id;
            $order->delete(); 
            
            // Explicit safeguard: Ensure table is available if no orders left
            if ($tableId) {
                \App\Models\Table::syncStatus($tableId);
            }
            
            return back()->with('success', 'Order cancelled as it was empty.');
        }

        // Calculate total (MongoDB compatibility)
        $total = $order->items->sum(function ($item) {
            return $item->quantity * $item->price;
        });
        $order->update(['total_amount' => $total, 'grand_total' => $total]);

        return back()->with('success', 'Item removed.');
    }

    public function showPublicReservation($tenantSlug)
    {
        $tenant = \App\Models\Tenant::where('slug', $tenantSlug)->firstOrFail();
        
        return Inertia::render('Reservations/PublicBooking', [
            'tables' => Table::where('tenant_id', $tenant->id)->get(),
            'tenant' => $tenant,
        ]);
    }
}
