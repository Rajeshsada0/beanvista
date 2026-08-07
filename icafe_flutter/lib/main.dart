import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'core/theme/app_theme.dart';
import 'core/services/api_service.dart';
import 'core/services/auth_service.dart';
import 'providers/auth_provider.dart';
import 'providers/app_provider.dart';
import 'providers/tables_provider.dart';
import 'providers/menu_provider.dart';
import 'providers/orders_provider.dart';
import 'providers/inventory_provider.dart';
import 'providers/reservations_provider.dart';
import 'providers/finance_provider.dart';
import 'providers/reports_provider.dart';
import 'providers/taxes_provider.dart';
import 'providers/subscriptions_provider.dart';
import 'providers/branches_provider.dart';
import 'providers/support_provider.dart';
import 'providers/staff_performance_provider.dart';
import 'providers/customers_provider.dart';
import 'providers/loyalty_provider.dart';
import 'providers/media_provider.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/email_verification_screen.dart';
import 'screens/home_shell.dart';

final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Lock orientation to portrait
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
    DeviceOrientation.landscapeLeft,
    DeviceOrientation.landscapeRight,
  ]);

  // Set system UI overlay style
  SystemChrome.setSystemUIOverlayStyle(
    SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: AppColors.darkSurface,
      systemNavigationBarIconBrightness: Brightness.light,
    ),
  );

  // Initialize services
  final apiService = ApiService();
  final authService = AuthService();
  final authProvider = AuthProvider(
    apiService: apiService,
    authService: authService,
  );

  apiService.onUnauthorized = () async {
    if (authProvider.isAuthenticated) {
      await authProvider.logout();
      final context = navigatorKey.currentContext;
      if (context != null && context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Your cafe account has been deleted or disabled. Logged out.'),
            backgroundColor: Colors.redAccent,
            duration: Duration(seconds: 4),
          ),
        );
      }
      navigatorKey.currentState?.pushAndRemoveUntil(
        MaterialPageRoute(builder: (context) => const LoginScreen()),
        (route) => false,
      );
    }
  };

  final appProvider = AppProvider();

  // Load settings
  await appProvider.loadSettings();
  await appProvider.fetchPublicSettings(apiService);

  // Attempt auto-login
  await authProvider.tryAutoLogin();

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: authProvider),
        ChangeNotifierProvider.value(value: appProvider),
        ChangeNotifierProvider(create: (_) => TablesProvider(apiService: apiService)),
        ChangeNotifierProvider(create: (_) => MenuProvider(apiService: apiService)),
        ChangeNotifierProxyProvider<TablesProvider, OrdersProvider>(
          create: (ctx) => OrdersProvider(apiService: apiService, tablesProvider: ctx.read<TablesProvider>()),
          update: (ctx, tablesProvider, ordersProvider) {
            ordersProvider?.setTablesProvider(tablesProvider);
            return ordersProvider ?? OrdersProvider(apiService: apiService, tablesProvider: tablesProvider);
          },
        ),
        ChangeNotifierProvider(create: (_) => InventoryProvider(apiService: apiService)),
        ChangeNotifierProvider(create: (_) => ReservationsProvider(apiService: apiService)),
        ChangeNotifierProvider(create: (_) => FinanceProvider(apiService: apiService)),
        ChangeNotifierProvider(create: (_) => ReportsProvider(apiService: apiService)),
        ChangeNotifierProvider(create: (_) => TaxesProvider(apiService: apiService)),
        ChangeNotifierProvider(create: (_) => SubscriptionsProvider(apiService: apiService)),
        ChangeNotifierProvider(create: (_) => BranchesProvider(apiService: apiService)),
        ChangeNotifierProvider(create: (_) => SupportProvider(apiService: apiService)),
        ChangeNotifierProvider(create: (_) => StaffPerformanceProvider(apiService: apiService)),
        ChangeNotifierProvider(create: (_) => CustomersProvider(apiService: apiService)),
        ChangeNotifierProvider(create: (_) => LoyaltyProvider(apiService: apiService)),
        ChangeNotifierProvider(create: (_) => MediaProvider(apiService: apiService)),
        Provider.value(value: apiService),
        Provider.value(value: authService),
      ],
      child: const iCafeApp(),
    ),
  );
}

class iCafeApp extends StatelessWidget {
  const iCafeApp({super.key});

  @override
  Widget build(BuildContext context) {
    final app = context.watch<AppProvider>();
    AppColors.isDark = app.isDarkMode;
    AppColors.activeTheme = app.themeColor;

    return MaterialApp(
      navigatorKey: navigatorKey,
      title: app.siteName,
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: app.isDarkMode ? ThemeMode.dark : ThemeMode.light,
      home: const _AppRouter(),
    );
  }
}

class _AppRouter extends StatelessWidget {
  const _AppRouter();

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, auth, _) {
        // Show splash while initializing
        if (!auth.initialized) {
          return const _SplashScreen();
        }

        // Show home or login based on auth state
        if (auth.isAuthenticated) {
          if (auth.user != null && !auth.user!.isVerified) {
            return const EmailVerificationScreen();
          }
          return HomeShell();
        }

        return const LoginScreen();
      },
    );
  }
}

class _SplashScreen extends StatelessWidget {
  const _SplashScreen();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.darkBg,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Logo
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: const LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [Color(0xFFF59E0B), Color(0xFFD97706)],
                ),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.accentAmber.withOpacity(0.4),
                    blurRadius: 40,
                    spreadRadius: 0,
                  ),
                ],
              ),
              child: ClipOval(
                child: Image.asset(
                  'assets/icons/beanvistapos.png',
                  fit: BoxFit.cover,
                  filterQuality: FilterQuality.high,
                ),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'Bean Vista',
              style: TextStyle(
                fontSize: 40,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
                letterSpacing: 2,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Cafe Management System',
              style: TextStyle(
                fontSize: 14,
                color: AppColors.textMuted,
              ),
            ),
            const SizedBox(height: 60),
            SizedBox(
              width: 32,
              height: 32,
              child: CircularProgressIndicator(
                strokeWidth: 3,
                valueColor:
                    AlwaysStoppedAnimation<Color>(AppColors.accentAmber),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
