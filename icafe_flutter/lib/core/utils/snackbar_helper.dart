import 'package:flutter/material.dart';
import '../widgets/app_notification.dart';
import '../theme/app_theme.dart';

String _extractTextFromWidget(Widget widget) {
  if (widget is Text) {
    return widget.data ?? widget.textSpan?.toPlainText() ?? '';
  }
  if (widget is RichText) {
    return widget.text.toPlainText();
  }
  if (widget is MultiChildRenderObjectWidget) {
    final buffer = <String>[];
    for (final child in (widget as dynamic).children) {
      if (child is Widget) {
        final t = _extractTextFromWidget(child);
        if (t.trim().isNotEmpty) buffer.add(t.trim());
      }
    }
    return buffer.join(' ');
  }
  if (widget is SingleChildRenderObjectWidget) {
    final child = (widget as dynamic).child;
    if (child is Widget) return _extractTextFromWidget(child);
  }
  try {
    final dynamic dyn = widget;
    if (dyn.child != null && dyn.child is Widget) {
      return _extractTextFromWidget(dyn.child as Widget);
    }
    if (dyn.children != null && dyn.children is List) {
      final buffer = <String>[];
      for (final c in dyn.children) {
        if (c is Widget) {
          final t = _extractTextFromWidget(c);
          if (t.trim().isNotEmpty) buffer.add(t.trim());
        }
      }
      return buffer.join(' ');
    }
  } catch (_) {}

  return '';
}

NotificationType? _extractTypeFromWidget(Widget widget) {
  if (widget is Icon) {
    final c = widget.color;
    final icon = widget.icon;
    if (c == AppColors.statusGreen ||
        c == const Color(0xFF10B981) ||
        c == const Color(0xFF059669) ||
        icon == Icons.check ||
        icon == Icons.check_circle ||
        icon == Icons.check_circle_outline ||
        icon == Icons.check_rounded ||
        icon == Icons.celebration) {
      return NotificationType.success;
    }
    if (c == AppColors.statusRed ||
        c == const Color(0xFFEF4444) ||
        icon == Icons.error ||
        icon == Icons.error_outline ||
        icon == Icons.cancel) {
      return NotificationType.error;
    }
    if (c == AppColors.statusAmber ||
        c == const Color(0xFFF59E0B) ||
        c == const Color(0xFFD97706) ||
        icon == Icons.warning ||
        icon == Icons.warning_amber_rounded) {
      return NotificationType.warning;
    }
  }
  try {
    final dynamic dyn = widget;
    if (dyn.children != null && dyn.children is List) {
      for (final c in dyn.children) {
        if (c is Widget) {
          final t = _extractTypeFromWidget(c);
          if (t != null) return t;
        }
      }
    }
    if (dyn.child != null && dyn.child is Widget) {
      return _extractTypeFromWidget(dyn.child as Widget);
    }
  } catch (_) {}
  return null;
}

void showTopSnackBar(BuildContext context, SnackBar snackBar) {
  try {
    String textContent = _extractTextFromWidget(snackBar.content).trim();
    if (textContent.isEmpty && snackBar.content is Text) {
      textContent = (snackBar.content as Text).data ?? '';
    }

    // Determine notification type from background color, then child icon
    NotificationType type = NotificationType.info;
    final bg = snackBar.backgroundColor;
    if (bg == AppColors.statusRed || bg == const Color(0xFFEF4444)) {
      type = NotificationType.error;
    } else if (bg == AppColors.statusGreen ||
        bg == const Color(0xFF10B981) ||
        bg == const Color(0xFF059669)) {
      type = NotificationType.success;
    } else if (bg == AppColors.statusAmber ||
        bg == const Color(0xFFF59E0B) ||
        bg == const Color(0xFFD97706)) {
      type = NotificationType.warning;
    } else {
      final childType = _extractTypeFromWidget(snackBar.content);
      if (childType != null) {
        type = childType;
      }
    }

    String title = textContent;
    String? message;

    if (textContent.contains('\n')) {
      final parts = textContent.split('\n');
      title = parts[0].trim();
      message = parts.sublist(1).join('\n').trim();
    } else {
      final lower = textContent.toLowerCase();
      if (lower.startsWith('error:') ||
          lower.startsWith('success:') ||
          lower.startsWith('warning:') ||
          lower.startsWith('note:') ||
          lower.startsWith('info:')) {
        final colonIdx = textContent.indexOf(':');
        title = textContent.substring(0, colonIdx).trim();
        message = textContent.substring(colonIdx + 1).trim();
      }
    }

    AppNotification.show(
      context,
      type: type,
      title: title,
      message: message,
      duration: snackBar.duration,
    );
  } catch (_) {
    // Fallback to standard SnackBar if overlay context is unavailable
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(snackBar);
  }
}

void showTopSnackBarWithMessenger(
    ScaffoldMessengerState messenger, BuildContext context, SnackBar snackBar) {
  showTopSnackBar(context, snackBar);
}
