<?php
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\LoyaltyReward;
use App\Models\Table;
use App\Http\Controllers\GuestOrderController;
use App\Http\Controllers\OrderController;
use Illuminate\Http\Request;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// 1. Setup
$customer = Customer::first();
$customer->update(['loyalty_points' => 100]);
$reward = LoyaltyReward::first();
$table = Table::first();

echo "Initial Points: " . $customer->loyalty_points . "\n";

// 2. Simulate Order Placement
$order = Order::create([
    'table_id' => $table->id,
    'customer_id' => $customer->id,
    'status' => 'pending',
    'total_amount' => 0,
    'grand_total' => 0,
]);

$item = OrderItem::create([
    'order_id' => $order->id,
    'menu_id' => $reward->menu_item_id,
    'quantity' => 1,
    'price' => 0,
    'is_redeemed' => true,
    'points_cost' => $reward->points_required,
]);

$customer->decrement('loyalty_points', $reward->points_required);
echo "Points after redemption: " . $customer->fresh()->loyalty_points . " (Expected: " . (100 - $reward->points_required) . ")\n";

// 3. Test GuestItem Cancellation
$controller = new GuestOrderController();
$controller->cancelItem($item);

echo "Points after guest cancellation: " . $customer->fresh()->loyalty_points . " (Expected: 100)\n";

// 4. Test Order Cancellation
$customer->update(['loyalty_points' => 100]);
$order = Order::create([
    'table_id' => $table->id,
    'customer_id' => $customer->id,
    'status' => 'pending',
    'total_amount' => 0,
    'grand_total' => 0,
]);
OrderItem::create([
    'order_id' => $order->id,
    'menu_id' => $reward->menu_item_id,
    'quantity' => 1,
    'price' => 0,
    'is_redeemed' => true,
    'points_cost' => $reward->points_required,
]);
$customer->decrement('loyalty_points', $reward->points_required);

$staffController = new OrderController();
$staffController->destroy($order);

echo "Points after staff order cancellation: " . $customer->fresh()->loyalty_points . " (Expected: 100)\n";
