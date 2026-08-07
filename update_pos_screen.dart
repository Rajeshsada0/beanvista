import 'dart:io';

void main() {
  final file = File('E:/Project/Windsurf/CafeFlutterApp/icafe_flutter/lib/screens/pos/pos_screen.dart');
  String content = file.readAsStringSync();

  // 1. Add imports
  final importSearch = "import '../../providers/orders_provider.dart';";
  final importReplace = "import '../../providers/orders_provider.dart';\nimport '../../providers/customers_provider.dart';\nimport '../../providers/loyalty_provider.dart';\nimport '../../models/loyalty_reward_model.dart';";
  content = content.replaceFirst(importSearch, importReplace);

  // 2. Add to initState
  final initSearch = "context.read<MenuProvider>().fetchMenu();";
  final initReplace = "context.read<MenuProvider>().fetchMenu();\n      context.read<CustomersProvider>().fetchCustomers();\n      context.read<LoyaltyProvider>().fetchRewards();";
  content = content.replaceFirst(initSearch, initReplace);

  // 3. Update customer dropdown logic in _buildOrderConfig
  final customerSearch = """
    // Ensure unique customer names to prevent dropdown assertion crashes
    final rawCustomers = _customers.isEmpty ? kPosCustomers : _customers;
    final seenNames = <String>{};
    final customers = <Map<String, dynamic>>[];
    for (var c in rawCustomers) {
      final name = c['name'] as String? ?? '';
      if (name.isNotEmpty && !seenNames.contains(name)) {
        seenNames.add(name);
        customers.add(c);
      }
    }
""";
  final customerReplace = """
    final customersProvider = context.watch<CustomersProvider>();
    final liveCustomers = customersProvider.customers;
    final seenNames = <String>{};
    final customers = <Map<String, dynamic>>[];
    
    // Always include a Walk-in Customer
    customers.add({'id': 1, 'name': 'Walk-in Customer'});
    seenNames.add('Walk-in Customer');

    for (var c in liveCustomers) {
      final name = c.name;
      if (name.isNotEmpty && !seenNames.contains(name)) {
        seenNames.add(name);
        customers.add({
          'id': c.id,
          'name': c.name,
          'phone': c.phone,
          'points': c.loyaltyPoints,
        });
      }
    }
""";
  content = content.replaceFirst(customerSearch, customerReplace);

  // 4. Update the _PaymentModal to support redeeming rewards
  // I need to add state for selectedReward and discountAmount
  final modalStateSearch = """class _PaymentModalState extends State<_PaymentModal>
    with SingleTickerProviderStateMixin {
  late TabController _tabCtrl;""";
  
  final modalStateReplace = """class _PaymentModalState extends State<_PaymentModal>
    with SingleTickerProviderStateMixin {
  late TabController _tabCtrl;
  LoyaltyRewardModel? _selectedReward;
  double _rewardDiscount = 0.0;
  bool _isRedeeming = false;

  void _showRewardSelector() {
    final customer = widget.selectedCustomer;
    if (customer == null || customer['id'] == 1) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('Please select a registered customer to redeem rewards.', style: GoogleFonts.poppins(color: Colors.white)),
        backgroundColor: Colors.red,
      ));
      return;
    }

    final double customerPoints = double.tryParse(customer['points']?.toString() ?? '0') ?? 0;
    final rewards = context.read<LoyaltyProvider>().activeRewards;

    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.darkCard,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) {
        return Container(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Select Reward', style: GoogleFonts.poppins(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
              Text('Available Points: \$customerPoints', style: GoogleFonts.poppins(color: AppColors.accentAmber)),
              const SizedBox(height: 16),
              if (rewards.isEmpty)
                Text('No active rewards available.', style: GoogleFonts.poppins(color: Colors.white70))
              else
                ...rewards.map((r) {
                  final canAfford = customerPoints >= r.pointsRequired;
                  return ListTile(
                    enabled: canAfford,
                    leading: Icon(Icons.card_giftcard, color: canAfford ? AppColors.primary : Colors.grey),
                    title: Text(r.name, style: GoogleFonts.poppins(color: canAfford ? Colors.white : Colors.grey)),
                    subtitle: Text('\${r.pointsRequired} pts', style: GoogleFonts.poppins(color: canAfford ? AppColors.accentAmber : Colors.grey)),
                    onTap: () {
                      Navigator.pop(context);
                      if (canAfford) {
                         setState(() {
                           _selectedReward = r;
                           // Calculate discount
                           if (r.type == 'discount') {
                             if (r.discountType == 'percentage') {
                               _rewardDiscount = widget.grandTotal * ((r.discountValue ?? 0) / 100);
                             } else {
                               _rewardDiscount = r.discountValue ?? 0;
                             }
                           } else {
                             _rewardDiscount = 0.0; // Gift/Voucher requires custom logic, keep simple for now
                           }
                           if (_rewardDiscount > widget.grandTotal) _rewardDiscount = widget.grandTotal;
                         });
                      }
                    },
                  );
                }).toList(),
            ],
          ),
        );
      }
    );
  }
""";
  content = content.replaceFirst(modalStateSearch, modalStateReplace);

  // Update Grand Total display in PaymentModal
  final totalDisplaySearch = """            // Total Amount
            Container(
              padding: const EdgeInsets.all(20),""";
              
  final totalDisplayReplace = """            // Total Amount
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.darkSurface,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                children: [
                  if (_selectedReward != null) ...[
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Subtotal', style: GoogleFonts.poppins(color: AppColors.textSecondary, fontSize: 14)),
                        Text('\${widget.grandTotal.toStringAsFixed(2)}', style: GoogleFonts.poppins(color: AppColors.textSecondary, fontSize: 14)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Reward: \${_selectedReward!.name}', style: GoogleFonts.poppins(color: AppColors.primary, fontSize: 14)),
                        Text('-\${_rewardDiscount.toStringAsFixed(2)}', style: GoogleFonts.poppins(color: AppColors.primary, fontSize: 14)),
                      ],
                    ),
                    const Divider(color: AppColors.darkBorder, height: 24),
                  ],
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Amount to Pay',
                          style: GoogleFonts.poppins(color: AppColors.textSecondary, fontSize: 16)),
                      Text('\${(widget.grandTotal - _rewardDiscount).toStringAsFixed(2)}',
                          style: GoogleFonts.poppins(
                              color: AppColors.accentAmber,
                              fontSize: 28,
                              fontWeight: FontWeight.w700)),
                    ],
                  ),
                ],
              ),
            ),
            
            // Redeem Reward Button
            if (widget.selectedCustomer != null && widget.selectedCustomer!['id'] != 1)
              Padding(
                padding: const EdgeInsets.only(top: 16),
                child: InkWell(
                  onTap: _showRewardSelector,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(
                      color: AppColors.darkSurface,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.primary.withOpacity(0.5)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.stars_rounded, color: AppColors.primary, size: 20),
                        const SizedBox(width: 8),
                        Text(
                          _selectedReward != null ? 'Change Reward' : 'Redeem Loyalty Points',
                          style: GoogleFonts.poppins(color: AppColors.primary, fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              
            const SizedBox(height: 24),
""";
  content = content.replaceFirst("""            // Total Amount
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.darkSurface,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Amount to Pay',
                      style: GoogleFonts.poppins(color: AppColors.textSecondary, fontSize: 16)),
                  Text('\${widget.grandTotal.toStringAsFixed(2)}',
                      style: GoogleFonts.poppins(
                          color: AppColors.accentAmber,
                          fontSize: 28,
                          fontWeight: FontWeight.w700)),
                ],
              ),
            ),""", totalDisplayReplace);

  // Hook up redemption API before confirm
  final onConfirmSearch = """                    onPressed: () {
                      final method = _tabCtrl.index == 0
                          ? 'Cash'
                          : _tabCtrl.index == 1
                              ? 'Card'
                              : 'Credit';
                      widget.onConfirm(method);
                    },""";
  final onConfirmReplace = """                    onPressed: _isRedeeming ? null : () async {
                      final method = _tabCtrl.index == 0
                          ? 'Cash'
                          : _tabCtrl.index == 1
                              ? 'Card'
                              : 'Credit';
                              
                      if (_selectedReward != null && widget.selectedCustomer != null) {
                        setState(() => _isRedeeming = true);
                        final success = await context.read<LoyaltyProvider>().apiService.redeemLoyaltyReward(
                          widget.selectedCustomer!['id'],
                          _selectedReward!.id,
                        );
                        setState(() => _isRedeeming = false);
                        
                        if (success == null || success['success'] != true) {
                          ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                            content: Text(success?['message'] ?? 'Failed to redeem reward.', style: GoogleFonts.poppins()),
                            backgroundColor: Colors.red,
                          ));
                          return;
                        }
                      }
                      
                      widget.onConfirm(method);
                    },""";
  content = content.replaceFirst(onConfirmSearch, onConfirmReplace);
  
  // Need to also replace the Button child to show loading indicator if redeeming
  content = content.replaceFirst("Text('Confirm Payment',", "_isRedeeming ? const SizedBox(height:20, width:20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : Text('Confirm Payment',");

  file.writeAsStringSync(content);
  print('Updated PosScreen with Loyalty and CustomersProvider');
}
