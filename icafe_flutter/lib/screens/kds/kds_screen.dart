import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/services/api_service.dart';
import '../../core/constants/app_constants.dart';
import '../../providers/orders_provider.dart';
import '../../providers/app_provider.dart';
import '../../core/utils/json_utils.dart';
import '../home_shell.dart';

// ─────────────────────────────────────────────
//  Model
// ─────────────────────────────────────────────
class KdsItem {
  final int id;
  final String orderNumber;
  final String table;
  final String item;
  final int qty;
  final List<String> addons;
  String status; // pending | preparing | ready | delivered
  final String? imageUrl;

  // Grouping & Sorting Fields
  final int orderId;
  final String? waiterName;
  final String? customerName;
  final String orderType;
  final String orderStatus;
  final String paymentStatus;
  final DateTime createdAt;

  KdsItem({
    required this.id,
    required this.orderNumber,
    required this.table,
    required this.item,
    required this.qty,
    required this.addons,
    required this.status,
    this.imageUrl,
    required this.orderId,
    this.waiterName,
    this.customerName,
    required this.orderType,
    required this.orderStatus,
    this.paymentStatus = 'unpaid',
    required this.createdAt,
  });

  bool get isPaid =>
      paymentStatus.toLowerCase() == 'paid' ||
      orderStatus.toLowerCase() == 'completed';

  int get waitMins => DateTime.now().difference(createdAt).inMinutes;
  int get waitSeconds => DateTime.now().difference(createdAt).inSeconds;

  String get elapsedText {
    final mins = waitMins;
    if (mins < 1) return '< 1 min';
    if (mins < 60) return '$mins min';
    final h = mins ~/ 60;
    final m = mins % 60;
    return '${h}h ${m}m';
  }

  String get formattedWaitTime {
    final secs = waitSeconds;
    if (secs < 0) return '00:00';
    final m = (secs ~/ 60).toString().padLeft(2, '0');
    final s = (secs % 60).toString().padLeft(2, '0');
    return '$m:$s';
  }
}

class GroupedOrder {
  final int orderId;
  final String orderNumber;
  final String table;
  final String? waiterName;
  final String? customerName;
  final String orderType;
  final String orderStatus;
  final String paymentStatus;
  final DateTime oldestCreatedAt;
  final List<KdsItem> items;

  GroupedOrder({
    required this.orderId,
    required this.orderNumber,
    required this.table,
    this.waiterName,
    this.customerName,
    required this.orderType,
    required this.orderStatus,
    this.paymentStatus = 'unpaid',
    required this.oldestCreatedAt,
    required this.items,
  });

  bool get isPaid =>
      paymentStatus.toLowerCase() == 'paid' ||
      orderStatus.toLowerCase() == 'completed';

  int get waitMins => DateTime.now().difference(oldestCreatedAt).inMinutes;
  int get waitSeconds => DateTime.now().difference(oldestCreatedAt).inSeconds;

  String get elapsedText {
    final mins = waitMins;
    if (mins < 1) return '< 1 min';
    if (mins < 60) return '$mins min';
    final h = mins ~/ 60;
    final m = mins % 60;
    return '${h}h ${m}m';
  }

  String get formattedWaitTime {
    final secs = waitSeconds;
    if (secs < 0) return '00:00';
    final m = (secs ~/ 60).toString().padLeft(2, '0');
    final s = (secs % 60).toString().padLeft(2, '0');
    return '$m:$s';
  }
}

// ─────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────
const _statusOrder = ['pending', 'preparing', 'ready', 'delivered'];

String _nextStatus(String current) {
  final idx = _statusOrder.indexOf(current);
  if (idx < 0 || idx >= _statusOrder.length - 1) return current;
  return _statusOrder[idx + 1];
}

// ─────────────────────────────────────────────
//  KDS Screen
// ─────────────────────────────────────────────
class KdsScreen extends StatefulWidget {
  const KdsScreen({super.key});

  @override
  State<KdsScreen> createState() => _KdsScreenState();
}

class _KdsScreenState extends State<KdsScreen> {
  List<KdsItem> _items = [];
  String _selectedFilter = 'All';

  // Search, Sort, Selected Item Filter and View Mode States
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  String _selectedSort = 'oldest'; // oldest | newest | urgent
  String _viewMode = 'order'; // order | item
  String? _selectedItemNameFilter;

  late Timer _clockTimer;
  late Timer _refreshTimer;
  late DateTime _now;
  final Set<int> _removingIds = {};
  bool _isFetching = false;

  @override
  void initState() {
    super.initState();
    _now = DateTime.now();

    // Live clock update every second
    _clockTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() => _now = DateTime.now());
    });

    // Auto-refresh every 3 seconds (polling)
    _refreshTimer = Timer.periodic(const Duration(seconds: 3), (_) {
      if (mounted) {
        _fetchKdsItems();
      }
    });

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _fetchKdsItems();
    });
  }

  Future<void> _fetchKdsItems() async {
    if (_isFetching) return;
    _isFetching = true;
    try {
      final api = context.read<ApiService>();
      final res = await api.get('/orders?status=active');
      if (res != null && res['data'] != null) {
        final List<KdsItem> loaded = [];
        final ordersList = res['data'] as List;
        for (final order in ordersList) {
          final orderId = JsonUtils.parseInt(order['id']);
          final orderNumber =
              order['display_number'] as String? ??
              order['order_number'] as String? ??
              '#$orderId';
          final tableStr = (order['table'] is Map)
              ? 'T${(order['table'] as Map)['table_number'] ?? '1'}'
              : (order['table'] as String? ??
                  (order['order_type'] ?? 'Takeaway'));
          final waiter = order['waiter'] as String?;
          final customer = order['customer'] as String?;
          final orderType = order['order_type'] as String? ?? 'Dine-In';
          final orderStatus = order['status'] as String? ?? 'pending';
          final paymentStatus =
              order['payment_status'] as String? ??
              (orderStatus == 'completed' ? 'paid' : 'unpaid');
          final items = order['items'] as List? ?? [];

          for (final item in items) {
            final id = JsonUtils.parseInt(item['id']);
            final menu = item['menu'] as Map? ?? {};
            final name = menu['name'] as String? ?? 'Unknown Item';
            final imageUrl =
                menu['image_url'] as String? ?? menu['image'] as String?;
            final qty = JsonUtils.parseInt(item['quantity'], 1);
            final status = item['kds_status'] as String? ?? 'pending';
            final addons =
                (item['addons'] as List?)?.map((e) => e.toString()).toList() ??
                [];

            if (status == 'delivered' || status == 'cancelled') continue;

            final createdAtStr =
                item['created_at'] as String? ??
                order['created_at'] as String? ??
                '';
            DateTime createdAt = DateTime.now();
            if (createdAtStr.isNotEmpty) {
              try {
                createdAt = DateTime.parse(createdAtStr);
              } catch (_) {}
            }

            loaded.add(
              KdsItem(
                id: id,
                orderNumber: orderNumber,
                table: tableStr,
                item: name,
                qty: qty,
                addons: addons,
                status: status,
                imageUrl: imageUrl,
                orderId: orderId,
                waiterName: waiter,
                customerName: customer,
                orderType: orderType,
                orderStatus: orderStatus,
                paymentStatus: paymentStatus,
                createdAt: createdAt,
              ),
            );
          }
        }
        if (mounted) {
          setState(() {
            _items = loaded
                .where((item) => !_removingIds.contains(item.id))
                .toList();
          });
        }
      }
    } catch (e) {
      debugPrint('KDS fetch error: $e');
    } finally {
      _isFetching = false;
    }
  }

  @override
  void dispose() {
    _clockTimer.cancel();
    _refreshTimer.cancel();
    _searchController.dispose();
    super.dispose();
  }

  // Filter counts
  int get _allCount => _items.length;
  int get _pendingCount => _items.where((i) => i.status == 'pending').length;
  int get _preparingCount => _items.where((i) => i.status == 'preparing').length;
  int get _readyCount => _items.where((i) => i.status == 'ready').length;

  // Filter & Search matching items
  List<KdsItem> get _filteredAndSearched {
    List<KdsItem> list = _items;

    // 1. Status Filter Tab
    if (_selectedFilter != 'All') {
      list = list
          .where((e) => e.status.toLowerCase() == _selectedFilter.toLowerCase())
          .toList();
    }

    // 2. Active Item Pill Filter
    if (_selectedItemNameFilter != null) {
      list = list.where((e) => e.item == _selectedItemNameFilter).toList();
    }

    // 3. Search Query
    if (_searchQuery.trim().isNotEmpty) {
      final q = _searchQuery.toLowerCase();
      list = list.where((e) {
        return e.table.toLowerCase().contains(q) ||
            e.orderNumber.toLowerCase().contains(q) ||
            e.item.toLowerCase().contains(q) ||
            (e.waiterName?.toLowerCase().contains(q) ?? false) ||
            (e.customerName?.toLowerCase().contains(q) ?? false);
      }).toList();
    }

    return list;
  }

  List<GroupedOrder> get _groupedOrders =>
      _getGroupedOrders(_filteredAndSearched);
  List<KdsItem> get _sortedItems => _getSortedItems(_filteredAndSearched);

  int _getUrgencyValue(KdsItem item) {
    final app = Provider.of<AppProvider>(context, listen: false);
    if (item.waitMins >= app.kdsCriticalMins) return 3;
    if (item.waitMins >= app.kdsWarningMins) return 2;
    return 1;
  }

  int _getOrderUrgencyValue(List<KdsItem> orderItems) {
    if (orderItems.isEmpty) return 1;
    int maxUrgency = 1;
    for (final item in orderItems) {
      final u = _getUrgencyValue(item);
      if (u > maxUrgency) maxUrgency = u;
    }
    return maxUrgency;
  }

  List<GroupedOrder> _getGroupedOrders(List<KdsItem> filteredItems) {
    final Map<int, List<KdsItem>> groups = {};
    for (final item in filteredItems) {
      if (!groups.containsKey(item.orderId)) {
        groups[item.orderId] = [];
      }
      groups[item.orderId]!.add(item);
    }

    final List<GroupedOrder> result = [];
    groups.forEach((orderId, items) {
      DateTime oldest = items.first.createdAt;
      for (final item in items) {
        if (item.createdAt.isBefore(oldest)) {
          oldest = item.createdAt;
        }
      }

      final first = items.first;
      result.add(
        GroupedOrder(
          orderId: orderId,
          orderNumber: first.orderNumber,
          table: first.table,
          waiterName: first.waiterName,
          customerName: first.customerName,
          orderType: first.orderType,
          orderStatus: first.orderStatus,
          paymentStatus: first.paymentStatus,
          oldestCreatedAt: oldest,
          items: items,
        ),
      );
    });

    if (_selectedSort == 'oldest') {
      result.sort((a, b) => a.oldestCreatedAt.compareTo(b.oldestCreatedAt));
    } else if (_selectedSort == 'newest') {
      result.sort((a, b) => b.oldestCreatedAt.compareTo(a.oldestCreatedAt));
    } else if (_selectedSort == 'urgent') {
      result.sort((a, b) {
        final uA = _getOrderUrgencyValue(a.items);
        final uB = _getOrderUrgencyValue(b.items);
        if (uA != uB) return uB.compareTo(uA);
        return a.oldestCreatedAt.compareTo(b.oldestCreatedAt);
      });
    }

    return result;
  }

  List<KdsItem> _getSortedItems(List<KdsItem> filteredItems) {
    final sorted = List<KdsItem>.from(filteredItems);
    if (_selectedSort == 'oldest') {
      sorted.sort((a, b) => a.createdAt.compareTo(b.createdAt));
    } else if (_selectedSort == 'newest') {
      sorted.sort((a, b) => b.createdAt.compareTo(a.createdAt));
    } else if (_selectedSort == 'urgent') {
      sorted.sort((a, b) {
        final uA = _getUrgencyValue(a);
        final uB = _getUrgencyValue(b);
        if (uA != uB) return uB.compareTo(uA);
        return a.createdAt.compareTo(b.createdAt);
      });
    }
    return sorted;
  }

  void _advance(KdsItem item) async {
    final next = _nextStatus(item.status);
    final success = await context.read<OrdersProvider>().updateKdsItemStatus(
      item.id,
      next,
    );

    if (!mounted) return;
    if (success) {
      if (item.status == 'ready') {
        setState(() {
          _removingIds.add(item.id);
          item.status = 'delivered';
        });
        Future.delayed(const Duration(milliseconds: 500), () {
          if (mounted) {
            setState(() {
              _items.removeWhere((e) => e.id == item.id);
              _removingIds.remove(item.id);
            });
          }
        });
      } else {
        setState(() => item.status = next);
      }
    }
  }

  void _bulkAdvance(List<KdsItem> itemsToUpdate, String nextStatus) async {
    if (itemsToUpdate.isEmpty) return;
    final ids = itemsToUpdate.map((e) => e.id).toList();
    final success = await context.read<OrdersProvider>().bulkUpdateKdsItemStatus(
      ids,
      nextStatus,
    );

    if (!mounted) return;
    if (success) {
      if (nextStatus == 'delivered') {
        setState(() {
          for (final item in itemsToUpdate) {
            _removingIds.add(item.id);
            item.status = 'delivered';
          }
        });
        Future.delayed(const Duration(milliseconds: 500), () {
          if (mounted) {
            setState(() {
              _items.removeWhere((e) => ids.contains(e.id));
              _removingIds.removeAll(ids);
            });
          }
        });
      } else {
        setState(() {
          for (final item in _items) {
            if (ids.contains(item.id)) {
              item.status = nextStatus;
            }
          }
        });
      }
    }
  }

  String _clockText(DateTime dt) {
    final h = dt.hour % 12 == 0 ? 12 : dt.hour % 12;
    final m = dt.minute.toString().padLeft(2, '0');
    final s = dt.second.toString().padLeft(2, '0');
    final p = dt.hour < 12 ? 'AM' : 'PM';
    return '$h:$m:$s $p';
  }

  String get _selectedSortLabel {
    if (_selectedSort == 'oldest') return 'FIFO (Oldest)';
    if (_selectedSort == 'newest') return 'Newest First';
    return 'Urgent First';
  }

  void _showFilterOptionsModal() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      backgroundColor: AppColors.isDark ? const Color(0xFF1E293B) : Colors.white,
      builder: (ctx) {
        final app = Provider.of<AppProvider>(ctx);
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Filter & Display Options',
                      style: GoogleFonts.poppins(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: AppColors.isDark ? Colors.white : const Color(0xFF0F172A),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close_rounded, size: 20),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
                const Divider(),
                ListTile(
                  leading: Icon(
                    app.isDarkMode ? Icons.light_mode_rounded : Icons.dark_mode_rounded,
                    color: const Color(0xFF2563EB),
                  ),
                  title: Text(
                    app.isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode',
                    style: GoogleFonts.poppins(fontSize: 14, fontWeight: FontWeight.w600),
                  ),
                  onTap: () {
                    app.setDarkMode(!app.isDarkMode);
                    Navigator.pop(ctx);
                  },
                ),
                if (_selectedItemNameFilter != null || _searchQuery.isNotEmpty)
                  ListTile(
                    leading: const Icon(Icons.clear_all_rounded, color: Color(0xFFDC2626)),
                    title: Text(
                      'Reset All Filters',
                      style: GoogleFonts.poppins(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFFDC2626),
                      ),
                    ),
                    onTap: () {
                      setState(() {
                        _selectedItemNameFilter = null;
                        _searchQuery = '';
                        _searchController.clear();
                      });
                      Navigator.pop(ctx);
                    },
                  ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final w = MediaQuery.of(context).size.width;
    final orderCols = w >= 1200 ? 4 : (w >= 900 ? 3 : (w >= 600 ? 2 : 1));
    final itemCols = w >= 1200 ? 4 : (w >= 900 ? 3 : (w >= 600 ? 2 : 1));
    final hasActiveItems = _items.any(
      (e) => e.status == 'pending' || e.status == 'preparing',
    );

    return Scaffold(
      backgroundColor: AppColors.isDark
          ? const Color(0xFF0F172A)
          : const Color(0xFFF8FAFC),
      appBar: _appBar(),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _statusFilterBar(),
          _searchAndFilterRow(),
          _viewSwitcherAndSortRow(),
          if (hasActiveItems) _activeQuantitiesBar(),
          Expanded(
            child: _viewMode == 'order'
                ? (_groupedOrders.isEmpty
                    ? _emptyState()
                    : _buildGroupedOrderGrid(orderCols))
                : (_sortedItems.isEmpty
                    ? _emptyState()
                    : _buildIndividualItemGrid(itemCols)),
          ),
        ],
      ),
    );
  }

  // ─── 1. Top AppBar ────────────────────────────
  PreferredSizeWidget _appBar() {
    return AppBar(
      backgroundColor: AppColors.isDark
          ? const Color(0xFF0F172A)
          : Colors.white,
      elevation: 0,
      leading: IconButton(
        icon: Icon(
          Icons.menu_rounded,
          color: AppColors.isDark ? Colors.white : const Color(0xFF0F172A),
          size: 26,
        ),
        onPressed: () => HomeShell.toggleMenu(),
      ),
      title: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            'Kitchen',
            style: GoogleFonts.poppins(
              color: AppColors.isDark ? Colors.white : const Color(0xFF0F172A),
              fontSize: 19,
              fontWeight: FontWeight.w800,
              letterSpacing: -0.3,
            ),
          ),
          const SizedBox(width: 8),
          Container(
            width: 8,
            height: 8,
            decoration: const BoxDecoration(
              color: Color(0xFF10B981), // Emerald green live indicator dot
              shape: BoxShape.circle,
            ),
          ),
        ],
      ),
      actions: [
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.access_time_rounded,
              color: Color(0xFF2563EB),
              size: 16,
            ),
            const SizedBox(width: 5),
            Text(
              _clockText(_now),
              style: GoogleFonts.poppins(
                color: AppColors.isDark ? Colors.white : const Color(0xFF0F172A),
                fontSize: 12.5,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
        const SizedBox(width: 6),
        IconButton(
          onPressed: () => _fetchKdsItems(),
          icon: const Icon(
            Icons.refresh_rounded,
            color: Color(0xFF2563EB),
            size: 24,
          ),
          tooltip: 'Refresh',
        ),
        const SizedBox(width: 6),
      ],
    );
  }

  // ─── 2. Status Filter Pills Bar ───────────────
  Widget _statusFilterBar() {
    return Container(
      color: AppColors.isDark ? const Color(0xFF0F172A) : Colors.white,
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        child: Row(
          children: [
            _statusFilterChip('All', _allCount),
            const SizedBox(width: 8),
            _statusFilterChip('Pending', _pendingCount),
            const SizedBox(width: 8),
            _statusFilterChip('Preparing', _preparingCount),
            const SizedBox(width: 8),
            _statusFilterChip('Ready', _readyCount),
          ],
        ),
      ),
    );
  }

  Widget _statusFilterChip(String label, int count) {
    final isSelected = _selectedFilter.toLowerCase() == label.toLowerCase();
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedFilter = label;
        });
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
        decoration: BoxDecoration(
          color: isSelected
              ? const Color(0xFFEFF6FF)
              : (AppColors.isDark ? const Color(0xFF1E293B) : Colors.white),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: isSelected
                ? const Color(0xFF3B82F6)
                : (AppColors.isDark
                    ? const Color(0xFF334155)
                    : const Color(0xFFE2E8F0)),
            width: isSelected ? 1.5 : 1.0,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: GoogleFonts.poppins(
                color: isSelected
                    ? const Color(0xFF2563EB)
                    : (AppColors.isDark
                        ? Colors.white
                        : const Color(0xFF334155)),
                fontSize: 12.5,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w600,
              ),
            ),
            const SizedBox(width: 7),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
              decoration: BoxDecoration(
                color: isSelected
                    ? const Color(0xFFDBEAFE)
                    : (AppColors.isDark
                        ? const Color(0xFF334155)
                        : const Color(0xFFF1F5F9)),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                '$count',
                style: GoogleFonts.poppins(
                  color: isSelected
                      ? const Color(0xFF2563EB)
                      : const Color(0xFF64748B),
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ─── 3. Search & Filter Row ───────────────────
  Widget _searchAndFilterRow() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(14, 8, 14, 4),
      child: Row(
        children: [
          // Search Input
          Expanded(
            child: Container(
              height: 44,
              decoration: BoxDecoration(
                color: AppColors.isDark
                    ? const Color(0xFF1E293B)
                    : Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(
                  color: AppColors.isDark
                      ? const Color(0xFF334155)
                      : const Color(0xFFE2E8F0),
                ),
              ),
              child: TextField(
                controller: _searchController,
                onChanged: (val) => setState(() => _searchQuery = val),
                style: GoogleFonts.poppins(
                  color: AppColors.isDark
                      ? Colors.white
                      : const Color(0xFF0F172A),
                  fontSize: 12.5,
                ),
                decoration: InputDecoration(
                  hintText: 'Search order, table, item, waiter...',
                  hintStyle: GoogleFonts.poppins(
                    color: const Color(0xFF94A3B8),
                    fontSize: 12,
                  ),
                  prefixIcon: const Icon(
                    Icons.search_rounded,
                    color: Color(0xFF94A3B8),
                    size: 18,
                  ),
                  suffixIcon: _searchQuery.isNotEmpty
                      ? IconButton(
                          icon: const Icon(
                            Icons.clear_rounded,
                            color: Color(0xFF94A3B8),
                            size: 18,
                          ),
                          onPressed: () {
                            _searchController.clear();
                            setState(() => _searchQuery = '');
                          },
                        )
                      : null,
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(vertical: 11),
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),

          // Trailing Quick Filter Button
          Container(
            height: 44,
            width: 44,
            decoration: BoxDecoration(
              color: AppColors.isDark
                  ? const Color(0xFF1E293B)
                  : Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: AppColors.isDark
                    ? const Color(0xFF334155)
                    : const Color(0xFFE2E8F0),
              ),
            ),
            child: IconButton(
              icon: const Icon(
                Icons.tune_rounded,
                color: Color(0xFF2563EB),
                size: 20,
              ),
              tooltip: 'Filter options',
              onPressed: _showFilterOptionsModal,
            ),
          ),
        ],
      ),
    );
  }

  // ─── 4. View Switcher & Sort Row ───────────────
  Widget _viewSwitcherAndSortRow() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(14, 6, 14, 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          // Segmented View Toggle (Order View vs Item View)
          Container(
            padding: const EdgeInsets.all(3),
            decoration: BoxDecoration(
              color: AppColors.isDark
                  ? const Color(0xFF1E293B)
                  : const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(24),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                _viewModeSegment('order', 'Order View', Icons.tune_rounded),
                _viewModeSegment('item', 'Item View', Icons.coffee_rounded),
              ],
            ),
          ),

          // Sort Indicator Pill
          PopupMenuButton<String>(
            onSelected: (val) => setState(() => _selectedSort = val),
            color: AppColors.isDark ? const Color(0xFF1E293B) : Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
            ),
            itemBuilder: (context) => [
              PopupMenuItem(
                value: 'oldest',
                child: Text(
                  'FIFO (Oldest)',
                  style: GoogleFonts.poppins(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              PopupMenuItem(
                value: 'newest',
                child: Text(
                  'Newest First',
                  style: GoogleFonts.poppins(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              PopupMenuItem(
                value: 'urgent',
                child: Text(
                  'Urgent First',
                  style: GoogleFonts.poppins(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(
                    Icons.swap_vert_rounded,
                    size: 15,
                    color: Color(0xFF94A3B8),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    _selectedSortLabel,
                    style: GoogleFonts.poppins(
                      color: const Color(0xFF64748B),
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
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

  Widget _viewModeSegment(String mode, String label, IconData icon) {
    final isSelected = _viewMode == mode;
    return GestureDetector(
      onTap: () {
        if (_viewMode != mode) {
          setState(() => _viewMode = mode);
        }
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF2563EB) : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: const Color(0xFF2563EB).withValues(alpha: 0.25),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ]
              : null,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 14,
              color: isSelected ? Colors.white : const Color(0xFF64748B),
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: GoogleFonts.poppins(
                color: isSelected ? Colors.white : const Color(0xFF64748B),
                fontSize: 12,
                fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ─── 5. Active Item Quantities Bar ───────────
  Widget _activeQuantitiesBar() {
    final Map<String, int> totals = {};
    for (final item in _items) {
      if (item.status == 'pending' || item.status == 'preparing') {
        totals[item.item] = (totals[item.item] ?? 0) + item.qty;
      }
    }
    if (totals.isEmpty) return const SizedBox.shrink();

    final sortedTotals = totals.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    final totalCount = totals.values.fold(0, (a, b) => a + b);

    return Container(
      margin: const EdgeInsets.fromLTRB(14, 4, 14, 6),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Active Item Quantities (Pending / Preparing)',
                style: GoogleFonts.poppins(
                  color: const Color(0xFF64748B),
                  fontSize: 11.5,
                  fontWeight: FontWeight.w700,
                  letterSpacing: -0.2,
                ),
              ),
              Text(
                '$totalCount Total',
                style: GoogleFonts.poppins(
                  color: const Color(0xFF2563EB),
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          SizedBox(
            height: 38,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              physics: const BouncingScrollPhysics(),
              itemCount: sortedTotals.length,
              itemBuilder: (context, index) {
                final entry = sortedTotals[index];
                final isSelected = _selectedItemNameFilter == entry.key;

                return GestureDetector(
                  onTap: () {
                    setState(() {
                      _selectedItemNameFilter = isSelected ? null : entry.key;
                    });
                  },
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 180),
                    margin: const EdgeInsets.only(right: 8),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? const Color(0xFFEFF6FF)
                          : (AppColors.isDark
                              ? const Color(0xFF1E293B)
                              : Colors.white),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isSelected
                            ? const Color(0xFF2563EB)
                            : (AppColors.isDark
                                ? const Color(0xFF334155)
                                : const Color(0xFFE2E8F0)),
                        width: isSelected ? 1.5 : 1.0,
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          entry.key,
                          style: GoogleFonts.poppins(
                            color: AppColors.isDark
                                ? Colors.white
                                : const Color(0xFF0F172A),
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 6,
                            vertical: 2,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFDBEAFE),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            '${entry.value}',
                            style: GoogleFonts.poppins(
                              color: const Color(0xFF2563EB),
                              fontSize: 11,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  // ─── 6. Grids ────────────────────────────────
  Widget _buildGroupedOrderGrid(int cols) {
    final grouped = _groupedOrders;
    final List<List<GroupedOrder>> columnsData = List.generate(
      cols,
      (_) => [],
    );
    for (int i = 0; i < grouped.length; i++) {
      columnsData[i % cols].add(grouped[i]);
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(14, 6, 14, 14),
      physics: const BouncingScrollPhysics(),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: List.generate(cols, (colIndex) {
          final columnItems = columnsData[colIndex];
          return Expanded(
            child: Padding(
              padding: EdgeInsets.only(
                left: colIndex == 0 ? 0 : 6,
                right: colIndex == cols - 1 ? 0 : 6,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: columnItems.map((orderGroup) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 14),
                    child: _GroupedOrderCard(
                      orderGroup: orderGroup,
                      onUpdateStatus: (item, status) => _advance(item),
                      onBulkUpdateStatus: (items, status) =>
                          _bulkAdvance(items, status),
                      removingIds: _removingIds,
                    ),
                  );
                }).toList(),
              ),
            ),
          );
        }),
      ),
    );
  }

  Widget _buildIndividualItemGrid(int cols) {
    final itemsList = _sortedItems;
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(14, 6, 14, 14),
      physics: const BouncingScrollPhysics(),
      itemCount: itemsList.length,
      itemBuilder: (_, i) {
        final item = itemsList[i];
        final removing = _removingIds.contains(item.id);
        return AnimatedOpacity(
          duration: const Duration(milliseconds: 300),
          opacity: removing ? 0.0 : 1.0,
          child: Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: _KdsCard(
              item: item,
              onAdvance: () => _advance(item),
            ),
          ),
        );
      },
    );
  }

  Widget _emptyState() => Center(
    child: Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          padding: const EdgeInsets.all(20),
          decoration: const BoxDecoration(
            color: Color(0xFFD1FAE5),
            shape: BoxShape.circle,
          ),
          child: const Icon(
            Icons.check_circle_rounded,
            color: Color(0xFF059669),
            size: 56,
          ),
        ),
        const SizedBox(height: 16),
        Text(
          'All Caught Up!',
          style: GoogleFonts.poppins(
            color: AppColors.isDark ? Colors.white : const Color(0xFF0F172A),
            fontSize: 20,
            fontWeight: FontWeight.w800,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          'No kitchen orders pending.',
          style: GoogleFonts.poppins(
            color: const Color(0xFF64748B),
            fontSize: 13,
          ),
        ),
      ],
    ),
  );
}

// ─────────────────────────────────────────────
//  Thumbnail Fallback Helper
// ─────────────────────────────────────────────
Widget _foodFallbackThumbnail(String name) {
  IconData icon = Icons.restaurant_rounded;
  Color iconColor = const Color(0xFF64748B);
  Color bgColor = const Color(0xFFF1F5F9);

  final n = name.toLowerCase();
  if (n.contains('tea') || n.contains('coffee')) {
    icon = Icons.coffee_rounded;
    iconColor = const Color(0xFFD97706);
    bgColor = const Color(0xFFFEF3C7);
  } else if (n.contains('momo') ||
      n.contains('chow') ||
      n.contains('noodle')) {
    icon = Icons.ramen_dining_rounded;
    iconColor = const Color(0xFF2563EB);
    bgColor = const Color(0xFFEFF6FF);
  } else if (n.contains('cake') ||
      n.contains('pastry') ||
      n.contains('dessert')) {
    icon = Icons.cake_rounded;
    iconColor = const Color(0xFFEC4899);
    bgColor = const Color(0xFFFCE7F3);
  }

  return Container(
    width: 48,
    height: 48,
    decoration: BoxDecoration(
      color: bgColor,
      borderRadius: BorderRadius.circular(12),
    ),
    alignment: Alignment.center,
    child: Icon(icon, color: iconColor, size: 22),
  );
}

// ─────────────────────────────────────────────
//  Grouped Order Card Widget (Order View)
// ─────────────────────────────────────────────
class _GroupedOrderCard extends StatelessWidget {
  final GroupedOrder orderGroup;
  final Function(KdsItem, String) onUpdateStatus;
  final Function(List<KdsItem>, String) onBulkUpdateStatus;
  final Set<int> removingIds;

  const _GroupedOrderCard({
    required this.orderGroup,
    required this.onUpdateStatus,
    required this.onBulkUpdateStatus,
    required this.removingIds,
  });

  @override
  Widget build(BuildContext context) {
    final pendingItems =
        orderGroup.items.where((i) => i.status == 'pending').toList();
    final activeItems =
        orderGroup.items.where((i) => i.status == 'pending' || i.status == 'preparing').toList();
    final readyItems =
        orderGroup.items.where((i) => i.status == 'ready').toList();

    final totalCount = orderGroup.items.length;
    final readyCount = readyItems.length;
    final progressRatio = totalCount == 0 ? 0.0 : readyCount / totalCount;

    // ETA calculation: ~7 min per remaining active item, clamped
    final remainingCount =
        orderGroup.items.where((i) => i.status != 'ready' && i.status != 'delivered').length;
    final estMin = (remainingCount * 6 + 2).clamp(5, 45);
    final estMax = estMin + 9;
    final estText = remainingCount == 0 ? 'Ready now!' : '$estMin-$estMax min';

    return Container(
      decoration: BoxDecoration(
        color: AppColors.isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: AppColors.isDark
              ? const Color(0xFF334155)
              : const Color(0xFFE2E8F0),
          width: 1.0,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 12,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          // Left solid blue vertical accent bar
          Positioned(
            top: 0,
            bottom: 0,
            left: 0,
            width: 4.5,
            child: Container(
              color: const Color(0xFF2563EB),
            ),
          ),

          // Card Inner Content
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 14, 14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                    // Header Row: Table Badge, Order Info & Elapsed Timer Pill
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Pink Table Badge
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 8,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFEE2E2),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            orderGroup.table,
                            style: GoogleFonts.poppins(
                              color: const Color(0xFFDC2626),
                              fontSize: 14,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),

                        // Order Number + Waiter & Payment Status
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '#${orderGroup.orderNumber}',
                                style: GoogleFonts.poppins(
                                  color: AppColors.isDark
                                      ? Colors.white
                                      : const Color(0xFF0F172A),
                                  fontSize: 16,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: -0.3,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Row(
                                children: [
                                  const Icon(
                                    Icons.person_outline_rounded,
                                    size: 12,
                                    color: Color(0xFF64748B),
                                  ),
                                  const SizedBox(width: 3),
                                  Text(
                                    orderGroup.waiterName ?? 'Staff',
                                    style: GoogleFonts.poppins(
                                      color: const Color(0xFF64748B),
                                      fontSize: 11,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  const Text(
                                    '|',
                                    style: TextStyle(
                                      color: Color(0xFFCBD5E1),
                                      fontSize: 11,
                                    ),
                                  ),
                                  const SizedBox(width: 6),
                                  Icon(
                                    Icons.bookmark_outline_rounded,
                                    size: 12,
                                    color: orderGroup.isPaid
                                        ? const Color(0xFF10B981)
                                        : const Color(0xFFDC2626),
                                  ),
                                  const SizedBox(width: 3),
                                  Text(
                                    orderGroup.isPaid ? 'Paid' : 'Unpaid',
                                    style: GoogleFonts.poppins(
                                      color: orderGroup.isPaid
                                          ? const Color(0xFF10B981)
                                          : const Color(0xFFDC2626),
                                      fontSize: 11,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),

                        // Top-Right Elapsed Timer Pill
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFEE2E2),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(
                                Icons.access_time_rounded,
                                size: 16,
                                color: Color(0xFFDC2626),
                              ),
                              const SizedBox(width: 6),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    orderGroup.elapsedText,
                                    style: GoogleFonts.poppins(
                                      color: const Color(0xFFDC2626),
                                      fontSize: 12,
                                      fontWeight: FontWeight.w800,
                                      height: 1.1,
                                    ),
                                  ),
                                  Text(
                                    'elapsed',
                                    style: GoogleFonts.poppins(
                                      color: const Color(0xFFDC2626),
                                      fontSize: 9.5,
                                      fontWeight: FontWeight.w500,
                                      height: 1.1,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 14),

                    // Items List
                    Column(
                      children: [
                        for (int index = 0; index < orderGroup.items.length; index++) ...[
                          if (index > 0) const SizedBox(height: 10),
                          AnimatedOpacity(
                            duration: const Duration(milliseconds: 300),
                            opacity: removingIds.contains(orderGroup.items[index].id)
                                ? 0.0
                                : 1.0,
                            child: _buildItemRow(context, orderGroup.items[index]),
                          ),
                        ],
                      ],
                    ),

                    const SizedBox(height: 14),

                    // Dual Batch Action Buttons: Prepare All / Ready All
                    Row(
                      children: [
                        // Prepare All
                        Expanded(
                          child: Material(
                            color: const Color(0xFFF59E0B),
                            borderRadius: BorderRadius.circular(14),
                            child: InkWell(
                              onTap: pendingItems.isNotEmpty
                                  ? () => onBulkUpdateStatus(
                                      pendingItems,
                                      'preparing',
                                    )
                                  : null,
                              borderRadius: BorderRadius.circular(14),
                              child: Padding(
                                padding: const EdgeInsets.symmetric(
                                  vertical: 9,
                                  horizontal: 8,
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    const Icon(
                                      Icons.restaurant_rounded,
                                      color: Colors.white,
                                      size: 18,
                                    ),
                                    const SizedBox(width: 6),
                                    Flexible(
                                      child: Column(
                                        mainAxisSize: MainAxisSize.min,
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            'Prepare All (${pendingItems.length})',
                                            style: GoogleFonts.poppins(
                                              color: Colors.white,
                                              fontSize: 12,
                                              fontWeight: FontWeight.w800,
                                            ),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                          Text(
                                            'Mark all as cooking',
                                            style: GoogleFonts.poppins(
                                              color: Colors.white.withValues(
                                                alpha: 0.9,
                                              ),
                                              fontSize: 9,
                                              fontWeight: FontWeight.w500,
                                            ),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),

                        // Ready All
                        Expanded(
                          child: Material(
                            color: const Color(0xFF10B981),
                            borderRadius: BorderRadius.circular(14),
                            child: InkWell(
                              onTap: activeItems.isNotEmpty
                                  ? () => onBulkUpdateStatus(
                                      activeItems,
                                      'ready',
                                    )
                                  : null,
                              borderRadius: BorderRadius.circular(14),
                              child: Padding(
                                padding: const EdgeInsets.symmetric(
                                  vertical: 9,
                                  horizontal: 8,
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    const Icon(
                                      Icons.check_circle_outline_rounded,
                                      color: Colors.white,
                                      size: 18,
                                    ),
                                    const SizedBox(width: 6),
                                    Flexible(
                                      child: Column(
                                        mainAxisSize: MainAxisSize.min,
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            'Ready All (${activeItems.length})',
                                            style: GoogleFonts.poppins(
                                              color: Colors.white,
                                              fontSize: 12,
                                              fontWeight: FontWeight.w800,
                                            ),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                          Text(
                                            'Mark all as ready',
                                            style: GoogleFonts.poppins(
                                              color: Colors.white.withValues(
                                                alpha: 0.9,
                                              ),
                                              fontSize: 9,
                                              fontWeight: FontWeight.w500,
                                            ),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 12),

                    // Progress & ETA Container
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.isDark
                            ? const Color(0xFF0F172A)
                            : const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: AppColors.isDark
                              ? const Color(0xFF334155)
                              : const Color(0xFFE2E8F0),
                        ),
                      ),
                      child: Row(
                        children: [
                          // Left: Progress Bar & Ready fraction
                          Expanded(
                            flex: 5,
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    const Icon(
                                      Icons.insert_chart_outlined_rounded,
                                      size: 16,
                                      color: Color(0xFF64748B),
                                    ),
                                    const SizedBox(width: 6),
                                    Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          'Progress',
                                          style: GoogleFonts.poppins(
                                            color: AppColors.isDark
                                                ? Colors.white
                                                : const Color(0xFF0F172A),
                                            fontSize: 11.5,
                                            fontWeight: FontWeight.w800,
                                          ),
                                        ),
                                        Text(
                                          '$readyCount / $totalCount Ready',
                                          style: GoogleFonts.poppins(
                                            color: const Color(0xFF64748B),
                                            fontSize: 9.5,
                                            fontWeight: FontWeight.w500,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                Row(
                                  children: [
                                    Expanded(
                                      child: ClipRRect(
                                        borderRadius: BorderRadius.circular(4),
                                        child: LinearProgressIndicator(
                                          value: progressRatio,
                                          backgroundColor: AppColors.isDark
                                              ? const Color(0xFF334155)
                                              : const Color(0xFFE2E8F0),
                                          valueColor:
                                              const AlwaysStoppedAnimation(
                                            Color(0xFF2563EB),
                                          ),
                                          minHeight: 5,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      '${(progressRatio * 100).toInt()}%',
                                      style: GoogleFonts.poppins(
                                        color: AppColors.isDark
                                            ? Colors.white
                                            : const Color(0xFF0F172A),
                                        fontSize: 10.5,
                                        fontWeight: FontWeight.w800,
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),

                          // Vertical Divider
                          Container(
                            width: 1,
                            height: 42,
                            color: AppColors.isDark
                                ? const Color(0xFF334155)
                                : const Color(0xFFE2E8F0),
                            margin: const EdgeInsets.symmetric(horizontal: 10),
                          ),

                          // Right: Est. Ready In
                          Expanded(
                            flex: 4,
                            child: Row(
                              children: [
                                const Icon(
                                  Icons.access_time_rounded,
                                  size: 16,
                                  color: Color(0xFF7C3AED),
                                ),
                                const SizedBox(width: 6),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'Est. Ready In',
                                        style: GoogleFonts.poppins(
                                          color: const Color(0xFF64748B),
                                          fontSize: 9.5,
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      Text(
                                        estText,
                                        style: GoogleFonts.poppins(
                                          color: const Color(0xFF7C3AED),
                                          fontSize: 12.5,
                                          fontWeight: FontWeight.w800,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      }

  Widget _buildItemRow(BuildContext context, KdsItem item) {
    return Row(
      children: [
        // Food Thumbnail
        ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: SizedBox(
            width: 48,
            height: 48,
            child: item.imageUrl != null && item.imageUrl!.isNotEmpty
                ? Image.network(
                    AppConstants.formatImageUrl(item.imageUrl),
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) =>
                        _foodFallbackThumbnail(item.item),
                  )
                : _foodFallbackThumbnail(item.item),
          ),
        ),
        const SizedBox(width: 12),

        // Item Name & Soft Pink Qty Badge
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                item.item,
                style: GoogleFonts.poppins(
                  color:
                      AppColors.isDark ? Colors.white : const Color(0xFF0F172A),
                  fontSize: 13.5,
                  fontWeight: FontWeight.w700,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEE2E2),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  '${item.qty}x',
                  style: GoogleFonts.poppins(
                    color: const Color(0xFFDC2626),
                    fontSize: 10.5,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ],
          ),
        ),

        // Outlined Action Button
        _buildItemActionButton(item),
      ],
    );
  }

  Widget _buildItemActionButton(KdsItem item) {
    if (item.status == 'pending') {
      return OutlinedButton.icon(
        onPressed: () => onUpdateStatus(item, 'preparing'),
        icon: const Icon(
          Icons.outdoor_grill_outlined,
          size: 15,
          color: Color(0xFFD97706),
        ),
        label: Text(
          'Start',
          style: GoogleFonts.poppins(
            color: const Color(0xFFD97706),
            fontSize: 12,
            fontWeight: FontWeight.w700,
          ),
        ),
        style: OutlinedButton.styleFrom(
          side: const BorderSide(color: Color(0xFFF59E0B), width: 1.5),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
          minimumSize: Size.zero,
          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
        ),
      );
    } else if (item.status == 'preparing') {
      return OutlinedButton.icon(
        onPressed: () => onUpdateStatus(item, 'ready'),
        icon: const Icon(
          Icons.check_circle_outline_rounded,
          size: 15,
          color: Color(0xFF059669),
        ),
        label: Text(
          'Ready',
          style: GoogleFonts.poppins(
            color: const Color(0xFF059669),
            fontSize: 12,
            fontWeight: FontWeight.w700,
          ),
        ),
        style: OutlinedButton.styleFrom(
          side: const BorderSide(color: Color(0xFF10B981), width: 1.5),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
          minimumSize: Size.zero,
          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
        ),
      );
    } else {
      return OutlinedButton.icon(
        onPressed: () => onUpdateStatus(item, 'delivered'),
        icon: const Icon(
          Icons.done_all_rounded,
          size: 15,
          color: Color(0xFF2563EB),
        ),
        label: Text(
          'Delivered',
          style: GoogleFonts.poppins(
            color: const Color(0xFF2563EB),
            fontSize: 12,
            fontWeight: FontWeight.w700,
          ),
        ),
        style: OutlinedButton.styleFrom(
          side: const BorderSide(color: Color(0xFF3B82F6), width: 1.5),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
          minimumSize: Size.zero,
          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
        ),
      );
    }
  }
}

// ─────────────────────────────────────────────
//  Item View Card Widget
// ─────────────────────────────────────────────
class _KdsCard extends StatelessWidget {
  final KdsItem item;
  final VoidCallback onAdvance;

  const _KdsCard({required this.item, required this.onAdvance});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: AppColors.isDark
              ? const Color(0xFF334155)
              : const Color(0xFFE2E8F0),
          width: 1.0,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          // Left Blue Stripe
          Positioned(
            top: 0,
            bottom: 0,
            left: 0,
            width: 4.5,
            child: Container(
              color: const Color(0xFF2563EB),
            ),
          ),

          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 14, 14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                    // Header Row: Table Badge, Order Number & Elapsed Timer Pill
                    Row(
                      children: [
                        // Pink Table Badge
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 9,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFEE2E2),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            item.table,
                            style: GoogleFonts.poppins(
                              color: const Color(0xFFDC2626),
                              fontSize: 12,
                              fontWeight: FontWeight.w900,
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),

                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '#${item.orderNumber}',
                                style: GoogleFonts.poppins(
                                  color: AppColors.isDark
                                      ? Colors.white
                                      : const Color(0xFF0F172A),
                                  fontSize: 14,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                              Row(
                                children: [
                                  Text(
                                    item.waiterName ?? 'Staff',
                                    style: GoogleFonts.poppins(
                                      color: const Color(0xFF64748B),
                                      fontSize: 10.5,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                  const SizedBox(width: 4),
                                  const Text(
                                    '|',
                                    style: TextStyle(
                                      color: Color(0xFFCBD5E1),
                                      fontSize: 10,
                                    ),
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    item.isPaid ? 'Paid' : 'Unpaid',
                                    style: GoogleFonts.poppins(
                                      color: item.isPaid
                                          ? const Color(0xFF10B981)
                                          : const Color(0xFFDC2626),
                                      fontSize: 10.5,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),

                        // Elapsed Timer Pill
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 5,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFEE2E2),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(
                                Icons.access_time_rounded,
                                size: 14,
                                color: Color(0xFFDC2626),
                              ),
                              const SizedBox(width: 4),
                              Text(
                                item.elapsedText,
                                style: GoogleFonts.poppins(
                                  color: const Color(0xFFDC2626),
                                  fontSize: 11,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),

                    const SizedBox(height: 12),

                    // Item Body
                    Row(
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(12),
                          child: SizedBox(
                            width: 50,
                            height: 50,
                            child: item.imageUrl != null &&
                                    item.imageUrl!.isNotEmpty
                                ? Image.network(
                                    AppConstants.formatImageUrl(item.imageUrl),
                                    fit: BoxFit.cover,
                                    errorBuilder: (_, __, ___) =>
                                        _foodFallbackThumbnail(item.item),
                                  )
                                : _foodFallbackThumbnail(item.item),
                          ),
                        ),
                        const SizedBox(width: 12),

                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                item.item,
                                style: GoogleFonts.poppins(
                                  color: AppColors.isDark
                                      ? Colors.white
                                      : const Color(0xFF0F172A),
                                  fontSize: 14,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 7,
                                  vertical: 2,
                                ),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFFEE2E2),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  '${item.qty}x',
                                  style: GoogleFonts.poppins(
                                    color: const Color(0xFFDC2626),
                                    fontSize: 11,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),

                        // Action Button
                        if (item.status == 'pending')
                          OutlinedButton.icon(
                            onPressed: onAdvance,
                            icon: const Icon(
                              Icons.outdoor_grill_outlined,
                              size: 15,
                              color: Color(0xFFD97706),
                            ),
                            label: Text(
                              'Start',
                              style: GoogleFonts.poppins(
                                color: const Color(0xFFD97706),
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            style: OutlinedButton.styleFrom(
                              side: const BorderSide(
                                color: Color(0xFFF59E0B),
                                width: 1.5,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(20),
                              ),
                              padding: const EdgeInsets.symmetric(
                                horizontal: 14,
                                vertical: 6,
                              ),
                              minimumSize: Size.zero,
                              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                            ),
                          )
                        else if (item.status == 'preparing')
                          OutlinedButton.icon(
                            onPressed: onAdvance,
                            icon: const Icon(
                              Icons.check_circle_outline_rounded,
                              size: 15,
                              color: Color(0xFF059669),
                            ),
                            label: Text(
                              'Ready',
                              style: GoogleFonts.poppins(
                                color: const Color(0xFF059669),
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            style: OutlinedButton.styleFrom(
                              side: const BorderSide(
                                color: Color(0xFF10B981),
                                width: 1.5,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(20),
                              ),
                              padding: const EdgeInsets.symmetric(
                                horizontal: 14,
                                vertical: 6,
                              ),
                              minimumSize: Size.zero,
                              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                            ),
                          )
                        else
                          OutlinedButton.icon(
                            onPressed: onAdvance,
                            icon: const Icon(
                              Icons.done_all_rounded,
                              size: 15,
                              color: Color(0xFF2563EB),
                            ),
                            label: Text(
                              'Delivered',
                              style: GoogleFonts.poppins(
                                color: const Color(0xFF2563EB),
                                fontSize: 12,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            style: OutlinedButton.styleFrom(
                              side: const BorderSide(
                                color: Color(0xFF3B82F6),
                                width: 1.5,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(20),
                              ),
                              padding: const EdgeInsets.symmetric(
                                horizontal: 14,
                                vertical: 6,
                              ),
                              minimumSize: Size.zero,
                              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                            ),
                          ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      }
}
