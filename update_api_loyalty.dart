import 'dart:io';

void main() {
  final file = File('E:/Project/Windsurf/CafeFlutterApp/app/Http/Controllers/ApiController.php');
  String content = file.readAsStringSync();
  
  // 1. Inject Loyalty API Methods at the end of the class
  final appendString = """
    // ==========================================
    // LOYALTY REWARDS API
    // ==========================================

    public function loyaltyRewards(Request \$request)
    {
        \$rewards = \\App\\Models\\LoyaltyReward::with('menuItem')->latest()->get();
        return response()->json([
            'success' => true,
            'data' => \$rewards
        ]);
    }

    public function createLoyaltyReward(Request \$request)
    {
        \$validated = \$request->validate([
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

        if (\$validated['type'] === 'gift') {
            \$validated['discount_type'] = null;
            \$validated['discount_value'] = null;
            \$validated['code'] = null;
        }

        \$reward = \\App\\Models\\LoyaltyReward::create(\$validated);
        
        return response()->json([
            'success' => true,
            'message' => 'Reward created successfully',
            'data' => \$reward->load('menuItem')
        ]);
    }

    public function updateLoyaltyReward(Request \$request, \$id)
    {
        \$reward = \\App\\Models\\LoyaltyReward::findOrFail(\$id);
        \$validated = \$request->validate([
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

        if (isset(\$validated['type']) && \$validated['type'] === 'gift') {
            \$validated['discount_type'] = null;
            \$validated['discount_value'] = null;
            \$validated['code'] = null;
        }

        \$reward->update(\$validated);

        return response()->json([
            'success' => true,
            'message' => 'Reward updated successfully',
            'data' => \$reward->load('menuItem')
        ]);
    }

    public function deleteLoyaltyReward(\$id)
    {
        \$reward = \\App\\Models\\LoyaltyReward::findOrFail(\$id);
        \$reward->delete();
        return response()->json([
            'success' => true,
            'message' => 'Reward deleted successfully'
        ]);
    }

    public function toggleLoyaltyRewardStatus(\$id)
    {
        \$reward = \\App\\Models\\LoyaltyReward::findOrFail(\$id);
        \$reward->update(['status' => !\$reward->status]);
        return response()->json([
            'success' => true,
            'message' => 'Reward status toggled successfully',
            'data' => \$reward->load('menuItem')
        ]);
    }

    public function redeemLoyaltyReward(Request \$request)
    {
        \$validated = \$request->validate([
            'customer_id' => 'required|exists:customers,id',
            'reward_id' => 'required|exists:loyalty_rewards,id',
        ]);

        \$customer = \\App\\Models\\Customer::findOrFail(\$validated['customer_id']);
        \$reward = \\App\\Models\\LoyaltyReward::findOrFail(\$validated['reward_id']);

        if (!\$reward->status) {
            return response()->json(['success' => false, 'message' => 'Reward is currently inactive.'], 400);
        }

        if (\$customer->loyalty_points < \$reward->points_required) {
            return response()->json(['success' => false, 'message' => 'Insufficient loyalty points.'], 400);
        }

        // Deduct points
        \$customer->decrement('loyalty_points', \$reward->points_required);

        \\App\\Models\\ActivityLog::record('redeemed', "Customer {\$customer->name} redeemed reward: {\$reward->name}");

        return response()->json([
            'success' => true,
            'message' => 'Reward redeemed successfully',
            'data' => [
                'customer_points' => \$customer->loyalty_points,
                'reward' => \$reward
            ]
        ]);
    }
}
""";
  content = content.replaceFirst("}\n}", "}\n$appendString");
  content = content.replaceFirst("}\r\n}", "}\r\n$appendString");
  
  // 2. Inject awarding points logic into `createOrder`
  final createOrderSearch = """
            \$order->total_amount = \$total;
            \$order->grand_total = \$total;
            \$order->save();
""";
  final createOrderReplace = """
            \$order->total_amount = \$total;
            \$order->grand_total = \$total;
            \$order->save();

            // Award loyalty points on direct checkout
            if (\$order->status === 'completed' && \$order->customer_id) {
                \$pointsPerCurrency = \\App\\Models\\Setting::where('tenant_id', auth()->user()->tenant_id)->where('key', 'points_per_currency')->value('value') ?? 0;
                if (\$pointsPerCurrency > 0) {
                    \$earned = floor(\$order->grand_total * \$pointsPerCurrency);
                    if (\$earned > 0) {
                        \$customer = \\App\\Models\\Customer::find(\$order->customer_id);
                        if (\$customer) {
                            \$customer->increment('loyalty_points', \$earned);
                            \$customer->increment('lifetime_points', \$earned);
                        }
                    }
                }
            }
""";
  content = content.replaceFirst(createOrderSearch, createOrderReplace);
  
  // 3. Inject awarding points logic into `updateOrder`
  final updateOrderSearch = """
            if (isset(\$validated['status'])) {
                \$order->status = \$validated['status'];
""";
  final updateOrderReplace = """
            \$wasCompleted = \$order->status === 'completed';

            if (isset(\$validated['status'])) {
                \$order->status = \$validated['status'];
""";
  content = content.replaceFirst(updateOrderSearch, updateOrderReplace);

  final updateOrderSearch2 = """
                    // Sync table status
                    if (\$order->table_id) {
""";
  final updateOrderReplace2 = """
                    // Award loyalty points
                    if (!\$wasCompleted && \$order->status === 'completed' && \$order->customer_id) {
                        \$pointsPerCurrency = \\App\\Models\\Setting::where('tenant_id', auth()->user()->tenant_id)->where('key', 'points_per_currency')->value('value') ?? 0;
                        if (\$pointsPerCurrency > 0) {
                            \$earned = floor(\$order->grand_total * \$pointsPerCurrency);
                            if (\$earned > 0) {
                                \$customer = \\App\\Models\\Customer::find(\$order->customer_id);
                                if (\$customer) {
                                    \$customer->increment('loyalty_points', \$earned);
                                    \$customer->increment('lifetime_points', \$earned);
                                }
                            }
                        }
                    }

                    // Sync table status
                    if (\$order->table_id) {
""";
  content = content.replaceFirst(updateOrderSearch2, updateOrderReplace2);

  file.writeAsStringSync(content);
  print('Updated ApiController with Loyalty Logic');
}
