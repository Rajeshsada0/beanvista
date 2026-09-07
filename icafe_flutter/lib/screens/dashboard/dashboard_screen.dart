import 'package:icafe_app/core/constants/app_constants.dart';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/json_utils.dart';
import '../../core/utils/formatters.dart';
import '../../providers/auth_provider.dart';
import '../../core/services/api_service.dart';
import '../../providers/finance_provider.dart';
import '../../providers/app_provider.dart';
import '../../core/utils/snackbar_helper.dart';
import '../home_shell.dart';
import '../menu/menu_screen.dart';
import '../customers/customers_screen.dart';
import '../inventory/inventory_screen.dart';
import '../finance/finance_screen.dart';
import '../../providers/subscriptions_provider.dart';
import '../settings/my_plan_screen.dart';


// ─── Dashboard Screen ────────────────────────────────────────────────────────

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen>
    with TickerProviderStateMixin {
  int _touchedBarIndex = -1;

  // Notification List state
  final List<Map<String, dynamic>> _notifications = [];
  final Set<String> _readNotificationIds = {};

  void _addLowStockNotifications() {
    for (var item in _lowStock) {
      final name = item['name'] ?? 'Item';
      final qty = item['quantity'] ?? '0';
      final unit = item['unit'] ?? 'pcs';
      final id = 'low_stock_${item['id']}';
      
      // Check if already exists
      if (!_notifications.any((n) => n['id'] == id)) {
        _notifications.insert(0, {
          'id': id,
          'title': 'Low Stock Alert',
          'body': '$name is running low. Only $qty $unit remaining.',
          'time': 'Just now',
          'type': 'stock',
          'isRead': false,
          'route': 'Inventory',
          'icon': Icons.warning_amber_rounded,
          'color': const Color(0xFFEF4444),
        });
      }
    }
  }

  // Live state variables loaded from backend
  double _todaySales = 0.0;
  double _yesterdaySales = 0.0;
  int _activeTables = 0;
  int _totalTables = 0;
  int _ordersToday = 0;
  int _completedOrders = 0;
  int _totalCustomers = 0;
  double _cashSales = 0.0;
  double _onlineSales = 0.0;
  double _todayCashExpenses = 0.0;
  double _monthlySales = 0.0;
  int _totalItems = 0;
  double _avgTurnaroundMins = 0.0;
  List<Map<String, dynamic>> _weeklySales = [];
  List<Map<String, dynamic>> _topSelling = [];
  List<Map<String, dynamic>> _lowStock = [];
  List<Map<String, dynamic>> _recentActivity = [];
  String? _lastActiveTab;

  late AnimationController _fadeController;
  late AnimationController _slideController;
  late Animation<double> _fadeAnim;
  late Animation<Offset> _slideAnim;

  DateTime _fromDate = DateTime.now().subtract(const Duration(days: 6));
  DateTime _toDate = DateTime.now();
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _lastActiveTab = 'Dashboard';
    _fadeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    );
    _slideController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );
    _fadeAnim = CurvedAnimation(parent: _fadeController, curve: Curves.easeOut);
    _slideAnim = Tween<Offset>(
      begin: const Offset(0, 0.06),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _slideController, curve: Curves.easeOutCubic));

    _fadeController.forward();
    _slideController.forward();
    
    // Fetch live dashboard statistics
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _fetchDashboardData();
    });
  }

  Future<void> _fetchDashboardData() async {
    final hasNoData = _weeklySales.isEmpty && _topSelling.isEmpty && _recentActivity.isEmpty;
    if (mounted && hasNoData) {
      setState(() => _isLoading = true);
    }

    try {
      final api = context.read<ApiService>();
      final formattedFrom = _fromDate.toIso8601String().substring(0, 10);
      final formattedTo = _toDate.toIso8601String().substring(0, 10);
      context.read<FinanceProvider>().fetchCashCounter();
      context.read<SubscriptionsProvider>().fetchSubscriptionDetails();
      final response = await api.get('/dashboard?start_date=$formattedFrom&end_date=$formattedTo');
      
      if (response != null) {
        if (!mounted) return;
        setState(() {
          final stats = response['stats'] as Map<String, dynamic>? ?? {};
          _todaySales = JsonUtils.parseDouble(stats['today_sales']);
          _yesterdaySales = JsonUtils.parseDouble(stats['yesterday_sales']);
          _activeTables = JsonUtils.parseInt(stats['active_tables']);
          _totalTables = JsonUtils.parseInt(stats['total_tables']);
          _ordersToday = JsonUtils.parseInt(stats['today_orders']);
          _completedOrders = JsonUtils.parseInt(stats['completed_orders']);
          _totalCustomers = JsonUtils.parseInt(stats['total_customers']);
          _cashSales = JsonUtils.parseDouble(stats['today_cash']);
          _onlineSales = JsonUtils.parseDouble(stats['today_online']);
          _todayCashExpenses = JsonUtils.parseDouble(stats['today_cash_expenses']);
          _monthlySales = JsonUtils.parseDouble(stats['monthly_sales']);
          _totalItems = JsonUtils.parseInt(stats['total_items']);
          _avgTurnaroundMins = JsonUtils.parseDouble(stats['avg_turnaround_mins']);

          if (response['weekly_sales'] != null) {
            _weeklySales = (response['weekly_sales'] as List)
                .map((e) => Map<String, dynamic>.from(e as Map))
                .toList();
          }

          if (response['top_selling'] != null) {
            _topSelling = (response['top_selling'] as List)
                .map((e) => Map<String, dynamic>.from(e as Map))
                .toList();
          }

          if (response['recent_activity'] != null) {
            _recentActivity = (response['recent_activity'] as List)
                .map((e) => Map<String, dynamic>.from(e as Map))
                .toList();
          }

          // Parse dynamic notifications
          if (response['notifications'] != null) {
            final rawNotifs = response['notifications'] as List;
            _notifications.clear();
            for (var item in rawNotifs) {
              final map = Map<String, dynamic>.from(item as Map);
              IconData icon;
              Color color;
              switch (map['type']) {
                case 'reservation':
                  icon = Icons.event_seat_rounded;
                  color = const Color(0xFF3B82F6);
                  break;
                case 'payment':
                  icon = Icons.payments_rounded;
                  color = const Color(0xFF10B981);
                  break;
                case 'system':
                  icon = Icons.system_update_rounded;
                  color = const Color(0xFF6366F1);
                  break;
                case 'stock':
                  icon = Icons.warning_amber_rounded;
                  color = const Color(0xFFEF4444);
                  break;
                default:
                  icon = Icons.notifications_rounded;
                  color = const Color(0xFFF59E0B);
              }
              map['icon'] = icon;
              map['color'] = color;
              
              // Maintain local isRead state if user has read it in this session
              final id = map['id']?.toString() ?? '';
              map['isRead'] = _readNotificationIds.contains(id) || (map['isRead'] ?? false);
              
              _notifications.add(map);
            }
          }

          // Parse low stock and add low stock alerts to notifications list
          if (response['low_stock'] != null) {
            _lowStock = (response['low_stock'] as List)
                .map((e) => Map<String, dynamic>.from(e as Map))
                .toList();
            _addLowStockNotifications();
          }
        });
      }
    } catch (e) {
      debugPrint('Failed to load dashboard data: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  void dispose() {
    _fadeController.dispose();
    _slideController.dispose();
    super.dispose();
  }

  Future<void> _onRefresh() async {
    await _fetchDashboardData();
  }

  Future<void> _pickDate(bool isFrom) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: isFrom ? _fromDate : _toDate,
      firstDate: DateTime(2024),
      lastDate: DateTime.now(),
      builder: (context, child) => Theme(
        data: Theme.of(context).copyWith(
          colorScheme: Theme.of(context).colorScheme.copyWith(
            primary: AppColors.accentAmber,
          ),
        ),
        child: child!,
      ),
    );
    if (picked != null) {
      setState(() {
        if (isFrom) {
          _fromDate = picked;
        } else {
          _toDate = picked;
        }
      });
      _fetchDashboardData();
    }
  }

  @override
  Widget build(BuildContext context) {
    final activeTab = context.watch<AppProvider>().activeTabLabel;
    if (activeTab == 'Dashboard' && _lastActiveTab != 'Dashboard') {
      _lastActiveTab = 'Dashboard';
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _fetchDashboardData();
      });
    } else {
      _lastActiveTab = activeTab;
    }

    final auth = context.watch<AuthProvider>();
    final userName = auth.user?.name ?? 'User';
    final initials = userName
        .split(' ')
        .map((e) => e.isNotEmpty ? e[0] : '')
        .take(2)
        .join()
        .toUpperCase();

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Scaffold(
        backgroundColor: AppColors.darkBg,
        body: FadeTransition(
          opacity: _fadeAnim,
          child: SlideTransition(
            position: _slideAnim,
            child: RefreshIndicator(
              onRefresh: _onRefresh,
              color: AppColors.accentAmber,
              backgroundColor: AppColors.darkCard,
              child: CustomScrollView(
                physics: const BouncingScrollPhysics(
                  parent: AlwaysScrollableScrollPhysics(),
                ),
                slivers: [
                  _buildSliverAppBar(userName, initials),
                  SliverToBoxAdapter(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 16),
                        _buildDateFilter(),
                        const SizedBox(height: 20),
                        _buildSectionHeader(
                          'Quick Stats',
                          Icons.dashboard_rounded,
                          onViewAll: () => HomeShell.selectTabByLabel('POS'),
                        ),
                        const SizedBox(height: 12),
                        _buildStatsGrid(),
                        const SizedBox(height: 24),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: _buildCashRegisterCard(),
                        ),
                        const SizedBox(height: 24),
                        _buildSectionHeader(
                          'Quick Shortcuts',
                          Icons.grid_view_rounded,
                        ),
                        const SizedBox(height: 12),
                        _buildQuickActions(),
                        const SizedBox(height: 24),
                        _buildSectionHeader('Sales Trend', Icons.bar_chart_rounded),
                        const SizedBox(height: 12),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: _buildSalesBarChart(),
                        ),
                        const SizedBox(height: 24),
                        _buildSectionHeader('Payment Breakdown', Icons.pie_chart_rounded),
                        const SizedBox(height: 12),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: _buildPaymentBreakdown(),
                        ),
                        const SizedBox(height: 24),
                        _buildTopSellingList(),
                        const SizedBox(height: 24),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: _buildLowStockAlerts(),
                        ),
                        const SizedBox(height: 24),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: _buildRecentActivity(),
                        ),
                        const SizedBox(height: 32),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  // ── Sliver App Bar ──────────────────────────────────────────────────────────

  Widget _buildSliverAppBar(String userName, String initials) {
    return SliverAppBar(
      expandedHeight: 130,
      floating: false,
      pinned: true,
      snap: false,
      backgroundColor: AppColors.darkSurface,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      leading: IconButton(
        icon: Icon(Icons.menu_rounded, color: AppColors.textPrimary, size: 24),
        onPressed: () => HomeShell.toggleMenu(),
      ),
      title: Text(
        'Dashboard',
        style: GoogleFonts.plusJakartaSans(
          fontSize: 20,
          fontWeight: FontWeight.w700,
          color: AppColors.textPrimary,
        ),
      ),
      actions: [
        Builder(
          builder: (context) {
            final user = context.watch<AuthProvider>().user;
            final subProvider = context.watch<SubscriptionsProvider>();
            final sub = user?.subscription;
            final trialInfo = subProvider.trialInfo;

            final isTrial = (sub?.isTrial == true) ||
                (sub?.planName.toLowerCase().contains('trial') ?? false) ||
                (trialInfo != null && !trialInfo.isExpired) ||
                (subProvider.currentSubscription?.planName.toLowerCase().contains('trial') ?? false);

            final daysLeft = sub?.trialDaysRemaining ?? trialInfo?.daysRemaining;

            if (isTrial) {
              return Padding(
                padding: const EdgeInsets.only(right: 8.0),
                child: Center(child: _buildUpgradePlanBadge(context, daysLeft)),
              );
            }
            return const SizedBox.shrink();
          },
        ),
        Builder(
          builder: (context) {
            final unread = _notifications.where((n) => !n['isRead']).length;
            return _buildIconButton(
              Icons.notifications_outlined,
              onTap: () => _showNotificationsSheet(context),
              badge: unread > 0 ? '$unread' : null,
            );
          }
        ),
        const SizedBox(width: 12),
      ],
      flexibleSpace: FlexibleSpaceBar(
        collapseMode: CollapseMode.parallax,
        background: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: AppColors.isDark
                  ? [const Color(0xFF2D1200), const Color(0xFF1C1209)]
                  : [const Color(0xFFFFFFFF), const Color(0xFFF1F5F9)],
            ),
          ),
          child: Stack(
            children: [
              Positioned(
                top: -30,
                right: -30,
                child: Container(
                  width: 160,
                  height: 160,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppColors.accentAmber.withOpacity(0.06),
                  ),
                ),
              ),
              Positioned(
                bottom: -20,
                left: 40,
                child: Container(
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppColors.accentAmber.withOpacity(0.04),
                  ),
                ),
              ),
              SafeArea(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 12, 20, 12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [

                      Text(
                        'Good morning! 👋',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 12,
                          color: AppColors.textMuted,
                        ),
                      ),
                      Text(
                        "Here's today's overview",
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 15,
                          fontWeight: FontWeight.w600,
                          color: AppColors.textPrimary,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showNotificationsSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.darkCard,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (context, setSheetState) {
          final unread = _notifications.where((n) => !n['isRead']).length;
          
          return Container(
            padding: const EdgeInsets.all(24),
            height: MediaQuery.of(context).size.height * 0.7,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top handle
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    margin: const EdgeInsets.only(bottom: 20),
                    decoration: BoxDecoration(
                      color: AppColors.darkBorder,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                
                // Header Row
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Text(
                          'Notifications',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 20,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        if (unread > 0) ...[
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppColors.statusRed,
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              '$unread',
                              style: GoogleFonts.plusJakartaSans(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                    if (_notifications.isNotEmpty)
                      TextButton(
                        onPressed: () {
                          setSheetState(() {
                            for (var n in _notifications) {
                              n['isRead'] = true;
                              final id = n['id']?.toString();
                              if (id != null) {
                                _readNotificationIds.add(id);
                              }
                            }
                          });
                          setState(() {});
                        },
                        child: Text(
                          'Mark all as read',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: AppColors.accentAmber,
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 16),
                
                // Notification list
                Expanded(
                  child: _notifications.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Container(
                                padding: const EdgeInsets.all(20),
                                decoration: BoxDecoration(
                                  color: AppColors.darkBorder.withOpacity(0.3),
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(
                                  Icons.notifications_off_outlined,
                                  size: 40,
                                  color: AppColors.textMuted,
                                ),
                              ),
                              const SizedBox(height: 16),
                              Text(
                                'No notifications yet',
                                style: GoogleFonts.plusJakartaSans(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                            ],
                          ),
                        )
                      : ListView.separated(
                          itemCount: _notifications.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 10),
                          itemBuilder: (context, index) {
                            final notif = _notifications[index];
                            return Dismissible(
                              key: Key(notif['id']),
                              direction: DismissDirection.horizontal,
                              background: Container(
                                decoration: BoxDecoration(
                                  color: AppColors.statusRed,
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                alignment: Alignment.centerLeft,
                                padding: const EdgeInsets.symmetric(horizontal: 20),
                                child: const Icon(Icons.delete_rounded, color: Colors.white),
                              ),
                              secondaryBackground: Container(
                                decoration: BoxDecoration(
                                  color: AppColors.statusRed,
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                alignment: Alignment.centerRight,
                                padding: const EdgeInsets.symmetric(horizontal: 20),
                                child: const Icon(Icons.delete_rounded, color: Colors.white),
                              ),
                              onDismissed: (direction) {
                                final removedId = notif['id'];
                                setSheetState(() {
                                  _notifications.removeWhere((n) => n['id'] == removedId);
                                });
                                setState(() {});
                              },
                              child: GestureDetector(
                                onTap: () {
                                  // Mark as read
                                  setSheetState(() {
                                    notif['isRead'] = true;
                                    final id = notif['id']?.toString();
                                    if (id != null) {
                                      _readNotificationIds.add(id);
                                    }
                                  });
                                  setState(() {});
                                  
                                  // Close sheet and navigate
                                  Navigator.pop(ctx);
                                  
                                  if (notif['route'] != null && notif['route'] != 'Dashboard') {
                                    HomeShell.selectTabByLabel(notif['route']);
                                  }
                                },
                                child: Container(
                                  padding: const EdgeInsets.all(16),
                                  decoration: BoxDecoration(
                                    color: notif['isRead']
                                        ? AppColors.darkSurface.withOpacity(0.5)
                                        : AppColors.darkSurface,
                                    borderRadius: BorderRadius.circular(16),
                                    border: Border.all(
                                      color: notif['isRead']
                                          ? AppColors.darkBorder.withOpacity(0.5)
                                          : AppColors.accentAmber.withOpacity(0.2),
                                    ),
                                  ),
                                  child: Row(
                                    children: [
                                      // Icon container
                                      Container(
                                        padding: const EdgeInsets.all(10),
                                        decoration: BoxDecoration(
                                          color: (notif['color'] as Color).withOpacity(0.12),
                                          shape: BoxShape.circle,
                                        ),
                                        child: Icon(
                                          notif['icon'] as IconData,
                                          color: notif['color'] as Color,
                                          size: 20,
                                        ),
                                      ),
                                      const SizedBox(width: 14),
                                      
                                      // Text fields
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              notif['title'] as String,
                                              style: GoogleFonts.plusJakartaSans(
                                                fontSize: 13,
                                                fontWeight: FontWeight.w600,
                                                color: notif['isRead']
                                                    ? AppColors.textSecondary
                                                    : AppColors.textPrimary,
                                              ),
                                            ),
                                            const SizedBox(height: 3),
                                            Text(
                                              notif['body'] as String,
                                              style: GoogleFonts.plusJakartaSans(
                                                fontSize: 12,
                                                color: AppColors.textMuted,
                                              ),
                                            ),
                                            const SizedBox(height: 5),
                                            Text(
                                              notif['time'] as String,
                                              style: GoogleFonts.plusJakartaSans(
                                                fontSize: 10,
                                                color: AppColors.textMuted.withOpacity(0.7),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      
                                      // Unread indicator dot
                                      if (!notif['isRead'])
                                        Container(
                                          width: 8,
                                          height: 8,
                                          decoration: BoxDecoration(
                                            color: AppColors.accentAmber,
                                            shape: BoxShape.circle,
                                          ),
                                        ),
                                    ],
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildUpgradePlanBadge(BuildContext context, int? daysLeft) {
    final labelText = (daysLeft != null && daysLeft > 0)
        ? 'Trial ($daysLeft d)'
        : 'Upgrade Plan';

    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => const MyPlanScreen()),
        );
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFFF59E0B), Color(0xFFEA580C)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFFF59E0B).withOpacity(0.35),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.workspace_premium_rounded,
              color: Colors.white,
              size: 14,
            ),
            const SizedBox(width: 4),
            Text(
              labelText,
              style: GoogleFonts.plusJakartaSans(
                color: Colors.white,
                fontSize: 11,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.2,
              ),
            ),
            const SizedBox(width: 3),
            const Icon(
              Icons.arrow_forward_ios_rounded,
              color: Colors.white,
              size: 9,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildIconButton(IconData icon,
      {required VoidCallback onTap, String? badge}) {
    return GestureDetector(
      onTap: onTap,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: AppColors.darkCard,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppColors.darkBorder),
            ),
            child: Icon(icon, size: 18, color: AppColors.textSecondary),
          ),
          if (badge != null)
            Positioned(
              top: -4,
              right: -4,
              child: Container(
                padding: const EdgeInsets.all(3),
                decoration: BoxDecoration(
                  color: AppColors.statusRed,
                  shape: BoxShape.circle,
                ),
                child: Text(
                  badge,
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 8,
                    fontWeight: FontWeight.w700,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  // ── Date Filter ─────────────────────────────────────────────────────────────

  Widget _buildDateFilter() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppColors.darkCard,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.darkBorder),
        ),
        child: Row(
          children: [
            Icon(Icons.calendar_today_rounded,
                size: 16, color: AppColors.accentAmber),
            const SizedBox(width: 10),
            Text(
              'Period:',
              style: GoogleFonts.plusJakartaSans(
                fontSize: 12,
                color: AppColors.textMuted,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _dateChip(
                _formatDate(_fromDate),
                onTap: () => _pickDate(true),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 6),
              child: Text(
                '→',
                style: GoogleFonts.plusJakartaSans(
                    color: AppColors.textMuted, fontSize: 14),
              ),
            ),
            Expanded(
              child: _dateChip(
                _formatDate(_toDate),
                onTap: () => _pickDate(false),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime d) =>
      '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';

  Widget _dateChip(String label, {required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: AppColors.accentAmber.withOpacity(0.1),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: AppColors.accentAmber.withOpacity(0.3)),
        ),
        child: Text(
          label,
          textAlign: TextAlign.center,
          style: GoogleFonts.plusJakartaSans(
            fontSize: 11,
            color: AppColors.accentAmber,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }

  // ── Section Header ──────────────────────────────────────────────────────────

  Widget _buildSectionHeader(String title, IconData icon,
      {String? badge, Color? badgeColor, VoidCallback? onViewAll}) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              color: AppColors.accentAmber.withOpacity(0.12),
              borderRadius: BorderRadius.circular(9),
            ),
            child: Icon(icon, size: 16, color: AppColors.accentAmber),
          ),
          const SizedBox(width: 10),
          Text(
            title,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 15,
              fontWeight: FontWeight.w600,
              color: AppColors.textPrimary,
            ),
          ),
          if (badge != null) ...[
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
              decoration: BoxDecoration(
                color: (badgeColor ?? AppColors.accentAmber).withOpacity(0.15),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: (badgeColor ?? AppColors.accentAmber).withOpacity(0.4),
                ),
              ),
              child: Text(
                badge,
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  color: badgeColor ?? AppColors.accentAmber,
                ),
              ),
            ),
          ],
          const Spacer(),
          if (onViewAll != null)
            InkWell(
              onTap: onViewAll,
              borderRadius: BorderRadius.circular(6),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'View All',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 11,
                        color: AppColors.accentAmber,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(width: 2),
                    Icon(Icons.chevron_right_rounded,
                        size: 16, color: AppColors.accentAmber),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  // ── Quick Shortcuts ─────────────────────────────────────────────────────────

  Widget _buildQuickActions() {
    final actions = [
      {
        'label': 'Add Account',
        'icon': Icons.account_balance_rounded,
        'color': const Color(0xFF10B981),
        'onTap': (BuildContext context) {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => const FinanceScreen(showAddBankAccount: true),
            ),
          );
        },
      },
      {
        'label': 'Add Menu',
        'icon': Icons.restaurant_menu_rounded,
        'color': const Color(0xFFF59E0B),
        'onTap': (BuildContext context) {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => const MenuScreen(showAdd: true),
            ),
          );
        },
      },
      {
        'label': 'Category',
        'icon': Icons.category_rounded,
        'color': const Color(0xFF3B82F6),
        'onTap': (BuildContext context) {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => const MenuScreen(showCategories: true),
            ),
          );
        },
      },
      {
        'label': 'Add Stock',
        'icon': Icons.inventory_2_rounded,
        'color': const Color(0xFFEF4444),
        'onTap': (BuildContext context) {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => const InventoryScreen(showAdd: true),
            ),
          );
        },
      },
      {
        'label': 'Add Customer',
        'icon': Icons.person_add_rounded,
        'color': const Color(0xFF8B5CF6),
        'onTap': (BuildContext context) {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => const CustomersScreen(showAdd: true),
            ),
          );
        },
      },
    ];

    return Container(
      height: 90,
      margin: const EdgeInsets.symmetric(vertical: 4),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        physics: const BouncingScrollPhysics(),
        itemCount: actions.length,
        itemBuilder: (context, idx) {
          final act = actions[idx];
          return Padding(
            padding: const EdgeInsets.only(right: 18),
            child: GestureDetector(
              onTap: () => (act['onTap'] as Function(BuildContext))(context),
              child: Column(
                children: [
                  Container(
                    width: 52,
                    height: 52,
                    decoration: BoxDecoration(
                      color: (act['color'] as Color).withOpacity(0.12),
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: (act['color'] as Color).withOpacity(0.2),
                        width: 1.5,
                      ),
                    ),
                    child: Icon(
                      act['icon'] as IconData,
                      color: act['color'] as Color,
                      size: 22,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    act['label'] as String,
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  // ── Quick Stats Grid ────────────────────────────────────────────────────────

  Widget _buildStatsGrid() {
    final isMobile = MediaQuery.of(context).size.width < 720;
    
    final cards = [
      _buildStatCard(
        icon: Icons.payments_rounded,
        iconBg: AppColors.statusGreen.withOpacity(0.12),
        iconColor: AppColors.statusGreen,
        label: "TODAY'S REVENUE",
        value: '${AppConstants.currencySymbol} ${_todaySales.toStringAsFixed(2)}',
        changePercent: _yesterdaySales > 0
            ? '${((_todaySales - _yesterdaySales) / _yesterdaySales * 100).toStringAsFixed(1)}%'
            : '100.0%',
        isPositive: _todaySales >= _yesterdaySales,
        accentColor: AppColors.statusGreen,
        child: Padding(
          padding: const EdgeInsets.only(top: 8.0),
          child: LayoutBuilder(
            builder: (context, constraints) {
              final useColumn = constraints.maxWidth < 180;
              if (useColumn) {
                return Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
                      decoration: BoxDecoration(
                        color: AppColors.statusGreen.withOpacity(0.08),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.payments_rounded, color: AppColors.statusGreen, size: 10),
                          const SizedBox(width: 4),
                          Text('CASH', style: GoogleFonts.plusJakartaSans(fontSize: 8, fontWeight: FontWeight.bold, color: AppColors.statusGreen)),
                          Expanded(
                            child: Text(
                              '${AppConstants.currencySymbol}${_cashSales.toStringAsFixed(2)}',
                              style: GoogleFonts.plusJakartaSans(fontSize: 8.5, fontWeight: FontWeight.bold, color: AppColors.statusGreen),
                              textAlign: TextAlign.end,
                              overflow: TextOverflow.ellipsis,
                              maxLines: 1,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 6),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
                      decoration: BoxDecoration(
                        color: AppColors.statusBlue.withOpacity(0.08),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.payment_rounded, color: AppColors.statusBlue, size: 10),
                          const SizedBox(width: 4),
                          Text('ONLINE', style: GoogleFonts.plusJakartaSans(fontSize: 8, fontWeight: FontWeight.bold, color: AppColors.statusBlue)),
                          Expanded(
                            child: Text(
                              '${AppConstants.currencySymbol}${_onlineSales.toStringAsFixed(2)}',
                              style: GoogleFonts.plusJakartaSans(fontSize: 8.5, fontWeight: FontWeight.bold, color: AppColors.statusBlue),
                              textAlign: TextAlign.end,
                              overflow: TextOverflow.ellipsis,
                              maxLines: 1,
                            ),
                          ),
                        ],
                      ),
                    ),
                    if (_todayCashExpenses > 0) ...[
                      const SizedBox(height: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
                        decoration: BoxDecoration(
                          color: AppColors.statusRed.withOpacity(0.08),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.remove_circle_outline_rounded, color: AppColors.statusRed, size: 10),
                            const SizedBox(width: 4),
                            Text('EXPENSE', style: GoogleFonts.plusJakartaSans(fontSize: 8, fontWeight: FontWeight.bold, color: AppColors.statusRed)),
                            Expanded(
                              child: Text(
                                '- ${AppConstants.currencySymbol}${_todayCashExpenses.toStringAsFixed(2)}',
                                style: GoogleFonts.plusJakartaSans(fontSize: 8.5, fontWeight: FontWeight.bold, color: AppColors.statusRed),
                                textAlign: TextAlign.end,
                                overflow: TextOverflow.ellipsis,
                                maxLines: 1,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                );
              } else {
                return Column(
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppColors.statusGreen.withOpacity(0.08),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Row(
                              children: [
                                Icon(Icons.payments_rounded, color: AppColors.statusGreen, size: 10),
                                const SizedBox(width: 4),
                                Text('CASH', style: GoogleFonts.plusJakartaSans(fontSize: 7.5, fontWeight: FontWeight.bold, color: AppColors.statusGreen)),
                                Expanded(
                                  child: Text(
                                    '${AppConstants.currencySymbol}${_cashSales.toStringAsFixed(2)}',
                                    style: GoogleFonts.plusJakartaSans(fontSize: 8.5, fontWeight: FontWeight.bold, color: AppColors.statusGreen),
                                    textAlign: TextAlign.end,
                                    overflow: TextOverflow.ellipsis,
                                    maxLines: 1,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppColors.statusBlue.withOpacity(0.08),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Row(
                              children: [
                                Icon(Icons.payment_rounded, color: AppColors.statusBlue, size: 10),
                                const SizedBox(width: 4),
                                Text('ONLINE', style: GoogleFonts.plusJakartaSans(fontSize: 7.5, fontWeight: FontWeight.bold, color: AppColors.statusBlue)),
                                Expanded(
                                  child: Text(
                                    '${AppConstants.currencySymbol}${_onlineSales.toStringAsFixed(2)}',
                                    style: GoogleFonts.plusJakartaSans(fontSize: 8.5, fontWeight: FontWeight.bold, color: AppColors.statusBlue),
                                    textAlign: TextAlign.end,
                                    overflow: TextOverflow.ellipsis,
                                    maxLines: 1,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                    if (_todayCashExpenses > 0) ...[
                      const SizedBox(height: 4),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppColors.statusRed.withOpacity(0.08),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.remove_circle_outline_rounded, color: AppColors.statusRed, size: 9),
                            const SizedBox(width: 4),
                            Text('COUNTER EXPENSE', style: GoogleFonts.plusJakartaSans(fontSize: 7.5, fontWeight: FontWeight.bold, color: AppColors.statusRed)),
                            Expanded(
                              child: Text(
                                '- ${AppConstants.currencySymbol}${_todayCashExpenses.toStringAsFixed(2)}',
                                style: GoogleFonts.plusJakartaSans(fontSize: 8, fontWeight: FontWeight.bold, color: AppColors.statusRed),
                                textAlign: TextAlign.end,
                                overflow: TextOverflow.ellipsis,
                                maxLines: 1,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ],
                );
              }
            },
          ),
        ),
      ),
      _buildStatCard(
        icon: Icons.people_outline_rounded,
        iconBg: AppColors.statusBlue.withOpacity(0.12),
        iconColor: AppColors.statusBlue,
        label: 'TOTAL CUSTOMERS',
        value: '$_totalCustomers',
        subtext: 'LOYALTY MEMBERS',
        accentColor: AppColors.statusBlue,
      ),
      _buildStatCard(
        icon: Icons.grid_view_rounded,
        iconBg: AppColors.statusRed.withOpacity(0.12),
        iconColor: AppColors.statusRed,
        label: 'ACTIVE TABLES',
        value: '$_activeTables',
        subtext: 'OUT OF $_totalTables TOTAL',
        accentColor: AppColors.statusRed,
      ),
      _buildStatCard(
        icon: Icons.trending_up_rounded,
        iconBg: AppColors.statusPurple.withOpacity(0.12),
        iconColor: AppColors.statusPurple,
        label: 'MONTHLY SALES',
        value: '${AppConstants.currencySymbol} ${_monthlySales.toStringAsFixed(2)}',
        subtext: 'CURRENT MONTH',
        accentColor: AppColors.statusPurple,
      ),
      _buildStatCard(
        icon: Icons.coffee_rounded,
        iconBg: AppColors.accentAmber.withOpacity(0.12),
        iconColor: AppColors.accentAmber,
        label: 'MENU ITEMS',
        value: '$_totalItems',
        subtext: 'ACTIVE ON MENU',
        accentColor: AppColors.accentAmber,
      ),
      _buildStatCard(
        icon: Icons.watch_later_rounded,
        iconBg: AppColors.statusAmber.withOpacity(0.12),
        iconColor: AppColors.statusAmber,
        label: 'AVG TURNAROUND',
        value: _avgTurnaroundMins > 0 ? '${_avgTurnaroundMins.toStringAsFixed(0)} MINS' : 'N/A',
        subtext: "TODAY'S AVG SERVICE TIME",
        accentColor: AppColors.statusAmber,
      ),
    ];

    if (isMobile) {
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Column(
          children: [
            Row(
              children: [
                Expanded(child: cards[0]),
                const SizedBox(width: 12),
                Expanded(child: cards[1]),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(child: cards[2]),
                const SizedBox(width: 12),
                Expanded(child: cards[3]),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(child: cards[4]),
                const SizedBox(width: 12),
                Expanded(child: cards[5]),
              ],
            ),
          ],
        ),
      );
    } else {
      return Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Column(
          children: [
            Row(
              children: [
                Expanded(child: cards[0]),
                const SizedBox(width: 12),
                Expanded(child: cards[1]),
                const SizedBox(width: 12),
                Expanded(child: cards[2]),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(child: cards[3]),
                const SizedBox(width: 12),
                Expanded(child: cards[4]),
                const SizedBox(width: 12),
                Expanded(child: cards[5]),
              ],
            ),
          ],
        ),
      );
    }
  }

  Widget _buildStatCard({
    required IconData icon,
    required Color iconBg,
    required Color iconColor,
    required String label,
    required String value,
    String? changePercent,
    bool? isPositive,
    String? subtext,
    required Color accentColor,
    Widget? child,
  }) {
    final isMobile = MediaQuery.of(context).size.width < 720;
    
    return Container(
      padding: EdgeInsets.all(isMobile ? 12 : 16),
      constraints: BoxConstraints(minHeight: isMobile ? 120 : 130),
      decoration: BoxDecoration(
        color: AppColors.darkCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.darkBorder),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.015),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                width: isMobile ? 32 : 36,
                height: isMobile ? 32 : 36,
                decoration: BoxDecoration(
                  color: iconBg,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, size: isMobile ? 16 : 18, color: iconColor),
              ),
              if (changePercent != null)
                Flexible(
                  child: Container(
                    padding: EdgeInsets.symmetric(horizontal: isMobile ? 4 : 6, vertical: isMobile ? 2 : 3),
                    decoration: BoxDecoration(
                      color: AppColors.statusRed.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.arrow_downward_rounded,
                          size: isMobile ? 8 : 9,
                          color: AppColors.statusRed,
                        ),
                        const SizedBox(width: 2),
                        Flexible(
                          child: Text(
                            changePercent,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: isMobile ? 8 : 9,
                              fontWeight: FontWeight.bold,
                              color: AppColors.statusRed,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
            ],
          ),
          SizedBox(height: isMobile ? 8 : 12),
          Text(
            label,
            style: GoogleFonts.plusJakartaSans(
              fontSize: isMobile ? 9 : 10,
              fontWeight: FontWeight.bold,
              color: AppColors.textSecondary,
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: GoogleFonts.plusJakartaSans(
              fontSize: isMobile ? 16 : 18,
              fontWeight: FontWeight.w700,
              color: AppColors.textPrimary,
            ),
          ),
          if (child != null) child,
          if (subtext != null) ...[
            const SizedBox(height: 4),
            Text(
              subtext,
              style: GoogleFonts.plusJakartaSans(
                fontSize: isMobile ? 8 : 9,
                fontWeight: FontWeight.w600,
                color: AppColors.textMuted,
                letterSpacing: 0.4,
              ),
            ),
          ],
        ],
      ),
    );
  }

  // ── Cash Register Card ──────────────────────────────────────────────────────

  Widget _buildCashRegisterCard() {
    final financeProv = context.watch<FinanceProvider>();
    final reg = financeProv.cashRegister;
    final activeSession = reg['activeSession'];
    final bool isCashRegisterOpen = activeSession != null;
    
    // Calculate expected balance if active
    double expected = 0.0;
    int? sessionId;
    if (isCashRegisterOpen) {
      final openBal = JsonUtils.parseDouble(activeSession['opening_balance']);
      final sales = JsonUtils.parseDouble(reg['cashSales']);
      final deposits = JsonUtils.parseDouble(reg['cashDeposits']);
      final withdrawals = JsonUtils.parseDouble(reg['cashWithdrawals']);
      expected = openBal + sales + deposits - withdrawals;
      sessionId = JsonUtils.parseInt(activeSession['id']);
    }

    final statusColor = isCashRegisterOpen ? AppColors.statusGreen : AppColors.statusRed;
    
    final isMobile = MediaQuery.of(context).size.width < 720;

    return AnimatedContainer(
      duration: const Duration(milliseconds: 300),
      padding: EdgeInsets.all(isMobile ? 12 : 18),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: isCashRegisterOpen
              ? (AppColors.isDark
                  ? [const Color(0xFF052E16), const Color(0xFF041A0D)]
                  : [const Color(0xFFECFDF5), const Color(0xFFD1FAE5)])
              : (AppColors.isDark
                  ? [const Color(0xFF2D0707), const Color(0xFF1A0404)]
                  : [const Color(0xFFFDF2F2), const Color(0xFFFDE2E2)]),
        ),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: statusColor.withOpacity(0.3),
        ),
        boxShadow: [
          BoxShadow(
            color: statusColor.withOpacity(0.08),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: isMobile ? 40 : 52,
            height: isMobile ? 40 : 52,
            decoration: BoxDecoration(
              color: statusColor.withOpacity(0.15),
              borderRadius: BorderRadius.circular(isMobile ? 10 : 14),
            ),
            child: Icon(
              Icons.point_of_sale_rounded,
              size: isMobile ? 20 : 26,
              color: statusColor,
            ),
          ),
          SizedBox(width: isMobile ? 10 : 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Cash Register',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: isMobile ? 11.5 : 13,
                    color: AppColors.textMuted,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 2),
                Row(
                  children: [
                    Container(
                      width: isMobile ? 6 : 8,
                      height: isMobile ? 6 : 8,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: statusColor,
                        boxShadow: [
                          BoxShadow(
                            color: statusColor.withOpacity(0.5),
                            blurRadius: isMobile ? 4 : 6,
                            spreadRadius: 1,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(
                      isCashRegisterOpen ? 'Open' : 'Closed',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: isMobile ? 15 : 18,
                        fontWeight: FontWeight.w700,
                        color: statusColor,
                      ),
                    ),
                  ],
                ),
                Text(
                  isCashRegisterOpen
                      ? 'Opened: ${activeSession['opened_at'] != null ? activeSession['opened_at'].toString().split('T')[0] : ''}'
                      : 'Register currently closed',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: isMobile ? 9.5 : 11,
                    color: AppColors.textMuted,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: () {
              if (isCashRegisterOpen) {
                if (sessionId != null) {
                  _showCloseRegisterSheet(context, financeProv, sessionId, expected);
                }
              } else {
                _showOpenRegisterSheet(context, financeProv);
              }
            },
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 300),
              padding: EdgeInsets.symmetric(horizontal: isMobile ? 10 : 14, vertical: isMobile ? 6 : 8),
              decoration: BoxDecoration(
                color: (isCashRegisterOpen ? AppColors.statusRed : AppColors.statusGreen).withOpacity(0.15),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: (isCashRegisterOpen ? AppColors.statusRed : AppColors.statusGreen).withOpacity(0.4),
                ),
              ),
              child: Text(
                isCashRegisterOpen ? 'Close' : 'Open',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: isMobile ? 11 : 12,
                  fontWeight: FontWeight.w600,
                  color: isCashRegisterOpen ? AppColors.statusRed : AppColors.statusGreen,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _fmt(double v) => '${AppConstants.currencySymbol} ${v.toStringAsFixed(2)}';

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
            Text('Open Cash Register', style: GoogleFonts.plusJakartaSans(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 16),
            TextField(
              controller: balanceCtrl,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              style: TextStyle(color: AppColors.textPrimary),
              decoration: const InputDecoration(labelText: 'Opening Balance Amount (Rs.)'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: notesCtrl,
              style: TextStyle(color: AppColors.textPrimary),
              decoration: const InputDecoration(labelText: 'Opening Notes (optional)'),
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
                    showTopSnackBar(context, SnackBar(content: Text('Cash register opened successfully'), backgroundColor: AppColors.statusGreen));
                  } else if (ctx.mounted) {
                    showTopSnackBar(context, SnackBar(content: Text(provider.error ?? 'Failed to open register'), backgroundColor: AppColors.statusRed));
                  }
                },
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.statusGreen, foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
                child: Text('Confirm Open', style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.bold)),
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
            Text('Close Cash Register Session', style: GoogleFonts.plusJakartaSans(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 8),
            Text('Expected drawer balance: ${_fmt(expected)}', style: GoogleFonts.plusJakartaSans(color: AppColors.textSecondary, fontSize: 12)),
            const SizedBox(height: 16),
            TextField(
              controller: balanceCtrl,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              style: TextStyle(color: AppColors.textPrimary),
              decoration: const InputDecoration(labelText: 'Actual Drawer Cash Counted (Rs.)'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: notesCtrl,
              style: TextStyle(color: AppColors.textPrimary),
              decoration: const InputDecoration(labelText: 'Closing Notes (optional)'),
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
                        title: Text('Discrepancy Warning', style: GoogleFonts.plusJakartaSans(color: AppColors.textPrimary, fontWeight: FontWeight.bold)),
                        content: Text(
                          'Counted balance differs from expected by Rs. ${discrepancy.toStringAsFixed(2)}. A GL adjustment entry will be automatically posted. Continue?',
                          style: GoogleFonts.plusJakartaSans(color: AppColors.textSecondary),
                        ),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.pop(c, false),
                            child: Text(
                              'Back',
                              style: GoogleFonts.plusJakartaSans(
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
                              style: GoogleFonts.plusJakartaSans(
                                fontWeight: FontWeight.bold,
                              ),
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
                    showTopSnackBar(context, SnackBar(content: Text('Cash register closed and reconciled'), backgroundColor: AppColors.statusGreen));
                  } else if (ctx.mounted) {
                    showTopSnackBar(context, SnackBar(content: Text(provider.error ?? 'Failed to close register'), backgroundColor: AppColors.statusRed));
                  }
                },
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.statusRed, foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
                child: Text('Confirm Close & Reconcile', style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSalesBarChart() {
    final maxVal = _weeklySales.isEmpty ? 10.0 : _weeklySales
        .map((e) => JsonUtils.parseDouble(e['total']))
        .fold(0.0, (a, b) => a > b ? a : b);
    final finalMaxVal = maxVal == 0 ? 10.0 : maxVal;
    
    final totalSales = _weeklySales.isEmpty ? 0.0 : _weeklySales
        .map((e) => JsonUtils.parseDouble(e['total']))
        .fold(0.0, (a, b) => a + b);

    return Container(
      height: 220,
      padding: const EdgeInsets.fromLTRB(12, 16, 12, 8),
      decoration: BoxDecoration(
        color: AppColors.darkCard,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.darkBorder),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.3),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 4, bottom: 6),
            child: Row(
              children: [
                Text(
                  'Last 7 Days',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 11,
                    color: AppColors.textMuted,
                  ),
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: AppColors.accentAmber.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    '${Formatters.formatCurrencyCompact(totalSales)} total',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 10,
                      color: AppColors.accentAmber,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: _isLoading && (_weeklySales.isEmpty || totalSales == 0)
                ? Center(
                    child: CircularProgressIndicator(
                      color: AppColors.accentAmber,
                    ),
                  )
                : (_weeklySales.isEmpty || totalSales == 0)
                    ? Center(
                        child: Text(
                          'No records found',
                          style: GoogleFonts.plusJakartaSans(
                            color: AppColors.textMuted,
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      )
                    : BarChart(
                    BarChartData(
                maxY: finalMaxVal * 1.25,
                minY: 0,
                barTouchData: BarTouchData(
                  touchTooltipData: BarTouchTooltipData(
                    getTooltipColor: (_) => AppColors.darkCard,
                    tooltipRoundedRadius: 10,
                    tooltipPadding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 6),
                    getTooltipItem: (group, groupIndex, rod, rodIndex) {
                      final day =
                          _weeklySales[groupIndex]['day'] as String;
                      final val =
                          JsonUtils.parseDouble(_weeklySales[groupIndex]['total']);
                      return BarTooltipItem(
                        '$day\n',
                        GoogleFonts.plusJakartaSans(
                          color: AppColors.textMuted,
                          fontSize: 10,
                          fontWeight: FontWeight.w500,
                        ),
                        children: [
                          TextSpan(
                            text: 'Rs.${val.toStringAsFixed(0)}',
                            style: GoogleFonts.plusJakartaSans(
                              color: AppColors.accentAmber,
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      );
                    },
                  ),
                  touchCallback: (event, response) {
                    setState(() {
                      if (response != null &&
                          response.spot != null &&
                          event is! FlTapUpEvent) {
                        _touchedBarIndex =
                            response.spot!.touchedBarGroupIndex;
                      } else {
                        _touchedBarIndex = -1;
                      }
                    });
                  },
                ),
                titlesData: FlTitlesData(
                  show: true,
                  topTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  rightTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  leftTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      getTitlesWidget: (value, meta) {
                        final idx = value.toInt();
                        if (idx < 0 || idx >= _weeklySales.length) {
                          return const SizedBox.shrink();
                        }
                        final day = _weeklySales[idx]['day'] as String;
                        return Padding(
                          padding: const EdgeInsets.only(top: 6),
                          child: Text(
                            day,
                            style: GoogleFonts.plusJakartaSans(
                              fontSize: 10,
                              color: idx == _touchedBarIndex
                                  ? AppColors.accentAmber
                                  : AppColors.textMuted,
                              fontWeight: idx == _touchedBarIndex
                                  ? FontWeight.w700
                                  : FontWeight.w400,
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ),
                gridData: const FlGridData(show: false),
                borderData: FlBorderData(show: false),
                barGroups: List.generate(_weeklySales.length, (i) {
                  final val = JsonUtils.parseDouble(_weeklySales[i]['total']);
                  final isTouched = i == _touchedBarIndex;
                  return BarChartGroupData(
                    x: i,
                    barRods: [
                      BarChartRodData(
                        toY: val,
                        width: 22,
                        borderRadius: const BorderRadius.vertical(
                          top: Radius.circular(8),
                        ),
                        gradient: isTouched
                            ? const LinearGradient(
                                begin: Alignment.bottomCenter,
                                end: Alignment.topCenter,
                                colors: [
                                  Color(0xFFD97706),
                                  Color(0xFFFBBF24),
                                ],
                              )
                            : LinearGradient(
                                begin: Alignment.bottomCenter,
                                end: Alignment.topCenter,
                                colors: [
                                  AppColors.accentAmber.withOpacity(0.5),
                                  AppColors.accentAmber.withOpacity(0.85),
                                ],
                              ),
                        backDrawRodData: BackgroundBarChartRodData(
                          show: true,
                          toY: maxVal * 1.25,
                          color: AppColors.darkBorder.withOpacity(0.3),
                        ),
                      ),
                    ],
                  );
                }),
              ),
              swapAnimationDuration: const Duration(milliseconds: 300),
              swapAnimationCurve: Curves.easeInOut,
            ),
          ),
        ],
      ),
    );
  }

  // ── Payment Breakdown ───────────────────────────────────────────────────────

  Widget _buildPaymentBreakdown() {
    final total = _cashSales + _onlineSales;
    final cashPct = total > 0 ? _cashSales / total : 0.0;
    final onlinePct = total > 0 ? _onlineSales / total : 0.0;

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.darkCard,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.darkBorder),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Expanded(
                child: _paymentStat(
                  icon: Icons.money_rounded,
                  label: 'Cash',
                  amount: 'Rs.${_cashSales.toStringAsFixed(0)}',
                  percent: '${(cashPct * 100).toStringAsFixed(0)}%',
                  color: AppColors.statusGreen,
                ),
              ),
              Container(width: 1, height: 50, color: AppColors.darkBorder),
              Expanded(
                child: _paymentStat(
                  icon: Icons.credit_card_rounded,
                  label: 'Online',
                  amount: 'Rs.${_onlineSales.toStringAsFixed(0)}',
                  percent: '${(onlinePct * 100).toStringAsFixed(0)}%',
                  color: AppColors.statusBlue,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: Row(
              children: [
                if (total == 0)
                  Expanded(
                    child: Container(
                      height: 10,
                      color: AppColors.darkBorder,
                    ),
                  ),
                if (total > 0 && cashPct > 0)
                  Flexible(
                    flex: (cashPct * 100).toInt().clamp(1, 100),
                    child: Container(
                      height: 10,
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          colors: [Color(0xFF059669), Color(0xFF10B981)],
                        ),
                      ),
                    ),
                  ),
                if (total > 0 && cashPct > 0 && onlinePct > 0)
                  const SizedBox(width: 2),
                if (total > 0 && onlinePct > 0)
                  Flexible(
                    flex: (onlinePct * 100).toInt().clamp(1, 100),
                    child: Container(
                      height: 10,
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          colors: [Color(0xFF2563EB), Color(0xFF3B82F6)],
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              _legendDot(AppColors.statusGreen,
                  'Cash ${(cashPct * 100).toStringAsFixed(0)}%'),
              const SizedBox(width: 16),
              _legendDot(AppColors.statusBlue,
                  'Online ${(onlinePct * 100).toStringAsFixed(0)}%'),
            ],
          ),
        ],
      ),
    );
  }

  Widget _paymentStat({
    required IconData icon,
    required String label,
    required String amount,
    required String percent,
    required Color color,
  }) {
    return Column(
      children: [
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: color.withOpacity(0.12),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, size: 18, color: color),
        ),
        const SizedBox(height: 8),
        Text(
          amount,
          style: GoogleFonts.plusJakartaSans(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: AppColors.textPrimary,
          ),
        ),
        Text(
          label,
          style: GoogleFonts.plusJakartaSans(fontSize: 11, color: AppColors.textMuted),
        ),
        const SizedBox(height: 4),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
          decoration: BoxDecoration(
            color: color.withOpacity(0.12),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Text(
            percent,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 11,
              color: color,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    );
  }

  Widget _legendDot(Color color, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
        const SizedBox(width: 4),
        Text(label,
            style: GoogleFonts.plusJakartaSans(
                fontSize: 10, color: AppColors.textMuted)),
      ],
    );
  }

  void _showTopSellingSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        height: MediaQuery.of(context).size.height * 0.75,
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          children: [
            const SizedBox(height: 12),
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.textMuted.withOpacity(0.3),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 16),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                children: [
                  Icon(Icons.trending_up_rounded, color: AppColors.accentAmber, size: 24),
                  const SizedBox(width: 10),
                  Text(
                    'All Top Selling Items',
                    style: GoogleFonts.plusJakartaSans(
                      color: AppColors.textPrimary,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const Spacer(),
                  IconButton(
                    onPressed: () => Navigator.pop(ctx),
                    icon: Icon(Icons.close_rounded, color: AppColors.textMuted),
                  ),
                ],
              ),
            ),
            const Divider(),
            Expanded(
              child: ListView.separated(
                padding: const EdgeInsets.all(20),
                itemCount: _topSelling.length,
                separatorBuilder: (_, __) => Divider(color: AppColors.border),
                itemBuilder: (context, index) {
                  final item = _topSelling[index];
                  final rank = index + 1;
                  return Row(
                    children: [
                      Container(
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          color: AppColors.accentAmber.withOpacity(0.12),
                          shape: BoxShape.circle,
                        ),
                        child: Center(
                          child: Text(
                            '#$rank',
                            style: GoogleFonts.plusJakartaSans(
                              color: AppColors.accentAmber,
                              fontWeight: FontWeight.bold,
                              fontSize: 13,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Text(
                        item['emoji'] as String? ?? '☕',
                        style: const TextStyle(fontSize: 24),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              item['name'] as String? ?? 'Unknown Product',
                              style: GoogleFonts.plusJakartaSans(
                                color: AppColors.textPrimary,
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            Text(
                              '${item['category'] as String? ?? 'N/A'}',
                              style: GoogleFonts.plusJakartaSans(
                                color: AppColors.textMuted,
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            '${item['qty'] ?? item['quantity'] ?? 0} sold',
                            style: GoogleFonts.plusJakartaSans(
                              color: AppColors.textSecondary,
                              fontSize: 13,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          Text(
                            'Rs.${((item['revenue'] ?? 0.0) as num).toDouble().toStringAsFixed(0)}',
                            style: GoogleFonts.plusJakartaSans(
                              color: AppColors.accentAmber,
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ],
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showRecentActivitySheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        height: MediaQuery.of(context).size.height * 0.75,
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          border: Border.all(color: AppColors.border),
        ),
        child: Column(
          children: [
            const SizedBox(height: 12),
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.textMuted.withOpacity(0.3),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(height: 16),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                children: [
                  Icon(Icons.history_rounded, color: AppColors.accentAmber, size: 24),
                  const SizedBox(width: 10),
                  Text(
                    'Full Activity Logs',
                    style: GoogleFonts.plusJakartaSans(
                      color: AppColors.textPrimary,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const Spacer(),
                  IconButton(
                    onPressed: () => Navigator.pop(ctx),
                    icon: Icon(Icons.close_rounded, color: AppColors.textMuted),
                  ),
                ],
              ),
            ),
            const Divider(),
            Expanded(
              child: ListView.separated(
                padding: const EdgeInsets.all(20),
                itemCount: _recentActivity.length,
                separatorBuilder: (_, __) => Divider(color: AppColors.border),
                itemBuilder: (context, index) {
                  final activity = _recentActivity[index];
                  final action = activity['action'] as String? ?? 'created';
                  Color dotColor;
                  IconData dotIcon;

                  switch (action) {
                    case 'created':
                      dotColor = AppColors.statusGreen;
                      dotIcon = Icons.add_circle_outline_rounded;
                      break;
                    case 'completed':
                      dotColor = AppColors.statusBlue;
                      dotIcon = Icons.check_circle_outline_rounded;
                      break;
                    case 'updated':
                      dotColor = AppColors.statusAmber;
                      dotIcon = Icons.edit_outlined;
                      break;
                    case 'cancelled':
                      dotColor = AppColors.statusRed;
                      dotIcon = Icons.cancel_outlined;
                      break;
                    default:
                      dotColor = AppColors.textMuted;
                      dotIcon = Icons.info_outline_rounded;
                  }

                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: dotColor.withOpacity(0.12),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(dotIcon, color: dotColor, size: 18),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                activity['desc'] as String? ?? '',
                                style: GoogleFonts.plusJakartaSans(
                                  color: AppColors.textPrimary,
                                  fontSize: 13,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                activity['time'] as String? ?? '',
                                style: GoogleFonts.plusJakartaSans(
                                  color: AppColors.textMuted,
                                  fontSize: 11,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Top Selling ─────────────────────────────────────────────────────────────

  Widget _buildTopSellingList() {
    final displayList = _topSelling.take(5).toList();

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.darkCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.darkBorder),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.015),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Top Selling Products',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'MOST POPULAR MENU ITEMS BY SALES VOLUME',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 9,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textMuted,
                        letterSpacing: 0.5,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (_isLoading && _topSelling.isEmpty)
            Container(
              height: 100,
              alignment: Alignment.center,
              child: CircularProgressIndicator(
                color: AppColors.accentAmber,
              ),
            )
          else if (_topSelling.isEmpty)
            Container(
              height: 100,
              alignment: Alignment.center,
              child: Text(
                'No records found',
                style: GoogleFonts.plusJakartaSans(
                  color: AppColors.textMuted,
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                ),
              ),
            )
          else
            ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: displayList.length,
            separatorBuilder: (_, __) => Divider(color: AppColors.darkBorder, height: 24),
            itemBuilder: (context, index) {
              final item = displayList[index];
              final category = (item['category'] as String? ?? 'FOOD').toUpperCase();
              final sales = item['qty'] ?? item['quantity'] ?? 0;
              final rev = JsonUtils.parseDouble(item['revenue']);
              
              return Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: AppColors.accentAmber.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    clipBehavior: Clip.antiAlias,
                    child: item['image_url'] != null && (item['image_url'] as String).isNotEmpty
                        ? Image.network(
                            item['image_url'],
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) => Icon(
                              Icons.local_cafe_rounded,
                              color: AppColors.accentAmber,
                              size: 20,
                            ),
                          )
                        : Icon(
                            Icons.local_cafe_rounded,
                            color: AppColors.accentAmber,
                            size: 20,
                          ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          item['name'] as String? ?? 'Unknown Product',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 12.5,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          category,
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 9,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textMuted,
                            letterSpacing: 0.4,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        '$sales Sold',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Rs. ${rev.toStringAsFixed(2)}',
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: AppColors.statusRed,
                        ),
                      ),
                    ],
                  ),
                ],
              );
            },
          ),
        ],
      ),
    );
  }
          Widget _buildLowStockAlerts() {
    final displayList = _lowStock.take(3).toList();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.darkCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.darkBorder),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.015),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Low Stock Alerts',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'INVENTORY ITEMS BELOW WARNING THRESHOLD',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 9,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textMuted,
                        letterSpacing: 0.5,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              if (_lowStock.isNotEmpty) ...[
                const SizedBox(width: 12),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.statusRed.withOpacity(0.08),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    '${_lowStock.length} WARNINGS',
                    style: GoogleFonts.plusJakartaSans(
                      color: AppColors.statusRed,
                      fontSize: 9,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 12),
          if (_isLoading && _lowStock.isEmpty)
            Container(
              height: 100,
              alignment: Alignment.center,
              child: CircularProgressIndicator(
                color: AppColors.accentAmber,
              ),
            )
          else if (_lowStock.isEmpty)
            Container(
              height: 100,
              alignment: Alignment.center,
              child: Text(
                'No records found',
                style: GoogleFonts.plusJakartaSans(
                  color: AppColors.textMuted,
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                ),
              ),
            )
          else
            ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: displayList.length,
            separatorBuilder: (_, __) => Divider(color: AppColors.darkBorder, height: 24),
            itemBuilder: (context, index) {
              final item = displayList[index];
              final stock = JsonUtils.parseDouble(item['stock']);
              final threshold = JsonUtils.parseDouble(item['threshold']);
              final unit = item['unit'] ?? 'pcs';
              final isCritical = (threshold > 0 ? stock / threshold : 0.0) < 0.3;
              
              return Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          item['name'] as String? ?? 'Unknown Item',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 12.5,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          'THRESHOLD: ${threshold.toStringAsFixed(1).replaceAll('.0', '')} ${unit.toUpperCase()}',
                          style: GoogleFonts.plusJakartaSans(
                            fontSize: 9,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textMuted,
                            letterSpacing: 0.4,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: isCritical 
                          ? AppColors.statusRed.withOpacity(0.08) 
                          : AppColors.statusAmber.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      '${stock.toStringAsFixed(1).replaceAll('.0', '')} $unit',
                      style: GoogleFonts.plusJakartaSans(
                        color: isCritical ? AppColors.statusRed : AppColors.statusAmber,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              );
            },
          ),
        ],
      ),
    );
  }

  // ── Recent Activity ─────────────────────────────────────────────────────────

  Widget _buildRecentActivity() {
    final displayList = _recentActivity.take(5).toList();

    return Container(
      decoration: BoxDecoration(
        color: AppColors.darkCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.darkBorder),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.015),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Activity Feed',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'LIVE OPERATION LOG',
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 9,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textMuted,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ],
                ),
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: AppColors.statusGreen,
                    shape: BoxShape.circle,
                  ),
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          if (_isLoading && _recentActivity.isEmpty)
            Container(
              height: 100,
              alignment: Alignment.center,
              child: CircularProgressIndicator(
                color: AppColors.accentAmber,
              ),
            )
          else if (_recentActivity.isEmpty)
            Container(
              height: 100,
              alignment: Alignment.center,
              child: Text(
                'No records found',
                style: GoogleFonts.plusJakartaSans(
                  color: AppColors.textMuted,
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                ),
              ),
            )
          else ...[
            const SizedBox(height: 4),
            ...displayList.asMap().entries.map((entry) {
              final index = entry.key;
              final activity = entry.value;
              final isLast = index == displayList.length - 1;
              return _buildActivityItem(activity, isLast: isLast);
            }).toList(),
            const Divider(height: 1),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 14),
              alignment: Alignment.center,
              child: Text(
                'END OF RECENT ACTIVITY',
                style: GoogleFonts.plusJakartaSans(
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                  color: AppColors.textMuted,
                  letterSpacing: 0.8,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildActivityItem(Map<String, dynamic> activity, {bool isLast = false}) {
    final action = activity['action'] as String? ?? 'created';
    
    // Extract user name safely
    final authUser = context.watch<AuthProvider>().user?.name;
    String userName = authUser ?? 'System';
    if (activity['user'] != null) {
      if (activity['user'] is Map) {
        userName = activity['user']['name'] ?? (authUser ?? 'System');
      } else if (activity['user'] is String && (activity['user'] as String).isNotEmpty) {
        userName = activity['user'] as String;
      }
    }

    final iconType = activity['icon_type'] as String? ?? 'info';
    Color dotColor;
    IconData dotIcon;

    switch (iconType) {
      case 'order':
        dotColor = AppColors.statusGreen;
        dotIcon = Icons.shopping_bag_rounded;
        break;
      case 'menu':
        dotColor = AppColors.statusRed; // Match the soft pink/red from web screenshot for menu items
        dotIcon = Icons.coffee_rounded;
        break;
      case 'staff':
        dotColor = AppColors.statusAmber;
        dotIcon = Icons.people_rounded;
        break;
      case 'reservation':
        dotColor = AppColors.statusPurple;
        dotIcon = Icons.calendar_today_rounded;
        break;
      case 'customer':
        dotColor = AppColors.statusRed;
        dotIcon = Icons.person_rounded;
        break;
      default:
        dotColor = AppColors.textMuted;
        dotIcon = Icons.info_outline_rounded;
    }

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.only(left: 16),
            child: Column(
              children: [
                const SizedBox(height: 12),
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: dotColor.withOpacity(0.08),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(dotIcon, size: 16, color: dotColor),
                ),
                if (!isLast)
                  Expanded(
                    child: Container(
                      width: 1.5,
                      color: AppColors.darkBorder,
                    ),
                  ),
                if (isLast) const SizedBox(height: 16),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Padding(
              padding: EdgeInsets.fromLTRB(4, 12, 16, isLast ? 16 : 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        action.toUpperCase(),
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 9.5,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textSecondary,
                          letterSpacing: 0.5,
                        ),
                      ),
                      Text(
                        (activity['time'] as String? ?? '').toUpperCase(),
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 9.5,
                          fontWeight: FontWeight.w500,
                          color: AppColors.textMuted,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    activity['desc'] as String? ?? '',
                    style: GoogleFonts.plusJakartaSans(
                      fontSize: 12.5,
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.bold,
                      height: 1.25,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(Icons.person_outline_rounded, size: 10, color: AppColors.textMuted),
                      const SizedBox(width: 4),
                      Text(
                        userName,
                        style: GoogleFonts.plusJakartaSans(
                          fontSize: 10,
                          color: AppColors.textMuted,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
