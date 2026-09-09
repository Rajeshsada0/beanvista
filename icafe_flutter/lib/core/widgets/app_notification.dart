import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import '../theme/app_theme.dart';

enum NotificationType { success, error, warning, info }

class NotificationThemeStyle {
  final Color primaryColor;
  final Color backgroundColor;
  final Color borderColor;
  final Color titleColor;
  final Color messageColor;
  final Color iconBadgeColor;
  final Color iconColor;
  final IconData icon;

  const NotificationThemeStyle({
    required this.primaryColor,
    required this.backgroundColor,
    required this.borderColor,
    required this.titleColor,
    required this.messageColor,
    required this.iconBadgeColor,
    required this.iconColor,
    required this.icon,
  });

  factory NotificationThemeStyle.resolve(NotificationType type) {
    final isDark = AppColors.isDark;
    final globalAccent = AppColors.accentAmber;

    switch (type) {
      case NotificationType.success:
        final accent = AppColors.activeTheme == 'green' ? globalAccent : AppColors.statusGreen;
        return NotificationThemeStyle(
          primaryColor: accent,
          backgroundColor: isDark ? const Color(0xFF052312) : const Color(0xFFECFDF5),
          borderColor: isDark ? const Color(0xFF0F5132) : const Color(0xFFA7F3D0),
          titleColor: isDark ? Colors.white : const Color(0xFF064E3B),
          messageColor: isDark ? const Color(0xFFD1FAE5) : const Color(0xFF065F46),
          iconBadgeColor: accent,
          iconColor: Colors.white,
          icon: Icons.check_rounded,
        );

      case NotificationType.error:
        final accent = AppColors.statusRed;
        return NotificationThemeStyle(
          primaryColor: accent,
          backgroundColor: isDark ? const Color(0xFF280A0A) : const Color(0xFFFEF2F2),
          borderColor: isDark ? const Color(0xFF5C1D1D) : const Color(0xFFFECACA),
          titleColor: isDark ? Colors.white : const Color(0xFF7F1D1D),
          messageColor: isDark ? const Color(0xFFFEE2E2) : const Color(0xFF991B1B),
          iconBadgeColor: accent,
          iconColor: Colors.white,
          icon: Icons.close_rounded,
        );

      case NotificationType.warning:
        final accent = AppColors.statusAmber;
        return NotificationThemeStyle(
          primaryColor: accent,
          backgroundColor: isDark ? const Color(0xFF281804) : const Color(0xFFFFFBEB),
          borderColor: isDark ? const Color(0xFF653B08) : const Color(0xFFFDE68A),
          titleColor: isDark ? Colors.white : const Color(0xFF78350F),
          messageColor: isDark ? const Color(0xFFFEF3C7) : const Color(0xFF92400E),
          iconBadgeColor: accent,
          iconColor: Colors.white,
          icon: Icons.warning_amber_rounded,
        );

      case NotificationType.info:
        final accent = globalAccent;
        return NotificationThemeStyle(
          primaryColor: accent,
          backgroundColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFF1F5F9),
          borderColor: isDark ? const Color(0xFF1E293B) : const Color(0xFFCBD5E1),
          titleColor: isDark ? Colors.white : const Color(0xFF0F172A),
          messageColor: isDark ? const Color(0xFFCBD5E1) : const Color(0xFF334155),
          iconBadgeColor: accent,
          iconColor: Colors.white,
          icon: Icons.info_outline_rounded,
        );
    }
  }
}

/// A modern, reusable notification alert widget for inline or overlay presentation.
class AppAlertBanner extends StatelessWidget {
  final NotificationType type;
  final String title;
  final String? message;
  final VoidCallback? onClose;
  final EdgeInsetsGeometry? margin;
  final EdgeInsetsGeometry? padding;
  final double? borderRadius;

  const AppAlertBanner({
    super.key,
    required this.type,
    required this.title,
    this.message,
    this.onClose,
    this.margin,
    this.padding,
    this.borderRadius,
  });

  @override
  Widget build(BuildContext context) {
    final style = NotificationThemeStyle.resolve(type);

    return Semantics(
      liveRegion: true,
      container: true,
      label: message != null ? '$title: $message' : title,
      child: Container(
        margin: margin ?? const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        padding: padding ?? const EdgeInsets.fromLTRB(12, 10, 10, 10),
        decoration: BoxDecoration(
          color: style.backgroundColor,
          borderRadius: BorderRadius.circular(borderRadius ?? 14),
          border: Border.all(color: style.borderColor, width: 1.2),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: AppColors.isDark ? 0.3 : 0.05),
              offset: const Offset(0, 4),
              blurRadius: 12,
            ),
          ],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            // Left circular icon badge
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: style.iconBadgeColor,
                shape: BoxShape.circle,
              ),
              alignment: Alignment.center,
              child: Icon(
                style.icon,
                color: style.iconColor,
                size: 18,
              ),
            ),
            const SizedBox(width: 12),

            // Content: Title + Supporting message
            Expanded(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: GoogleFonts.poppins(
                      fontSize: 13.5,
                      fontWeight: FontWeight.w600,
                      color: style.titleColor,
                      height: 1.25,
                    ),
                  ),
                  if (message != null && message!.trim().isNotEmpty) ...[
                    const SizedBox(height: 2),
                    Text(
                      message!,
                      style: GoogleFonts.poppins(
                        fontSize: 12,
                        fontWeight: FontWeight.normal,
                        color: style.messageColor,
                        height: 1.35,
                      ),
                    ),
                  ],
                ],
              ),
            ),

            // Close button (×)
            if (onClose != null) ...[
              const SizedBox(width: 8),
              Semantics(
                button: true,
                label: 'Close notification',
                child: Material(
                  color: Colors.transparent,
                  borderRadius: BorderRadius.circular(16),
                  child: InkWell(
                    onTap: onClose,
                    borderRadius: BorderRadius.circular(16),
                    child: Padding(
                      padding: const EdgeInsets.all(4),
                      child: Icon(
                        Icons.close_rounded,
                        size: 18,
                        color: style.titleColor.withValues(alpha: 0.7),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// Global controller to display floating animated notifications anywhere in the app.
class AppNotification {
  static OverlayEntry? _activeEntry;
  static Timer? _dismissTimer;

  /// Show a global floating notification.
  static void show(
    BuildContext context, {
    required NotificationType type,
    required String title,
    String? message,
    Duration duration = const Duration(seconds: 4),
  }) {
    dismiss();

    final overlay = Overlay.of(context);

    late OverlayEntry entry;
    entry = OverlayEntry(
      builder: (ctx) => _AppNotificationOverlay(
        type: type,
        title: title,
        message: message,
        onDismiss: dismiss,
      ),
    );

    _activeEntry = entry;
    overlay.insert(entry);

    if (duration > Duration.zero) {
      _dismissTimer = Timer(duration, () {
        dismiss();
      });
    }
  }

  /// Convenience method for Success notification
  static void success(
    BuildContext context, {
    required String title,
    String? message,
    Duration duration = const Duration(seconds: 4),
  }) {
    show(
      context,
      type: NotificationType.success,
      title: title,
      message: message,
      duration: duration,
    );
  }

  /// Convenience method for Error notification
  static void error(
    BuildContext context, {
    required String title,
    String? message,
    Duration duration = const Duration(seconds: 4),
  }) {
    show(
      context,
      type: NotificationType.error,
      title: title,
      message: message,
      duration: duration,
    );
  }

  /// Convenience method for Warning notification
  static void warning(
    BuildContext context, {
    required String title,
    String? message,
    Duration duration = const Duration(seconds: 4),
  }) {
    show(
      context,
      type: NotificationType.warning,
      title: title,
      message: message,
      duration: duration,
    );
  }

  /// Convenience method for Info notification
  static void info(
    BuildContext context, {
    required String title,
    String? message,
    Duration duration = const Duration(seconds: 4),
  }) {
    show(
      context,
      type: NotificationType.info,
      title: title,
      message: message,
      duration: duration,
    );
  }

  /// Dismiss the currently visible notification
  static void dismiss() {
    _dismissTimer?.cancel();
    _dismissTimer = null;
    if (_activeEntry != null) {
      try {
        _activeEntry!.remove();
      } catch (_) {}
      _activeEntry = null;
    }
  }
}

class _AppNotificationOverlay extends StatefulWidget {
  final NotificationType type;
  final String title;
  final String? message;
  final VoidCallback onDismiss;

  const _AppNotificationOverlay({
    required this.type,
    required this.title,
    this.message,
    required this.onDismiss,
  });

  @override
  State<_AppNotificationOverlay> createState() => _AppNotificationOverlayState();
}

class _AppNotificationOverlayState extends State<_AppNotificationOverlay>
    with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  late Animation<Offset> _slideAnimation;
  late Animation<double> _fadeAnimation;
  final FocusNode _focusNode = FocusNode();

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 320),
    );

    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, -0.6),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _animController,
      curve: Curves.easeOutCubic,
      reverseCurve: Curves.easeInCubic,
    ));

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(CurvedAnimation(
      parent: _animController,
      curve: Curves.easeOut,
      reverseCurve: Curves.easeIn,
    ));

    _animController.forward();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) _focusNode.requestFocus();
    });
  }

  Future<void> _handleDismiss() async {
    if (!mounted) return;
    await _animController.reverse();
    widget.onDismiss();
  }

  @override
  void dispose() {
    _animController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final topPadding = MediaQuery.of(context).padding.top;

    return Positioned(
      top: topPadding + 10,
      left: 0,
      right: 0,
      child: KeyboardListener(
        focusNode: _focusNode,
        onKeyEvent: (event) {
          if (event is KeyDownEvent &&
              event.logicalKey == LogicalKeyboardKey.escape) {
            _handleDismiss();
          }
        },
        child: Align(
          alignment: Alignment.topCenter,
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 560),
            child: SlideTransition(
              position: _slideAnimation,
              child: FadeTransition(
                opacity: _fadeAnimation,
                child: GestureDetector(
                  onVerticalDragUpdate: (details) {
                    if (details.primaryDelta != null && details.primaryDelta! < -4) {
                      _handleDismiss();
                    }
                  },
                  child: AppAlertBanner(
                    type: widget.type,
                    title: widget.title,
                    message: widget.message,
                    onClose: _handleDismiss,
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
