import 'package:icafe_app/core/utils/snackbar_helper.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/json_utils.dart';
import '../../providers/orders_provider.dart';
import '../../providers/app_provider.dart';
import '../../providers/tables_provider.dart';
import '../../providers/menu_provider.dart';
import '../../components/payment_modal.dart';
import '../home_shell.dart';

// ─── Tab Definitions ──────────────────────────────────────────────────────────

const _tabs = ['ALL ORDERS', 'ACTIVE', 'COMPLETED', 'CANCELLED'];

// ─── Orders Screen ────────────────────────────────────────────────────────────

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen>
    with TickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  bool _showSearch = false;
  String _selectedTypeFilter = 'All';
  bool _isGridView = false;
  final Set<int> _expandedOrderIds = {};
  String? _lastActiveTab;

  late AnimationController _fadeController;
  late Animation<double> _fadeAnim;

  Future<bool> _showCancelConfirmation(BuildContext context) async {
    return await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            backgroundColor: AppColors.isDark ? AppColors.darkCard : Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            title: Text(
              'Cancel Order',
              style: GoogleFonts.poppins(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.bold,
                fontSize: 18,
              ),
            ),
            content: Text(
              'Are you sure you want to cancel this order?',
              style: GoogleFonts.poppins(
                color: AppColors.textSecondary,
                fontSize: 14,
              ),
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx, false),
                child: Text(
                  'No',
                  style: GoogleFonts.poppins(
                    color: AppColors.textMuted,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.statusRed,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                  elevation: 0,
                ),
                onPressed: () => Navigator.pop(ctx, true),
                child: Text(
                  'Yes, Cancel',
                  style: GoogleFonts.poppins(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
        ) ??
        false;
  }

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _tabs.length, vsync: this);
    _tabController.addListener(() {
      if (mounted && !_tabController.indexIsChanging) {
        setState(() {});
      }
    });

    _fadeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _fadeAnim = CurvedAnimation(parent: _fadeController, curve: Curves.easeOut);
    _fadeController.forward();

    // Fetch live orders list
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<OrdersProvider>().fetchOrders();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    _fadeController.dispose();
    super.dispose();
  }

  List<Map<String, dynamic>> _filteredOrders(
      int tabIndex, List<Map<String, dynamic>> source) {
    var orders = List<Map<String, dynamic>>.from(source);

    // Filter by tab
    switch (tabIndex) {
      case 1: // Active
        orders = orders.where((o) {
          final s = (o['status'] as String? ?? '').toLowerCase();
          return s == 'pending' ||
              s == 'preparing' ||
              s == 'served' ||
              s == 'active' ||
              s == 'processing' ||
              s == 'ready';
        }).toList();
        break;
      case 2: // Completed
        orders = orders.where((o) {
          final s = (o['status'] as String? ?? '').toLowerCase();
          return s == 'completed' || s == 'paid' || s == 'done';
        }).toList();
        break;
      case 3: // Cancelled
        orders = orders.where((o) {
          final s = (o['status'] as String? ?? '').toLowerCase();
          return s == 'cancelled' || s == 'canceled' || s == 'void';
        }).toList();
        break;
    }

    // Filter by type
    if (_selectedTypeFilter != 'All') {
      orders = orders
          .where((o) =>
              (o['type'] as String? ?? '').toLowerCase() ==
              _selectedTypeFilter.toLowerCase())
          .toList();
    }

    // Filter by search
    if (_searchQuery.isNotEmpty) {
      final q = _searchQuery.toLowerCase();
      orders = orders.where((o) {
        final number = (o['number'] as String? ?? '').toLowerCase();
        final customer = (o['customer'] as String? ?? '').toLowerCase();
        final table = (o['table'] as String? ?? '').toLowerCase();
        final type = (o['type'] as String? ?? '').toLowerCase();
        return number.contains(q) ||
            customer.contains(q) ||
            table.contains(q) ||
            type.contains(q);
      }).toList();
    }

    return orders;
  }

  Future<void> _onRefresh() async {
    await context.read<OrdersProvider>().fetchOrders();
    if (mounted) setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final activeTab = context.watch<AppProvider>().activeTabLabel;
    if (activeTab == 'Orders' && _lastActiveTab != 'Orders') {
      _lastActiveTab = 'Orders';
      WidgetsBinding.instance.addPostFrameCallback((_) {
        context.read<OrdersProvider>().fetchOrders();
      });
    } else {
      _lastActiveTab = activeTab;
    }

    final ordersProvider = context.watch<OrdersProvider>();
    final ordersList = ordersProvider.orders;

    final liveOrders = ordersList.map((o) => {
          'id': o.id,
          'number': o.number,
          'type': o.type ?? 'Dine-In',
          'table': o.table,
          'customer': o.customer,
          'status': o.status,
          'total': o.total,
          'time': o.time,
          'items': o.itemsCount,
          'items_list': o.itemsList,
          'kds_items': o.items,
        }).toList();

    final isLight = !AppColors.isDark;
    final bgBackgroundColor = isLight ? const Color(0xFFF8FAFC) : AppColors.darkBg;
    final surfaceColor = isLight ? Colors.white : AppColors.darkSurface;

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: isLight ? SystemUiOverlayStyle.dark : SystemUiOverlayStyle.light,
      child: Scaffold(
        backgroundColor: bgBackgroundColor,
        body: FadeTransition(
          opacity: _fadeAnim,
          child: SafeArea(
            child: NestedScrollView(
              headerSliverBuilder: (context, innerBoxIsScrolled) => [
                SliverToBoxAdapter(
                  child: _buildHeaderTopSection(liveOrders),
                ),
                SliverPersistentHeader(
                  pinned: true,
                  delegate: _SliverTabBarDelegate(
                    backgroundColor: surfaceColor,
                    child: _buildTabBarSection(liveOrders),
                  ),
                ),
              ],
              body: TabBarView(
                controller: _tabController,
                children: List.generate(_tabs.length, (i) {
                  return _buildOrdersTabContent(i, liveOrders);
                }),
              ),
            ),
          ),
        ),
      ),
    );
  }

  // ── Kitetool Style Header Top Section ─────────────────────────────────────────

  Widget _buildHeaderTopSection(List<Map<String, dynamic>> liveOrders) {
    final isLight = !AppColors.isDark;
    final surfaceColor = isLight ? Colors.white : AppColors.darkSurface;
    final screenWidth = MediaQuery.of(context).size.width;
    final isMobile = screenWidth < 600;

    return Container(
      color: surfaceColor,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Top Navigation Bar
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: Row(
              children: [
                IconButton(
                  icon: Icon(Icons.menu_rounded,
                      color: AppColors.textPrimary, size: 24),
                  onPressed: () => HomeShell.toggleMenu(),
                ),
                const SizedBox(width: 4),
                if (_showSearch)
                  Expanded(child: _buildSearchField())
                else
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        FittedBox(
                          fit: BoxFit.scaleDown,
                          alignment: Alignment.centerLeft,
                          child: Text(
                            'Order Management',
                            style: GoogleFonts.poppins(
                              fontSize: isMobile ? 18 : 22,
                              fontWeight: FontWeight.w800,
                              color: isLight ? const Color(0xFF0F172A) : AppColors.textPrimary,
                              letterSpacing: -0.5,
                            ),
                          ),
                        ),
                        const SizedBox(height: 2),
                        Wrap(
                          crossAxisAlignment: WrapCrossAlignment.center,
                          spacing: 8,
                          runSpacing: 4,
                          children: [
                            Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.assignment_outlined,
                                    size: 13,
                                    color: isLight ? const Color(0xFF64748B) : AppColors.textMuted),
                                const SizedBox(width: 4),
                                Text(
                                  'ALL ORDERS',
                                  style: GoogleFonts.poppins(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w700,
                                    color: isLight ? const Color(0xFF64748B) : AppColors.textMuted,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                              ],
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: const Color(0xFF3B82F6).withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Container(
                                    width: 6,
                                    height: 6,
                                    decoration: const BoxDecoration(
                                      color: Color(0xFF2563EB),
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    'LIVE SYNC ACTIVE',
                                    style: GoogleFonts.poppins(
                                      fontSize: 9,
                                      fontWeight: FontWeight.w700,
                                      color: const Color(0xFF2563EB),
                                      letterSpacing: 0.5,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                if (!_showSearch) ...[
                  IconButton(
                    icon: Icon(Icons.search_rounded,
                        color: AppColors.textPrimary, size: 22),
                    onPressed: () => setState(() => _showSearch = true),
                  ),
                ] else ...[
                  IconButton(
                    icon: Icon(Icons.close_rounded,
                        color: AppColors.textPrimary, size: 22),
                    onPressed: () {
                      setState(() {
                        _showSearch = false;
                        _searchQuery = '';
                        _searchController.clear();
                      });
                    },
                  ),
                ],
              ],
            ),
          ),

          const SizedBox(height: 4),

          // Controls Bar: FILTER | Grid/List Switch | + NEW ORDER
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
            child: Wrap(
              alignment: WrapAlignment.spaceBetween,
              crossAxisAlignment: WrapCrossAlignment.center,
              spacing: 8,
              runSpacing: 8,
              children: [
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Filter Button
                    OutlinedButton.icon(
                      onPressed: () => _showFilterSheet(context),
                      icon: Icon(
                        Icons.filter_alt_outlined,
                        size: 14,
                        color: isLight ? const Color(0xFF475569) : AppColors.textSecondary,
                      ),
                      label: Text(
                        'FILTER',
                        style: GoogleFonts.poppins(
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                          color: isLight ? const Color(0xFF334155) : AppColors.textPrimary,
                        ),
                      ),
                      style: OutlinedButton.styleFrom(
                        backgroundColor: isLight ? Colors.white : AppColors.darkCard,
                        side: BorderSide(
                          color: isLight ? const Color(0xFFCBD5E1) : AppColors.darkBorder,
                          width: 1,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                      ),
                    ),
                    const SizedBox(width: 8),
                    // View Mode Toggle Icons
                    Container(
                      height: 34,
                      decoration: BoxDecoration(
                        color: isLight ? const Color(0xFFF1F5F9) : AppColors.darkCard,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(
                          color: isLight ? const Color(0xFFE2E8F0) : AppColors.darkBorder,
                        ),
                      ),
                      child: Row(
                        children: [
                          InkWell(
                            onTap: () => setState(() => _isGridView = true),
                            borderRadius: const BorderRadius.horizontal(left: Radius.circular(9)),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                              decoration: BoxDecoration(
                                color: _isGridView
                                    ? (isLight ? Colors.white : AppColors.darkSurface)
                                    : Colors.transparent,
                                borderRadius: const BorderRadius.horizontal(left: Radius.circular(9)),
                              ),
                              child: Icon(
                                Icons.grid_view_rounded,
                                size: 16,
                                color: _isGridView
                                    ? const Color(0xFF2563EB)
                                    : (isLight ? const Color(0xFF94A3B8) : AppColors.textMuted),
                              ),
                            ),
                          ),
                          InkWell(
                            onTap: () => setState(() => _isGridView = false),
                            borderRadius: const BorderRadius.horizontal(right: Radius.circular(9)),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                              decoration: BoxDecoration(
                                color: !_isGridView
                                    ? (isLight ? Colors.white : AppColors.darkSurface)
                                    : Colors.transparent,
                                borderRadius: const BorderRadius.horizontal(right: Radius.circular(9)),
                              ),
                              child: Icon(
                                Icons.reorder_rounded,
                                size: 16,
                                color: !_isGridView
                                    ? const Color(0xFF2563EB)
                                    : (isLight ? const Color(0xFF94A3B8) : AppColors.textMuted),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                // + NEW ORDER Button
                ElevatedButton.icon(
                  onPressed: () => _showCreateOrderSheet(context),
                  icon: const Icon(Icons.add_rounded, color: Colors.white, size: 16),
                  label: Text(
                    '+ NEW ORDER',
                    style: GoogleFonts.poppins(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: Colors.white,
                      letterSpacing: 0.3,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF2563EB),
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── Tab Bar Section ───────────────────────────────────────────────────────────

  Widget _buildTabBarSection(List<Map<String, dynamic>> liveOrders) {
    final isLight = !AppColors.isDark;
    final activeCount = liveOrders.where((o) {
      final s = (o['status'] as String? ?? '').toLowerCase();
      return s == 'pending' || s == 'preparing' || s == 'served' || s == 'active' || s == 'processing';
    }).length;
    final completedCount = liveOrders.where((o) {
      final s = (o['status'] as String? ?? '').toLowerCase();
      return s == 'completed' || s == 'paid' || s == 'done';
    }).length;
    final cancelledCount = liveOrders.where((o) {
      final s = (o['status'] as String? ?? '').toLowerCase();
      return s == 'cancelled' || s == 'canceled' || s == 'void';
    }).length;

    return Container(
      decoration: BoxDecoration(
        color: isLight ? Colors.white : AppColors.darkSurface,
        border: Border(
          bottom: BorderSide(
            color: isLight ? const Color(0xFFE2E8F0) : AppColors.darkBorder,
            width: 1,
          ),
        ),
      ),
      child: TabBar(
        controller: _tabController,
        isScrollable: true,
        tabAlignment: TabAlignment.start,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        indicatorColor: const Color(0xFF2563EB),
        indicatorWeight: 3,
        labelColor: const Color(0xFF2563EB),
        unselectedLabelColor: isLight ? const Color(0xFF64748B) : AppColors.textMuted,
        labelStyle: GoogleFonts.poppins(
          fontSize: 12,
          fontWeight: FontWeight.w700,
        ),
        unselectedLabelStyle: GoogleFonts.poppins(
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
        tabs: [
          _buildTabPill('ALL ORDERS', liveOrders.length, 0, const Color(0xFF2563EB), const Color(0xFFEFF6FF)),
          _buildTabPill('ACTIVE', activeCount, 1, const Color(0xFF2563EB), const Color(0xFFEFF6FF)),
          _buildTabPill('COMPLETED', completedCount, 2, const Color(0xFF059669), const Color(0xFFECFDF5)),
          _buildTabPill('CANCELLED', cancelledCount, 3, const Color(0xFFDC2626), const Color(0xFFFEF2F2)),
        ],
      ),
    );
  }

  Widget _buildTabPill(String label, int count, int index, Color color, Color bgColor) {
    final isSelected = _tabController.index == index;
    final isLight = !AppColors.isDark;

    return Tab(
      height: 44,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(label),
          const SizedBox(width: 6),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: isSelected
                  ? color.withValues(alpha: 0.15)
                  : (isLight ? bgColor : AppColors.darkCard),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              '$count',
              style: GoogleFonts.poppins(
                fontSize: 11,
                fontWeight: FontWeight.w700,
                color: isSelected ? color : (isLight ? color.withValues(alpha: 0.8) : AppColors.textMuted),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchField() {
    final isLight = !AppColors.isDark;
    return Container(
      height: 40,
      decoration: BoxDecoration(
        color: isLight ? const Color(0xFFF1F5F9) : AppColors.darkCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: isLight ? const Color(0xFFE2E8F0) : AppColors.darkBorder),
      ),
      child: TextField(
        key: const ValueKey('search'),
        controller: _searchController,
        autofocus: true,
        style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13),
        decoration: InputDecoration(
          hintText: 'Search order #, customer or table...',
          hintStyle: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 13),
          border: InputBorder.none,
          focusedBorder: InputBorder.none,
          enabledBorder: InputBorder.none,
          prefixIcon: Icon(Icons.search_rounded, size: 18, color: AppColors.textMuted),
          contentPadding: const EdgeInsets.symmetric(vertical: 10),
        ),
        onChanged: (val) => setState(() => _searchQuery = val),
      ),
    );
  }

  // ── Tab Content ───────────────────────────────────────────────────────────────

  Widget _buildOrdersTabContent(int tabIndex, List<Map<String, dynamic>> liveOrders) {
    final ordersProvider = context.watch<OrdersProvider>();

    if (ordersProvider.isLoading && liveOrders.isEmpty) {
      return const Center(
        child: CircularProgressIndicator(color: Color(0xFF2563EB)),
      );
    }

    final orders = _filteredOrders(tabIndex, liveOrders);

    if (orders.isEmpty) {
      return _buildEmptyState(tabIndex);
    }

    final isLight = !AppColors.isDark;
    final screenWidth = MediaQuery.of(context).size.width;
    final crossAxisCount = _isGridView
        ? (screenWidth > 900 ? 4 : (screenWidth > 600 ? 3 : (screenWidth > 450 ? 2 : 1)))
        : 1;

    return RefreshIndicator(
      onRefresh: _onRefresh,
      color: const Color(0xFF2563EB),
      backgroundColor: isLight ? Colors.white : AppColors.darkCard,
      child: _isGridView
          ? GridView.builder(
              key: const PageStorageKey('grid_view'),
              padding: const EdgeInsets.fromLTRB(12, 12, 12, 100),
              physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
              gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: crossAxisCount,
                mainAxisSpacing: 10,
                crossAxisSpacing: 10,
                mainAxisExtent: 350,
              ),
              itemCount: orders.length,
              itemBuilder: (context, index) =>
                  _buildKitetoolOrderCard(orders[index], index, isGrid: true),
            )
          : ListView.separated(
              key: const PageStorageKey('list_view'),
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
              physics: const BouncingScrollPhysics(parent: AlwaysScrollableScrollPhysics()),
              itemCount: orders.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                return _buildKitetoolOrderCard(orders[index], index, isGrid: false);
              },
            ),
    );
  }

  // ── Empty State ───────────────────────────────────────────────────────────────

  Widget _buildEmptyState(int tabIndex) {
    final emptyMessages = [
      'No orders found',
      'No active orders',
      'No completed orders',
      'No cancelled orders',
    ];
    final emptyIcons = [
      Icons.receipt_long_outlined,
      Icons.hourglass_empty_rounded,
      Icons.check_circle_outline_rounded,
      Icons.cancel_outlined,
    ];

    return RefreshIndicator(
      onRefresh: _onRefresh,
      color: const Color(0xFF2563EB),
      backgroundColor: AppColors.isDark ? AppColors.darkCard : Colors.white,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: SizedBox(
          width: double.infinity,
          height: MediaQuery.of(context).size.height * 0.55,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Container(
                width: 80,
                height: 80,
                decoration: BoxDecoration(
                  color: const Color(0xFF2563EB).withValues(alpha: 0.08),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  emptyIcons[tabIndex],
                  size: 38,
                  color: const Color(0xFF2563EB).withValues(alpha: 0.6),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                emptyMessages[tabIndex],
                style: GoogleFonts.poppins(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textSecondary,
                ),
              ),
              const SizedBox(height: 6),
              Text(
                _searchQuery.isNotEmpty
                    ? 'Try a different search query'
                    : 'Pull down to refresh live orders',
                style: GoogleFonts.poppins(
                  fontSize: 12,
                  color: AppColors.textMuted,
                ),
              ),
              if (_searchQuery.isEmpty) ...[
                const SizedBox(height: 24),
                ElevatedButton.icon(
                  onPressed: () => _showCreateOrderSheet(context),
                  icon: const Icon(Icons.add_rounded, color: Colors.white, size: 18),
                  label: Text(
                    'Create Order',
                    style: GoogleFonts.poppins(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF2563EB),
                    elevation: 0,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  // ── Kitetool Order Card Component ─────────────────────────────────────────────

  Widget _buildKitetoolOrderCard(Map<String, dynamic> order, int index, {bool isGrid = false}) {
    final status = order['status'] as String? ?? 'pending';
    final orderId = order['id'] as int;
    final isLight = !AppColors.isDark;
    final cardBg = isLight ? Colors.white : AppColors.darkCard;
    final borderColor = isLight ? const Color(0xFFE2E8F0) : AppColors.darkBorder;

    final statusStyle = _getKitetoolStatusStyle(status);
    final rawItems = (order['items_list'] as List<dynamic>?) ?? [];
    final itemsCount = rawItems.isNotEmpty ? rawItems.length : (order['items'] as int? ?? 0);
    final isExpanded = _expandedOrderIds.contains(orderId);

    final maxInitialItems = isGrid ? 2 : 3;
    final displayItems = isExpanded || rawItems.length <= maxInitialItems
        ? rawItems
        : rawItems.sublist(0, maxInitialItems);

    return Container(
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: borderColor, width: 1),
        boxShadow: isLight
            ? [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.03),
                  blurRadius: 10,
                  offset: const Offset(0, 3),
                ),
              ]
            : null,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Card Header: Order Number + Status Badge
          Padding(
            padding: isGrid
                ? const EdgeInsets.fromLTRB(12, 10, 12, 6)
                : const EdgeInsets.fromLTRB(16, 14, 16, 10),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Flexible(
                  child: Text(
                    order['number'] as String? ?? '',
                    style: GoogleFonts.poppins(
                      fontSize: isGrid ? 14 : 16,
                      fontWeight: FontWeight.w800,
                      color: isLight ? const Color(0xFF0F172A) : AppColors.textPrimary,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 4),
                Container(
                  padding: EdgeInsets.symmetric(
                      horizontal: isGrid ? 6 : 10, vertical: isGrid ? 2 : 4),
                  decoration: BoxDecoration(
                    color: statusStyle['bg'] as Color,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      if (status.toLowerCase() == 'completed') ...[
                        Icon(Icons.check_rounded, size: isGrid ? 10 : 12, color: statusStyle['text'] as Color),
                        const SizedBox(width: 2),
                      ],
                      Text(
                        (statusStyle['label'] as String).toUpperCase(),
                        style: GoogleFonts.poppins(
                          fontSize: isGrid ? 9 : 10,
                          fontWeight: FontWeight.w700,
                          color: statusStyle['text'] as Color,
                          letterSpacing: 0.3,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Table / Customer / Type Subheader
          Padding(
            padding: EdgeInsets.symmetric(horizontal: isGrid ? 12 : 16),
            child: Row(
              children: [
                Flexible(
                  child: Text(
                    order['table'] != null ? order['table'] as String : (order['type'] as String? ?? 'Dine-In'),
                    style: GoogleFonts.poppins(
                      fontSize: isGrid ? 11 : 13,
                      fontWeight: FontWeight.w700,
                      color: isLight ? const Color(0xFF1E293B) : AppColors.textPrimary,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                if (order['customer'] != null && (order['customer'] as String).isNotEmpty) ...[
                  const SizedBox(width: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                    decoration: BoxDecoration(
                      color: isLight ? const Color(0xFFEFF6FF) : AppColors.darkSurface,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      (order['customer'] as String).toUpperCase(),
                      style: GoogleFonts.poppins(
                        fontSize: 8,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF2563EB),
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ],
            ),
          ),

          SizedBox(height: isGrid ? 6 : 10),

          // Time Pill Capsule Bar
          Padding(
            padding: EdgeInsets.symmetric(horizontal: isGrid ? 12 : 16),
            child: Container(
              padding: EdgeInsets.symmetric(horizontal: isGrid ? 8 : 10, vertical: isGrid ? 4 : 6),
              decoration: BoxDecoration(
                color: isLight ? const Color(0xFFF8FAFC) : AppColors.darkSurface,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: isLight ? const Color(0xFFF1F5F9) : AppColors.darkBorder,
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.access_time_rounded,
                      size: isGrid ? 11 : 13,
                      color: isLight ? const Color(0xFF64748B) : AppColors.textMuted),
                  const SizedBox(width: 4),
                  Text(
                    order['time'] as String? ?? '',
                    style: GoogleFonts.poppins(
                      fontSize: isGrid ? 10 : 11,
                      fontWeight: FontWeight.w600,
                      color: isLight ? const Color(0xFF475569) : AppColors.textSecondary,
                    ),
                  ),
                  if (status.toLowerCase() == 'completed' && !isGrid) ...[
                    Text('  |  ',
                        style: GoogleFonts.poppins(
                            fontSize: 11, color: isLight ? const Color(0xFFCBD5E1) : AppColors.darkBorder)),
                    const Icon(Icons.flash_on_rounded, size: 12, color: Color(0xFF2563EB)),
                    const SizedBox(width: 2),
                    Text(
                      '20 MINS',
                      style: GoogleFonts.poppins(
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF2563EB),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),

          SizedBox(height: isGrid ? 8 : 14),

          // ITEMS Header
          Padding(
            padding: EdgeInsets.symmetric(horizontal: isGrid ? 12 : 16),
            child: Text(
              'ITEMS ($itemsCount)',
              style: GoogleFonts.poppins(
                fontSize: 9,
                fontWeight: FontWeight.w700,
                color: isLight ? const Color(0xFF94A3B8) : AppColors.textMuted,
                letterSpacing: 0.5,
              ),
            ),
          ),

          const SizedBox(height: 6),

          // Items List
          if (rawItems.isEmpty) ...[
            Padding(
              padding: EdgeInsets.symmetric(horizontal: isGrid ? 12 : 16, vertical: 2),
              child: Text(
                '${order['items']} items ordered',
                style: GoogleFonts.poppins(
                  fontSize: isGrid ? 11 : 12,
                  color: isLight ? const Color(0xFF475569) : AppColors.textSecondary,
                ),
              ),
            ),
          ] else ...[
            Padding(
              padding: EdgeInsets.symmetric(horizontal: isGrid ? 12 : 16),
              child: Column(
                children: displayItems.map((item) {
                  String name = '';
                  int qty = 1;
                  double price = 0.0;
                  if (item is OrderItemDetails) {
                    name = item.name;
                    qty = item.qty;
                    price = item.price;
                  } else if (item is Map) {
                    name = (item['name'] ?? '') as String;
                    qty = (item['qty'] ?? 1) as int;
                    price = JsonUtils.parseDouble(item['price']);
                  }

                  return Padding(
                    padding: const EdgeInsets.only(bottom: 4),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1.5),
                          decoration: BoxDecoration(
                            color: const Color(0xFFEFF6FF),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            '${qty}x',
                            style: GoogleFonts.poppins(
                              fontSize: isGrid ? 10 : 11,
                              fontWeight: FontWeight.w700,
                              color: const Color(0xFF2563EB),
                            ),
                          ),
                        ),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            name,
                            style: GoogleFonts.poppins(
                              fontSize: isGrid ? 11 : 12,
                              fontWeight: FontWeight.w500,
                              color: isLight ? const Color(0xFF334155) : AppColors.textPrimary,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        Text(
                          'Rs. ${price.toStringAsFixed(2)}',
                          style: GoogleFonts.poppins(
                            fontSize: isGrid ? 11 : 12,
                            fontWeight: FontWeight.w500,
                            color: isLight ? const Color(0xFF64748B) : AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  );
                }).toList(),
              ),
            ),
          ],

          // Expand / Collapse Items Toggle Button
          if (rawItems.length > maxInitialItems) ...[
            Padding(
              padding: EdgeInsets.only(left: isGrid ? 12 : 16, top: 2),
              child: InkWell(
                onTap: () {
                  setState(() {
                    if (isExpanded) {
                      _expandedOrderIds.remove(orderId);
                    } else {
                      _expandedOrderIds.add(orderId);
                    }
                  });
                },
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      isExpanded
                          ? Icons.keyboard_arrow_up_rounded
                          : Icons.keyboard_arrow_down_rounded,
                      size: 14,
                      color: const Color(0xFF2563EB),
                    ),
                    const SizedBox(width: 2),
                    Text(
                      isExpanded
                          ? 'HIDE'
                          : 'SHOW ${rawItems.length - maxInitialItems} MORE',
                      style: GoogleFonts.poppins(
                        fontSize: 9,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF2563EB),
                        letterSpacing: 0.3,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],

          if (isGrid) const Spacer() else const SizedBox(height: 12),

          // Card Footer: Total + Action Buttons
          Padding(
            padding: EdgeInsets.symmetric(horizontal: isGrid ? 12 : 16),
            child: Divider(
              height: 1,
              thickness: 1,
              color: isLight ? const Color(0xFFF1F5F9) : AppColors.darkBorder,
            ),
          ),

          SizedBox(height: isGrid ? 8 : 12),

          // Total Price Row
          Padding(
            padding: EdgeInsets.symmetric(horizontal: isGrid ? 12 : 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'FINAL TOTAL',
                  style: GoogleFonts.poppins(
                    fontSize: isGrid ? 9 : 10,
                    fontWeight: FontWeight.w700,
                    color: isLight ? const Color(0xFF94A3B8) : AppColors.textMuted,
                    letterSpacing: 0.5,
                  ),
                ),
                Text(
                  'Rs. ${JsonUtils.parseDouble(order['total']).toStringAsFixed(2)}',
                  style: GoogleFonts.poppins(
                    fontSize: isGrid ? 14 : 18,
                    fontWeight: FontWeight.w800,
                    color: isLight ? const Color(0xFF0F172A) : AppColors.textPrimary,
                  ),
                ),
              ],
            ),
          ),

          SizedBox(height: isGrid ? 8 : 12),

          // Action Buttons Bar
          Padding(
            padding: EdgeInsets.fromLTRB(isGrid ? 12 : 16, 0, isGrid ? 12 : 16, isGrid ? 10 : 16),
            child: _buildCardFooterActions(order, isGrid: isGrid),
          ),
        ],
      ),
    );
  }

  Widget _buildCardFooterActions(Map<String, dynamic> order, {bool isGrid = false}) {
    final status = (order['status'] as String? ?? 'pending').toLowerCase();
    final orderId = order['id'] as int;
    final isLight = !AppColors.isDark;

    final btnHeight = isGrid ? 36.0 : 42.0;
    final fontSize = isGrid ? 10.0 : 12.0;

    if (status == 'pending' || status == 'preparing' || status == 'served' || status == 'active' || status == 'processing') {
      return Row(
        children: [
          // CANCEL Button
          Expanded(
            child: SizedBox(
              height: btnHeight,
              child: ElevatedButton(
                onPressed: () async {
                  final confirm = await _showCancelConfirmation(context);
                  if (!confirm) return;

                  if (!mounted) return;
                  final success = await context
                      .read<OrdersProvider>()
                      .updateOrderStatus(orderId, 'cancelled');
                  if (!mounted) return;
                  if (success) {
                    context.read<OrdersProvider>().fetchOrders();
                    showTopSnackBar(
                        context,
                        SnackBar(
                          content: const Text('Order Cancelled'),
                          backgroundColor: AppColors.statusRed,
                        ));
                  } else {
                    showTopSnackBar(
                        context,
                        SnackBar(
                          content: const Text('Failed to cancel order'),
                          backgroundColor: AppColors.statusRed,
                        ));
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFFEF2F2),
                  foregroundColor: const Color(0xFFDC2626),
                  elevation: 0,
                  padding: EdgeInsets.zero,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                child: Text(
                  'CANCEL',
                  style: GoogleFonts.poppins(
                    fontSize: fontSize,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFFDC2626),
                    letterSpacing: 0.3,
                  ),
                ),
              ),
            ),
          ),
          SizedBox(width: isGrid ? 6 : 10),
          // MANAGE > Button
          Expanded(
            child: SizedBox(
              height: btnHeight,
              child: ElevatedButton(
                onPressed: () => _showOrderDetailSheet(context, order),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2563EB),
                  foregroundColor: Colors.white,
                  elevation: 0,
                  padding: EdgeInsets.zero,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      'MANAGE',
                      style: GoogleFonts.poppins(
                        fontSize: fontSize,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                        letterSpacing: 0.3,
                      ),
                    ),
                    const SizedBox(width: 2),
                    Icon(Icons.chevron_right_rounded, size: isGrid ? 14 : 16, color: Colors.white),
                  ],
                ),
              ),
            ),
          ),
        ],
      );
    } else if (status == 'completed' || status == 'paid' || status == 'done') {
      // VIEW RECEIPT > Button
      return SizedBox(
        width: double.infinity,
        height: btnHeight,
        child: OutlinedButton(
          onPressed: () => _showOrderDetailSheet(context, order),
          style: OutlinedButton.styleFrom(
            backgroundColor: isLight ? const Color(0xFFF8FAFC) : AppColors.darkSurface,
            side: BorderSide(
              color: isLight ? const Color(0xFFE2E8F0) : AppColors.darkBorder,
            ),
            padding: EdgeInsets.zero,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                'VIEW RECEIPT',
                style: GoogleFonts.poppins(
                  fontSize: fontSize,
                  fontWeight: FontWeight.w700,
                  color: isLight ? const Color(0xFF475569) : AppColors.textSecondary,
                  letterSpacing: 0.3,
                ),
              ),
              const SizedBox(width: 2),
              Icon(Icons.chevron_right_rounded,
                  size: isGrid ? 14 : 16, color: isLight ? const Color(0xFF475569) : AppColors.textSecondary),
            ],
          ),
        ),
      );
    } else {
      // CANCELLED Status Bar
      return Container(
        width: double.infinity,
        height: btnHeight,
        decoration: BoxDecoration(
          color: const Color(0xFFFEF2F2),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Center(
          child: Text(
            'CANCELLED',
            style: GoogleFonts.poppins(
              fontSize: fontSize,
              fontWeight: FontWeight.w700,
              color: const Color(0xFFDC2626),
              letterSpacing: 0.3,
            ),
          ),
        ),
      );
    }
  }

  Map<String, dynamic> _getKitetoolStatusStyle(String statusStr) {
    final status = statusStr.toLowerCase();
    switch (status) {
      case 'pending':
        return {
          'label': 'PENDING',
          'bg': const Color(0xFFFEF3C7),
          'text': const Color(0xFFD97706),
        };
      case 'preparing':
      case 'processing':
        return {
          'label': 'PREPARING',
          'bg': const Color(0xFFDBEAFE),
          'text': const Color(0xFF2563EB),
        };
      case 'served':
      case 'ready':
        return {
          'label': 'SERVED',
          'bg': const Color(0xFFE0E7FF),
          'text': const Color(0xFF4F46E5),
        };
      case 'completed':
      case 'paid':
      case 'done':
        return {
          'label': 'COMPLETED',
          'bg': const Color(0xFFD1FAE5),
          'text': const Color(0xFF059669),
        };
      case 'cancelled':
      case 'canceled':
      case 'void':
        return {
          'label': 'CANCELLED',
          'bg': const Color(0xFFFEE2E2),
          'text': const Color(0xFFDC2626),
        };
      default:
        return {
          'label': statusStr.toUpperCase(),
          'bg': const Color(0xFFF1F5F9),
          'text': const Color(0xFF64748B),
        };
    }
  }

  // ── Bottom Sheets ─────────────────────────────────────────────────────────────

  void _showCreateOrderSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _CreateOrderSheet(),
    );
  }

  void _showFilterSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _FilterSheet(
        initialType: _selectedTypeFilter,
        onApplied: (type) {
          setState(() {
            _selectedTypeFilter = type;
          });
        },
      ),
    );
  }

  void _showOrderDetailSheet(
      BuildContext context, Map<String, dynamic> order) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _OrderDetailSheet(order: order, parentContext: context),
    );
  }
}

// ─── Pinned TabBar Delegate ───────────────────────────────────────────────────

class _SliverTabBarDelegate extends SliverPersistentHeaderDelegate {
  final Widget child;
  final Color backgroundColor;

  _SliverTabBarDelegate({required this.child, required this.backgroundColor});

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      color: backgroundColor,
      child: child,
    );
  }

  @override
  double get maxExtent => 45.0;

  @override
  double get minExtent => 45.0;

  @override
  bool shouldRebuild(covariant _SliverTabBarDelegate oldDelegate) {
    return oldDelegate.child != child || oldDelegate.backgroundColor != backgroundColor;
  }
}

// ─── Create Order Sheet ───────────────────────────────────────────────────────

class _CreateOrderSheet extends StatefulWidget {
  @override
  State<_CreateOrderSheet> createState() => _CreateOrderSheetState();
}

class _CreateOrderSheetState extends State<_CreateOrderSheet> {
  String _selectedType = 'Dine-In';
  String? _selectedTable;
  bool _showTableError = false;
  final List<String> _types = ['Dine-In', 'Takeaway', 'Delivery', 'Drive-Thru'];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<TablesProvider>().fetchTables();
    });
  }

  @override
  Widget build(BuildContext context) {
    final isLight = !AppColors.isDark;
    return Container(
      decoration: BoxDecoration(
        color: isLight ? Colors.white : AppColors.darkCard,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      ),
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Handle
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 20),
                  decoration: BoxDecoration(
                    color: isLight ? const Color(0xFFE2E8F0) : AppColors.darkBorder,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: const Color(0xFF2563EB),
                      borderRadius: BorderRadius.circular(11),
                    ),
                    child: const Icon(Icons.add_rounded,
                        color: Colors.white, size: 22),
                  ),
                  const SizedBox(width: 12),
                  Text(
                    'New Order',
                    style: GoogleFonts.poppins(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              Text(
                'Order Type',
                style: GoogleFonts.poppins(
                  fontSize: 13,
                  color: AppColors.textMuted,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 10),
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                crossAxisSpacing: 10,
                mainAxisSpacing: 10,
                childAspectRatio: 2.6,
                physics: const NeverScrollableScrollPhysics(),
                children: _types.map((type) {
                  final isSelected = type == _selectedType;
                  final info = _getTypeInfo(type);
                  return GestureDetector(
                    onTap: () => setState(() => _selectedType = type),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? const Color(0xFFEFF6FF)
                            : (isLight ? const Color(0xFFF8FAFC) : AppColors.darkSurface),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isSelected
                              ? const Color(0xFF2563EB)
                              : (isLight ? const Color(0xFFE2E8F0) : AppColors.darkBorder),
                          width: isSelected ? 1.5 : 1,
                        ),
                      ),
                      child: Row(
                        children: [
                          Text(info['emoji'] as String,
                              style: const TextStyle(fontSize: 18)),
                          const SizedBox(width: 8),
                          Text(
                            type,
                            style: GoogleFonts.poppins(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: isSelected
                                  ? const Color(0xFF2563EB)
                                  : AppColors.textSecondary,
                            ),
                          ),
                          if (isSelected) ...[
                            const Spacer(),
                            const Icon(Icons.check_circle_rounded,
                                size: 14, color: Color(0xFF2563EB)),
                          ],
                        ],
                      ),
                    ),
                  );
                }).toList(),
              ),
              if (_selectedType == 'Dine-In') ...[
                const SizedBox(height: 16),
                Text(
                  'Select Table',
                  style: GoogleFonts.poppins(
                    fontSize: 13,
                    color: AppColors.textMuted,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 10),
                Consumer<TablesProvider>(
                  builder: (context, provider, child) {
                    final seen = <String>{};
                    final uniqueTables =
                        provider.tables.where((t) => seen.add(t.number)).toList();

                    if (uniqueTables.isEmpty) {
                      return Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4),
                        child: Text(
                          'No tables found. Please add a table.',
                          style: GoogleFonts.poppins(
                              color: AppColors.statusRed,
                              fontSize: 13,
                              fontWeight: FontWeight.w500),
                        ),
                      );
                    }
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          decoration: BoxDecoration(
                            color: isLight ? const Color(0xFFF8FAFC) : AppColors.darkSurface,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: _showTableError
                                  ? AppColors.statusRed
                                  : (isLight ? const Color(0xFFE2E8F0) : AppColors.darkBorder),
                              width: _showTableError ? 1.5 : 1,
                            ),
                          ),
                          child: DropdownButtonHideUnderline(
                            child: DropdownButton<String>(
                              isExpanded: true,
                              dropdownColor: isLight ? Colors.white : AppColors.darkCard,
                              borderRadius: BorderRadius.circular(12),
                              value: uniqueTables.any((t) => t.number == _selectedTable)
                                  ? _selectedTable
                                  : null,
                              hint: Text('Choose Table',
                                  style: GoogleFonts.poppins(
                                      color: AppColors.textSecondary, fontSize: 13)),
                              items: uniqueTables
                                  .map((t) => DropdownMenuItem(
                                        value: t.number,
                                        child: Text(t.number,
                                            style: GoogleFonts.poppins(
                                                color: AppColors.textPrimary, fontSize: 13)),
                                      ))
                                  .toList(),
                              onChanged: (val) {
                                setState(() {
                                  _selectedTable = val;
                                  _showTableError = false;
                                });
                              },
                            ),
                          ),
                        ),
                        if (_showTableError) ...[
                          const SizedBox(height: 6),
                          Padding(
                            padding: const EdgeInsets.only(left: 4),
                            child: Text(
                              'Please select a table first',
                              style: GoogleFonts.poppins(
                                color: AppColors.statusRed,
                                fontSize: 11,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                        ],
                      ],
                    );
                  },
                ),
              ],
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: () {
                    if (_selectedType == 'Dine-In' &&
                        (_selectedTable == null || _selectedTable!.isEmpty)) {
                      setState(() {
                        _showTableError = true;
                      });
                      return;
                    }
                    context
                        .read<OrdersProvider>()
                        .setPreselectedOrder(_selectedType, _selectedTable);
                    HomeShell.selectTabByLabel('POS');
                    Navigator.pop(context);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF2563EB),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                    elevation: 0,
                  ),
                  child: Text(
                    'Continue',
                    style: GoogleFonts.poppins(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Map<String, dynamic> _getTypeInfo(String type) {
    switch (type) {
      case 'Dine-In':
        return {'emoji': '🍽️', 'color': AppColors.statusGreen};
      case 'Takeaway':
        return {'emoji': '🥡', 'color': AppColors.accentAmber};
      case 'Delivery':
        return {'emoji': '🚚', 'color': AppColors.statusBlue};
      case 'Drive-Thru':
        return {'emoji': '🚗', 'color': AppColors.statusPurple};
      default:
        return {'emoji': '📦', 'color': AppColors.textMuted};
    }
  }
}

// ─── Filter Sheet ─────────────────────────────────────────────────────────────

class _FilterSheet extends StatefulWidget {
  final String initialType;
  final ValueChanged<String> onApplied;

  const _FilterSheet({
    required this.initialType,
    required this.onApplied,
  });

  @override
  State<_FilterSheet> createState() => _FilterSheetState();
}

class _FilterSheetState extends State<_FilterSheet> {
  late String _localSelectedType;

  @override
  void initState() {
    super.initState();
    _localSelectedType = widget.initialType;
  }

  @override
  Widget build(BuildContext context) {
    final isLight = !AppColors.isDark;
    return Container(
      decoration: BoxDecoration(
        color: isLight ? Colors.white : AppColors.darkCard,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      ),
      padding: const EdgeInsets.all(24),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: 20),
                decoration: BoxDecoration(
                  color: isLight ? const Color(0xFFE2E8F0) : AppColors.darkBorder,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: const Color(0xFF2563EB).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(11),
                  ),
                  child: const Icon(Icons.filter_alt_outlined,
                      color: Color(0xFF2563EB), size: 20),
                ),
                const SizedBox(width: 12),
                Text(
                  'Filter Orders',
                  style: GoogleFonts.poppins(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            Text(
              'Order Type',
              style: GoogleFonts.poppins(
                fontSize: 13,
                color: AppColors.textMuted,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: ['All', 'Dine-In', 'Takeaway', 'Delivery', 'Drive-Thru']
                  .map(
                    (t) => GestureDetector(
                      onTap: () {
                        setState(() {
                          _localSelectedType = t;
                        });
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 14, vertical: 8),
                        decoration: BoxDecoration(
                          color: t == _localSelectedType
                              ? const Color(0xFFEFF6FF)
                              : (isLight ? const Color(0xFFF8FAFC) : AppColors.darkSurface),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(
                            color: t == _localSelectedType
                                ? const Color(0xFF2563EB)
                                : (isLight ? const Color(0xFFE2E8F0) : AppColors.darkBorder),
                          ),
                        ),
                        child: Text(
                          t,
                          style: GoogleFonts.poppins(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: t == _localSelectedType
                                ? const Color(0xFF2563EB)
                                : AppColors.textSecondary,
                          ),
                        ),
                      ),
                    ),
                  )
                  .toList(),
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () {
                      widget.onApplied('All');
                      Navigator.pop(context);
                    },
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.textSecondary,
                      side: BorderSide(
                        color: isLight ? const Color(0xFFE2E8F0) : AppColors.darkBorder,
                      ),
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    child: Text('Reset',
                        style: GoogleFonts.poppins(fontSize: 14)),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: () {
                      widget.onApplied(_localSelectedType);
                      Navigator.pop(context);
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF2563EB),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      elevation: 0,
                    ),
                    child: Text('Apply Filter',
                        style: GoogleFonts.poppins(
                            fontSize: 14, fontWeight: FontWeight.w600)),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Order Detail Sheet ───────────────────────────────────────────────────────

class _OrderDetailSheet extends StatefulWidget {
  final Map<String, dynamic> order;
  final BuildContext parentContext;

  const _OrderDetailSheet({required this.order, required this.parentContext});

  @override
  State<_OrderDetailSheet> createState() => _OrderDetailSheetState();
}

class _OrderDetailSheetState extends State<_OrderDetailSheet> {
  bool _isExpanded = false;

  void _startModifyOrder(BuildContext ctx, Map<String, dynamic> order, String currentStatus) {
    final menusList = ctx.read<MenuProvider>().menus;
    final ordersProvider = ctx.read<OrdersProvider>();
    Navigator.pop(ctx);
    final itemsList = order['items_list'] as List<dynamic>? ?? [];
    final cartItems = itemsList.map((item) {
      MenuItem? matchingMenu;
      String itemName = '';
      int itemQty = 0;
      double itemPrice = 0.0;
      int? menuId;
      String? kdsStatus;

      if (item is OrderItemDetails) {
        itemName = item.name;
        itemQty = item.qty;
        itemPrice = item.price;
        menuId = item.menuId;
        kdsStatus = item.kdsStatus;
      } else if (item is Map) {
        itemName = (item['name'] ?? '') as String;
        itemQty = (item['qty'] ?? 0) as int;
        itemPrice = ((item['price'] as num?) ?? 0).toDouble();
        menuId = item['menu_id'] as int?;
        kdsStatus = item['kds_status'] as String?;
      }

      try {
        matchingMenu = menusList.firstWhere((m) =>
            m.name.trim().toLowerCase() == itemName.trim().toLowerCase());
      } catch (_) {
        matchingMenu = null;
      }

      return {
        'id': menuId ?? (matchingMenu != null ? matchingMenu.id : itemName.hashCode),
        'name': itemName,
        'price': itemPrice,
        'qty': itemQty,
        'category': 'Food',
        'emoji': '🥪',
        'kds_status': kdsStatus ?? 'pending',
      };
    }).toList();

    ordersProvider.startOrderModification(
      order['id'],
      order['number'] ?? '',
      cartItems,
      order['type'],
      order['table'],
      status: currentStatus,
    );

    HomeShell.selectTabByLabel('POS');
  }

  @override
  Widget build(BuildContext context) {
    final order = widget.order;
    final parentContext = widget.parentContext;
    final status = (order['status'] as String? ?? 'pending').toLowerCase();
    final isCompleted = status == 'completed' || status == 'paid' || status == 'done';
    final isCancelled = status == 'cancelled' || status == 'canceled' || status == 'void';
    final allowEditCompleted = context.watch<AppProvider>().enableCompletedOrderEdit;
    final isLight = !AppColors.isDark;
    final statusInfo = _getStatusInfo(status);
    final typeInfo = _getTypeInfo(order['type'] as String? ?? 'Dine-In');

    final rawItems = (order['items_list'] as List<dynamic>?) ?? [];
    final totalItemsCount = rawItems.length;

    final displayItems = (_isExpanded || totalItemsCount <= 4)
        ? rawItems
        : rawItems.sublist(0, 4);

    final double initialSize = totalItemsCount > 4 ? 0.88 : 0.65;

    return DraggableScrollableSheet(
      initialChildSize: initialSize,
      maxChildSize: 0.92,
      minChildSize: 0.4,
      builder: (_, controller) => Container(
        decoration: BoxDecoration(
          color: isLight ? Colors.white : AppColors.darkCard,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: Column(
          children: [
            // Handle
            Center(
              child: Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.fromLTRB(0, 12, 0, 0),
                decoration: BoxDecoration(
                  color: isLight ? const Color(0xFFE2E8F0) : AppColors.darkBorder,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            // Scrollable Body
            Expanded(
              child: ListView(
                controller: controller,
                padding: const EdgeInsets.fromLTRB(24, 16, 24, 12),
                children: [
                  // Header Row
                  Row(
                    children: [
                      Container(
                        width: 48,
                        height: 48,
                        decoration: BoxDecoration(
                          color: (typeInfo['color'] as Color).withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Center(
                          child: Text(typeInfo['emoji'] as String,
                              style: const TextStyle(fontSize: 22)),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              order['number'] as String? ?? '',
                              style: GoogleFonts.poppins(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                color: AppColors.textPrimary,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: (statusInfo['color'] as Color).withValues(alpha: 0.12),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Text(
                                    statusInfo['label'] as String,
                                    style: GoogleFonts.poppins(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w700,
                                      color: statusInfo['color'] as Color,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  order['type'] as String? ?? 'Dine-In',
                                  style: GoogleFonts.poppins(
                                    fontSize: 12,
                                    color: AppColors.textMuted,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                      GestureDetector(
                        onTap: () => Navigator.pop(context),
                        child: Container(
                          width: 34,
                          height: 34,
                          decoration: BoxDecoration(
                            color: isLight ? const Color(0xFFF1F5F9) : AppColors.darkSurface,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(Icons.close_rounded,
                              size: 18, color: AppColors.textSecondary),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Divider(color: isLight ? const Color(0xFFE2E8F0) : AppColors.darkBorder),
                  const SizedBox(height: 16),

                  // Details rows
                  _detailRow('Order ID', order['number'] as String? ?? ''),
                  _detailRow('Type', order['type'] as String? ?? 'Dine-In'),
                  if (order['table'] != null)
                    _detailRow('Table', order['table'] as String),
                  if (order['customer'] != null)
                    _detailRow('Customer', order['customer'] as String),
                  _detailRow('Items', '$totalItemsCount items'),
                  _detailRow('Time', order['time'] as String? ?? ''),
                  _detailRow(
                    'Total Amount',
                    'Rs. ${JsonUtils.parseDouble(order['total']).toStringAsFixed(2)}',
                    highlight: true,
                  ),

                  const SizedBox(height: 20),

                  // Order items list title
                  Text(
                    'Order Items',
                    style: GoogleFonts.poppins(
                      fontSize: 14,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 10),

                  // List of display items
                  ...displayItems.map((item) {
                    if (item is OrderItemDetails) {
                      return _itemRow(item.name, item.qty, item.price);
                    } else if (item is Map) {
                      return _itemRow(
                        (item['name'] ?? '') as String,
                        (item['qty'] ?? 0) as int,
                        ((item['price'] as num?) ?? 0).toDouble(),
                      );
                    }
                    return const SizedBox.shrink();
                  }),

                  // Expand/Collapse View button if totalItemsCount > 4
                  if (totalItemsCount > 4) ...[
                    const SizedBox(height: 8),
                    TextButton(
                      onPressed: () {
                        setState(() {
                          _isExpanded = !_isExpanded;
                        });
                      },
                      style: TextButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        foregroundColor: const Color(0xFF2563EB),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            _isExpanded
                                ? Icons.keyboard_arrow_up_rounded
                                : Icons.keyboard_arrow_down_rounded,
                            size: 20,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            _isExpanded
                                ? 'Show Less'
                                : 'View all items (+${totalItemsCount - 4} more)',
                            style: GoogleFonts.poppins(
                              fontWeight: FontWeight.w600,
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ],
              ),
            ),

            // Pinned Actions Footer
            if (!isCancelled && (!isCompleted || allowEditCompleted))
              Container(
                padding: const EdgeInsets.fromLTRB(24, 12, 24, 20),
                decoration: BoxDecoration(
                  color: isLight ? const Color(0xFFF8FAFC) : AppColors.darkSurface,
                  border: Border(
                    top: BorderSide(
                        color: isLight ? const Color(0xFFE2E8F0) : AppColors.darkBorder,
                        width: 1),
                  ),
                ),
                child: SafeArea(
                  top: false,
                  child: Row(
                    children: [
                      // Modify Order Button
                      Expanded(
                        child: SizedBox(
                          height: 48,
                          child: OutlinedButton.icon(
                            onPressed: () => _startModifyOrder(context, order, status),
                            icon: const Icon(Icons.edit_rounded, size: 18),
                            label: Text(
                              isCompleted ? 'Modify Completed Order' : 'Modify Order',
                              style: GoogleFonts.poppins(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: const Color(0xFF2563EB),
                              ),
                            ),
                            style: OutlinedButton.styleFrom(
                              side: const BorderSide(color: Color(0xFF2563EB)),
                              shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12)),
                            ),
                          ),
                        ),
                      ),
                      if (!isCompleted) ...[
                        const SizedBox(width: 10),
                        // Pay & Complete Button
                        Expanded(
                          child: SizedBox(
                            height: 48,
                            child: ElevatedButton.icon(
                              onPressed: () {
                                Navigator.pop(context);

                                parentContext
                                    .read<OrdersProvider>()
                                    .fetchBankAccounts();

                                showModalBottomSheet(
                                  context: parentContext,
                                  isScrollControlled: true,
                                  backgroundColor: Colors.transparent,
                                  builder: (ctx) => PaymentModal(
                                    grandTotal: JsonUtils.parseDouble(order['total']),
                                    selectedCustomer: null,
                                    onConfirm: (method,
                                        {int? bankAccountId,
                                        Map<String, dynamic>? selectedCustomer}) async {
                                      Navigator.pop(ctx);

                                      final success = await parentContext
                                          .read<OrdersProvider>()
                                          .completeOrder(
                                            order['id'],
                                            paymentMethod: method,
                                            bankAccountId: bankAccountId,
                                          );

                                      if (success) {
                                        if (parentContext.mounted) {
                                          parentContext
                                              .read<OrdersProvider>()
                                              .fetchOrders();
                                          parentContext
                                              .read<TablesProvider>()
                                              .fetchTables();
                                          showTopSnackBar(
                                              parentContext,
                                              SnackBar(
                                                content: const Text(
                                                    'Order completed successfully!'),
                                                backgroundColor: AppColors.statusGreen,
                                              ));
                                        }
                                      } else {
                                        if (parentContext.mounted) {
                                          showTopSnackBar(
                                              parentContext,
                                              SnackBar(
                                                content: const Text(
                                                    'Failed to complete order'),
                                                backgroundColor: AppColors.statusRed,
                                              ));
                                        }
                                      }
                                    },
                                  ),
                                );
                              },
                              icon: const Icon(Icons.payment_rounded, size: 18),
                              label: FittedBox(
                                fit: BoxFit.scaleDown,
                                child: Text(
                                  'Pay & Complete',
                                  style: GoogleFonts.poppins(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.white,
                                  ),
                                ),
                              ),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF2563EB),
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(12)),
                                elevation: 0,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _detailRow(String label, String value, {bool highlight = false}) {
    final isLight = !AppColors.isDark;
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: GoogleFonts.poppins(
                fontSize: 13, color: isLight ? const Color(0xFF64748B) : AppColors.textMuted),
          ),
          Text(
            value,
            style: GoogleFonts.poppins(
              fontSize: 13,
              fontWeight: highlight ? FontWeight.w700 : FontWeight.w600,
              color: highlight
                  ? const Color(0xFF2563EB)
                  : (isLight ? const Color(0xFF0F172A) : AppColors.textPrimary),
            ),
          ),
        ],
      ),
    );
  }

  Widget _itemRow(String name, int qty, double price) {
    final isLight = !AppColors.isDark;
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isLight ? const Color(0xFFF8FAFC) : AppColors.darkSurface,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: isLight ? const Color(0xFFE2E8F0) : AppColors.darkBorder),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              color: const Color(0xFFEFF6FF),
              borderRadius: BorderRadius.circular(4),
            ),
            child: Text(
              '${qty}x',
              style: GoogleFonts.poppins(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: const Color(0xFF2563EB),
              ),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              name,
              style: GoogleFonts.poppins(
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: AppColors.textPrimary,
              ),
            ),
          ),
          Text(
            'Rs. ${price.toStringAsFixed(2)}',
            style: GoogleFonts.poppins(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              color: isLight ? const Color(0xFF334155) : AppColors.textPrimary,
            ),
          ),
        ],
      ),
    );
  }

  Map<String, dynamic> _getStatusInfo(String statusStr) {
    final status = statusStr.toLowerCase();
    switch (status) {
      case 'pending':
        return {'label': 'Pending', 'color': const Color(0xFFD97706)};
      case 'preparing':
      case 'processing':
        return {'label': 'Preparing', 'color': const Color(0xFF2563EB)};
      case 'served':
      case 'ready':
        return {'label': 'Served', 'color': const Color(0xFF4F46E5)};
      case 'completed':
      case 'paid':
      case 'done':
        return {'label': 'Completed', 'color': const Color(0xFF059669)};
      case 'cancelled':
      case 'canceled':
      case 'void':
        return {'label': 'Cancelled', 'color': const Color(0xFFDC2626)};
      default:
        return {'label': statusStr, 'color': AppColors.textMuted};
    }
  }

  Map<String, dynamic> _getTypeInfo(String type) {
    switch (type) {
      case 'Dine-In':
        return {'emoji': '🍽️', 'color': AppColors.statusGreen};
      case 'Takeaway':
        return {'emoji': '🥡', 'color': AppColors.accentAmber};
      case 'Delivery':
        return {'emoji': '🚚', 'color': AppColors.statusBlue};
      case 'Drive-Thru':
        return {'emoji': '🚗', 'color': AppColors.statusPurple};
      default:
        return {'emoji': '📦', 'color': AppColors.textMuted};
    }
  }
}
