import 'package:icafe_app/core/utils/snackbar_helper.dart';
import 'package:icafe_app/core/constants/app_constants.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../core/theme/app_theme.dart';
import '../providers/orders_provider.dart';
import '../providers/tables_provider.dart';
import 'payment_modal.dart';

/// A beautifully designed bottom sheet that displays order details with items
/// and provides Pay & Complete functionality.
class OrderViewSheet extends StatefulWidget {
  final Map<String, dynamic> order;
  final String tableNumber;

  const OrderViewSheet({
    Key? key,
    required this.order,
    required this.tableNumber,
  }) : super(key: key);

  @override
  State<OrderViewSheet> createState() => _OrderViewSheetState();
}

class _OrderViewSheetState extends State<OrderViewSheet>
    with SingleTickerProviderStateMixin {
  OrderItemData? _orderDetail;
  bool _loading = true;
  bool _completing = false;
  late AnimationController _animCtrl;
  late Animation<double> _fadeAnim;

  @override
  void initState() {
    super.initState();
    _animCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );
    _fadeAnim = CurvedAnimation(parent: _animCtrl, curve: Curves.easeOut);
    _loadOrder();
  }

  @override
  void dispose() {
    _animCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadOrder() async {
    final orderId = widget.order['id'];
    if (orderId != null) {
      final detail =
          await context.read<OrdersProvider>().fetchOrderById(orderId);
      if (mounted) {
        setState(() {
          _orderDetail = detail;
          _loading = false;
        });
        _animCtrl.forward();
      }
    } else {
      setState(() => _loading = false);
      _animCtrl.forward();
    }
  }

  void _openPaymentModal() {
    final orderId = widget.order['id'];
    if (orderId == null) return;

    // Fetch bank accounts before opening modal
    context.read<OrdersProvider>().fetchBankAccounts();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => PaymentModal(
        grandTotal: (widget.order['total'] as num?)?.toDouble() ?? 0.0,
        selectedCustomer: null,
        onConfirm: (method, {int? bankAccountId, Map<String, dynamic>? selectedCustomer}) async {
          Navigator.pop(context); // Close payment modal
          setState(() => _completing = true);

          final success = await context.read<OrdersProvider>().completeOrder(
                orderId,
                paymentMethod: method,
                bankAccountId: bankAccountId,
              );

          if (mounted) {
            setState(() => _completing = false);
            if (success) {
              // Refresh tables
              context.read<TablesProvider>().fetchTables();
              Navigator.pop(context); // Close order view sheet
              showTopSnackBar(context, SnackBar(
                content: Row(
                  children: [
                    const Icon(Icons.check_circle, color: Colors.white, size: 20),
                    const SizedBox(width: 10),
                    Text('Order completed successfully!',
                        style: GoogleFonts.poppins(color: Colors.white)),
                  ],
                ),
                backgroundColor: AppColors.statusGreen,
                behavior: SnackBarBehavior.floating,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
              ));
            } else {
              showTopSnackBar(context, SnackBar(
                content: Row(
                  children: [
                    const Icon(Icons.error_outline, color: Colors.white, size: 20),
                    const SizedBox(width: 10),
                    Text('Failed to complete order',
                        style: GoogleFonts.poppins(color: Colors.white)),
                  ],
                ),
                backgroundColor: AppColors.statusRed,
                behavior: SnackBarBehavior.floating,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12)),
              ));
            }
          }
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final order = widget.order;
    final total = (order['total'] as num?)?.toDouble() ?? 0.0;
    final orderNumber = order['number'] ?? 'N/A';
    final itemsCount = order['items'] ?? 0;
    final waiter = order['waiter'] ?? 'Unknown';

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.85,
      ),
      decoration: BoxDecoration(
        color: AppColors.darkCard,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // ── Handle bar ──
          Container(
            width: 40,
            height: 4,
            margin: const EdgeInsets.only(top: 14, bottom: 6),
            decoration: BoxDecoration(
              color: AppColors.darkBorder,
              borderRadius: BorderRadius.circular(2),
            ),
          ),

          // ── Header ──
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 10, 20, 0),
            child: Row(
              children: [
                // Table badge
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    gradient: AppColors.primaryGradient,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.table_restaurant_rounded,
                          color: AppColors.textOnAmber, size: 16),
                      const SizedBox(width: 6),
                      Text(widget.tableNumber,
                          style: GoogleFonts.poppins(
                              color: AppColors.textOnAmber,
                              fontWeight: FontWeight.w700,
                              fontSize: 14)),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Order Details',
                          style: GoogleFonts.poppins(
                              color: AppColors.textPrimary,
                              fontWeight: FontWeight.w700,
                              fontSize: 18)),
                      Text(orderNumber,
                          style: GoogleFonts.poppins(
                              color: AppColors.textMuted, fontSize: 12)),
                    ],
                  ),
                ),
                // Close button
                Material(
                  color: AppColors.darkSurface,
                  borderRadius: BorderRadius.circular(10),
                  child: InkWell(
                    borderRadius: BorderRadius.circular(10),
                    onTap: () => Navigator.pop(context),
                    child: Container(
                      padding: const EdgeInsets.all(8),
                      child: Icon(Icons.close_rounded,
                          color: AppColors.textMuted, size: 20),
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 12),

          // ── Order info chips ──
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                _InfoChip(
                  icon: Icons.restaurant_menu_outlined,
                  label: '$itemsCount items',
                  color: AppColors.statusBlue,
                ),
                const SizedBox(width: 8),
                _InfoChip(
                  icon: Icons.person_outline_rounded,
                  label: waiter,
                  color: AppColors.accentAmber,
                ),
                const Spacer(),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.statusRedBg,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    'ACTIVE',
                    style: GoogleFonts.poppins(
                        color: AppColors.tableOccupied,
                        fontWeight: FontWeight.w700,
                        fontSize: 10,
                        letterSpacing: 0.5),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // ── Divider ──
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                Text('ORDER ITEMS',
                    style: GoogleFonts.poppins(
                        color: AppColors.textMuted,
                        fontWeight: FontWeight.w600,
                        fontSize: 11,
                        letterSpacing: 1.0)),
                const SizedBox(width: 10),
                Expanded(
                  child: Container(height: 1, color: AppColors.darkBorder),
                ),
              ],
            ),
          ),

          const SizedBox(height: 8),

          // ── Items list ──
          _loading
              ? Padding(
                  padding: const EdgeInsets.symmetric(vertical: 40),
                  child: Column(
                    children: [
                      SizedBox(
                        width: 28,
                        height: 28,
                        child: CircularProgressIndicator(
                          strokeWidth: 2.5,
                          color: AppColors.accentAmber,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text('Loading items...',
                          style: GoogleFonts.poppins(
                              color: AppColors.textMuted, fontSize: 12)),
                    ],
                  ),
                )
              : Flexible(
                  child: FadeTransition(
                    opacity: _fadeAnim,
                    child: _buildItemsList(),
                  ),
                ),

          // ── Footer: Total + Pay & Complete ──
          Container(
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 20),
            decoration: BoxDecoration(
              color: AppColors.darkSurface,
              border: Border(
                top: BorderSide(color: AppColors.darkBorder, width: 1),
              ),
            ),
            child: SafeArea(
              top: false,
              child: Column(
                children: [
                  // Total row
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Grand Total',
                          style: GoogleFonts.poppins(
                              color: AppColors.textSecondary,
                              fontWeight: FontWeight.w500,
                              fontSize: 14)),
                      Text('${AppConstants.currencySymbol} ${total.toStringAsFixed(2)}',
                          style: GoogleFonts.poppins(
                              color: AppColors.accentAmber,
                              fontWeight: FontWeight.w800,
                              fontSize: 20)),
                    ],
                  ),
                  const SizedBox(height: 14),
                  // Pay & Complete button
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton(
                      onPressed: _completing ? null : _openPaymentModal,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.statusGreen,
                        disabledBackgroundColor: AppColors.statusGreen.withValues(alpha: 0.5),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14)),
                        elevation: 0,
                      ),
                      child: _completing
                          ? Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white,
                                  ),
                                ),
                                const SizedBox(width: 12),
                                Text('Processing...',
                                    style: GoogleFonts.poppins(
                                        color: Colors.white,
                                        fontWeight: FontWeight.w600,
                                        fontSize: 15)),
                              ],
                            )
                          : FittedBox(
                              fit: BoxFit.scaleDown,
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const Icon(Icons.payment_rounded,
                                      color: Colors.white, size: 20),
                                  const SizedBox(width: 10),
                                  Text('Pay & Complete',
                                      style: GoogleFonts.poppins(
                                          color: Colors.white,
                                          fontWeight: FontWeight.w700,
                                          fontSize: 15)),
                                ],
                              ),
                            ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildItemsList() {
    // Use fetched detail items, or fallback to items_list from the order map
    List<_OrderItemRow> items = [];

    if (_orderDetail != null && _orderDetail!.itemsList.isNotEmpty) {
      items = _orderDetail!.itemsList
          .map((item) => _OrderItemRow(
                name: item.name,
                qty: item.qty,
                price: item.price,
              ))
          .toList();
    } else {
      // Fallback: try to parse items_list from the raw order map
      final rawItems = widget.order['items_list'];
      if (rawItems is List && rawItems.isNotEmpty) {
        items = rawItems
            .map((e) => _OrderItemRow(
                  name: (e['name'] ?? '') as String,
                  qty: (e['qty'] ?? 0) as int,
                  price: ((e['price'] as num?) ?? 0).toDouble(),
                ))
            .toList();
      }
    }

    if (items.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 30),
        child: Column(
          children: [
            Icon(Icons.receipt_long_rounded,
                color: AppColors.textMuted.withValues(alpha: 0.4), size: 48),
            const SizedBox(height: 10),
            Text('No items found',
                style: GoogleFonts.poppins(
                    color: AppColors.textMuted, fontSize: 13)),
          ],
        ),
      );
    }

    return ListView.separated(
      shrinkWrap: true,
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
      itemCount: items.length,
      separatorBuilder: (_, __) =>
          Divider(color: AppColors.darkBorder, height: 1),
      itemBuilder: (_, i) {
        final item = items[i];
        final lineTotal = item.qty * item.price;
        return Padding(
          padding: const EdgeInsets.symmetric(vertical: 10),
          child: Row(
            children: [
              // Item number indicator
              Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  color: AppColors.accentAmber.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                alignment: Alignment.center,
                child: Text(
                  '${i + 1}',
                  style: GoogleFonts.poppins(
                      color: AppColors.accentAmber,
                      fontWeight: FontWeight.w700,
                      fontSize: 12),
                ),
              ),
              const SizedBox(width: 12),
              // Item name
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(item.name,
                        style: GoogleFonts.poppins(
                            color: AppColors.textPrimary,
                            fontWeight: FontWeight.w500,
                            fontSize: 13)),
                    Text(
                      '${AppConstants.currencySymbol} ${item.price.toStringAsFixed(2)} × ${item.qty}',
                      style: GoogleFonts.poppins(
                          color: AppColors.textMuted, fontSize: 11),
                    ),
                  ],
                ),
              ),
              // Quantity badge
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppColors.darkSurface,
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: AppColors.darkBorder),
                ),
                child: Text('×${item.qty}',
                    style: GoogleFonts.poppins(
                        color: AppColors.textSecondary,
                        fontWeight: FontWeight.w600,
                        fontSize: 11)),
              ),
              const SizedBox(width: 12),
              // Line total
              Text('${AppConstants.currencySymbol} ${lineTotal.toStringAsFixed(2)}',
                  style: GoogleFonts.poppins(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w600,
                      fontSize: 13)),
            ],
          ),
        );
      },
    );
  }
}

// ── Helper data class ──
class _OrderItemRow {
  final String name;
  final int qty;
  final double price;
  _OrderItemRow({required this.name, required this.qty, required this.price});
}

// ── Small info chip ──
class _InfoChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  const _InfoChip(
      {required this.icon, required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.25)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 5),
          Text(label,
              style: GoogleFonts.poppins(
                  color: color, fontWeight: FontWeight.w600, fontSize: 11)),
        ],
      ),
    );
  }
}
