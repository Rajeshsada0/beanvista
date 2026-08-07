import 'package:icafe_app/core/constants/app_constants.dart';
import 'package:intl/intl.dart';

class Formatters {
  Formatters._();

  static String formatCurrency(double amount, {String? symbol}) {
    final curSymbol = symbol ?? AppConstants.currencySymbol;
    final formatted = NumberFormat('#,##0.00').format(amount);
    return '$curSymbol $formatted';
  }

  static String formatCurrencyCompact(double amount, {String? symbol}) {
    final curSymbol = symbol ?? AppConstants.currencySymbol;
    if (amount >= 1000000) {
      return '$curSymbol ${(amount / 1000000).toStringAsFixed(1)}M';
    } else if (amount >= 1000) {
      return '$curSymbol ${(amount / 1000).toStringAsFixed(1)}K';
    }
    return '$curSymbol ${amount.toStringAsFixed(0)}';
  }

  static String formatDate(DateTime date) {
    return DateFormat('MMM d, yyyy').format(date);
  }

  static String formatShortDate(DateTime date) {
    return DateFormat('MMM d').format(date);
  }

  static String formatDateIso(DateTime date) {
    return DateFormat('yyyy-MM-dd').format(date);
  }

  static String formatTime(DateTime date) {
    return DateFormat('h:mm a').format(date);
  }

  static String formatTime24(DateTime date) {
    return DateFormat('HH:mm').format(date);
  }

  static String formatDateTime(DateTime date) {
    return DateFormat('MMM d, yyyy h:mm a').format(date);
  }

  static String formatDuration(Duration d) {
    if (d.inMinutes < 60) {
      return '${d.inMinutes} min';
    } else {
      final hours = d.inHours;
      final mins = d.inMinutes % 60;
      if (mins == 0) return '$hours hr';
      return '$hours hr $mins min';
    }
  }

  static String formatDurationClock(Duration d) {
    final h = d.inHours.toString().padLeft(2, '0');
    final m = (d.inMinutes % 60).toString().padLeft(2, '0');
    final s = (d.inSeconds % 60).toString().padLeft(2, '0');
    return '$h:$m:$s';
  }

  static String timeAgo(DateTime date) {
    final now = DateTime.now();
    final diff = now.difference(date);

    if (diff.inSeconds < 60) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes} min ago';
    if (diff.inHours < 24) return '${diff.inHours} hr ago';
    if (diff.inDays == 1) return 'Yesterday';
    if (diff.inDays < 7) return '${diff.inDays} days ago';
    return formatDate(date);
  }

  static String capitalize(String s) {
    if (s.isEmpty) return s;
    return s[0].toUpperCase() + s.substring(1).toLowerCase();
  }

  static String titleCase(String s) {
    return s.split(' ').map(capitalize).join(' ');
  }

  static String truncate(String s, int maxLen) {
    if (s.length <= maxLen) return s;
    return '${s.substring(0, maxLen)}...';
  }

  static String formatNumber(double n) {
    return NumberFormat('#,##0.##').format(n);
  }

  static String formatPercent(double n, {int decimals = 1}) {
    return '${n.toStringAsFixed(decimals)}%';
  }

  static String formatQuantity(double qty, String unit) {
    final formatted = qty == qty.roundToDouble()
        ? qty.toInt().toString()
        : qty.toStringAsFixed(2);
    return '$formatted $unit';
  }
}
