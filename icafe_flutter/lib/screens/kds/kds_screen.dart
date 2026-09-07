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
    required this.createdAt,
  });

  int get waitMins => DateTime.now().difference(createdAt).inMinutes;
  int get waitSeconds => DateTime.now().difference(createdAt).inSeconds;

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
    required this.oldestCreatedAt,
    required this.items,
  });

  int get waitMins => DateTime.now().difference(oldestCreatedAt).inMinutes;
  int get waitSeconds => DateTime.now().difference(oldestCreatedAt).inSeconds;

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
//  KDS Screen (Kitetool KDS Inspired Design)
// ─────────────────────────────────────────────
class KdsScreen extends StatefulWidget {
  const KdsScreen({super.key});

  @override
  State<KdsScreen> createState() => _KdsScreenState();
}

class _KdsScreenState extends State<KdsScreen> {
  List<KdsItem> _items = [];
  
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

    // Live clock & wait timers update every second
    _clockTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) setState(() => _now = DateTime.now());
    });

    // Auto-refresh every 3 seconds (simulates live socket / polling)
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
          final orderNumber = order['display_number'] as String? ?? order['order_number'] as String? ?? '#$orderId';
          final tableStr = (order['table'] is Map) 
              ? 'T${(order['table'] as Map)['table_number'] ?? '1'}' 
              : (order['table'] as String? ?? (order['order_type'] ?? 'Takeaway'));
          final waiter = order['waiter'] as String?;
          final customer = order['customer'] as String?;
          final orderType = order['order_type'] as String? ?? 'Dine-In';
          final orderStatus = order['status'] as String? ?? 'pending';
          final items = order['items'] as List? ?? [];
          
          for (final item in items) {
            final id = JsonUtils.parseInt(item['id']);
            final menu = item['menu'] as Map? ?? {};
            final name = menu['name'] as String? ?? 'Unknown Item';
            final imageUrl = menu['image_url'] as String? ?? menu['image'] as String?;
            final qty = JsonUtils.parseInt(item['quantity'], 1);
            final status = item['kds_status'] as String? ?? 'pending';
            final addons = (item['addons'] as List?)?.map((e) => e.toString()).toList() ?? [];
            
            if (status == 'delivered' || status == 'cancelled') continue;
            
            final createdAtStr = item['created_at'] as String? ?? order['created_at'] as String? ?? '';
            DateTime createdAt = DateTime.now();
            if (createdAtStr.isNotEmpty) {
              try {
                createdAt = DateTime.parse(createdAtStr);
              } catch (_) {}
            }

            loaded.add(KdsItem(
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
              createdAt: createdAt,
            ));
          }
        }
        if (mounted) {
          setState(() {
            _items = loaded.where((item) => !_removingIds.contains(item.id)).toList();
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

  // Filter & Search matching items
  List<KdsItem> get _filteredAndSearched {
    List<KdsItem> list = _items;
    
    // 1. Active Item Pill Filter
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

  List<GroupedOrder> get _groupedOrders => _getGroupedOrders(_filteredAndSearched);
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
      result.add(GroupedOrder(
        orderId: orderId,
        orderNumber: first.orderNumber,
        table: first.table,
        waiterName: first.waiterName,
        customerName: first.customerName,
        orderType: first.orderType,
        orderStatus: first.orderStatus,
        oldestCreatedAt: oldest,
        items: items,
      ));
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
    final success = await context.read<OrdersProvider>().updateKdsItemStatus(item.id, next);
    
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
    final success = await context.read<OrdersProvider>().bulkUpdateKdsItemStatus(ids, nextStatus);

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

  int get _criticalCount {
    final app = Provider.of<AppProvider>(context, listen: false);
    return _items.where((i) => i.waitMins >= app.kdsCriticalMins).length;
  }

  @override
  Widget build(BuildContext context) {
    final w = MediaQuery.of(context).size.width;
    final orderCols = w >= 1200 ? 4 : (w >= 900 ? 3 : (w >= 600 ? 2 : 1));
    final itemCols = w >= 1200 ? 4 : (w >= 900 ? 3 : (w >= 600 ? 2 : 1));
    final hasActiveItems = _items.any((e) => e.status == 'pending' || e.status == 'preparing');

    return Scaffold(
      backgroundColor: AppColors.isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
      appBar: _appBar(),
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildControlHeader(context),
          if (hasActiveItems) _activeQuantitiesBar(),
          Expanded(
            child: _viewMode == 'order'
                ? (_groupedOrders.isEmpty ? _emptyState() : _buildGroupedOrderGrid(orderCols))
                : (_sortedItems.isEmpty ? _emptyState() : _buildIndividualItemGrid(itemCols)),
          ),
        ],
      ),
    );
  }

  // ─── Unified Responsive Control Header ──────
  Widget _buildControlHeader(BuildContext context) {
    final app = Provider.of<AppProvider>(context);
    final isDark = AppColors.isDark;

    return LayoutBuilder(
      builder: (context, constraints) {
        final w = constraints.maxWidth;
        final isCompact = w < 480;

        return Container(
          margin: const EdgeInsets.fromLTRB(14, 8, 14, 6),
          padding: EdgeInsets.all(isCompact ? 10 : 12),
          decoration: BoxDecoration(
            color: isDark ? const Color(0xFF1E293B) : Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: isDark ? const Color(0xFF334155) : const Color(0xFFF1F5F9),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.03),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Row 1: View Mode Switcher + Critical Badge (Left) & Clock + Theme Toggle (Right)
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Left side: View Mode Switcher + Critical
                  Flexible(
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(3),
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              _viewModeButton('order', isCompact ? 'Orders' : 'Order View', Icons.tune_rounded),
                              _viewModeButton('item', isCompact ? 'Items' : 'Item View', Icons.local_cafe_rounded),
                            ],
                          ),
                        ),

                        if (_criticalCount > 0) ...[
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFEE2E2),
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: const Color(0xFFFCA5A5)),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Text('🔥 ', style: TextStyle(fontSize: 11)),
                                Text(
                                  isCompact ? '$_criticalCount' : '$_criticalCount Critical',
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
                      ],
                    ),
                  ),

                  // Right side: Clock Capsule & Theme Toggle
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(
                            color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.access_time_rounded, color: Color(0xFF64748B), size: 13),
                            const SizedBox(width: 5),
                            Text(
                              _clockText(_now),
                              style: GoogleFonts.poppins(
                                color: isDark ? Colors.white : const Color(0xFF0F172A),
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 8),
                      InkWell(
                        onTap: () => app.setDarkMode(!app.isDarkMode),
                        borderRadius: BorderRadius.circular(20),
                        child: Container(
                          padding: const EdgeInsets.all(7),
                          decoration: BoxDecoration(
                            color: isDark ? const Color(0xFF334155) : const Color(0xFFF1F5F9),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            app.isDarkMode ? Icons.light_mode_rounded : Icons.dark_mode_rounded,
                            size: 15,
                            color: isDark ? const Color(0xFFF59E0B) : const Color(0xFF64748B),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),

              const SizedBox(height: 10),

              // Row 2: Search Input & Sort Dropdown in one managed responsive row
              Row(
                children: [
                  Expanded(
                    child: Container(
                      height: 40,
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0),
                        ),
                      ),
                      child: TextField(
                        controller: _searchController,
                        onChanged: (val) => setState(() => _searchQuery = val),
                        style: GoogleFonts.poppins(
                          color: isDark ? Colors.white : const Color(0xFF0F172A),
                          fontSize: 12,
                        ),
                        decoration: InputDecoration(
                          hintText: isCompact ? 'Search table, order...' : 'Search table, order, or item...',
                          hintStyle: GoogleFonts.poppins(
                            color: const Color(0xFF94A3B8),
                            fontSize: 12,
                          ),
                          prefixIcon: const Icon(Icons.search_rounded, color: Color(0xFF94A3B8), size: 18),
                          suffixIcon: _searchQuery.isNotEmpty
                              ? IconButton(
                                  icon: const Icon(Icons.clear_rounded, color: Color(0xFF94A3B8), size: 16),
                                  onPressed: () {
                                    _searchController.clear();
                                    setState(() => _searchQuery = '');
                                  },
                                )
                              : null,
                          border: InputBorder.none,
                          isDense: true,
                          contentPadding: const EdgeInsets.symmetric(vertical: 10),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),

                  // Sort Dropdown Button
                  PopupMenuButton<String>(
                    onSelected: (val) => setState(() => _selectedSort = val),
                    itemBuilder: (context) => [
                      PopupMenuItem(
                        value: 'oldest',
                        child: Row(
                          children: [
                            Icon(
                              Icons.history_rounded,
                              size: 16,
                              color: _selectedSort == 'oldest' ? const Color(0xFF2563EB) : const Color(0xFF64748B),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'Oldest First (FIFO)',
                              style: GoogleFonts.poppins(
                                fontSize: 12,
                                fontWeight: _selectedSort == 'oldest' ? FontWeight.w700 : FontWeight.w500,
                                color: _selectedSort == 'oldest' ? const Color(0xFF2563EB) : null,
                              ),
                            ),
                          ],
                        ),
                      ),
                      PopupMenuItem(
                        value: 'newest',
                        child: Row(
                          children: [
                            Icon(
                              Icons.update_rounded,
                              size: 16,
                              color: _selectedSort == 'newest' ? const Color(0xFF2563EB) : const Color(0xFF64748B),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'Newest First',
                              style: GoogleFonts.poppins(
                                fontSize: 12,
                                fontWeight: _selectedSort == 'newest' ? FontWeight.w700 : FontWeight.w500,
                                color: _selectedSort == 'newest' ? const Color(0xFF2563EB) : null,
                              ),
                            ),
                          ],
                        ),
                      ),
                      PopupMenuItem(
                        value: 'urgent',
                        child: Row(
                          children: [
                            Icon(
                              Icons.local_fire_department_rounded,
                              size: 16,
                              color: _selectedSort == 'urgent' ? const Color(0xFFDC2626) : const Color(0xFF64748B),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              'Urgent First',
                              style: GoogleFonts.poppins(
                                fontSize: 12,
                                fontWeight: _selectedSort == 'urgent' ? FontWeight.w700 : FontWeight.w500,
                                color: _selectedSort == 'urgent' ? const Color(0xFFDC2626) : null,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                    child: Container(
                      height: 40,
                      padding: EdgeInsets.symmetric(horizontal: isCompact ? 10 : 12),
                      decoration: BoxDecoration(
                        color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: isDark ? const Color(0xFF334155) : const Color(0xFFCBD5E1),
                        ),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.swap_vert_rounded, size: 16, color: Color(0xFF64748B)),
                          const SizedBox(width: 4),
                          Text(
                            _getSortLabel(isCompact),
                            style: GoogleFonts.poppins(
                              color: isDark ? Colors.white : const Color(0xFF0F172A),
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(width: 2),
                          const Icon(Icons.keyboard_arrow_down_rounded, size: 16, color: Color(0xFF64748B)),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  String _getSortLabel(bool isCompact) {
    if (isCompact) {
      switch (_selectedSort) {
        case 'newest':
          return 'Newest';
        case 'urgent':
          return 'Urgent';
        case 'oldest':
        default:
          return 'Oldest';
      }
    } else {
      switch (_selectedSort) {
        case 'newest':
          return 'Newest First';
        case 'urgent':
          return 'Urgent First';
        case 'oldest':
        default:
          return 'Sort: Oldest (FIFO)';
      }
    }
  }

  Widget _viewModeButton(String mode, String label, IconData icon) {
    final isSelected = _viewMode == mode;
    return GestureDetector(
      onTap: () {
        if (_viewMode != mode) {
          setState(() => _viewMode = mode);
        }
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: isSelected
              ? (AppColors.isDark ? const Color(0xFF334155) : Colors.white)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(9),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 4,
                    offset: const Offset(0, 1),
                  ),
                ]
              : null,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              icon,
              size: 13,
              color: isSelected
                  ? (AppColors.isDark ? Colors.white : const Color(0xFF0F172A))
                  : const Color(0xFF64748B),
            ),
            const SizedBox(width: 5),
            Text(
              label,
              style: GoogleFonts.poppins(
                color: isSelected
                    ? (AppColors.isDark ? Colors.white : const Color(0xFF0F172A))
                    : const Color(0xFF64748B),
                fontSize: 11,
                fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ─── Active Quantities Bar ───────────────────
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
      margin: const EdgeInsets.fromLTRB(14, 6, 14, 6),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: AppColors.isDark ? const Color(0xFF334155) : const Color(0xFFF1F5F9),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  'ACTIVE ITEM QUANTITIES (PENDING / PREPARING)',
                  style: GoogleFonts.poppins(
                    color: const Color(0xFF64748B),
                    fontSize: 10,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppColors.isDark ? const Color(0xFF0F172A) : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  '${totalCount.toString().padLeft(4, '0')} Total Items',
                  style: GoogleFonts.poppins(
                    color: const Color(0xFF475569),
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          SizedBox(
            height: 38,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
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
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: isSelected
                          ? const Color(0xFFDBEAFE)
                          : (AppColors.isDark ? const Color(0xFF0F172A) : Colors.white),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isSelected
                            ? const Color(0xFF2563EB)
                            : (AppColors.isDark ? const Color(0xFF334155) : const Color(0xFFE2E8F0)),
                        width: isSelected ? 1.5 : 1.0,
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          entry.key,
                          style: GoogleFonts.poppins(
                            color: AppColors.isDark ? Colors.white : const Color(0xFF0F172A),
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: const Color(0xFFDBEAFE),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            entry.value.toString().padLeft(2, '0'),
                            style: GoogleFonts.poppins(
                              color: const Color(0xFF2563EB),
                              fontSize: 10,
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

  // ─── Grid Builders ───────────────────────────
  Widget _buildGroupedOrderGrid(int cols) {
    final grouped = _groupedOrders;
    final List<List<GroupedOrder>> columnsData = List.generate(cols, (_) => []);
    for (int i = 0; i < grouped.length; i++) {
      columnsData[i % cols].add(grouped[i]);
    }
    
    return SingleChildScrollView(
      padding: const EdgeInsets.all(14),
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
                      onBulkUpdateStatus: (items, status) => _bulkAdvance(items, status),
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
    if (cols <= 1) {
      return ListView.builder(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        itemCount: itemsList.length,
        itemBuilder: (_, i) {
          final item = itemsList[i];
          final removing = _removingIds.contains(item.id);
          return AnimatedOpacity(
            duration: const Duration(milliseconds: 400),
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

    final List<List<KdsItem>> columnsData = List.generate(cols, (_) => []);
    for (int i = 0; i < itemsList.length; i++) {
      columnsData[i % cols].add(itemsList[i]);
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(14),
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
                children: columnItems.map((item) {
                  final removing = _removingIds.contains(item.id);
                  return AnimatedOpacity(
                    duration: const Duration(milliseconds: 400),
                    opacity: removing ? 0.0 : 1.0,
                    child: Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: _KdsCard(
                        item: item,
                        onAdvance: () => _advance(item),
                      ),
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

  PreferredSizeWidget _appBar() {
    return AppBar(
      backgroundColor: AppColors.isDark ? const Color(0xFF0F172A) : Colors.white,
      elevation: 0,
      leading: IconButton(
        icon: Icon(Icons.menu_rounded, color: AppColors.isDark ? Colors.white : const Color(0xFF0F172A), size: 24),
        onPressed: () => HomeShell.toggleMenu(),
      ),
      title: Text(
        'Kitchen Display',
        style: GoogleFonts.poppins(
          color: AppColors.isDark ? Colors.white : const Color(0xFF0F172A),
          fontSize: 18,
          fontWeight: FontWeight.w800,
        ),
      ),
      actions: [
        IconButton(
          onPressed: () => _fetchKdsItems(),
          icon: const Icon(Icons.refresh_rounded, color: Color(0xFF2563EB)),
          tooltip: 'Refresh',
        ),
        const SizedBox(width: 8),
      ],
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
              child: const Icon(Icons.check_circle_rounded, color: Color(0xFF059669), size: 56),
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
    final app = Provider.of<AppProvider>(context);
    final isCritical = orderGroup.waitMins >= app.kdsCriticalMins;
    final isUnpaid = orderGroup.orderStatus != 'completed';

    return Container(
      decoration: BoxDecoration(
        color: AppColors.isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isCritical ? const Color(0xFFFCA5A5) : (AppColors.isDark ? const Color(0xFF334155) : const Color(0xFFF1F5F9)),
          width: isCritical ? 1.5 : 1.0,
        ),
        boxShadow: [
          BoxShadow(
            color: isCritical ? const Color(0xFFEF4444).withValues(alpha: 0.08) : Colors.black.withValues(alpha: 0.03),
            blurRadius: 12,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Row (Table circle, Order Number, Payment, Type, Info, Flame)
          Row(
            children: [
              // Table circle avatar
              Container(
                width: 36,
                height: 36,
                decoration: const BoxDecoration(
                  color: Color(0xFFFEE2E2), // Soft pink
                  shape: BoxShape.circle,
                ),
                alignment: Alignment.center,
                child: Text(
                  orderGroup.table,
                  style: GoogleFonts.poppins(
                    color: const Color(0xFFDC2626),
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              
              // Order info
              Expanded(
                child: Wrap(
                  spacing: 6,
                  runSpacing: 4,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  children: [
                    Text(
                      'ORDER #${orderGroup.orderNumber}',
                      style: GoogleFonts.poppins(
                        color: AppColors.isDark ? Colors.white : const Color(0xFF0F172A),
                        fontSize: 12,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.2,
                      ),
                    ),
                    
                    // Paid/Unpaid pill
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: isUnpaid ? const Color(0xFFFEE2E2) : const Color(0xFFD1FAE5),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        isUnpaid ? 'UNPAID' : 'PAID',
                        style: GoogleFonts.poppins(
                          color: isUnpaid ? const Color(0xFFDC2626) : const Color(0xFF059669),
                          fontSize: 9,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),

                    // Type pill
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: const Color(0xFFDBEAFE),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        orderGroup.orderType.toUpperCase(),
                        style: GoogleFonts.poppins(
                          color: const Color(0xFF2563EB),
                          fontSize: 9,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const Icon(Icons.info_outline_rounded, size: 16, color: Color(0xFF94A3B8)),
              if (isCritical) ...[
                const SizedBox(width: 4),
                const Text('🔥', style: TextStyle(fontSize: 12)),
              ],
            ],
          ),

          const SizedBox(height: 6),
          // Subheader line: Wait timer
          Row(
            children: [
              const Icon(Icons.access_time_rounded, size: 13, color: Color(0xFFDC2626)),
              const SizedBox(width: 4),
              Text(
                'Wait: ${orderGroup.formattedWaitTime}',
                style: GoogleFonts.poppins(
                  color: const Color(0xFFDC2626),
                  fontSize: 12,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          // Items List (Nested mini item cards)
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: orderGroup.items.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (context, index) {
              final item = orderGroup.items[index];
              final removing = removingIds.contains(item.id);

              return AnimatedOpacity(
                duration: const Duration(milliseconds: 300),
                opacity: removing ? 0.0 : 1.0,
                child: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppColors.isDark ? const Color(0xFF0F172A) : const Color(0xFFFFF5F5),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: const Color(0xFFFFE4E4),
                    ),
                  ),
                  child: Row(
                    children: [
                      // Food image thumbnail
                      Container(
                        width: 42,
                        height: 42,
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(10),
                          child: item.imageUrl != null && item.imageUrl!.isNotEmpty
                              ? Image.network(
                                  AppConstants.formatImageUrl(item.imageUrl),
                                  fit: BoxFit.cover,
                                  errorBuilder: (_, __, ___) => _foodFallbackIcon(item.item),
                                )
                              : _foodFallbackIcon(item.item),
                        ),
                      ),
                      const SizedBox(width: 10),
                      
                      // Item Name & Wait Time
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            RichText(
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              text: TextSpan(
                                children: [
                                  TextSpan(
                                    text: '${item.qty}x ',
                                    style: GoogleFonts.poppins(
                                      color: const Color(0xFF2563EB), // Blue qty
                                      fontSize: 13,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                  TextSpan(
                                    text: item.item,
                                    style: GoogleFonts.poppins(
                                      color: AppColors.isDark ? Colors.white : const Color(0xFF0F172A),
                                      fontSize: 13,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Wait: ${item.formattedWaitTime}',
                              style: GoogleFonts.poppins(
                                color: const Color(0xFF64748B),
                                fontSize: 10,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),

                      // Circular Blue Action Play Button
                      GestureDetector(
                        onTap: () => onUpdateStatus(item, _nextStatus(item.status)),
                        child: Container(
                          width: 32,
                          height: 32,
                          decoration: const BoxDecoration(
                            color: Color(0xFF2563EB), // Solid royal blue
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            item.status == 'pending' ? Icons.play_arrow_rounded : Icons.check_rounded,
                            color: Colors.white,
                            size: 20,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),

          const SizedBox(height: 12),

          // Action Buttons: Prepare All / Ready All
          _buildActionFooter(),
        ],
      ),
    );
  }

  Widget _foodFallbackIcon(String name) {
    IconData icon = Icons.restaurant_rounded;
    if (name.toLowerCase().contains('tea') || name.toLowerCase().contains('coffee')) {
      icon = Icons.coffee_rounded;
    } else if (name.toLowerCase().contains('momo') || name.toLowerCase().contains('chow')) {
      icon = Icons.ramen_dining_rounded;
    }
    return Icon(icon, color: const Color(0xFF94A3B8), size: 20);
  }

  Widget _buildActionFooter() {
    final pendingItems = orderGroup.items.where((i) => i.status == 'pending').toList();
    final preparingItems = orderGroup.items.where((i) => i.status == 'preparing').toList();
    final totalCount = orderGroup.items.length;

    return LayoutBuilder(
      builder: (context, constraints) {
        final isNarrow = constraints.maxWidth < 260;
        final prepareLabel = isNarrow ? 'Prep ($totalCount)' : 'Prepare All ($totalCount)';
        final readyLabel = isNarrow ? 'Ready ($totalCount)' : 'Ready All ($totalCount)';

        return Row(
          children: [
            // Prepare All
            Expanded(
              child: SizedBox(
                height: 38,
                child: ElevatedButton.icon(
                  onPressed: pendingItems.isNotEmpty
                      ? () => onBulkUpdateStatus(pendingItems, 'preparing')
                      : null,
                  icon: const Icon(Icons.play_arrow_rounded, size: 15),
                  label: FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Text(
                      prepareLabel,
                      style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.w800),
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFEFF6FF), // Light blue
                    foregroundColor: const Color(0xFF2563EB), // Royal blue
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),
            
            // Ready All
            Expanded(
              child: SizedBox(
                height: 38,
                child: ElevatedButton.icon(
                  onPressed: (preparingItems.isNotEmpty || pendingItems.isNotEmpty)
                      ? () => onBulkUpdateStatus([...preparingItems, ...pendingItems], 'ready')
                      : null,
                  icon: const Icon(Icons.check_circle_outline_rounded, size: 15),
                  label: FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Text(
                      readyLabel,
                      style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.w800),
                    ),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF059669), // Solid green
                    foregroundColor: Colors.white,
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}

// ─────────────────────────────────────────────
//  Item View Card Widget (Kitetool Item View)
// ─────────────────────────────────────────────
class _KdsCard extends StatelessWidget {
  final KdsItem item;
  final VoidCallback onAdvance;

  const _KdsCard({required this.item, required this.onAdvance});

  @override
  Widget build(BuildContext context) {
    final app = Provider.of<AppProvider>(context);
    final isCritical = item.waitMins >= app.kdsCriticalMins;
    final isUnpaid = item.orderStatus != 'completed';

    return Container(
      decoration: BoxDecoration(
        color: AppColors.isDark ? const Color(0xFF1E293B) : Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isCritical ? const Color(0xFFFCA5A5) : (AppColors.isDark ? const Color(0xFF334155) : const Color(0xFFF1F5F9)),
          width: isCritical ? 1.5 : 1.0,
        ),
        boxShadow: [
          BoxShadow(
            color: isCritical ? const Color(0xFFEF4444).withValues(alpha: 0.08) : Colors.black.withValues(alpha: 0.03),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Row (Table Avatar, Order number, Payment badge, Type badge, Info, Status)
          Row(
            children: [
              // Table avatar circle
              Container(
                width: 34,
                height: 34,
                decoration: const BoxDecoration(
                  color: Color(0xFFFEE2E2),
                  shape: BoxShape.circle,
                ),
                alignment: Alignment.center,
                child: Text(
                  item.table,
                  style: GoogleFonts.poppins(
                    color: const Color(0xFFDC2626),
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              const SizedBox(width: 8),

              Expanded(
                child: Wrap(
                  spacing: 4,
                  runSpacing: 4,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  children: [
                    Text(
                      'ORDER #${item.orderNumber}',
                      style: GoogleFonts.poppins(
                        color: AppColors.isDark ? Colors.white : const Color(0xFF0F172A),
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    
                    // Paid/Unpaid badge
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                      decoration: BoxDecoration(
                        color: isUnpaid ? const Color(0xFFFEE2E2) : const Color(0xFFD1FAE5),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        isUnpaid ? 'UNPAID' : 'PAID',
                        style: GoogleFonts.poppins(
                          color: isUnpaid ? const Color(0xFFDC2626) : const Color(0xFF059669),
                          fontSize: 8,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),

                    // Type badge
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                      decoration: BoxDecoration(
                        color: const Color(0xFFDBEAFE),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        item.orderType.toUpperCase(),
                        style: GoogleFonts.poppins(
                          color: const Color(0xFF2563EB),
                          fontSize: 8,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              const Icon(Icons.info_outline_rounded, size: 15, color: Color(0xFF94A3B8)),
              const SizedBox(width: 4),

              // Status pill (PENDING / PREPARING)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: item.status == 'pending' ? const Color(0xFFFEF3C7) : const Color(0xFFDBEAFE),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  item.status.toUpperCase(),
                  style: GoogleFonts.poppins(
                    color: item.status == 'pending' ? const Color(0xFFD97706) : const Color(0xFF2563EB),
                    fontSize: 8,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ],
          ),

          const SizedBox(height: 12),

          // Item Info Body
          Row(
            children: [
              // Food image thumbnail
              Container(
                width: 54,
                height: 54,
                decoration: BoxDecoration(
                  color: AppColors.isDark ? const Color(0xFF0F172A) : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: item.imageUrl != null && item.imageUrl!.isNotEmpty
                      ? Image.network(
                          AppConstants.formatImageUrl(item.imageUrl),
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => _foodFallbackIcon(item.item),
                        )
                      : _foodFallbackIcon(item.item),
                ),
              ),
              const SizedBox(width: 12),

              // Quantity & Name + Live Wait Pill
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    RichText(
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      text: TextSpan(
                        children: [
                          TextSpan(
                            text: '${item.qty}x ',
                            style: GoogleFonts.poppins(
                              color: const Color(0xFF2563EB), // Royal blue qty font
                              fontSize: 14,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          TextSpan(
                            text: item.item,
                            style: GoogleFonts.poppins(
                              color: AppColors.isDark ? Colors.white : const Color(0xFF0F172A),
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 6),

                    // Wait pill: Wait: 66:25 !
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFEE2E2), // Soft pink
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Text('🔥 ', style: TextStyle(fontSize: 10)),
                          Text(
                            'Wait: ${item.formattedWaitTime} !',
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
              ),
            ],
          ),

          const SizedBox(height: 12),

          // Main Action Button (Start Preparing / Mark Ready)
          SizedBox(
            width: double.infinity,
            height: 42,
            child: ElevatedButton.icon(
              onPressed: onAdvance,
              icon: Icon(
                item.status == 'pending' ? Icons.play_arrow_rounded : Icons.check_rounded,
                size: 18,
              ),
              label: Text(
                item.status == 'pending' ? 'Start Preparing' : (item.status == 'preparing' ? 'Mark Ready' : 'Mark Delivered'),
                style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w800),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF2563EB), // Solid royal blue
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _foodFallbackIcon(String name) {
    IconData icon = Icons.restaurant_rounded;
    if (name.toLowerCase().contains('tea') || name.toLowerCase().contains('coffee')) {
      icon = Icons.coffee_rounded;
    } else if (name.toLowerCase().contains('momo') || name.toLowerCase().contains('chow')) {
      icon = Icons.ramen_dining_rounded;
    }
    return Icon(icon, color: const Color(0xFF94A3B8), size: 24);
  }
}
