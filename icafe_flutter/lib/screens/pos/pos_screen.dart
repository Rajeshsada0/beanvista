import 'dart:async';
import 'package:icafe_app/core/utils/snackbar_helper.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/json_utils.dart';
import '../../providers/menu_provider.dart';
import '../../providers/tables_provider.dart';
import '../../providers/orders_provider.dart';
import '../../providers/customers_provider.dart';
import '../../providers/loyalty_provider.dart';
import '../../models/loyalty_reward_model.dart';
import '../../providers/taxes_provider.dart';
import '../../providers/finance_provider.dart';
import '../../providers/auth_provider.dart';
import '../../core/services/api_service.dart';
import '../../core/constants/app_constants.dart';
import '../home_shell.dart';
import '../menu/menu_screen.dart';

// ──────────────────────────────────────────────────────────────────────────────
//  MOCK DATA
// ──────────────────────────────────────────────────────────────────────────────
const List<String> kPosCategories = [
  'All', 'Coffee', 'Food', 'Beverages', 'Desserts',
];

const List<Map<String, dynamic>> kPosMenuItems = [
  {'id': 1,  'name': 'Cappuccino',     'category': 'Coffee',    'price': 350.0, 'emoji': '☕'},
  {'id': 2,  'name': 'Latte',          'category': 'Coffee',    'price': 380.0, 'emoji': '🥛'},
  {'id': 3,  'name': 'Americano',      'category': 'Coffee',    'price': 280.0, 'emoji': '☕'},
  {'id': 4,  'name': 'Espresso',       'category': 'Coffee',    'price': 220.0, 'emoji': '☕'},
  {'id': 5,  'name': 'Club Sandwich',  'category': 'Food',      'price': 550.0, 'emoji': '🥪'},
  {'id': 6,  'name': 'Pasta Carbonara','category': 'Food',      'price': 720.0, 'emoji': '🍝'},
  {'id': 7,  'name': 'Burger Deluxe',  'category': 'Food',      'price': 680.0, 'emoji': '🍔'},
  {'id': 8,  'name': 'Caesar Salad',   'category': 'Food',      'price': 420.0, 'emoji': '🥗'},
  {'id': 9,  'name': 'Fresh Juice',    'category': 'Beverages', 'price': 250.0, 'emoji': '🍹'},
  {'id': 10, 'name': 'Iced Tea',       'category': 'Beverages', 'price': 200.0, 'emoji': '🧊'},
  {'id': 11, 'name': 'Cheesecake',     'category': 'Desserts',  'price': 450.0, 'emoji': '🍰'},
  {'id': 12, 'name': 'Chocolate Lava', 'category': 'Desserts',  'price': 490.0, 'emoji': '🍫'},
  {'id': 13, 'name': 'Iced Coffee',    'category': 'Coffee',    'price': 400.0, 'emoji': '🧋'},
  {'id': 14, 'name': 'Flat White',     'category': 'Coffee',    'price': 360.0, 'emoji': '☕'},
  {'id': 15, 'name': 'Pancakes',       'category': 'Desserts',  'price': 380.0, 'emoji': '🥞'},
  {'id': 16, 'name': 'Mineral Water',  'category': 'Beverages', 'price': 80.0,  'emoji': '💧'},
];

const List<String> kPosTables = [
  'T-01','T-02','T-03','T-04','T-05','T-06','T-07','T-08','T-09','T-10',
];

const List<Map<String, dynamic>> kPosCustomers = [
  {'id': 1, 'name': 'Walk-in Customer'},
  {'id': 2, 'name': 'John Doe',   'phone': '9801234567', 'points': 450},
  {'id': 3, 'name': 'Jane Smith', 'phone': '9807654321', 'points': 1200},
  {'id': 4, 'name': 'Ali Khan',   'phone': '9800112233', 'points': 89},
];

// Standard unified branding colors
const Map<String, Color> kPosCategoryColors = {};

// ──────────────────────────────────────────────────────────────────────────────
//  MAIN SCREEN
// ──────────────────────────────────────────────────────────────────────────────
class PosScreen extends StatefulWidget {
  const PosScreen({super.key});

  @override
  State<PosScreen> createState() => _PosScreenState();
}

class _PosScreenState extends State<PosScreen>
    with SingleTickerProviderStateMixin {
  // ── State ────────────────────────────────────────────────────────────────
  final TextEditingController _searchCtrl = TextEditingController();
  bool _isSearching = false;
  String _selectedCategory = 'All';
  List<Map<String, dynamic>> _cart = [];
  String _orderType = 'Dine-In';
  String? _selectedTable;
  Map<String, dynamic>? _selectedCustomer;
  double get _taxRate => context.read<TaxesProvider>().activeTaxRate;
  bool _cartOpen = false;
  late AnimationController _cartAnim;
  late Animation<double> _cartSlide;
  List<Map<String, dynamic>> _customers = [];
  bool _isSubmitting = false;
  bool _tableError = false;
  int? _modifyingOrderId;
  String? _modifyingOrderNumber;

  // ── Derived ──────────────────────────────────────────────────────────────
  List<Map<String, dynamic>> get _filteredMenus {
    final menuItems = context.select<MenuProvider, List<MenuItem>>((p) => p.menus);
    final menuItemsList = menuItems.map((m) => {
      'id': m.id,
      'name': m.name,
      'category': m.category,
      'price': m.price,
      'emoji': m.category == 'Coffee' ? '☕' : (m.category == 'Food' ? '🥪' : (m.category == 'Beverages' ? '🍹' : '🍰')),
      'image_url': m.imageUrl,
      'out_of_stock': m.outOfStock,
    }).toList();

    final q = _searchCtrl.text.toLowerCase();
    return menuItemsList.where((item) {
      final catOk = _selectedCategory == 'All' || item['category'] == _selectedCategory;
      final nameOk = q.isEmpty || (item['name'] as String).toLowerCase().contains(q);
      return catOk && nameOk;
    }).toList();
  }

  double get _subtotal =>
      _cart.fold(0.0, (s, i) => s + JsonUtils.parseDouble(i['price']) * JsonUtils.parseInt(i['qty']));
  double get _taxAmount  => _subtotal * _taxRate;
  double get _grandTotal => _subtotal + _taxAmount;
  int    get _cartCount  => _cart.fold(0, (s, i) => s + JsonUtils.parseInt(i['qty']));

  // ── Lifecycle ────────────────────────────────────────────────────────────
  @override
  void initState() {
    super.initState();
    _cartAnim = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 340),
    );
    _cartSlide = CurvedAnimation(parent: _cartAnim, curve: Curves.easeOutCubic);
    _searchCtrl.addListener(() => setState(() {}));
    
    // Fetch live categories, menus, tables, and customers
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<MenuProvider>().fetchMenus();
      context.read<TablesProvider>().fetchTables();
      context.read<TaxesProvider>().fetchTaxes();
      _fetchCustomers();
      context.read<OrdersProvider>().fetchBankAccounts();
      final user = context.read<AuthProvider>().user;
      if (user != null && user.role != 'waiter') {
        context.read<FinanceProvider>().fetchCashCounter();
      }

      // Apply preselected order configuration if redirected from orders screen
      final ordersProvider = context.read<OrdersProvider>();
      if (ordersProvider.modifyingOrderId != null) {
        setState(() {
          _modifyingOrderId = ordersProvider.modifyingOrderId;
          _modifyingOrderNumber = ordersProvider.modifyingOrderNumber;
          _orderType = ordersProvider.preselectedOrderType ?? 'Dine-In';
          _selectedTable = ordersProvider.preselectedTable;
          _cart = List<Map<String, dynamic>>.from(ordersProvider.modifyingCartItems ?? []);
        });
        ordersProvider.clearModification();
      } else if (ordersProvider.preselectedOrderType != null) {
        setState(() {
          _orderType = ordersProvider.preselectedOrderType!;
          _selectedTable = ordersProvider.preselectedTable;
        });
        ordersProvider.setPreselectedOrder(null, null);
      }
    });
  }

  Future<void> _fetchCustomers() async {
    try {
      final api = context.read<ApiService>();
      final res = await api.get('/customers');
      if (!mounted) return;
      if (res != null && res['data'] != null) {
        setState(() {
          _customers = (res['data'] as List)
              .map((e) => Map<String, dynamic>.from(e as Map))
              .toList();
        });
      }
    } catch (e) {
      debugPrint('Failed to load customers: $e');
    }
  }

  @override
  void dispose() {
    _cartAnim.dispose();
    _searchCtrl.dispose();
    super.dispose();
  }

  // ── Cart Operations ──────────────────────────────────────────────────────
  void _addToCart(Map<String, dynamic> item) {
    setState(() {
      final idx = _cart.indexWhere((c) => c['id'] == item['id']);
      if (idx >= 0) {
        _cart[idx] = {..._cart[idx], 'qty': (_cart[idx]['qty'] as int) + 1};
      } else {
        _cart.add({...item, 'qty': 1});
      }
    });
    if (!_cartOpen) _toggleCart();
    _showAddedSnack(item['name'] as String);
  }

  void _removeFromCart(int index) {
    setState(() => _cart.removeAt(index));
    if (_cart.isEmpty && _cartOpen) _toggleCart();
  }

  void _updateQty(int index, int delta) {
    setState(() {
      final newQty = (_cart[index]['qty'] as int) + delta;
      if (newQty <= 0) {
        _cart.removeAt(index);
        if (_cart.isEmpty && _cartOpen) _toggleCart();
      } else {
        _cart[index] = {..._cart[index], 'qty': newQty};
      }
    });
  }

  void _clearCart() {
    setState(() {
      _cart.clear();
      _selectedTable = null;
      _selectedCustomer = null;
      _orderType = 'Dine-In';
    });
    if (_cartOpen) _toggleCart();
  }

  void _toggleCart() {
    setState(() => _cartOpen = !_cartOpen);
    _cartOpen ? _cartAnim.forward() : _cartAnim.reverse();
  }

  void _showAddedSnack(String name) {
    ScaffoldMessenger.of(context).clearSnackBars();
    showTopSnackBar(context, SnackBar(
      content: Row(children: [
        Icon(Icons.check_circle, color: AppColors.statusGreen, size: 18),
        const SizedBox(width: 8),
        Text('$name added to cart',
            style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13)),
      ]),
      duration: const Duration(seconds: 1),
    ));
  }

  Future<void> _saveOrderPending() async {
    if (_cart.isEmpty) return;
    if (_isSubmitting) return;

    if (_orderType == 'Dine-In' && (_selectedTable == null || _selectedTable!.isEmpty)) {
      setState(() => _tableError = true);
      return;
    }

    debugPrint('DEBUG: _saveOrderPending() called with _modifyingOrderId = $_modifyingOrderId');
    setState(() => _isSubmitting = true);

    final tablesProvider = context.read<TablesProvider>();
    final table = tablesProvider.tables.firstWhere(
      (t) => t.number == _selectedTable,
      orElse: () => TableItem(id: 0, number: '', capacity: 0, status: ''),
    );
    final tableId = table.id > 0 ? table.id : null;

    final success = await context.read<OrdersProvider>().placeOrder(
      tableId: tableId,
      orderType: _orderType,
      customerId: _selectedCustomer?['id'] as int?,
      items: _cart.map((i) => {
        'menu_id': i['id'],
        'quantity': i['qty'],
        if (i['kds_status'] != null) 'kds_status': i['kds_status'],
      }).toList(),
      paymentMethod: 'none',
      cashAmount: 0.0,
      onlineAmount: 0.0,
      status: context.read<OrdersProvider>().modifyingOrderStatus ?? 'pending',
      orderId: _modifyingOrderId,
    );

    if (!mounted) return;
    setState(() => _isSubmitting = false);

    if (success) {
      final wasModifying = _modifyingOrderId != null;
      _clearCart();
      setState(() {
        _modifyingOrderId = null;
      });
      context.read<OrdersProvider>().clearModification();
      showTopSnackBar(context, SnackBar(
        content: Row(children: [
          Icon(Icons.save_rounded, color: AppColors.accentAmber, size: 18),
          const SizedBox(width: 8),
          Text(wasModifying ? 'Order Updated Successfully!' : 'Order Saved (Pending)!',
              style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13)),
        ]),
        duration: const Duration(seconds: 3),
      ));
      tablesProvider.fetchTables();
      context.read<OrdersProvider>().fetchOrders();
    } else {
      final errorMsg = context.read<OrdersProvider>().error ?? 'Failed to save order.';
      showTopSnackBar(context, SnackBar(
        content: Text(errorMsg,
            style: GoogleFonts.poppins(color: AppColors.textPrimary)),
        backgroundColor: AppColors.statusRedBg,
      ));
    }
  }

  void _showPaymentModal() async {
    if (_cart.isEmpty) {
      showTopSnackBar(context, SnackBar(
        content: Text('Cart is empty!',
            style: GoogleFonts.poppins(color: AppColors.textPrimary)),
      ));
      return;
    }
    if (_orderType == 'Dine-In' && (_selectedTable == null || _selectedTable!.isEmpty)) {
      setState(() => _tableError = true);
      return;
    }
    await _fetchCustomers();
    if (!mounted) return;
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _PaymentModal(
        grandTotal: _grandTotal,
        selectedCustomer: _selectedCustomer,
        customers: _customers,
        onConfirm: (method, {int? bankAccountId, Map<String, dynamic>? selectedCustomer}) async {
          Navigator.pop(context);
          
          if (selectedCustomer != null) {
            setState(() {
              _selectedCustomer = selectedCustomer;
            });
          }

          if (_isSubmitting) return;
          debugPrint('DEBUG: Checkout onConfirm called with _modifyingOrderId = $_modifyingOrderId');
          if (!mounted) return;
          setState(() => _isSubmitting = true);
          
          // Look up table ID from selectedTable name
          final tablesProvider = context.read<TablesProvider>();
          final table = tablesProvider.tables.firstWhere(
            (t) => t.number == _selectedTable,
            orElse: () => TableItem(id: 0, number: '', capacity: 0, status: ''),
          );
          final tableId = table.id > 0 ? table.id : null;
          
          final customerToUse = selectedCustomer ?? _selectedCustomer;
          final success = await context.read<OrdersProvider>().placeOrder(
            tableId: tableId,
            orderType: _orderType,
            customerId: customerToUse?['id'] as int?,
            items: _cart.map((i) => {
              'menu_id': i['id'],
              'quantity': i['qty'],
              if (i['kds_status'] != null) 'kds_status': i['kds_status'],
            }).toList(),
            paymentMethod: method,
            cashAmount: method == 'Cash' ? _grandTotal : 0.0,
            onlineAmount: method == 'Card' ? _grandTotal : 0.0,
            status: 'completed',
            bankAccountId: bankAccountId,
            orderId: _modifyingOrderId,
          );
          
          if (!mounted) return;
          setState(() => _isSubmitting = false);
          
          if (success) {
            _clearCart();
            setState(() {
              _modifyingOrderId = null;
            });
            context.read<OrdersProvider>().clearModification();
            showTopSnackBar(context, SnackBar(
              content: Row(children: [
                Icon(Icons.celebration, color: AppColors.accentAmber, size: 18),
                const SizedBox(width: 8),
                Text('Order placed via $method!',
                    style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13)),
              ]),
              duration: const Duration(seconds: 3),
            ));
            
            // Refresh tables and orders
            tablesProvider.fetchTables();
            context.read<OrdersProvider>().fetchOrders();
          } else {
            final errorMsg = context.read<OrdersProvider>().error ?? 'Failed to place order. Please try again.';
            showTopSnackBar(context, SnackBar(
              content: Row(children: [
                Icon(Icons.error_outline, color: AppColors.statusRed, size: 18),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(errorMsg,
                      style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13)),
                ),
              ]),
              duration: const Duration(seconds: 4),
            ));
          }
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final isWaiter = user?.role == 'waiter';
    // Check if there is an active modification payload waiting to be preloaded
    final ordersProvider = context.watch<OrdersProvider>();
    if (ordersProvider.modifyingOrderId != null) {
      final targetId = ordersProvider.modifyingOrderId;
      final targetNumber = ordersProvider.modifyingOrderNumber;
      final targetType = ordersProvider.preselectedOrderType ?? 'Dine-In';
      final targetTable = ordersProvider.preselectedTable;
      final targetCart = List<Map<String, dynamic>>.from(ordersProvider.modifyingCartItems ?? []);
      
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          setState(() {
            _modifyingOrderId = targetId;
            _modifyingOrderNumber = targetNumber;
            _orderType = targetType;
            _selectedTable = targetTable;
            _cart = targetCart;
          });
          ordersProvider.clearModification();
        }
      });
    } else if (ordersProvider.preselectedOrderType != null) {
      final targetType = ordersProvider.preselectedOrderType!;
      final targetTable = ordersProvider.preselectedTable;
      
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) {
          setState(() {
            _orderType = targetType;
            _selectedTable = targetTable;
          });
          ordersProvider.setPreselectedOrder(null, null);
        }
      });
    }

    final screenWidth = MediaQuery.of(context).size.width;
    final isMobile = screenWidth < 720;
    
    // Calculate available height for the sliding cart sheet
    // Full screen height minus bottom nav height (64) and safe area vertical paddings
    final padding = MediaQuery.of(context).padding;
    final availableHeight = MediaQuery.of(context).size.height - 64 - padding.top - padding.bottom;

    if (isMobile) {
      return Scaffold(
        backgroundColor: AppColors.darkBg,
        body: SafeArea(
          child: Stack(
            children: [
              // Background content
              Column(children: [
                _buildTopBar(),
                _buildCategoryRow(),
                Expanded(child: _buildProductGrid()),
              ]),
              // Dim overlay
              if (_cartOpen)
                GestureDetector(
                  onTap: _toggleCart,
                  child: Container(color: Colors.black54),
                ),
              // Sliding cart
              Positioned(
                left: 0, right: 0, bottom: 0,
                child: SlideTransition(
                  position: Tween<Offset>(
                    begin: const Offset(0, 1), end: Offset.zero,
                  ).animate(_cartSlide),
                  child: _buildCartPanel(isMobile: true, maxHeight: availableHeight * 0.9),
                ),
              ),
            ],
          ),
        ),
        floatingActionButton: !_cartOpen
            ? GestureDetector(
                onTap: _toggleCart,
                child: Container(
                  height: 60, width: 60,
                  decoration: BoxDecoration(
                    gradient: AppColors.primaryGradient,
                    shape: BoxShape.circle,
                    boxShadow: [BoxShadow(
                      color: AppColors.accentAmber.withOpacity(0.4),
                      blurRadius: 16, offset: const Offset(0, 4),
                    )],
                  ),
                  child: Stack(children: [
                    Center(child: Icon(
                      Icons.shopping_cart_rounded,
                      color: AppColors.textOnAmber, size: 26,
                    )),
                    if (_cartCount > 0)
                      Positioned(
                        right: 6, top: 6,
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: BoxDecoration(
                            color: AppColors.statusRed, shape: BoxShape.circle,
                          ),
                          child: Text('$_cartCount',
                              style: GoogleFonts.poppins(
                                color: Colors.white, fontSize: 10,
                                fontWeight: FontWeight.w700,
                              )),
                        ),
                      ),
                  ]),
                ),
              )
            : null,
      );
    } else {
      // Side-by-side desktop layout
      return Scaffold(
        backgroundColor: AppColors.darkBg,
        body: SafeArea(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Left side: catalog
              Expanded(
                child: Column(children: [
                  _buildTopBar(),
                  _buildCategoryRow(),
                  Expanded(child: _buildProductGrid()),
                ]),
              ),
              // Vertical divider
              Container(width: 1, color: AppColors.darkBorder),
              // Right side: persistent cart panel
              SizedBox(
                width: 380,
                child: _buildCartPanel(isMobile: false),
              ),
            ],
          ),
        ),
      );
    }
  }

  Widget _buildRegisterBadge(bool isMobile) {
    final user = context.watch<AuthProvider>().user;
    if (user == null || user.role == 'waiter') {
      return const SizedBox.shrink();
    }

    final financeProvider = context.watch<FinanceProvider>();
    final cashRegister = financeProvider.cashRegister;
    final activeSession = cashRegister['activeSession'];
    final isOpen = activeSession != null;

    return GestureDetector(
      onTap: () {
        if (isOpen) {
          final sessionId = JsonUtils.parseInt(activeSession['id']);
          final opening = JsonUtils.parseDouble(activeSession['opening_balance']);
          final sales = JsonUtils.parseDouble(cashRegister['cashSales']);
          final deposits = JsonUtils.parseDouble(cashRegister['cashDeposits']);
          final withdrawals = JsonUtils.parseDouble(cashRegister['cashWithdrawals']);
          final expected = opening + sales + deposits - withdrawals;

          _showCloseRegisterSheet(context, financeProvider, sessionId, expected);
        } else {
          _showOpenRegisterSheet(context, financeProvider);
        }
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: isOpen ? AppColors.statusGreen.withOpacity(0.12) : AppColors.textMuted.withOpacity(0.12),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: isOpen ? AppColors.statusGreen.withOpacity(0.3) : AppColors.darkBorder),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 6, height: 6,
              decoration: BoxDecoration(
                color: isOpen ? AppColors.statusGreen : AppColors.textMuted,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 6),
            Text(
              isOpen ? 'Register: Open' : 'Register: Closed',
              style: GoogleFonts.poppins(
                color: isOpen ? AppColors.statusGreen : AppColors.textMuted,
                fontSize: 11, fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showOpenRegisterSheet(BuildContext context, FinanceProvider provider) {
    final balanceCtrl = TextEditingController();
    final notesCtrl = TextEditingController();

    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.darkCard,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(left: 24, right: 24, top: 24, bottom: MediaQuery.of(ctx).viewInsets.bottom + 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Open Cash Register', style: GoogleFonts.poppins(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 16),
            TextField(
              controller: balanceCtrl,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              style: TextStyle(color: AppColors.textPrimary),
              decoration: InputDecoration(
                labelText: 'Opening Balance Amount (Rs.)',
                labelStyle: GoogleFonts.poppins(color: AppColors.textSecondary),
                enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: AppColors.darkBorder)),
                focusedBorder: UnderlineInputBorder(borderSide: BorderSide(color: AppColors.accentAmber)),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: notesCtrl,
              style: TextStyle(color: AppColors.textPrimary),
              decoration: InputDecoration(
                labelText: 'Opening Notes (optional)',
                labelStyle: GoogleFonts.poppins(color: AppColors.textSecondary),
                enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: AppColors.darkBorder)),
                focusedBorder: UnderlineInputBorder(borderSide: BorderSide(color: AppColors.accentAmber)),
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: () async {
                  final bal = double.tryParse(balanceCtrl.text) ?? 0.0;
                  final success = await provider.openCashRegister(bal, notesCtrl.text.trim());
                  if (success && ctx.mounted) {
                    Navigator.pop(ctx);
                    showTopSnackBar(context, SnackBar(content: Text('Cash register opened successfully', style: GoogleFonts.poppins(color: AppColors.textPrimary)), backgroundColor: AppColors.statusGreen));
                  } else if (ctx.mounted) {
                    showTopSnackBar(context, SnackBar(content: Text(provider.error ?? 'Failed to open register', style: GoogleFonts.poppins(color: AppColors.textPrimary)), backgroundColor: AppColors.statusRed));
                  }
                },
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.statusGreen, foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
                child: Text('Confirm Open', style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showCloseRegisterSheet(BuildContext context, FinanceProvider provider, int sessionId, double expected) {
    final balanceCtrl = TextEditingController(text: expected.toStringAsFixed(2));
    final notesCtrl = TextEditingController();

    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.darkCard,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(left: 24, right: 24, top: 24, bottom: MediaQuery.of(ctx).viewInsets.bottom + 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Close Cash Register Session', style: GoogleFonts.poppins(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 8),
            Text('Expected drawer balance: Rs. ${expected.toStringAsFixed(2)}', style: GoogleFonts.poppins(color: AppColors.textSecondary, fontSize: 12)),
            const SizedBox(height: 16),
            TextField(
              controller: balanceCtrl,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              style: TextStyle(color: AppColors.textPrimary),
              decoration: InputDecoration(
                labelText: 'Actual Drawer Cash Counted (Rs.)',
                labelStyle: GoogleFonts.poppins(color: AppColors.textSecondary),
                enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: AppColors.darkBorder)),
                focusedBorder: UnderlineInputBorder(borderSide: BorderSide(color: AppColors.accentAmber)),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: notesCtrl,
              style: TextStyle(color: AppColors.textPrimary),
              decoration: InputDecoration(
                labelText: 'Closing Notes (optional)',
                labelStyle: GoogleFonts.poppins(color: AppColors.textSecondary),
                enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: AppColors.darkBorder)),
                focusedBorder: UnderlineInputBorder(borderSide: BorderSide(color: AppColors.accentAmber)),
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: () async {
                  final bal = double.tryParse(balanceCtrl.text) ?? 0.0;
                  final discrepancy = bal - expected;

                  if (discrepancy.abs() > 0.01) {
                    final confirm = await showDialog<bool>(
                      context: context,
                      builder: (c) => AlertDialog(
                        backgroundColor: AppColors.darkCard,
                        title: Text('Discrepancy Warning', style: GoogleFonts.poppins(color: AppColors.textPrimary, fontWeight: FontWeight.bold)),
                        content: Text(
                          'Counted balance differs from expected by Rs. ${discrepancy.toStringAsFixed(2)}. A GL adjustment entry will be automatically posted. Continue?',
                          style: GoogleFonts.poppins(color: AppColors.textSecondary),
                        ),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.pop(c, false),
                            child: Text(
                              'Back',
                              style: GoogleFonts.poppins(
                                color: AppColors.textMuted,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          ElevatedButton(
                            onPressed: () => Navigator.pop(c, true),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.accentAmber,
                              foregroundColor: Colors.white,
                              elevation: 0,
                              shadowColor: Colors.transparent,
                              shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(10)),
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 16, vertical: 8),
                            ),
                            child: Text(
                              'Continue',
                              style: GoogleFonts.poppins(
                                  fontWeight: FontWeight.bold),
                            ),
                          ),
                        ],
                      ),
                    );
                    if (confirm != true) return;
                  }

                  final success = await provider.closeCashRegister(sessionId, bal, notesCtrl.text.trim());
                  if (success && ctx.mounted) {
                    Navigator.pop(ctx);
                    showTopSnackBar(context, SnackBar(content: Text('Cash register closed and reconciled', style: GoogleFonts.poppins(color: AppColors.textPrimary)), backgroundColor: AppColors.statusGreen));
                  } else if (ctx.mounted) {
                    showTopSnackBar(context, SnackBar(content: Text(provider.error ?? 'Failed to close register', style: GoogleFonts.poppins(color: AppColors.textPrimary)), backgroundColor: AppColors.statusRed));
                  }
                },
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.statusRed, foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
                child: Text('Confirm Close & Reconcile', style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── TOP BAR ──────────────────────────────────────────────────────────────
  Widget _buildTopBar() {
    final width = MediaQuery.of(context).size.width;
    final isMobile = width < 720;

    if (isMobile) {
      if (_isSearching) {
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: AppColors.darkSurface,
            border: Border(bottom: BorderSide(color: AppColors.darkBorder)),
          ),
          child: Row(
            children: [
              IconButton(
                icon: Icon(Icons.arrow_back, color: AppColors.textPrimary, size: 24),
                onPressed: () {
                  setState(() {
                    _isSearching = false;
                    _searchCtrl.clear();
                  });
                },
              ),
              Expanded(
                child: SizedBox(
                  height: 40,
                  child: TextField(
                    controller: _searchCtrl,
                    autofocus: true,
                    style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13),
                    decoration: InputDecoration(
                      hintText: 'Search menu...',
                      hintStyle: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 13),
                      prefixIcon: Icon(Icons.search, color: AppColors.textMuted, size: 18),
                      suffixIcon: _searchCtrl.text.isNotEmpty
                          ? GestureDetector(
                              onTap: () { _searchCtrl.clear(); setState(() {}); },
                              child: Icon(Icons.close, color: AppColors.textMuted, size: 18),
                            )
                          : null,
                      filled: true, fillColor: AppColors.darkCard,
                      contentPadding: EdgeInsets.zero,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: BorderSide(color: AppColors.darkBorder),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: BorderSide(color: AppColors.darkBorder),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(10),
                        borderSide: BorderSide(color: AppColors.accentAmber, width: 1.5),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      } else {
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: AppColors.darkSurface,
            border: Border(bottom: BorderSide(color: AppColors.darkBorder)),
          ),
          child: Row(
            children: [
              IconButton(
                icon: Icon(Icons.menu_rounded, color: AppColors.textPrimary, size: 24),
                onPressed: () => HomeShell.toggleMenu(),
              ),
              const SizedBox(width: 8),
              Text(
                'POS',
                style: GoogleFonts.poppins(
                  fontSize: 20,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(width: 8),
              _buildRegisterBadge(true),
              const SizedBox(width: 8),
              Expanded(
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: _buildOrderTypeToggle(),
                ),
              ),
              const SizedBox(width: 4),
              IconButton(
                icon: Icon(Icons.search, color: AppColors.textPrimary, size: 24),
                onPressed: () {
                  setState(() {
                    _isSearching = true;
                  });
                },
              ),
            ],
          ),
        );
      }
    }

    // Tablet & Desktop single-row layout
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: AppColors.darkSurface,
        border: Border(bottom: BorderSide(color: AppColors.darkBorder)),
      ),
      child: Row(children: [
        IconButton(
          icon: Icon(Icons.menu_rounded, color: AppColors.textPrimary, size: 24),
          onPressed: () => HomeShell.toggleMenu(),
        ),
        const SizedBox(width: 8),
        Text(
          'POS',
          style: GoogleFonts.poppins(
            fontSize: 20,
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(width: 16),
        // Search
        Expanded(
          child: SizedBox(
            height: 40,
            child: TextField(
              controller: _searchCtrl,
              style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13),
              decoration: InputDecoration(
                hintText: 'Search menu...',
                hintStyle: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 13),
                prefixIcon: Icon(Icons.search, color: AppColors.textMuted, size: 18),
                suffixIcon: _searchCtrl.text.isNotEmpty
                    ? GestureDetector(
                        onTap: () { _searchCtrl.clear(); setState(() {}); },
                        child: Icon(Icons.close, color: AppColors.textMuted, size: 18),
                      )
                    : null,
                filled: true, fillColor: AppColors.darkCard,
                contentPadding: EdgeInsets.zero,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: BorderSide(color: AppColors.darkBorder),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: BorderSide(color: AppColors.darkBorder),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: BorderSide(color: AppColors.accentAmber, width: 1.5),
                ),
              ),
            ),
          ),
        ),
        const SizedBox(width: 10),
        _buildOrderTypeToggle(),
        const SizedBox(width: 10),
        _buildRegisterBadge(false),
      ]),
    );
  }

  Widget _buildOrderTypeToggle() {
    const types = ['Dine-In', 'Takeaway', 'Delivery', 'Drive-Thru'];
    return Container(
      height: 38,
      padding: const EdgeInsets.all(3),
      decoration: BoxDecoration(
        color: AppColors.darkCard,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.darkBorder),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: types.map((type) {
          final sel = _orderType == type;
          return GestureDetector(
            onTap: () => setState(() {
              _orderType = type;
              if (type != 'Dine-In') _selectedTable = null;
              _tableError = false;
            }),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                gradient: sel ? AppColors.primaryGradient : null,
                borderRadius: BorderRadius.circular(7),
              ),
              child: Text(type, style: GoogleFonts.poppins(
                color: sel ? AppColors.textOnAmber : AppColors.textSecondary,
                fontSize: 11,
                fontWeight: sel ? FontWeight.w700 : FontWeight.w400,
              )),
            ),
          );
        }).toList(),
      ),
    );
  }

  // ── CATEGORY ROW ─────────────────────────────────────────────────────────
  Widget _buildCategoryRow() {
    final menuProvider = context.watch<MenuProvider>();
    final categories = ['All', ...menuProvider.categories.map((c) => c.name)];

    return Container(
      height: 52,
      color: AppColors.darkSurface,
      child: Row(
        children: [
          Expanded(
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              itemCount: categories.length,
              itemBuilder: (_, i) {
                final cat = categories[i];
                final sel = _selectedCategory == cat;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: GestureDetector(
                    onTap: () => setState(() => _selectedCategory = cat),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                      decoration: BoxDecoration(
                        gradient: sel ? AppColors.primaryGradient : null,
                        color: sel ? null : AppColors.darkCard,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: sel ? AppColors.accentAmber : AppColors.darkBorder,
                        ),
                      ),
                      child: Text(cat, style: GoogleFonts.poppins(
                        color: sel ? AppColors.textOnAmber : AppColors.textSecondary,
                        fontSize: 12,
                        fontWeight: sel ? FontWeight.w700 : FontWeight.w400,
                      )),
                    ),
                  ),
                );
              },
            ),
          ),
          IconButton(
            icon: Icon(Icons.add_circle_outline, color: AppColors.accentAmber, size: 22),
            tooltip: 'Add Category',
            onPressed: _showAddCategoryDialog,
          ),
          const SizedBox(width: 8),
        ],
      ),
    );
  }

  void _showAddCategoryDialog() {
    final ctrl = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.darkSurface,
        title: Text('Add Category',
            style: GoogleFonts.poppins(
                color: AppColors.textPrimary, fontWeight: FontWeight.bold)),
        content: TextField(
          controller: ctrl,
          style: GoogleFonts.poppins(color: AppColors.textPrimary),
          decoration: InputDecoration(
            hintText: 'Category Name',
            hintStyle: GoogleFonts.poppins(color: AppColors.textMuted),
            enabledBorder: UnderlineInputBorder(
                borderSide: BorderSide(color: AppColors.darkBorder)),
            focusedBorder: UnderlineInputBorder(
                borderSide: BorderSide(color: AppColors.accentAmber)),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text('Cancel',
                style: GoogleFonts.poppins(color: AppColors.textMuted)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.accentAmber,
              foregroundColor: AppColors.textOnAmber,
            ),
            onPressed: () async {
              final name = ctrl.text.trim();
              if (name.isNotEmpty) {
                Navigator.pop(ctx);
                final success = await context.read<MenuProvider>().createCategory(name);
                if (success && mounted) {
                  showTopSnackBar(context, SnackBar(
                    content: Text('Category created successfully!',
                        style: GoogleFonts.poppins(color: Colors.white)),
                    backgroundColor: AppColors.statusGreen,
                  ));
                } else if (mounted) {
                  showTopSnackBar(context, SnackBar(
                    content: Text('Failed to create category',
                        style: GoogleFonts.poppins(color: Colors.white)),
                    backgroundColor: AppColors.statusRed,
                  ));
                }
              }
            },
            child: Text('Add', style: GoogleFonts.poppins()),
          ),
        ],
      ),
    );
  }

  void _openAddMenuItemSheet() {
    final menuProvider = context.read<MenuProvider>();
    final sheetCats = menuProvider.categories.map((c) => c.name).where((name) => name != 'All').toList();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => MenuItemSheet(
        categories: sheetCats,
        onSave: (item, imageFile, serverImagePath) async {
          final provider = context.read<MenuProvider>();
          final success = await provider.createMenu(
            item['name'] as String,
            item['category'] as String,
            item['price'] as double,
            item['cost'] as double,
            imageFile: imageFile,
            serverImagePath: serverImagePath,
          );
          if (success && mounted) {
            showTopSnackBar(context, SnackBar(
              content: Text('Item created.',
                  style: GoogleFonts.poppins(color: AppColors.textPrimary)),
              backgroundColor: AppColors.statusGreen,
            ));
          }
        },
      ),
    );
  }

  // ── PRODUCT GRID ─────────────────────────────────────────────────────────
  Widget _buildProductGrid() {
    final menuProvider = context.watch<MenuProvider>();
    if (menuProvider.isLoading && menuProvider.menus.isEmpty) {
      return Center(
        child: CircularProgressIndicator(color: AppColors.accentAmber),
      );
    }
    final items = _filteredMenus;
    if (items.isEmpty) {
      final bool isCatalogEmpty = menuProvider.menus.isEmpty;
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(isCatalogEmpty ? '✨' : '🔍', style: const TextStyle(fontSize: 48)),
            const SizedBox(height: 12),
            Text(
              isCatalogEmpty ? 'No menu items found' : 'No items found',
              style: GoogleFonts.poppins(
                color: AppColors.textMuted,
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
            ),
            Text(
              isCatalogEmpty 
                  ? 'Get started by adding your first menu item'
                  : 'Try a different search or category',
              style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 12),
            ),
            if (isCatalogEmpty) ...[
              const SizedBox(height: 20),
              ElevatedButton.icon(
                onPressed: _openAddMenuItemSheet,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.accentAmber,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                icon: const Icon(Icons.add_rounded),
                label: Text(
                  'Add Menu Item',
                  style: GoogleFonts.poppins(fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ],
        ),
      );
    }
    return GridView.builder(
      padding: const EdgeInsets.fromLTRB(14, 14, 14, 100),
      gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
        maxCrossAxisExtent: 220,
        mainAxisSpacing: 12, crossAxisSpacing: 12,
        childAspectRatio: 0.78,
      ),
      itemCount: items.length,
      itemBuilder: (_, i) => _MenuItemCard(
        key: ValueKey(items[i]['id']),
        item: items[i],
        cartQty: _cart.firstWhere(
          (c) => c['id'] == items[i]['id'],
          orElse: () => {'qty': 0},
        )['qty'] as int,
        onAdd: () => _addToCart(items[i]),
      ),
    );
  }

  // ── CART PANEL ───────────────────────────────────────────────────────────
  // ── CART PANEL ───────────────────────────────────────────────────────────
  Widget _buildCartPanel({required bool isMobile, double? maxHeight}) {
    final bool isEmpty = _cart.isEmpty;

    return Container(
      constraints: BoxConstraints(
        maxHeight: isMobile 
            ? (maxHeight ?? MediaQuery.of(context).size.height * 0.85) 
            : double.infinity,
      ),
      decoration: BoxDecoration(
        color: AppColors.darkCard,
        borderRadius: isMobile 
            ? const BorderRadius.vertical(top: Radius.circular(24)) 
            : BorderRadius.zero,
        border: Border(
          top:   BorderSide(color: AppColors.darkBorder),
          left:  BorderSide(color: AppColors.darkBorder),
          right: isMobile ? BorderSide(color: AppColors.darkBorder) : BorderSide.none,
        ),
      ),
      child: Column(
        mainAxisSize: isMobile ? MainAxisSize.min : MainAxisSize.max,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _buildCartHeader(isMobile: isMobile),
          if (isEmpty)
            Flexible(child: _buildCartItems())
          else ...[
            Flexible(
              child: ListView(
                shrinkWrap: isMobile,
                padding: const EdgeInsets.symmetric(vertical: 8),
                children: [
                  _buildOrderConfig(),
                  const SizedBox(height: 8),
                  ...List.generate(_cart.length, (i) => Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 3),
                    child: _CartItemTile(
                      item: _cart[i],
                      onRemove:   () => _removeFromCart(i),
                      onDecrease: () => _updateQty(i, -1),
                      onIncrease: () => _updateQty(i, 1),
                    ),
                  )),
                ],
              ),
            ),
            _buildCartFooter(),
          ],
        ],
      ),
    );
  }

  Widget _buildCartHeader({required bool isMobile}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: AppColors.darkBorder)),
      ),
      child: Column(children: [
        if (isMobile)
          Container(
            width: 36, height: 4,
            margin: const EdgeInsets.only(bottom: 10),
            decoration: BoxDecoration(
              color: AppColors.darkBorder,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
        Row(children: [
          ShaderMask(
            shaderCallback: (b) => AppColors.primaryGradient.createShader(b),
            child: const Icon(Icons.shopping_cart_rounded, color: Colors.white, size: 20),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: FittedBox(
              fit: BoxFit.scaleDown,
              alignment: Alignment.centerLeft,
              child: Text(
                _modifyingOrderId != null
                    ? (_modifyingOrderNumber != null
                        ? 'Updating $_modifyingOrderNumber'
                        : 'Modify Order')
                    : 'Current Order',
                style: GoogleFonts.poppins(
                  color: AppColors.textPrimary,
                  fontWeight: FontWeight.w700,
                  fontSize: 15,
                ),
              ),
            ),
          ),
          if (_modifyingOrderId != null) ...[
            const SizedBox(width: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: AppColors.accentAmber.withOpacity(0.15),
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: AppColors.accentAmber.withOpacity(0.3)),
              ),
              child: Text(
                'Edit',
                style: GoogleFonts.poppins(
                  color: AppColors.accentAmber,
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
          const SizedBox(width: 6),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              gradient: AppColors.primaryGradient,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text('$_cartCount ${_cartCount == 1 ? "item" : "items"}', style: GoogleFonts.poppins(
              color: AppColors.textOnAmber, fontSize: 11, fontWeight: FontWeight.w600,
            )),
          ),
          if (_cart.isNotEmpty) ...[
            const SizedBox(width: 6),
            GestureDetector(
              onTap: _showClearConfirm,
              child: Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: AppColors.statusRedBg,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppColors.statusRed.withOpacity(0.3)),
                ),
                child: Icon(Icons.delete_outline, color: AppColors.statusRed, size: 16),
              ),
            ),
          ],
          if (isMobile) ...[
            const SizedBox(width: 6),
            GestureDetector(
              onTap: _toggleCart,
              child: Container(
                padding: const EdgeInsets.all(5),
                decoration: BoxDecoration(
                  color: AppColors.darkSurface,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(Icons.keyboard_arrow_down,
                    color: AppColors.textSecondary, size: 18),
              ),
            ),
          ],
        ]),
      ]),
    );
  }

  void _showClearConfirm() {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: AppColors.darkCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text('Clear Cart?', style: GoogleFonts.poppins(
            color: AppColors.textPrimary, fontWeight: FontWeight.w700)),
        content: Text('All items will be removed from the cart.',
            style: GoogleFonts.poppins(color: AppColors.textSecondary)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Cancel', style: GoogleFonts.poppins(color: AppColors.textMuted)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.statusRed, foregroundColor: Colors.white,
            ),
            onPressed: () { Navigator.pop(context); _clearCart(); },
            child: Text('Clear', style: GoogleFonts.poppins()),
          ),
        ],
      ),
    );
  }

  Widget _buildOrderConfig() {
    final screenWidth = MediaQuery.of(context).size.width;
    final isCompact = screenWidth < 520;
    final tablesProvider = context.watch<TablesProvider>();
    final tables = (tablesProvider.tables.isEmpty 
        ? <String>[] 
        : tablesProvider.tables
            .where((t) => t.status != 'occupied' || t.number == _selectedTable)
            .map((t) => t.number)
            .toList()).toSet().toList();

    // Ensure unique customer names to prevent dropdown assertion crashes
    final List<Map<String, dynamic>> rawCustomers = [
      {'id': 0, 'name': 'Walk-in Customer'},
      ..._customers
    ];
    final seenNames = <String>{};
    final customers = <Map<String, dynamic>>[];
    for (var c in rawCustomers) {
      final name = c['name'] as String? ?? '';
      if (name.isNotEmpty && !seenNames.contains(name)) {
        seenNames.add(name);
        customers.add(c);
      }
    }

    final tableWidget = _PosDropdown<String>(
      label: 'Table',
      icon: Icons.table_restaurant,
      hint: tablesProvider.tables.isEmpty ? 'Add table' : 'Select Table',
      hasError: tablesProvider.tables.isEmpty || (_orderType == 'Dine-In' && (_selectedTable == null || _selectedTable!.isEmpty) && _tableError),
      value: tables.contains(_selectedTable) ? _selectedTable : null,
      items: tables.map((t) => DropdownMenuItem(
        value: t,
        child: Text(t, style: GoogleFonts.poppins(
            color: AppColors.textPrimary, fontSize: 13)),
      )).toList(),
      onChanged: (v) => setState(() {
        _selectedTable = v;
        _tableError = false;
      }),
    );

    final addTableButton = Padding(
      padding: const EdgeInsets.only(top: 22),
      child: IconButton(
        padding: EdgeInsets.zero,
        constraints: const BoxConstraints(),
        icon: Icon(Icons.add_circle_outline, color: AppColors.accentAmber, size: 22),
        tooltip: 'Add Table',
        onPressed: _showAddTableDialog,
      ),
    );

    final customerWidget = _PosDropdown<String>(
      label: 'Customer',
      icon: Icons.person_outline,
      hint: 'Customer',
      value: _selectedCustomer?['name'] as String?,
      items: customers.map((c) => DropdownMenuItem(
        value: c['name'] as String,
        child: Row(children: [
          if (c.containsKey('points'))
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
              margin: const EdgeInsets.only(right: 4),
              decoration: BoxDecoration(
                color: AppColors.statusAmberBg,
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text('⭐ ${c["points"]}', style: GoogleFonts.poppins(
                  color: AppColors.accentAmber, fontSize: 9)),
            ),
          Expanded(
            child: Text(
              c['name'] as String,
              overflow: TextOverflow.ellipsis,
              style: GoogleFonts.poppins(
                color: AppColors.textPrimary, fontSize: 12,
              ),
            ),
          ),
        ]),
      )).toList(),
      onChanged: (v) => setState(() =>
        _selectedCustomer = customers.firstWhere((c) => c['name'] == v)),
    );

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
      decoration: BoxDecoration(
        border: Border(bottom: BorderSide(color: AppColors.darkBorder)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (_orderType == 'Dine-In') ...[
            Expanded(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(child: tableWidget),
                  const SizedBox(width: 4),
                  addTableButton,
                ],
              ),
            ),
            const SizedBox(width: 8),
          ],
          Expanded(child: customerWidget),
        ],
      ),
    );
  }

  void _showAddTableDialog() {
    final ctrl = TextEditingController();
    final capacityCtrl = TextEditingController(text: '4');
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.darkSurface,
        title: Text('Add Table',
            style: GoogleFonts.poppins(
                color: AppColors.textPrimary, fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: ctrl,
              style: GoogleFonts.poppins(color: AppColors.textPrimary),
              decoration: InputDecoration(
                hintText: 'Table Number (e.g. T-11)',
                hintStyle: GoogleFonts.poppins(color: AppColors.textMuted),
                enabledBorder: UnderlineInputBorder(
                    borderSide: BorderSide(color: AppColors.darkBorder)),
                focusedBorder: UnderlineInputBorder(
                    borderSide: BorderSide(color: AppColors.accentAmber)),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: capacityCtrl,
              keyboardType: TextInputType.number,
              style: GoogleFonts.poppins(color: AppColors.textPrimary),
              decoration: InputDecoration(
                hintText: 'Capacity (e.g. 4)',
                hintStyle: GoogleFonts.poppins(color: AppColors.textMuted),
                enabledBorder: UnderlineInputBorder(
                    borderSide: BorderSide(color: AppColors.darkBorder)),
                focusedBorder: UnderlineInputBorder(
                    borderSide: BorderSide(color: AppColors.accentAmber)),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text('Cancel',
                style: GoogleFonts.poppins(color: AppColors.textMuted)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.accentAmber,
              foregroundColor: AppColors.textOnAmber,
            ),
            onPressed: () async {
              final number = ctrl.text.trim();
              final capacity = int.tryParse(capacityCtrl.text.trim()) ?? 4;
              if (number.isNotEmpty) {
                Navigator.pop(ctx);
                final success = await context.read<TablesProvider>().addTable(
                  tableNumber: number,
                  capacity: capacity,
                  status: 'available',
                );
                if (success && mounted) {
                  setState(() {
                    _selectedTable = number;
                  });
                  showTopSnackBar(context, SnackBar(
                    content: Text('Table created successfully!',
                        style: GoogleFonts.poppins(color: Colors.white)),
                    backgroundColor: AppColors.statusGreen,
                  ));
                } else if (mounted) {
                  showTopSnackBar(context, SnackBar(
                    content: Text('Failed to create table',
                        style: GoogleFonts.poppins(color: Colors.white)),
                    backgroundColor: AppColors.statusRed,
                  ));
                }
              }
            },
            child: Text('Add', style: GoogleFonts.poppins()),
          ),
        ],
      ),
    );
  }

  Widget _buildCartItems() {
    if (_cart.isEmpty) {
      return Padding(
        padding: const EdgeInsets.all(32),
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          const Text('🛒', style: TextStyle(fontSize: 48)),
          const SizedBox(height: 12),
          Text('Your cart is empty', style: GoogleFonts.poppins(
              color: AppColors.textMuted, fontSize: 15, fontWeight: FontWeight.w500)),
          const SizedBox(height: 4),
          Text('Add items from the menu to get started',
              style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 12),
              textAlign: TextAlign.center),
        ]),
      );
    }
    return ListView.separated(
      shrinkWrap: true,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      itemCount: _cart.length,
      separatorBuilder: (_, __) => const SizedBox(height: 6),
      itemBuilder: (_, i) => _CartItemTile(
        item: _cart[i],
        onRemove:   () => _removeFromCart(i),
        onDecrease: () => _updateQty(i, -1),
        onIncrease: () => _updateQty(i, 1),
      ),
    );
  }

  Widget _buildCartFooter() {
    final isMobile = MediaQuery.of(context).size.width < 720;
    final user = context.watch<AuthProvider>().user;
    final isWaiter = user?.role == 'waiter';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.darkSurface,
        border: Border(top: BorderSide(color: AppColors.darkBorder)),
      ),
      child: Column(children: [
        _PosTotalRow(label: 'Subtotal', amount: _subtotal),
        const SizedBox(height: 4),
        _PosTotalRow(label: 'Tax (${(_taxRate * 100).toStringAsFixed(0)}%)', amount: _taxAmount, isSmall: true),
        Padding(
          padding: EdgeInsets.symmetric(vertical: 8),
          child: Divider(color: AppColors.darkBorder, height: 1),
        ),
        _PosTotalRow(label: 'Total', amount: _grandTotal, isBold: true, isAmber: true),
        const SizedBox(height: 14),
        Row(children: [
          Expanded(
            child: SizedBox(
              height: 52,
              child: isWaiter 
                ? ElevatedButton(
                    onPressed: _cart.isNotEmpty ? _saveOrderPending : null,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.accentAmber,
                      disabledBackgroundColor: AppColors.darkBorder,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      elevation: 0,
                    ),
                    child: FittedBox(
                      fit: BoxFit.scaleDown,
                      child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                        Icon(Icons.save_rounded, color: AppColors.textOnAmber, size: 18),
                        const SizedBox(width: 8),
                        Text(
                          _modifyingOrderId != null ? 'Update Order (KDS)' : 'Send to Kitchen (KDS)',
                          style: GoogleFonts.poppins(
                            color: AppColors.textOnAmber,
                            fontWeight: FontWeight.w700, fontSize: 13,
                          ),
                        ),
                      ]),
                    ),
                  )
                : OutlinedButton(
                    onPressed: _cart.isNotEmpty ? _saveOrderPending : null,
                    style: OutlinedButton.styleFrom(
                      side: BorderSide(color: _cart.isNotEmpty ? AppColors.accentAmber : AppColors.darkBorder),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    child: FittedBox(
                      fit: BoxFit.scaleDown,
                      child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                        if (!isMobile) ...[
                          Icon(Icons.save_rounded, color: _cart.isNotEmpty ? AppColors.accentAmber : AppColors.textMuted, size: 18),
                          const SizedBox(width: 8),
                        ],
                        Text(
                          _modifyingOrderId != null ? 'Update Order' : 'Save Order',
                          style: GoogleFonts.poppins(
                            color: _cart.isNotEmpty ? AppColors.accentAmber : AppColors.textMuted,
                            fontWeight: FontWeight.w600, fontSize: 13,
                          ),
                        ),
                      ]),
                    ),
                  ),
            ),
          ),
          if (!isWaiter) ...[
            const SizedBox(width: 10),
            Expanded(
              flex: 2,
              child: SizedBox(
                height: 52,
                child: ElevatedButton(
                  onPressed: _cart.isNotEmpty ? _showPaymentModal : null,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.accentAmber,
                    disabledBackgroundColor: AppColors.darkBorder,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    elevation: 0,
                  ),
                  child: FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                      if (!isMobile) ...[
                        Icon(Icons.payment_rounded, color: AppColors.textOnAmber, size: 18),
                        const SizedBox(width: 8),
                      ],
                      Text(
                        _modifyingOrderId != null ? 'Update & Pay' : 'Pay & Complete',
                        style: GoogleFonts.poppins(
                          color: AppColors.textOnAmber,
                          fontWeight: FontWeight.w700, fontSize: 13,
                        ),
                      ),
                    ]),
                  ),
                ),
              ),
            ),
          ],
        ]),
      ]),
    );
  }
}

// ──────────────────────────────────────────────────────────────────────────────
//  MENU ITEM CARD
// ──────────────────────────────────────────────────────────────────────────────
class _MenuItemCard extends StatelessWidget {
  final Map<String, dynamic> item;
  final int cartQty;
  final VoidCallback onAdd;

  const _MenuItemCard({
    super.key,
    required this.item, required this.cartQty, required this.onAdd,
  });

  @override
  Widget build(BuildContext context) {
    final isOutOfStock = item['out_of_stock'] == true;
    final bg    = AppColors.accentAmber;
    final inCart = cartQty > 0;

    return GestureDetector(
      onTap: isOutOfStock ? null : onAdd,
      child: Opacity(
        opacity: isOutOfStock ? 0.55 : 1.0,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          decoration: BoxDecoration(
            gradient: AppColors.isDark
                ? const LinearGradient(
                    begin: Alignment.topLeft, end: Alignment.bottomRight,
                    colors: [Color(0xFF231507), Color(0xFF1A0E05)],
                  )
                : const LinearGradient(
                    begin: Alignment.topLeft, end: Alignment.bottomRight,
                    colors: [Color(0xFFFFFFFF), Color(0xFFFFFFFF)],
                  ),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: inCart ? AppColors.accentAmber : AppColors.darkBorder,
              width: inCart ? 1.5 : 1.0,
            ),
            boxShadow: AppColors.isDark
                ? (inCart
                    ? [BoxShadow(
                        color: AppColors.accentAmber.withOpacity(0.15),
                        blurRadius: 12, offset: const Offset(0, 4),
                      )]
                    : const [])
                : [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.04),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                    if (inCart)
                      BoxShadow(
                        color: AppColors.accentAmber.withOpacity(0.2),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      )
                  ],
          ),
          child: Column(children: [
            // Emoji hero area
            Expanded(
              flex: 5,
              child: Container(
                width: double.infinity,
                decoration: BoxDecoration(
                  color: bg.withOpacity(0.35),
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(11)),
                ),
                child: Stack(
                  fit: StackFit.expand,
                  children: [
                  if (item['image_url'] != null && (item['image_url'] as String).isNotEmpty)
                    ClipRRect(
                      borderRadius: const BorderRadius.vertical(top: Radius.circular(11)),
                      child: Image.network(
                        AppConstants.formatImageUrl(item['image_url']),
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) {
                          return Center(
                            child: Container(
                              width: 72, height: 72,
                              decoration: BoxDecoration(
                                color: bg, shape: BoxShape.circle,
                                boxShadow: [BoxShadow(
                                  color: bg.withOpacity(0.5),
                                  blurRadius: 20, offset: const Offset(0, 4),
                                )],
                              ),
                              child: Center(
                                child: Text(item['emoji'] as String,
                                    style: const TextStyle(fontSize: 32)),
                              ),
                            ),
                          );
                        },
                      ),
                    )
                  else
                    Center(
                      child: Container(
                        width: 72, height: 72,
                        decoration: BoxDecoration(
                          color: bg, shape: BoxShape.circle,
                          boxShadow: [BoxShadow(
                            color: bg.withOpacity(0.5),
                            blurRadius: 20, offset: const Offset(0, 4),
                          )],
                        ),
                        child: Center(
                          child: Text(item['emoji'] as String,
                              style: const TextStyle(fontSize: 32)),
                        ),
                      ),
                    ),
                  if (inCart)
                    Positioned(
                      top: 8, right: 8,
                      child: Container(
                        width: 24, height: 24,
                        decoration: BoxDecoration(
                          gradient: LinearGradient(colors: [
                            AppColors.accentAmber, AppColors.accentGold,
                          ]),
                          shape: BoxShape.circle,
                        ),
                        child: Center(
                          child: Text('$cartQty', style: GoogleFonts.poppins(
                            color: AppColors.textOnAmber,
                            fontSize: 11, fontWeight: FontWeight.w700,
                          )),
                        ),
                      ),
                    ),
                  if (isOutOfStock)
                    Positioned(
                      top: 8, left: 8,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.red.withOpacity(0.9),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          'Out of Stock',
                          style: GoogleFonts.poppins(
                            color: Colors.white,
                            fontSize: 9,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                ]),
              ),
            ),
            // Details
            Expanded(
              flex: 4,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(item['name'] as String,
                      style: GoogleFonts.poppins(
                        color: AppColors.textPrimary, fontWeight: FontWeight.w600,
                        fontSize: 12.5, height: 1.2,
                      ),
                      maxLines: 2, overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 2),
                  Text(item['category'] as String,
                      style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 10)),
                  const Spacer(),
                  Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                    Text('${AppConstants.currencySymbol} ${JsonUtils.parseDouble(item["price"]).toStringAsFixed(0)}',  // ignore: prefer_interpolation_to_compose_strings
                        style: GoogleFonts.poppins(
                          color: AppColors.accentAmber,
                          fontWeight: FontWeight.w700, fontSize: 14,
                        )),
                    Container(
                      width: 28, height: 28,
                      decoration: BoxDecoration(
                        gradient: isOutOfStock ? const LinearGradient(colors: [Colors.grey, Colors.grey]) : AppColors.primaryGradient,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Icon(Icons.add, color: isOutOfStock ? Colors.white60 : AppColors.textOnAmber, size: 18),
                    ),
                  ]),
                ]),
              ),
            ),
          ]),
        ),
      ),
    );
  }
}

// ──────────────────────────────────────────────────────────────────────────────
//  CART ITEM TILE
// ──────────────────────────────────────────────────────────────────────────────
class _CartItemTile extends StatelessWidget {
  final Map<String, dynamic> item;
  final VoidCallback onRemove;
  final VoidCallback onDecrease;
  final VoidCallback onIncrease;

  const _CartItemTile({
    required this.item, required this.onRemove,
    required this.onDecrease, required this.onIncrease,
  });

  @override
  Widget build(BuildContext context) {
    final qty    = item['qty'] as int;
    final price  = item['price'] as double;
    final total  = price * qty;
    final bg     = AppColors.accentAmber;
    final isDelivered = item['kds_status'] == 'delivered';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
      decoration: BoxDecoration(
        color: AppColors.darkSurface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.darkBorder),
      ),
      child: Row(children: [
        Container(
          width: 38, height: 38,
          decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(10)),
          child: Center(child: Text(item['emoji'] as String,
              style: const TextStyle(fontSize: 18))),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                item['name'] as String,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: GoogleFonts.poppins(
                  color: isDelivered ? AppColors.textMuted : AppColors.textPrimary,
                  fontWeight: FontWeight.w600, fontSize: 13,
                  decoration: isDelivered ? TextDecoration.lineThrough : null,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                isDelivered ? 'Delivered' : '${AppConstants.currencySymbol} ${price.toStringAsFixed(2)} each',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: GoogleFonts.poppins(
                  color: isDelivered ? AppColors.statusGreen : AppColors.textMuted,
                  fontSize: 11,
                  fontWeight: isDelivered ? FontWeight.w600 : FontWeight.w400,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(width: 6),
        // Qty controls
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            _PosQtyBtn(
              icon: Icons.remove, 
              onTap: isDelivered ? () {} : onDecrease,
              isDisabled: isDelivered,
            ),
            Container(
              width: 26,
              alignment: Alignment.center,
              child: Text('$qty', style: GoogleFonts.poppins(
                color: isDelivered ? AppColors.textMuted : AppColors.textPrimary,
                fontWeight: FontWeight.w700, fontSize: 13,
              )),
            ),
            _PosQtyBtn(
              icon: Icons.add, 
              onTap: isDelivered ? () {} : onIncrease, 
              isAdd: true,
              isDisabled: isDelivered,
            ),
          ],
        ),
        const SizedBox(width: 8),
        FittedBox(
          fit: BoxFit.scaleDown,
          child: Text(
            '${AppConstants.currencySymbol} ${total.toStringAsFixed(2)}',
            style: GoogleFonts.poppins(
              color: isDelivered ? AppColors.textMuted : AppColors.accentAmber,
              fontWeight: FontWeight.w700,
              fontSize: 13,
            ),
          ),
        ),
        const SizedBox(width: 6),
        GestureDetector(
          onTap: isDelivered ? null : onRemove,
          child: Icon(
            Icons.delete_outline,
            color: isDelivered ? AppColors.textMuted.withOpacity(0.3) : AppColors.statusRed,
            size: 16,
          ),
        ),
      ]),
    );
  }
}

class _PosQtyBtn extends StatelessWidget {
  final IconData icon;
  final VoidCallback onTap;
  final bool isAdd;
  final bool isDisabled;

  const _PosQtyBtn({
    required this.icon, 
    required this.onTap, 
    this.isAdd = false,
    this.isDisabled = false,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: isDisabled ? null : onTap,
      child: Container(
        width: 26, height: 26,
        decoration: BoxDecoration(
          color: isDisabled 
              ? AppColors.darkCard.withOpacity(0.5) 
              : (isAdd ? AppColors.accentAmber.withOpacity(0.15) : AppColors.darkCard),
          borderRadius: BorderRadius.circular(7),
          border: Border.all(
            color: isDisabled 
                ? AppColors.darkBorder.withOpacity(0.3) 
                : (isAdd ? AppColors.accentAmber : AppColors.darkBorder),
          ),
        ),
        child: Icon(
          icon, 
          size: 14,
          color: isDisabled 
              ? AppColors.textMuted.withOpacity(0.3) 
              : (isAdd ? AppColors.accentAmber : AppColors.textSecondary),
        ),
      ),
    );
  }
}

// ──────────────────────────────────────────────────────────────────────────────
//  SHARED WIDGETS
// ──────────────────────────────────────────────────────────────────────────────
class _PosTotalRow extends StatelessWidget {
  final String label;
  final double amount;
  final bool isBold;
  final bool isAmber;
  final bool isSmall;

  const _PosTotalRow({
    required this.label, required this.amount,
    this.isBold = false, this.isAmber = false, this.isSmall = false,
  });

  @override
  Widget build(BuildContext context) {
    return Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
      Text(label, style: GoogleFonts.poppins(
        color: isBold ? AppColors.textPrimary : AppColors.textSecondary,
        fontWeight: isBold ? FontWeight.w700 : FontWeight.w400,
        fontSize: isSmall ? 12 : 14,
      )),
      Text('${AppConstants.currencySymbol} ${amount.toStringAsFixed(2)}', style: GoogleFonts.poppins(
        color: isAmber ? AppColors.accentAmber : AppColors.textPrimary,
        fontWeight: isBold ? FontWeight.w700 : FontWeight.w400,
        fontSize: isBold ? 18 : (isSmall ? 12 : 14),
      )),
    ]);
  }
}

class _PosDropdown<T> extends StatelessWidget {
  final IconData icon;
  final String hint;
  final String? label;
  final T? value;
  final List<DropdownMenuItem<T>> items;
  final ValueChanged<T?> onChanged;
  final bool hasError;

  const _PosDropdown({
    required this.icon, required this.hint,
    this.label,
    required this.value, required this.items, required this.onChanged,
    this.hasError = false,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        if (label != null)
          Padding(
            padding: const EdgeInsets.only(left: 2, bottom: 4),
            child: Text(
              label!,
              style: GoogleFonts.poppins(
                color: AppColors.textSecondary,
                fontSize: 11,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        LayoutBuilder(
          builder: (context, constraints) {
            final entries = items.map((item) {
              String labelText = '';
              Widget? leading;
              
              if (item.child is Text) {
                labelText = (item.child as Text).data ?? '';
              } else if (item.child is Row) {
                final rowChildren = (item.child as Row).children;
                for (var child in rowChildren) {
                  if (child is Text) {
                    labelText = child.data ?? '';
                  } else if (child is Container || child is Icon) {
                    leading = child;
                  }
                }
              }
              
              return DropdownMenuEntry<T>(
                value: item.value as T,
                label: labelText.isNotEmpty ? labelText : (item.value?.toString() ?? ''),
                leadingIcon: leading,
                style: MenuItemButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  textStyle: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13),
                ),
              );
            }).toList();

            final border = OutlineInputBorder(
              borderRadius: BorderRadius.circular(10),
              borderSide: BorderSide(
                color: hasError ? AppColors.statusRed : AppColors.darkBorder,
                width: hasError ? 2.0 : 1.0,
              ),
            );

            return DropdownMenu<T>(
              width: constraints.maxWidth,
              initialSelection: value,
              hintText: hint,
              leadingIcon: Icon(icon, color: hasError ? AppColors.statusRed : AppColors.textMuted, size: 16),
              dropdownMenuEntries: entries,
              onSelected: onChanged,
              inputDecorationTheme: Theme.of(context).inputDecorationTheme.copyWith(
                contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                isDense: true,
                filled: true,
                fillColor: hasError ? AppColors.statusRed.withOpacity(0.08) : Colors.transparent,
                hintStyle: GoogleFonts.poppins(
                  color: hasError ? AppColors.statusRed : AppColors.textMuted,
                  fontSize: 13,
                  fontWeight: hasError ? FontWeight.w600 : FontWeight.w400,
                ),
                enabledBorder: border,
                focusedBorder: border.copyWith(
                  borderSide: BorderSide(
                    color: hasError ? AppColors.statusRed : AppColors.accentAmber,
                    width: 2.0,
                  ),
                ),
              ),
              menuStyle: MenuStyle(
                backgroundColor: WidgetStatePropertyAll(AppColors.darkCard),
                surfaceTintColor: const WidgetStatePropertyAll(Colors.transparent),
                shape: WidgetStatePropertyAll(
                  RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              textStyle: GoogleFonts.poppins(
                color: hasError ? AppColors.statusRed : AppColors.textPrimary,
                fontSize: 13,
                fontWeight: hasError ? FontWeight.w500 : FontWeight.w400,
              ),
            );
          },
        ),
      ],
    );
  }
}

// ──────────────────────────────────────────────────────────────────────────────
//  PAYMENT MODAL
// ──────────────────────────────────────────────────────────────────────────────
class _PaymentModal extends StatefulWidget {
  final double grandTotal;
  final Map<String, dynamic>? selectedCustomer;
  final List<Map<String, dynamic>> customers;
  final Function(String method, {int? bankAccountId, Map<String, dynamic>? selectedCustomer}) onConfirm;

  const _PaymentModal({
    required this.grandTotal,
    required this.selectedCustomer,
    required this.customers,
    required this.onConfirm,
  });

  @override
  State<_PaymentModal> createState() => _PaymentModalState();
}

class _PaymentModalState extends State<_PaymentModal>
    with SingleTickerProviderStateMixin {
  late TabController _tabCtrl;
  final _cashCtrl       = TextEditingController();
  final _cardRefCtrl    = TextEditingController();
  final _custSearchCtrl = TextEditingController();
  int? _selectedBankAccountId;
  bool _bankAccountError = false;
  bool _creditCustomerError = false;
  Timer? _creditErrorTimer;
  Timer? _bankErrorTimer;
  Map<String, dynamic>? _modalSelectedCustomer;
  List<Map<String, dynamic>> _modalCustomers = [];

  double get _tendered =>
      double.tryParse(_cashCtrl.text.replaceAll(',', '')) ?? 0.0;
  double get _change =>
      _tendered >= widget.grandTotal ? _tendered - widget.grandTotal : 0.0;

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 3, vsync: this);
    _modalSelectedCustomer = widget.selectedCustomer;
    _modalCustomers = List<Map<String, dynamic>>.from(widget.customers);
    final formattedTotal = widget.grandTotal % 1 == 0
        ? widget.grandTotal.toInt().toString()
        : widget.grandTotal.toStringAsFixed(2);
    _cashCtrl.text = formattedTotal;
    _cashCtrl.addListener(() => setState(() {}));
    
    // Auto-fetch fresh customers on load
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _fetchFreshCustomers();
    });
  }

  Future<void> _fetchFreshCustomers() async {
    try {
      final api = context.read<ApiService>();
      final res = await api.get('/customers');
      if (res != null && res['data'] != null) {
        if (mounted) {
          setState(() {
            _modalCustomers = (res['data'] as List)
                .map((e) => Map<String, dynamic>.from(e as Map))
                .toList();
          });
        }
      }
    } catch (e) {
      debugPrint('Error fetching customers in modal: $e');
    }
  }

  @override
  void dispose() {
    _creditErrorTimer?.cancel();
    _bankErrorTimer?.cancel();
    _tabCtrl.dispose();
    _cashCtrl.dispose();
    _cardRefCtrl.dispose();
    _custSearchCtrl.dispose();
    super.dispose();
  }

  void _confirm() {
    const methods = ['Cash', 'Card', 'Credit'];
    final method  = methods[_tabCtrl.index];
    if (method == 'Credit' && _modalSelectedCustomer == null) {
      _creditErrorTimer?.cancel();
      setState(() => _creditCustomerError = true);
      _creditErrorTimer = Timer(const Duration(seconds: 2), () {
        if (mounted) {
          setState(() => _creditCustomerError = false);
        }
      });
      return;
    }
    if (method == 'Cash' && _tendered < widget.grandTotal) {
      return;
    }
    if (method == 'Card') {
      final bankAccounts = context.read<OrdersProvider>().bankAccounts;
      if (_selectedBankAccountId == null || !bankAccounts.any((acc) => acc.id == _selectedBankAccountId)) {
        _bankErrorTimer?.cancel();
        setState(() => _bankAccountError = true);
        _bankErrorTimer = Timer(const Duration(seconds: 2), () {
          if (mounted) {
            setState(() => _bankAccountError = false);
          }
        });
        if (bankAccounts.isEmpty) {
          _showQuickAddBankAccountSheet();
        }
        return;
      }
      widget.onConfirm(method, bankAccountId: _selectedBankAccountId, selectedCustomer: _modalSelectedCustomer);
    } else {
      widget.onConfirm(method, selectedCustomer: _modalSelectedCustomer);
    }
  }

  void _showQuickAddCustomerSheet() {
    final nameCtrl = TextEditingController();
    final phoneCtrl = TextEditingController();
    final emailCtrl = TextEditingController();

    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.darkCard,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx2, setStateSheet) => Padding(
          padding: EdgeInsets.only(
              left: 24,
              right: 24,
              top: 24,
              bottom: MediaQuery.of(ctx2).viewInsets.bottom + 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Quick Add Customer',
                      style: GoogleFonts.poppins(
                          color: AppColors.textPrimary,
                          fontWeight: FontWeight.bold,
                          fontSize: 16)),
                  IconButton(
                    icon: Icon(Icons.close_rounded, color: AppColors.textMuted, size: 20),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              TextField(
                controller: nameCtrl,
                style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13),
                decoration: InputDecoration(
                  labelText: 'Customer Name *',
                  labelStyle: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 12),
                  prefixIcon: Icon(Icons.person_outline_rounded, color: AppColors.textMuted, size: 18),
                  filled: true,
                  fillColor: AppColors.darkSurface,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: phoneCtrl,
                keyboardType: TextInputType.phone,
                style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13),
                decoration: InputDecoration(
                  labelText: 'Phone Number',
                  labelStyle: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 12),
                  prefixIcon: Icon(Icons.phone_outlined, color: AppColors.textMuted, size: 18),
                  filled: true,
                  fillColor: AppColors.darkSurface,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: emailCtrl,
                keyboardType: TextInputType.emailAddress,
                style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13),
                decoration: InputDecoration(
                  labelText: 'Email Address (optional)',
                  labelStyle: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 12),
                  prefixIcon: Icon(Icons.email_outlined, color: AppColors.textMuted, size: 18),
                  filled: true,
                  fillColor: AppColors.darkSurface,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: () async {
                    final name = nameCtrl.text.trim();
                    if (name.isEmpty) {
                      showTopSnackBar(
                          context,
                          SnackBar(
                              content: const Text('Customer name is required'),
                              backgroundColor: AppColors.statusRed));
                      return;
                    }

                    final api = context.read<ApiService>();
                    final res = await api.post('/customers', {
                      'name': name,
                      'phone': phoneCtrl.text.trim(),
                      'email': emailCtrl.text.trim(),
                    });

                    if (res != null && (res['success'] == true || res['id'] != null || res['data'] != null)) {
                      final Map<String, dynamic> newCust = res['data'] != null
                          ? Map<String, dynamic>.from(res['data'] as Map)
                          : {'id': res['id'] ?? DateTime.now().millisecondsSinceEpoch, 'name': name, 'phone': phoneCtrl.text.trim()};

                      setState(() {
                        _modalSelectedCustomer = newCust;
                        _creditCustomerError = false;
                        if (!_modalCustomers.any((c) => c['name'] == newCust['name'])) {
                          _modalCustomers.insert(0, newCust);
                        }
                      });

                      if (ctx.mounted) {
                        Navigator.pop(ctx);
                        showTopSnackBar(
                            context,
                            SnackBar(
                                content: Text('Customer "$name" added & selected!'),
                                backgroundColor: AppColors.statusGreen));
                      }
                    } else {
                      // Fallback local creation if backend response format differs
                      final fallbackCust = {
                        'id': DateTime.now().millisecondsSinceEpoch,
                        'name': name,
                        'phone': phoneCtrl.text.trim(),
                      };
                      setState(() {
                        _modalSelectedCustomer = fallbackCust;
                        _modalCustomers.insert(0, fallbackCust);
                      });
                      if (ctx.mounted) {
                        Navigator.pop(ctx);
                        showTopSnackBar(
                            context,
                            SnackBar(
                                content: Text('Customer "$name" selected for credit!'),
                                backgroundColor: AppColors.statusGreen));
                      }
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.accentAmber,
                    foregroundColor: AppColors.textOnAmber,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: Text('Save & Select Customer',
                      style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showQuickAddBankAccountSheet() {
    final nameCtrl = TextEditingController();
    final numberCtrl = TextEditingController();
    final bankCtrl = TextEditingController();
    final balanceCtrl = TextEditingController(text: '0');
    String type = 'checking';
    XFile? pickedQrFile;

    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.darkCard,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx2, setStateSheet) => Padding(
          padding: EdgeInsets.only(left: 24, right: 24, top: 24, bottom: MediaQuery.of(ctx2).viewInsets.bottom + 24),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Register Bank Account', style: GoogleFonts.poppins(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 16),
                TextField(
                  controller: nameCtrl,
                  style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13),
                  decoration: InputDecoration(
                    labelText: 'Account Name (e.g. Primary Checking)',
                    labelStyle: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 12),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: numberCtrl,
                  style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13),
                  decoration: InputDecoration(
                    labelText: 'Account Number (optional)',
                    labelStyle: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 12),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: bankCtrl,
                  style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13),
                  decoration: InputDecoration(
                    labelText: 'Bank Name (e.g. Standard Chartered)',
                    labelStyle: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 12),
                  ),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: type,
                  dropdownColor: AppColors.darkCard,
                  style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13),
                  decoration: InputDecoration(
                    labelText: 'Account Type',
                    filled: true,
                    fillColor: AppColors.darkSurface,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  items: ['checking', 'cash', 'online']
                      .map((t) => DropdownMenuItem(value: t, child: Text(t.toUpperCase(), style: GoogleFonts.poppins(color: AppColors.textPrimary))))
                      .toList(),
                  onChanged: (v) {
                    if (v != null) {
                      setStateSheet(() {
                        type = v;
                      });
                    }
                  },
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: balanceCtrl,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13),
                  decoration: InputDecoration(
                    labelText: 'Starting Balance (Rs.)',
                    labelStyle: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 12),
                  ),
                ),
                const SizedBox(height: 12),
                GestureDetector(
                  onTap: () async {
                    final picker = ImagePicker();
                    final picked = await picker.pickImage(source: ImageSource.gallery);
                    if (picked != null) {
                      setStateSheet(() => pickedQrFile = picked);
                    }
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    decoration: BoxDecoration(
                      color: AppColors.darkSurface,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: pickedQrFile != null ? AppColors.accentAmber : AppColors.darkBorder,
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          pickedQrFile != null ? Icons.check_circle : Icons.qr_code_2,
                          color: pickedQrFile != null ? AppColors.accentAmber : AppColors.textMuted,
                          size: 22,
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            pickedQrFile != null ? 'QR Code: ${pickedQrFile!.name}' : 'Upload Payment QR Code (Optional)',
                            style: GoogleFonts.poppins(
                              color: pickedQrFile != null ? AppColors.textPrimary : AppColors.textMuted,
                              fontSize: 12,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (pickedQrFile != null)
                          GestureDetector(
                            onTap: () => setStateSheet(() => pickedQrFile = null),
                            child: Icon(Icons.close, size: 18, color: AppColors.textMuted),
                          ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: () async {
                      final bal = double.tryParse(balanceCtrl.text) ?? 0.0;
                      if (nameCtrl.text.trim().isEmpty || bal < 0) {
                        showTopSnackBar(context, SnackBar(content: const Text('Please fill all required fields'), backgroundColor: AppColors.statusRed));
                        return;
                      }

                      final financeProvider = Provider.of<FinanceProvider>(context, listen: false);
                      final ordersProvider = Provider.of<OrdersProvider>(context, listen: false);

                      final success = await financeProvider.createBankAccount({
                        'account_name': nameCtrl.text.trim(),
                        'account_number': numberCtrl.text.trim(),
                        'bank_name': bankCtrl.text.trim(),
                        'account_type': type,
                        'balance': bal,
                      }, qrImage: pickedQrFile);

                    if (success) {
                      await ordersProvider.fetchBankAccounts();
                      // Auto-select the newly created account
                      final newAcc = ordersProvider.bankAccounts.firstWhere(
                        (acc) => acc.name == nameCtrl.text.trim() && acc.number == numberCtrl.text.trim(),
                        orElse: () => ordersProvider.bankAccounts.isNotEmpty
                            ? ordersProvider.bankAccounts.last
                            : BankAccountItem(id: 0, name: '', number: '', bankName: '', type: '', balance: 0.0),
                      );
                      if (newAcc.id != 0) {
                        setState(() {
                          _selectedBankAccountId = newAcc.id;
                        });
                      }
                      if (ctx.mounted) {
                        Navigator.pop(ctx);
                        showTopSnackBar(context, SnackBar(content: const Text('Bank Account registered successfully'), backgroundColor: AppColors.statusGreen));
                      }
                    } else {
                      showTopSnackBar(context, SnackBar(content: Text(financeProvider.error ?? 'Failed to register account'), backgroundColor: AppColors.statusRed));
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.accentAmber,
                    foregroundColor: AppColors.textOnAmber,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: Text('Complete Registration', style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ),
      ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.darkCard,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        border: Border(
          top:   BorderSide(color: AppColors.darkBorder),
          left:  BorderSide(color: AppColors.darkBorder),
          right: BorderSide(color: AppColors.darkBorder),
        ),
      ),
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: SafeArea(
        top: false,
        child: SingleChildScrollView(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            // Handle
            Container(
              width: 40, height: 4,
              margin: const EdgeInsets.only(top: 14, bottom: 4),
              decoration: BoxDecoration(
                color: AppColors.darkBorder, borderRadius: BorderRadius.circular(2),
              ),
            ),
            // Header
            Padding(
              padding: const EdgeInsets.all(20),
              child: Row(children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    gradient: AppColors.primaryGradient,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Icon(Icons.payment_rounded,
                      color: AppColors.textOnAmber, size: 20),
                ),
                const SizedBox(width: 12),
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('Payment', style: GoogleFonts.poppins(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w700, fontSize: 18)),
                  Text('Total: Rs. ${widget.grandTotal.toStringAsFixed(2)}',
                      style: GoogleFonts.poppins(
                          color: AppColors.accentAmber,
                          fontWeight: FontWeight.w600, fontSize: 13)),
                ]),
              ]),
            ),
            // Tab bar
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 20),
              decoration: BoxDecoration(
                color: AppColors.darkSurface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.darkBorder),
              ),
              child: TabBar(
                controller: _tabCtrl,
                onTap: (_) => setState(() {}),
                indicator: BoxDecoration(
                  gradient: AppColors.primaryGradient,
                  borderRadius: BorderRadius.circular(10),
                ),
                indicatorSize: TabBarIndicatorSize.tab,
                dividerColor: Colors.transparent,
                labelColor: AppColors.textOnAmber,
                unselectedLabelColor: AppColors.textMuted,
                labelStyle: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 13),
                tabs: const [
                  Tab(text: '💵  Cash'),
                  Tab(text: '💳  Card'),
                  Tab(text: '📋  Credit'),
                ],
              ),
            ),
            const SizedBox(height: 4),
            // Tab views
            SizedBox(
              height: _tabCtrl.index == 1 ? 400 : 250,
              child: TabBarView(
                controller: _tabCtrl,
                children: [_buildCashTab(), _buildCardTab(), _buildCreditTab()],
              ),
            ),
            // Confirm button
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
              child: SizedBox(
                width: double.infinity, height: 52,
                child: ElevatedButton(
                  onPressed: _confirm,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.accentAmber,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    elevation: 0,
                  ),
                  child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                    Icon(Icons.check_circle_outline,
                        color: AppColors.textOnAmber, size: 20),
                    const SizedBox(width: 10),
                    Text('Confirm Order', style: GoogleFonts.poppins(
                      color: AppColors.textOnAmber,
                      fontWeight: FontWeight.w700, fontSize: 15,
                    )),
                  ]),
                ),
              ),
            ),
          ]),
        ),
      ),
    );
  }

  Widget _buildCashTab() {
    final rounded = ((widget.grandTotal / 100).ceil() * 100).toDouble();
    final quickAmts = {widget.grandTotal, rounded, 500.0, 1000.0}.toList()
      ..sort();
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      child: Column(children: [
        TextField(
          controller: _cashCtrl,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 20),
          textAlign: TextAlign.center,
          decoration: InputDecoration(
            hintText: '0.00',
            hintStyle: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 20),
            prefixText: '${AppConstants.currencySymbol} ',
            prefixStyle: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 20),
            filled: true, fillColor: AppColors.darkSurface,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: AppColors.accentAmber, width: 2),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: AppColors.darkBorder),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: AppColors.accentAmber, width: 2),
            ),
            label: Text('Amount Tendered',
                style: GoogleFonts.poppins(color: AppColors.textSecondary, fontSize: 12)),
          ),
        ),
        const SizedBox(height: 10),
        Row(children: [
          Expanded(child: _PosInfoChip(
              label: 'Tendered',
              value: '${AppConstants.currencySymbol} ${_tendered.toStringAsFixed(2)}',
              color: AppColors.statusBlue)),
          const SizedBox(width: 10),
          Expanded(child: _PosInfoChip(
              label: 'Change',
              value: '${AppConstants.currencySymbol} ${_change.toStringAsFixed(2)}',
              color: _change >= 0 ? AppColors.statusGreen : AppColors.statusRed)),
        ]),
        const SizedBox(height: 10),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: quickAmts.map((amt) => Padding(
              padding: const EdgeInsets.only(right: 6),
              child: GestureDetector(
                onTap: () { _cashCtrl.text = amt.toStringAsFixed(0); setState(() {}); },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppColors.darkSurface,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppColors.darkBorder),
                  ),
                  child: Text('${AppConstants.currencySymbol} ${amt.toStringAsFixed(0)}',
                      style: GoogleFonts.poppins(
                        color: AppColors.accentAmber,
                        fontSize: 11, fontWeight: FontWeight.w600,
                      )),
                ),
              ),
            )).toList(),
          ),
        ),
      ]),
    );
  }

  void _showFullQrDialog(BankAccountItem account) {
    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Scan to Pay',
                    style: GoogleFonts.poppins(
                      fontWeight: FontWeight.bold,
                      fontSize: 18,
                      color: const Color(0xFF0F172A),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.grey),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: Image.network(
                  account.fullQrCodeUrl!,
                  width: 260,
                  height: 260,
                  fit: BoxFit.contain,
                  errorBuilder: (c, e, s) => Container(
                    width: 260,
                    height: 260,
                    color: Colors.grey.shade100,
                    child: const Icon(Icons.broken_image, size: 48, color: Colors.grey),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                '${AppConstants.currencySymbol} ${widget.grandTotal.toStringAsFixed(2)}',
                style: GoogleFonts.poppins(
                  fontWeight: FontWeight.w800,
                  fontSize: 22,
                  color: const Color(0xFF0F172A),
                ),
              ),
              Text(
                '${account.name} • ${account.bankName}',
                style: GoogleFonts.poppins(
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                  color: const Color(0xFF64748B),
                ),
              ),
              if (account.number.isNotEmpty)
                Text(
                  'A/C: ${account.number}',
                  style: GoogleFonts.poppins(
                    fontSize: 12,
                    color: const Color(0xFF94A3B8),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCardTab() {
    final bankAccounts = context.watch<OrdersProvider>().bankAccounts;
    final hasNoAccounts = bankAccounts.isEmpty;
    final isAccountError = _bankAccountError || (_selectedBankAccountId == null && _bankAccountError);

    if (_selectedBankAccountId == null && bankAccounts.isNotEmpty) {
      final preferred = bankAccounts.where((acc) => acc.type == 'online').firstOrNull;
      _selectedBankAccountId = preferred?.id ?? bankAccounts.first.id;
    }
    final selectedAcc = bankAccounts.where((acc) => acc.id == _selectedBankAccountId).firstOrNull;

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(20, 10, 20, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Select Bank Account', style: GoogleFonts.poppins(
                  color: (isAccountError || hasNoAccounts) ? AppColors.statusRed : AppColors.textSecondary,
                  fontSize: 11, fontWeight: FontWeight.w600)),
              GestureDetector(
                onTap: _showQuickAddBankAccountSheet,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: AppColors.accentAmber.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: AppColors.accentAmber.withOpacity(0.3)),
                  ),
                  child: Row(children: [
                    Icon(Icons.add_rounded, color: AppColors.accentAmber, size: 14),
                    const SizedBox(width: 2),
                    Text('Add Bank Account', style: GoogleFonts.poppins(
                        color: AppColors.accentAmber, fontSize: 11, fontWeight: FontWeight.bold)),
                  ]),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          GestureDetector(
            onTap: hasNoAccounts ? _showQuickAddBankAccountSheet : null,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                color: (isAccountError || hasNoAccounts)
                    ? AppColors.statusRed.withOpacity(0.08)
                    : AppColors.darkSurface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: (isAccountError || hasNoAccounts) ? AppColors.statusRed : AppColors.darkBorder,
                  width: (isAccountError || hasNoAccounts) ? 1.8 : 1.0,
                ),
              ),
              child: DropdownButtonHideUnderline(
                child: DropdownButton<int>(
                  value: bankAccounts.any((acc) => acc.id == _selectedBankAccountId) ? _selectedBankAccountId : null,
                  dropdownColor: AppColors.darkCard,
                  isExpanded: true,
                  icon: Icon(Icons.arrow_drop_down, color: (isAccountError || hasNoAccounts) ? AppColors.statusRed : AppColors.textMuted),
                  style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13),
                  hint: Row(children: [
                    Icon(
                      hasNoAccounts ? Icons.warning_amber_rounded : Icons.account_balance_rounded,
                      color: (isAccountError || hasNoAccounts) ? AppColors.statusRed : AppColors.textMuted,
                      size: 16,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      hasNoAccounts ? 'Please add bank account first' : 'Choose Account',
                      style: GoogleFonts.poppins(
                        color: (isAccountError || hasNoAccounts) ? AppColors.statusRed : AppColors.textMuted,
                        fontSize: 13,
                        fontWeight: (isAccountError || hasNoAccounts) ? FontWeight.w600 : FontWeight.w400,
                      ),
                    ),
                  ]),
                  items: bankAccounts.map((acc) => DropdownMenuItem<int>(
                    value: acc.id,
                    child: Row(children: [
                      Icon(Icons.account_balance_rounded, color: AppColors.accentAmber, size: 16),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          '${acc.bankName} - ${acc.name} (${acc.number})',
                          overflow: TextOverflow.ellipsis,
                          style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13),
                        ),
                      ),
                    ]),
                  )).toList(),
                  onChanged: (val) => setState(() {
                    _selectedBankAccountId = val;
                    _bankAccountError = false;
                  }),
                ),
              ),
            ),
          ),
          if (hasNoAccounts) ...[
            const SizedBox(height: 6),
            Row(children: [
              Icon(Icons.info_outline_rounded, color: AppColors.statusRed, size: 13),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  'No bank accounts registered. Tap "+ Add Bank Account" above.',
                  style: GoogleFonts.poppins(color: AppColors.statusRed, fontSize: 11, fontWeight: FontWeight.w500),
                ),
              ),
            ]),
          ],
          if (selectedAcc != null) ...[
            const SizedBox(height: 12),
            if (selectedAcc.fullQrCodeUrl != null)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.08),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.qr_code_2, size: 20, color: Color(0xFF1E293B)),
                        const SizedBox(width: 6),
                        Text(
                          'Scan to Pay',
                          style: GoogleFonts.poppins(
                            color: const Color(0xFF1E293B),
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    GestureDetector(
                      onTap: () => _showFullQrDialog(selectedAcc),
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.grey.shade300, width: 1.5),
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: Image.network(
                            selectedAcc.fullQrCodeUrl!,
                            width: 170,
                            height: 170,
                            fit: BoxFit.contain,
                            errorBuilder: (ctx, _, __) => Container(
                              width: 170,
                              height: 170,
                              color: Colors.grey.shade100,
                              child: const Icon(Icons.broken_image, color: Colors.grey, size: 40),
                            ),
                            loadingBuilder: (ctx, child, progress) {
                              if (progress == null) return child;
                              return Container(
                                width: 170,
                                height: 170,
                                alignment: Alignment.center,
                                child: const CircularProgressIndicator(strokeWidth: 2),
                              );
                            },
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      '${AppConstants.currencySymbol} ${widget.grandTotal.toStringAsFixed(2)}',
                      style: GoogleFonts.poppins(
                        color: const Color(0xFF0F172A),
                        fontWeight: FontWeight.w800,
                        fontSize: 16,
                      ),
                    ),
                    Text(
                      '${selectedAcc.name} (${selectedAcc.bankName})',
                      style: GoogleFonts.poppins(
                        color: const Color(0xFF64748B),
                        fontWeight: FontWeight.w500,
                        fontSize: 11,
                      ),
                    ),
                    if (selectedAcc.number.isNotEmpty)
                      Text(
                        'A/C: ${selectedAcc.number}',
                        style: GoogleFonts.poppins(
                          color: const Color(0xFF94A3B8),
                          fontWeight: FontWeight.w500,
                          fontSize: 10,
                        ),
                      ),
                    const SizedBox(height: 4),
                    Text(
                      'Tap QR code to zoom in',
                      style: GoogleFonts.poppins(
                        color: const Color(0xFF94A3B8),
                        fontStyle: FontStyle.italic,
                        fontSize: 9,
                      ),
                    ),
                  ],
                ),
              )
            else
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: AppColors.accentAmber.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppColors.accentAmber.withOpacity(0.3)),
                ),
                child: Row(
                  children: [
                    Icon(Icons.info_outline, size: 16, color: AppColors.accentAmber),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'No payment QR code configured for this account',
                        style: GoogleFonts.poppins(color: AppColors.accentAmber, fontSize: 11),
                      ),
                    ),
                  ],
                ),
              ),
          ],
          const SizedBox(height: 10),
          TextField(
            controller: _cardRefCtrl,
            style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13),
            decoration: InputDecoration(
              hintText: 'Reference / Approval No.',
              prefixIcon: Icon(Icons.numbers_rounded,
                  color: AppColors.textMuted, size: 16),
              label: Text('Reference Number (optional)',
                  style: GoogleFonts.poppins(color: AppColors.textSecondary, fontSize: 11)),
            ),
          ),
        ],
      ),
    );
  }

  double _getOldDue(Map<String, dynamic>? c) {
    if (c == null) return 0.0;
    final raw = c['due_amount'] ?? c['due'] ?? c['total_due'] ?? c['outstanding'];
    return double.tryParse(raw?.toString() ?? '0') ?? 0.0;
  }

  Widget _buildCreditTab() {
    final customer = _modalSelectedCustomer;
    final query = _custSearchCtrl.text.trim().toLowerCase();

    final filteredCustomers = _modalCustomers.where((c) {
      final name = (c['name'] as String? ?? '').toLowerCase();
      final phone = (c['phone'] as String? ?? '').toLowerCase();
      return name.contains(query) || phone.contains(query);
    }).toList();

    final oldDue = _getOldDue(customer);
    final newTotalDue = oldDue + widget.grandTotal;

    final isCustError = _creditCustomerError && customer == null;

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 10, 20, 0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Select Customer for Credit',
                style: GoogleFonts.poppins(
                  color: isCustError ? AppColors.statusRed : AppColors.textSecondary,
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                ),
              ),
              GestureDetector(
                onTap: _showQuickAddCustomerSheet,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: AppColors.accentAmber.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: AppColors.accentAmber.withOpacity(0.3)),
                  ),
                  child: Row(children: [
                    Icon(Icons.person_add_alt_1_rounded, color: AppColors.accentAmber, size: 13),
                    const SizedBox(width: 4),
                    Text('+ Add Customer', style: GoogleFonts.poppins(
                        color: AppColors.accentAmber, fontSize: 11, fontWeight: FontWeight.bold)),
                  ]),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          TextField(
            controller: _custSearchCtrl,
            onChanged: (val) => setState(() {}),
            style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 12),
            decoration: InputDecoration(
              hintText: 'Search customer by name or phone...',
              hintStyle: GoogleFonts.poppins(
                color: isCustError ? AppColors.statusRed : AppColors.textMuted,
                fontSize: 12,
              ),
              prefixIcon: Icon(
                Icons.search_rounded,
                color: isCustError ? AppColors.statusRed : AppColors.accentAmber,
                size: 18,
              ),
              suffixIcon: _custSearchCtrl.text.isNotEmpty
                  ? IconButton(
                      icon: Icon(Icons.clear_rounded, color: AppColors.textMuted, size: 16),
                      onPressed: () {
                        _custSearchCtrl.clear();
                        setState(() {});
                      },
                    )
                  : null,
              isDense: true,
              contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
              filled: true,
              fillColor: isCustError ? AppColors.statusRed.withOpacity(0.08) : AppColors.darkSurface,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide(
                  color: isCustError ? AppColors.statusRed : AppColors.darkBorder,
                  width: isCustError ? 2.0 : 1.0,
                ),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide(
                  color: isCustError ? AppColors.statusRed : AppColors.darkBorder,
                  width: isCustError ? 2.0 : 1.0,
                ),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide(
                  color: isCustError ? AppColors.statusRed : AppColors.accentAmber,
                  width: 2.0,
                ),
              ),
            ),
          ),
          if (isCustError) ...[
            const SizedBox(height: 4),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: AppColors.statusRed.withOpacity(0.12),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppColors.statusRed, width: 1.5),
              ),
              child: Row(children: [
                Icon(Icons.warning_amber_rounded, color: AppColors.statusRed, size: 15),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    'Customer required for credit: Tap a customer below or "+ Add Customer".',
                    style: GoogleFonts.poppins(color: AppColors.statusRed, fontSize: 11, fontWeight: FontWeight.bold),
                  ),
                ),
              ]),
            ),
          ],
          const SizedBox(height: 6),
          Expanded(
            child: SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              child: Column(
                children: [
                  if (customer == null || query.isNotEmpty)
                    Container(
                      constraints: BoxConstraints(maxHeight: customer == null ? 140 : 95),
                      decoration: BoxDecoration(
                        color: AppColors.darkSurface,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: isCustError ? AppColors.statusRed : AppColors.darkBorder),
                      ),
                      child: filteredCustomers.isEmpty
                          ? Padding(
                              padding: const EdgeInsets.all(12),
                              child: Center(
                                child: Text('No matching customer found.',
                                    style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 11)),
                              ),
                            )
                          : ListView.separated(
                              shrinkWrap: true,
                              padding: EdgeInsets.zero,
                              itemCount: filteredCustomers.length,
                              separatorBuilder: (_, __) => Divider(color: AppColors.darkBorder, height: 1),
                              itemBuilder: (ctx, idx) {
                                final c = filteredCustomers[idx];
                                final isSel = customer != null && customer['name'] == c['name'];
                                return ListTile(
                                  dense: true,
                                  title: Text(
                                    '${c['name']} ${c['phone'] != null ? '(${c['phone']})' : ''}',
                                    style: GoogleFonts.poppins(
                                      color: isSel ? AppColors.accentAmber : AppColors.textPrimary,
                                      fontSize: 12,
                                    ),
                                  ),
                                  onTap: () {
                                    setState(() {
                                      _modalSelectedCustomer = c;
                                      _custSearchCtrl.clear();
                                      _creditCustomerError = false;
                                    });
                                  },
                                );
                              },
                            ),
                    ),
                  if (customer != null) ...[
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: AppColors.statusPurpleBg,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.statusPurple.withOpacity(0.3)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  customer['name'] as String? ?? 'Customer',
                                  style: GoogleFonts.poppins(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 13),
                                ),
                              ),
                              GestureDetector(
                                onTap: () => setState(() => _modalSelectedCustomer = null),
                                child: Text('Clear', style: GoogleFonts.poppins(color: AppColors.statusRed, fontSize: 11, fontWeight: FontWeight.bold)),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('Previous Due:', style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 11)),
                              Text('Rs. ${oldDue.toStringAsFixed(2)}', style: GoogleFonts.poppins(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 11)),
                            ],
                          ),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('New Total Balance:', style: GoogleFonts.poppins(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 11)),
                              Text('Rs. ${newTotalDue.toStringAsFixed(2)}', style: GoogleFonts.poppins(color: AppColors.accentAmber, fontWeight: FontWeight.w800, fontSize: 12)),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _PosInfoChip extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _PosInfoChip({required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label, style: GoogleFonts.poppins(color: color, fontSize: 10)),
        Text(value, style: GoogleFonts.poppins(
            color: color, fontSize: 16, fontWeight: FontWeight.w700)),
      ]),
    );
  }
}
