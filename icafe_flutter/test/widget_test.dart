import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:icafe_app/main.dart';
import 'package:icafe_app/core/services/api_service.dart';
import 'package:icafe_app/core/services/auth_service.dart';
import 'package:icafe_app/providers/auth_provider.dart';
import 'package:icafe_app/providers/app_provider.dart';

void main() {
  testWidgets('App smoke test', (WidgetTester tester) async {
    final apiService = ApiService();
    final authService = AuthService();
    final authProvider = AuthProvider(
      apiService: apiService,
      authService: authService,
    );
    final appProvider = AppProvider();

    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider.value(value: authProvider),
          ChangeNotifierProvider.value(value: appProvider),
          Provider.value(value: apiService),
          Provider.value(value: authService),
        ],
        child: const iCafeApp(),
      ),
    );

    // Verify login screen or dashboard
    expect(find.byType(MaterialApp), findsOneWidget);
  });
}
