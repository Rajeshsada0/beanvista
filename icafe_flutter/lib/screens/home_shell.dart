import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../core/theme/app_theme.dart';
import '../providers/auth_provider.dart';
import '../providers/app_provider.dart';
import '../providers/tables_provider.dart';
import '../core/services/api_service.dart';
import 'dashboard/dashboard_screen.dart';
import 'pos/pos_screen.dart';
import 'orders/orders_screen.dart';
import 'tables/tables_screen.dart';
import 'kds/kds_screen.dart';
import 'menu/menu_screen.dart';
import 'customers/customers_screen.dart';
import 'inventory/inventory_screen.dart';
import 'reservations/reservations_screen.dart';
import 'finance/finance_screen.dart';
import 'reports/reports_screen.dart';
import 'loyalty/loyalty_screen.dart';
import 'settings/settings_screen.dart';
import 'staff/staff_screen.dart';
import 'media/media_screen.dart';

class HomeShell extends StatefulWidget {
  static final GlobalKey<_HomeShellState> stateKey = GlobalKey<_HomeShellState>();

  HomeShell({Key? key}) : super(key: stateKey);

  static void toggleMenu() {
    stateKey.currentState?.toggleSideMenu();
  }

  static void selectTabByLabel(String label) {
    stateKey.currentState?.selectTabByLabel(label);
  }

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> with TickerProviderStateMixin {
  int _currentIndex = 0;
  bool _sideMenuOpen = false;

  void toggleSideMenu() {
    setState(() => _sideMenuOpen = !_sideMenuOpen);
  }

  void selectTabByLabel(String label) {
    final index = _navItems.indexWhere((item) => item.label.toLowerCase() == label.toLowerCase());
    if (index != -1) {
      setState(() {
        _currentIndex = index;
        _sideMenuOpen = false;
      });
      context.read<AppProvider>().setActiveTabLabel(_navItems[index].label);
      if (_navItems[index].label.toLowerCase() == 'tables') {
        context.read<TablesProvider>().fetchTables();
      }
    }
  }

  late List<_NavItem> _navItems;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AppProvider>().fetchSettings(context.read<ApiService>());
    });
  }

  List<_NavItem> _buildNavItems(String role) {
    final all = [
      _NavItem(
        icon: Icons.dashboard_rounded,
        label: 'Dashboard',
        screen: const DashboardScreen(),
        roles: ['admin'],
      ),
      _NavItem(
        icon: Icons.point_of_sale_rounded,
        label: 'POS',
        screen: const PosScreen(),
        roles: ['admin', 'staff', 'cashier', 'waiter'],
      ),
      _NavItem(
        icon: Icons.table_restaurant_rounded,
        label: 'Tables',
        screen: const TablesScreen(),
        roles: ['admin', 'staff', 'cashier', 'waiter'],
      ),
      _NavItem(
        icon: Icons.receipt_long_rounded,
        label: 'Orders',
        screen: const OrdersScreen(),
        roles: ['admin', 'staff', 'cashier', 'waiter'],
      ),
      _NavItem(
        icon: Icons.kitchen_rounded,
        label: 'Kitchen',
        screen: const KdsScreen(),
        roles: ['admin', 'staff', 'cashier', 'waiter', 'kitchen'],
      ),
    ];

    return all.where((item) => item.roles.contains(role)).toList();
  }

  List<_DrawerItem> _buildDrawerItems(String role) {
    final items = <_DrawerItem>[
      _DrawerItem(Icons.dashboard_rounded, 'Dashboard', 'admin', 0),
      _DrawerItem(Icons.point_of_sale_rounded, 'POS Terminal', 'staff', 1),
      _DrawerItem(Icons.table_restaurant_rounded, 'Table Book', 'staff', 2),
      _DrawerItem(Icons.receipt_long_rounded, 'Orders', 'staff', 3),
      _DrawerItem(Icons.kitchen_rounded, 'Kitchen KDS', 'all', 4),
      _DrawerItem(Icons.restaurant_menu_rounded, 'Menu Items', 'admin', -1,
          screen: const MenuScreen()),
      _DrawerItem(Icons.people_rounded, 'Customers', 'staff', -1,
          screen: const CustomersScreen()),
      _DrawerItem(Icons.inventory_2_rounded, 'Inventory', 'admin', -1,
          screen: const InventoryScreen()),
      _DrawerItem(Icons.calendar_month_rounded, 'Reservations', 'staff', -1,
          screen: const ReservationsScreen()),
      _DrawerItem(Icons.badge_rounded, 'Staff Management', 'admin', -1,
          screen: const StaffScreen()),
      _DrawerItem(Icons.account_balance_wallet_rounded, 'Finance', 'admin', -1,
          screen: const FinanceScreen()),
      _DrawerItem(Icons.bar_chart_rounded, 'Reports', 'admin', -1,
          screen: const ReportsScreen()),
      _DrawerItem(Icons.card_giftcard_rounded, 'Loyalty Rewards', 'admin', -1,
          screen: const LoyaltyScreen()),
      _DrawerItem(Icons.image_rounded, 'Media Library', 'staff', -1,
          screen: const MediaScreen()),
      _DrawerItem(Icons.settings_rounded, 'Settings', 'all', -1,
          screen: const SettingsScreen()),
    ];

    return items.where((item) {
      if (item.roleRequired == 'all') return true;
      if (item.roleRequired == 'admin') return role == 'admin';
      if (item.roleRequired == 'staff') return role == 'admin' || role == 'staff' || role == 'cashier' || role == 'waiter';
      return false;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final appProv = context.watch<AppProvider>();
    final user = auth.user;
    final role = user?.role ?? 'staff';

    _navItems = _buildNavItems(role);
    final drawerItems = _buildDrawerItems(role);

    // Clamp current index if needed
    if (_currentIndex >= _navItems.length) {
      _currentIndex = 0;
    }

    return Scaffold(
      backgroundColor: AppColors.darkBg,
      body: Stack(
        children: [
          // Main content — ValueKey forces full rebuild on theme/dark-mode change
          _navItems.isEmpty
              ? const SettingsScreen()
              : IndexedStack(
                  key: ValueKey('${appProv.isDarkMode}_${appProv.themeColor}'),
                  index: _currentIndex,
                  children: _navItems.map((e) => e.screen).toList(),
                ),

          // Side drawer overlay
          if (_sideMenuOpen) ...[
            GestureDetector(
              onTap: () => setState(() => _sideMenuOpen = false),
              child: Container(color: Colors.black54),
            ),
            _buildSideMenu(user, drawerItems, appProv),
          ],
        ],
      ),
      bottomNavigationBar: _navItems.length > 1
          ? _buildBottomNav()
          : null,
      floatingActionButton: null,
    );
  }

  Widget _buildBottomNav() {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.darkSurface,
        border: Border(
          top: BorderSide(color: AppColors.darkBorder, width: 1),
        ),
      ),
      child: SafeArea(
        child: SizedBox(
          height: 64,
          child: Row(
            children: List.generate(_navItems.length, (i) {
              final item = _navItems[i];
              final selected = _currentIndex == i;
              return Expanded(
                child: InkWell(
                  onTap: () {
                    setState(() {
                      _currentIndex = i;
                      _sideMenuOpen = false;
                    });
                    context.read<AppProvider>().setActiveTabLabel(item.label);
                    if (item.label.toLowerCase() == 'tables') {
                      context.read<TablesProvider>().fetchTables();
                    }
                  },
                  borderRadius: BorderRadius.circular(12),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 4),
                        decoration: BoxDecoration(
                          color: selected
                              ? AppColors.accentAmber.withOpacity(0.15)
                              : Colors.transparent,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(
                          item.icon,
                          color: selected
                              ? AppColors.accentAmber
                              : AppColors.textMuted,
                          size: 22,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        item.label,
                        style: GoogleFonts.poppins(
                          fontSize: 10,
                          color: selected
                              ? AppColors.accentAmber
                              : AppColors.textMuted,
                          fontWeight: selected
                              ? FontWeight.w600
                              : FontWeight.w400,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }),
          ),
        ),
      ),
    );
  }



  Widget _buildSideMenu(user, List<_DrawerItem> items, AppProvider appProv) {
    return Positioned(
      left: 0,
      top: 0,
      bottom: 0,
      child: SafeArea(
        child: Container(
          width: 280,
          decoration: BoxDecoration(
            color: AppColors.darkSurface,
            border: Border(
              right: BorderSide(color: AppColors.darkBorder),
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black54,
                blurRadius: 20,
                spreadRadius: 0,
              ),
            ],
          ),
          child: Column(
            children: [
              // User header
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: AppColors.isDark
                      ? const LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [Color(0xFF2D1200), Color(0xFF1A0A00)],
                        )
                      : const LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [Color(0xFFFFFFFF), Color(0xFFF1F5F9)],
                        ),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 48,
                      height: 48,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        gradient: AppColors.primaryGradient,
                      ),
                      child: Center(
                        child: Text(
                          user?.initials ?? 'U',
                          style: GoogleFonts.poppins(
                            fontSize: 18,
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            user?.name ?? 'User',
                            style: GoogleFonts.poppins(
                              fontSize: 15,
                              fontWeight: FontWeight.w600,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          Container(
                            margin: const EdgeInsets.only(top: 4),
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              color: AppColors.accentAmber.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              user?.role.toUpperCase() ?? 'STAFF',
                              style: GoogleFonts.poppins(
                                fontSize: 10,
                                fontWeight: FontWeight.w600,
                                color: AppColors.accentAmber,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              // Logo
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                child: Row(
                  children: [
                    Container(
                      width: 22,
                      height: 22,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.white,
                      ),
                      child: ClipOval(
                        child: Image.asset(
                          'assets/icons/beanvistapos.png',
                          fit: BoxFit.cover,
                          filterQuality: FilterQuality.high,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      appProv.appName,
                      style: GoogleFonts.poppins(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary,
                        letterSpacing: 1,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppColors.accentAmber.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        appProv.appVersion,
                        style: GoogleFonts.poppins(
                          fontSize: 9,
                          color: AppColors.accentAmber,
                        ),
                      ),
                    ),
                  ],
                ),
              ),

              Divider(color: AppColors.darkBorder, height: 1),

              // Navigation items
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  itemCount: items.length,
                  itemBuilder: (context, i) {
                    final item = items[i];
                    final isSelected = item.tabIndex >= 0 &&
                        _currentIndex == item.tabIndex;

                    return Container(
                      margin: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? AppColors.accentAmber.withOpacity(0.12)
                            : Colors.transparent,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: ListTile(
                        dense: true,
                        leading: Icon(
                          item.icon,
                          color: isSelected
                              ? AppColors.accentAmber
                              : AppColors.textMuted,
                          size: 20,
                        ),
                        title: Text(
                          item.label,
                          style: GoogleFonts.poppins(
                            fontSize: 13,
                            color: isSelected
                                ? AppColors.accentAmber
                                : AppColors.textSecondary,
                            fontWeight: isSelected
                                ? FontWeight.w600
                                : FontWeight.w400,
                          ),
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                        onTap: () {
                          final tabIndex = item.tabIndex;
                          final screen = item.screen;
                          WidgetsBinding.instance.addPostFrameCallback((_) {
                            if (mounted) {
                              setState(() {
                                _sideMenuOpen = false;
                                if (tabIndex >= 0) {
                                  _currentIndex = tabIndex;
                                } else if (screen != null) {
                                  Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                        builder: (_) => screen),
                                  );
                                }
                              });
                              if (tabIndex >= 0) {
                                context.read<AppProvider>().setActiveTabLabel(item.label);
                              }
                            }
                          });
                        },
                      ),
                    );
                  },
                ),
              ),

              // Logout button
              Divider(color: AppColors.darkBorder, height: 1),
              ListTile(
                leading: Icon(Icons.logout_rounded,
                    color: AppColors.statusRed, size: 20),
                title: Text(
                  'Logout',
                  style: GoogleFonts.poppins(
                    fontSize: 13,
                    color: AppColors.statusRed,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                onTap: () {
                  WidgetsBinding.instance.addPostFrameCallback((_) {
                    if (mounted) {
                      setState(() => _sideMenuOpen = false);
                      _showLogoutDialog();
                    }
                  });
                },
              ),
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    );
  }

  void _showLogoutDialog() async {
    final confirmed = await showDialog<bool>(
      context: context,
      barrierDismissible: true,
      builder: (ctx) {
        final isDark = AppColors.isDark;
        final bgCard = isDark ? AppColors.darkCard : Colors.white;
        final borderCol = isDark ? AppColors.darkBorder : const Color(0xFFE5E7EB);

        return Dialog(
          backgroundColor: Colors.transparent,
          insetPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
          child: Container(
            constraints: const BoxConstraints(maxWidth: 360),
            decoration: BoxDecoration(
              color: bgCard,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: borderCol, width: 1.2),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.15),
                  blurRadius: 25,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Top Centered Icon Badge
                Container(
                  width: 64,
                  height: 64,
                  decoration: const BoxDecoration(
                    color: Color(0xFFFEE2E2),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.logout_rounded,
                    color: Color(0xFFEF4444),
                    size: 28,
                  ),
                ),
                const SizedBox(height: 18),

                // Title
                Text(
                  'Logout',
                  style: GoogleFonts.poppins(
                    color: AppColors.textPrimary,
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 6),

                // Subtitle
                Text(
                  'Are you sure you want to logout?',
                  style: GoogleFonts.poppins(
                    color: AppColors.textMuted,
                    fontSize: 14,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 20),

                // Divider Line
                Divider(
                  color: borderCol,
                  height: 1,
                  thickness: 1,
                ),
                const SizedBox(height: 20),

                // Action Buttons Row
                Row(
                  children: [
                    // Cancel Button
                    Expanded(
                      child: SizedBox(
                        height: 48,
                        child: OutlinedButton.icon(
                          onPressed: () => Navigator.pop(ctx, false),
                          icon: Icon(
                            Icons.close_rounded,
                            size: 18,
                            color: AppColors.textSecondary,
                          ),
                          label: Text(
                            'Cancel',
                            style: GoogleFonts.poppins(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: AppColors.textSecondary,
                            ),
                          ),
                          style: OutlinedButton.styleFrom(
                            backgroundColor: bgCard,
                            side: BorderSide(color: borderCol, width: 1.2),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),

                    // Logout Button
                    Expanded(
                      child: SizedBox(
                        height: 48,
                        child: ElevatedButton.icon(
                          onPressed: () => Navigator.pop(ctx, true),
                          icon: const Icon(
                            Icons.logout_rounded,
                            size: 18,
                            color: Colors.white,
                          ),
                          label: Text(
                            'Logout',
                            style: GoogleFonts.poppins(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: Colors.white,
                            ),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFEF4444),
                            foregroundColor: Colors.white,
                            elevation: 2,
                            shadowColor: const Color(0xFFEF4444).withOpacity(0.35),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );

    if (confirmed == true && mounted) {
      context.read<AuthProvider>().logout();
    }
  }
}

class _NavItem {
  final IconData icon;
  final String label;
  final Widget screen;
  final List<String> roles;

  const _NavItem({
    required this.icon,
    required this.label,
    required this.screen,
    required this.roles,
  });
}

class _DrawerItem {
  final IconData icon;
  final String label;
  final String roleRequired;
  final int tabIndex;
  final Widget? screen;

  const _DrawerItem(
      this.icon, this.label, this.roleRequired, this.tabIndex,
      {this.screen});
}
