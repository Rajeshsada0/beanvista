import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class AppColors {
  static bool isDark = false;
  static String activeTheme = 'brand';

  // Primary Brand Colors
  static Color get primaryBrown => isDark ? const Color(0xFF3D1A00) : const Color(0xFFEEF2F6);
  static Color get primaryDark => isDark ? const Color(0xFF1A0A00) : const Color(0xFFE2E8F0);
  
  static Color get accentAmber {
    if (isDark) {
      switch (activeTheme) {
        case 'green': return const Color(0xFF10B981);
        case 'blue': return const Color(0xFF3B82F6);
        case 'red': return const Color(0xFFEF4444);
        case 'brand':
        default:
          return const Color(0xFFF59E0B);
      }
    } else {
      switch (activeTheme) {
        case 'green': return const Color(0xFF059669);
        case 'blue': return const Color(0xFF2563EB);
        case 'red': return const Color(0xFFEF4444);
        case 'brand':
        default:
          return const Color(0xFFD97706);
      }
    }
  }

  static Color get accentAmberLight {
    if (isDark) {
      switch (activeTheme) {
        case 'green': return const Color(0xFF34D399);
        case 'blue': return const Color(0xFF60A5FA);
        case 'red': return const Color(0xFFF87171);
        case 'brand':
        default:
          return const Color(0xFFFBBF24);
      }
    } else {
      switch (activeTheme) {
        case 'green': return const Color(0xFF10B981);
        case 'blue': return const Color(0xFF3B82F6);
        case 'red': return const Color(0xFFF87171);
        case 'brand':
        default:
          return const Color(0xFFF59E0B);
      }
    }
  }

  static Color get accentGold {
    if (isDark) {
      switch (activeTheme) {
        case 'green': return const Color(0xFF047857);
        case 'blue': return const Color(0xFF1D4ED8);
        case 'red': return const Color(0xFFB91C1C);
        case 'brand':
        default:
          return const Color(0xFFD97706);
      }
    } else {
      switch (activeTheme) {
        case 'green': return const Color(0xFF065F46);
        case 'blue': return const Color(0xFF1E40AF);
        case 'red': return const Color(0xFF991B1B);
        case 'brand':
        default:
          return const Color(0xFFB45309);
      }
    }
  }

  // Background Colors
  static Color get darkBg => isDark ? const Color(0xFF0F0907) : const Color(0xFFF8FAFC);
  static Color get darkSurface => isDark ? const Color(0xFF1C1209) : const Color(0xFFF1F5F9);
  static Color get darkCard => isDark ? const Color(0xFF231507) : const Color(0xFFFFFFFF);
  static Color get darkCardHover => isDark ? const Color(0xFF2E1C0A) : const Color(0xFFF8FAFC);
  static Color get darkBorder => isDark ? const Color(0xFF3D2510) : const Color(0xFFE2E8F0);
  static Color get darkDivider => isDark ? const Color(0xFF2A1808) : const Color(0xFFF1F5F9);

  // Semantic aliases (used across screens for consistency)
  static Color get background => darkBg;
  static Color get surface => darkSurface;
  static Color get primary => accentAmber;
  static Color get border => darkBorder;

  // Text Colors
  static Color get textPrimary => isDark ? const Color(0xFFF5EDD8) : const Color(0xFF0F172A);
  static Color get textSecondary => isDark ? const Color(0xFFBFA080) : const Color(0xFF475569);
  static Color get textMuted => isDark ? const Color(0xFF7A5C3A) : const Color(0xFF94A3B8);
  static Color get textOnAmber => const Color(0xFFFFFFFF);

  // Status Colors
  static Color get statusGreen => const Color(0xFF10B981);
  static Color get statusGreenBg => isDark ? const Color(0xFF052E16) : const Color(0xFFD1FAE5);
  static Color get statusAmber => const Color(0xFFF59E0B);
  static Color get statusAmberBg => isDark ? const Color(0xFF2D1700) : const Color(0xFFFEF3C7);
  static Color get statusRed => const Color(0xFFEF4444);
  static Color get statusRedBg => isDark ? const Color(0xFF2D0707) : const Color(0xFFFEE2E2);
  static Color get statusBlue => const Color(0xFF3B82F6);
  static Color get statusBlueBg => isDark ? const Color(0xFF071730) : const Color(0xFFDBEAFE);
  static Color get statusPurple => const Color(0xFF8B5CF6);
  static Color get statusPurpleBg => isDark ? const Color(0xFF1E0A3C) : const Color(0xFFEDE9FE);

  // Table Status Colors
  static Color get tableAvailable => const Color(0xFF10B981);
  static Color get tableOccupied => const Color(0xFFEF4444);
  static Color get tableReserved => const Color(0xFFF59E0B);

  // KDS Status Colors
  static Color get kdsPending => const Color(0xFF6B7280);
  static Color get kdsPreparing => const Color(0xFFF59E0B);
  static Color get kdsReady => const Color(0xFF10B981);
  static Color get kdsDelivered => const Color(0xFF3B82F6);

  // Gradient
  static LinearGradient get primaryGradient => LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [accentAmber, accentGold],
      );

  static LinearGradient get darkGradient => isDark
      ? const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0xFF1C1209), Color(0xFF0F0907)],
        )
      : const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [Color(0xFFFFFFFF), Color(0xFFF8FAFC)],
        );

  static LinearGradient get cardGradient => isDark
      ? const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF231507), Color(0xFF1A0E05)],
        )
      : const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFFFFFFFF), Color(0xFFFFFFFF)],
        );
}

class AppTheme {
  static ThemeData get darkTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      scaffoldBackgroundColor: AppColors.darkBg,
      colorScheme: ColorScheme.dark(
        primary: AppColors.accentAmber,
        primaryContainer: AppColors.primaryBrown,
        secondary: AppColors.accentGold,
        surface: AppColors.darkSurface,
        error: AppColors.statusRed,
        onPrimary: AppColors.textOnAmber,
        onSecondary: AppColors.textPrimary,
        onSurface: AppColors.textPrimary,
        onError: Colors.white,
        outline: AppColors.darkBorder,
      ),
      textTheme: GoogleFonts.plusJakartaSansTextTheme(
        const TextTheme(
          displayLarge: TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
          displayMedium: TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
          displaySmall: TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
          headlineLarge: TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
          headlineMedium: TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
          headlineSmall: TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
          titleLarge: TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
          titleMedium: TextStyle(color: Colors.white, fontWeight: FontWeight.w500),
          titleSmall: TextStyle(color: Colors.white70, fontWeight: FontWeight.w500),
          bodyLarge: TextStyle(color: Colors.white),
          bodyMedium: TextStyle(color: Colors.white70),
          bodySmall: TextStyle(color: Colors.white54),
          labelLarge: TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
          labelMedium: TextStyle(color: Colors.white70, fontWeight: FontWeight.w500),
          labelSmall: TextStyle(color: Colors.white54),
        ),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: AppColors.darkSurface,
        foregroundColor: AppColors.textPrimary,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        shadowColor: AppColors.darkBorder,
        titleTextStyle: const TextStyle(
          color: Colors.white,
          fontSize: 18,
          fontWeight: FontWeight.w600,
        ),
        iconTheme: const IconThemeData(color: Colors.white),
        actionsIconTheme: const IconThemeData(color: Colors.white70),
      ),
      cardTheme: CardThemeData(
        color: AppColors.darkCard,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide(color: AppColors.darkBorder, width: 1),
        ),
        clipBehavior: Clip.antiAlias,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.accentAmber,
          foregroundColor: Colors.white,
          elevation: 0,
          shadowColor: Colors.transparent,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          textStyle: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w500, fontSize: 14),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.accentAmber,
          side: BorderSide(color: AppColors.accentAmber, width: 1.5),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          textStyle: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w500, fontSize: 14),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.accentAmber,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.darkSurface,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: AppColors.darkBorder),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: AppColors.darkBorder),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: AppColors.accentAmber, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: AppColors.statusRed),
        ),
        hintStyle: const TextStyle(color: Colors.white30, fontSize: 14),
        labelStyle: const TextStyle(color: Colors.white70),
        prefixIconColor: Colors.white30,
        suffixIconColor: Colors.white30,
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: AppColors.darkSurface,
        selectedItemColor: AppColors.accentAmber,
        unselectedItemColor: Colors.white30,
        type: BottomNavigationBarType.fixed,
        elevation: 0,
        showUnselectedLabels: true,
        selectedLabelStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
        unselectedLabelStyle: const TextStyle(fontSize: 11),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: AppColors.darkSurface,
        indicatorColor: AppColors.accentAmber.withOpacity(0.2),
        iconTheme: const WidgetStatePropertyAll(
          IconThemeData(color: Colors.white30),
        ),
        labelTextStyle: const WidgetStatePropertyAll(
          TextStyle(color: Colors.white30, fontSize: 11),
        ),
      ),
      dividerTheme: DividerThemeData(
        color: AppColors.darkBorder,
        thickness: 1,
        space: 1,
      ),
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) return AppColors.accentAmber;
          return Colors.white30;
        }),
        trackColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) return AppColors.accentAmber.withOpacity(0.3);
          return AppColors.darkCard;
        }),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: AppColors.darkCard,
        selectedColor: AppColors.accentAmber.withOpacity(0.2),
        labelStyle: const TextStyle(color: Colors.white70, fontSize: 12),
        side: BorderSide(color: AppColors.darkBorder),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: AppColors.darkCard,
        contentTextStyle: const TextStyle(color: Colors.white),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        behavior: SnackBarBehavior.floating,
        elevation: 4,
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: AppColors.darkCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        titleTextStyle: const TextStyle(
          color: Colors.white,
          fontSize: 18,
          fontWeight: FontWeight.w600,
        ),
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: Colors.transparent,
        modalBackgroundColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        clipBehavior: Clip.antiAlias,
      ),
      tabBarTheme: TabBarThemeData(
        labelColor: AppColors.accentAmber,
        unselectedLabelColor: Colors.white30,
        indicatorColor: AppColors.accentAmber,
        dividerColor: AppColors.darkBorder,
        labelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
        unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w400, fontSize: 13),
      ),
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: AppColors.accentAmber,
        foregroundColor: AppColors.textOnAmber,
        elevation: 4,
      ),
      listTileTheme: const ListTileThemeData(
        textColor: Colors.white,
        iconColor: Colors.white70,
        tileColor: Colors.transparent,
        shape: RoundedRectangleBorder(),
      ),
    );
  }

  static ThemeData get lightTheme {
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      scaffoldBackgroundColor: const Color(0xFFF8FAFC),
      colorScheme: ColorScheme.light(
        primary: AppColors.accentAmber,
        primaryContainer: AppColors.primaryBrown,
        secondary: AppColors.accentGold,
        surface: const Color(0xFFFFFFFF),
        error: const Color(0xFFEF4444),
        onPrimary: Colors.white,
        onSecondary: Color(0xFF0F172A),
        onSurface: Color(0xFF0F172A),
        onError: Colors.white,
        outline: Color(0xFFE2E8F0),
      ),
      textTheme: GoogleFonts.plusJakartaSansTextTheme(
        const TextTheme(
          displayLarge: TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.w700),
          displayMedium: TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.w700),
          displaySmall: TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.w600),
          headlineLarge: TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.w700),
          headlineMedium: TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.w600),
          headlineSmall: TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.w600),
          titleLarge: TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.w600),
          titleMedium: TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.w500),
          titleSmall: TextStyle(color: Color(0xFF475569), fontWeight: FontWeight.w500),
          bodyLarge: TextStyle(color: Color(0xFF0F172A)),
          bodyMedium: TextStyle(color: Color(0xFF475569)),
          bodySmall: TextStyle(color: Color(0xFF94A3B8)),
          labelLarge: TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.w600),
          labelMedium: TextStyle(color: Color(0xFF475569), fontWeight: FontWeight.w500),
          labelSmall: TextStyle(color: Color(0xFF94A3B8)),
        ),
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.white,
        foregroundColor: Color(0xFF0F172A),
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        shadowColor: Color(0xFFE2E8F0),
        titleTextStyle: TextStyle(
          color: Color(0xFF0F172A),
          fontSize: 18,
          fontWeight: FontWeight.w600,
        ),
        iconTheme: IconThemeData(color: Color(0xFF0F172A)),
        actionsIconTheme: IconThemeData(color: Color(0xFF475569)),
      ),
      cardTheme: CardThemeData(
        color: Colors.white,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: const BorderSide(color: Color(0xFFE2E8F0), width: 1),
        ),
        clipBehavior: Clip.antiAlias,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.accentAmber,
          foregroundColor: Colors.white,
          elevation: 0,
          shadowColor: Colors.transparent,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          textStyle: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w500, fontSize: 14),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.accentAmber,
          side: BorderSide(color: AppColors.accentAmber, width: 1.5),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
          textStyle: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.w500, fontSize: 14),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.accentAmber,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: AppColors.accentAmber, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFFEF4444)),
        ),
        hintStyle: const TextStyle(color: Color(0xFF94A3B8), fontSize: 14),
        labelStyle: const TextStyle(color: Color(0xFF475569)),
        prefixIconColor: Color(0xFF94A3B8),
        suffixIconColor: Color(0xFF94A3B8),
      ),
      bottomNavigationBarTheme: BottomNavigationBarThemeData(
        backgroundColor: Colors.white,
        selectedItemColor: AppColors.accentAmber,
        unselectedItemColor: const Color(0xFF94A3B8),
        type: BottomNavigationBarType.fixed,
        elevation: 0,
        showUnselectedLabels: true,
        selectedLabelStyle: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600),
        unselectedLabelStyle: const TextStyle(fontSize: 11),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: Colors.white,
        indicatorColor: AppColors.accentAmber.withOpacity(0.2),
        iconTheme: const WidgetStatePropertyAll(
          IconThemeData(color: Color(0xFF94A3B8)),
        ),
        labelTextStyle: const WidgetStatePropertyAll(
          TextStyle(color: Color(0xFF94A3B8), fontSize: 11),
        ),
      ),
      dividerTheme: const DividerThemeData(
        color: Color(0xFFE2E8F0),
        thickness: 1,
        space: 1,
      ),
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) return AppColors.accentAmber;
          return const Color(0xFF94A3B8);
        }),
        trackColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) return AppColors.accentAmber.withOpacity(0.3);
          return const Color(0xFFF1F5F9);
        }),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: const Color(0xFFF1F5F9),
        selectedColor: AppColors.accentAmber.withOpacity(0.2),
        labelStyle: const TextStyle(color: Color(0xFF475569), fontSize: 12),
        side: const BorderSide(color: Color(0xFFE2E8F0)),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: Colors.white,
        contentTextStyle: const TextStyle(color: Color(0xFF0F172A)),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        behavior: SnackBarBehavior.floating,
        elevation: 4,
      ),
      dialogTheme: DialogThemeData(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        titleTextStyle: const TextStyle(
          color: Color(0xFF0F172A),
          fontSize: 18,
          fontWeight: FontWeight.w600,
        ),
      ),
      bottomSheetTheme: const BottomSheetThemeData(
        backgroundColor: Colors.transparent,
        modalBackgroundColor: Colors.transparent,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        clipBehavior: Clip.antiAlias,
      ),
      tabBarTheme: TabBarThemeData(
        labelColor: AppColors.accentAmber,
        unselectedLabelColor: const Color(0xFF94A3B8),
        indicatorColor: AppColors.accentAmber,
        dividerColor: const Color(0xFFE2E8F0),
        labelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
        unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w400, fontSize: 13),
      ),
      floatingActionButtonTheme: FloatingActionButtonThemeData(
        backgroundColor: AppColors.accentAmber,
        foregroundColor: Colors.white,
        elevation: 4,
      ),
      listTileTheme: const ListTileThemeData(
        textColor: Color(0xFF0F172A),
        iconColor: Color(0xFF475569),
        tileColor: Colors.transparent,
        shape: RoundedRectangleBorder(),
      ),
    );
  }
}
