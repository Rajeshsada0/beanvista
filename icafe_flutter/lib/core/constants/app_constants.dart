// App Constants for iCafe Flutter

class AppConstants {
  // API Base URL - Production hosted server
  static const String baseUrl = 'https://cafe.kitetool.com';

  static const String apiBaseUrl = '$baseUrl/api';

  static String formatImageUrl(String? url) {
    if (url == null || url.isEmpty) return '';
    if (url.contains('127.0.0.1:8000')) {
      url = url.replaceAll('http://127.0.0.1:8000', baseUrl);
    }
    if (url.contains('localhost:8000')) {
      url = url.replaceAll('http://localhost:8000', baseUrl);
    }
    if (!url.startsWith('http')) {
      final clean = url.startsWith('/') ? url.substring(1) : url;
      if (clean.startsWith('storage/')) {
        return '$baseUrl/img/${clean.replaceFirst('storage/', '')}';
      }
      return '$baseUrl/img/$clean';
    }
    if (url.contains('/storage/')) {
      return url.replaceFirst('/storage/', '/img/');
    }
    return url;
  }

  // API Endpoints
  static const String loginEndpoint = '/auth/login';
  static const String logoutEndpoint = '/auth/logout';
  static const String userEndpoint = '/user';

  static const String dashboardEndpoint = '/dashboard';
  static const String ordersEndpoint = '/orders';
  static const String menusEndpoint = '/menus';
  static const String categoriesEndpoint = '/categories';
  static const String tablesEndpoint = '/tables';
  static const String customersEndpoint = '/customers';
  static const String inventoryEndpoint = '/inventory';
  static const String reservationsEndpoint = '/reservations';
  static const String loyaltyEndpoint = '/loyalty-rewards';
  static const String expensesEndpoint = '/expenses';
  static const String reportsEndpoint = '/reports';
  static const String kdsEndpoint = '/kds';
  static const String staffEndpoint = '/staff';
  static const String branchesEndpoint = '/branches';
  static const String settingsEndpoint = '/settings';

  // Storage Keys
  static const String tokenKey = 'auth_token';
  static const String userKey = 'user_data';
  static const String settingsKey = 'app_settings';
  static const String activeBranchKey = 'active_branch';
  static const String heldOrdersKey = 'pos_held_orders';
  static const String themeKey = 'is_dark_mode';

  // Currency
  static String currencySymbol = 'Rs.';

  // Order Types
  static const List<String> orderTypes = [
    'Dine-In',
    'Takeaway',
    'Delivery',
    'Drive-Thru',
    'Pre-Order',
  ];

  // Order Statuses
  static const String statusPending = 'pending';
  static const String statusPreparing = 'preparing';
  static const String statusServed = 'served';
  static const String statusCompleted = 'completed';
  static const String statusCancelled = 'cancelled';

  // KDS Statuses
  static const String kdsPending = 'pending';
  static const String kdsPreparing = 'preparing';
  static const String kdsReady = 'ready';
  static const String kdsDelivered = 'delivered';

  // User Roles
  static const String roleAdmin = 'admin';
  static const String roleStaff = 'staff';
  static const String roleKitchen = 'kitchen';
  static const String roleSuperAdmin = 'super_admin';

  // Pagination
  static const int pageSize = 20;

  // Timeouts
  static const int connectTimeout = 15000;
  static const int receiveTimeout = 15000;

  // App Info
  static const String appName = 'Bean Vista';
  static const String appVersion = '1.0.0';
}
