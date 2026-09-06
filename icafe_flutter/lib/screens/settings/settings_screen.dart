import 'package:icafe_app/core/utils/snackbar_helper.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/app_provider.dart';
import '../../providers/taxes_provider.dart';
import '../../providers/subscriptions_provider.dart';
import '../../providers/support_provider.dart';
import '../../core/services/api_service.dart';
import 'taxes_screen.dart';
import 'my_plan_screen.dart';
import 'branches_screen.dart';
import 'staff_performance_screen.dart';
import '../support/support_screen.dart';
import '../auth/login_screen.dart';
import 'package:local_auth/local_auth.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';


// ─── Main Screen ─────────────────────────────────────────────────────────────

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _biometricEnabled = false;

  @override
  void initState() {
    super.initState();
    _loadBiometricStatus();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<TaxesProvider>().fetchTaxes();
      context.read<SubscriptionsProvider>().fetchSubscriptionDetails();
      context.read<SupportProvider>().fetchTickets();
    });
  }

  Future<void> _loadBiometricStatus() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      setState(() {
        _biometricEnabled = prefs.getBool('pref_biometric_enabled') ?? false;
      });
    } catch (_) {}
  }

  Future<void> _toggleBiometricSetup(bool enabled) async {
    final auth = LocalAuthentication();
    
    if (enabled) {
      try {
        final bool canAuthenticateWithBiometrics = await auth.canCheckBiometrics;
        final bool canAuthenticate = canAuthenticateWithBiometrics || await auth.isDeviceSupported();
        
        if (!canAuthenticate) {
          _showSnackBar('Biometric authentication is not supported on this device.', isError: true);
          return;
        }

        final bool didAuthenticate = await auth.authenticate(
          localizedReason: 'Please authenticate to set up biometric login',
          options: const AuthenticationOptions(
            biometricOnly: true,
            stickyAuth: true,
          ),
        );

        if (didAuthenticate) {
          final prefs = await SharedPreferences.getInstance();
          await prefs.setBool('pref_biometric_enabled', true);
          setState(() {
            _biometricEnabled = true;
          });
          _showSnackBar('Biometric login enabled successfully!');
        } else {
          _showSnackBar('Biometric authentication failed.', isError: true);
        }
      } catch (e) {
        _showSnackBar('Error setting up biometrics: $e', isError: true);
      }
    } else {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool('pref_biometric_enabled', false);
      
      const secureStorage = FlutterSecureStorage();
      await secureStorage.delete(key: 'saved_email');
      await secureStorage.delete(key: 'saved_password');

      setState(() {
        _biometricEnabled = false;
      });
      _showSnackBar('Biometric login disabled.');
    }
  }

  void _showSnackBar(String message, {bool isError = false}) {
    showTopSnackBar(context, 
      SnackBar(
        content: Text(message, style: GoogleFonts.poppins(color: Colors.white)),
        backgroundColor: isError ? AppColors.statusRed : AppColors.statusGreen,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  @override
  void dispose() {
    super.dispose();
  }


  Future<void> _showLogoutDialog() async {
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
      await context.read<AuthProvider>().logout();
      if (mounted) {
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (context) => const LoginScreen()),
          (route) => false,
        );
      }
    }
  }


  void _showChangePasswordSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const _ChangePasswordSheet(),
    );
  }

  Future<void> _saveSetting(String key, dynamic value) async {
    showTopSnackBar(context, const SnackBar(
      content: Text('Saving setting...'),
      duration: Duration(milliseconds: 500),
    ));

    try {
      final api = context.read<ApiService>();
      final res = await api.post('/settings', {
        'settings': {key: value}
      });

      if (res != null && res['success'] == true) {
        await context.read<AppProvider>().fetchSettings(api);
        if (mounted) {
          showTopSnackBar(context, SnackBar(
            content: Text('Setting updated successfully!', style: GoogleFonts.poppins(color: Colors.white)),
            backgroundColor: AppColors.statusGreen,
          ));
        }
      } else {
        final errMsg = res?['message']?.toString() ?? 'Unknown error';
        debugPrint('_saveSetting failed for key=$key: $errMsg | res=$res');
        if (mounted) {
          showTopSnackBar(context, SnackBar(
            content: Text('Failed to update setting: $errMsg', style: GoogleFonts.poppins(color: Colors.white)),
            backgroundColor: AppColors.statusRed,
          ));
        }
      }
    } catch (e) {
      debugPrint('Failed to save setting: $e');
      if (mounted) {
        showTopSnackBar(context, SnackBar(
          content: Text('Error updating setting: $e', style: GoogleFonts.poppins(color: Colors.white)),
          backgroundColor: AppColors.statusRed,
        ));
      }
    }
  }

  void _editSetting(String key, String label, String currentValue, {bool isNumber = false, bool isEmail = false, bool isPhone = false, String? hint}) {
    final ctrl = TextEditingController(text: currentValue);
    final formKey = GlobalKey<FormState>();

    // Select icon and color badge based on key/type
    IconData headerIcon = Icons.edit_note_rounded;
    Color iconColor = AppColors.accentAmber;
    Color iconBg = AppColors.accentAmber.withOpacity(0.15);

    if (isEmail) {
      headerIcon = Icons.alternate_email_rounded;
      iconColor = AppColors.statusBlue;
      iconBg = AppColors.statusBlue.withOpacity(0.15);
    } else if (isPhone) {
      headerIcon = Icons.phone_rounded;
      iconColor = AppColors.statusGreen;
      iconBg = AppColors.statusGreen.withOpacity(0.15);
    } else if (key == 'address') {
      headerIcon = Icons.location_on_rounded;
      iconColor = AppColors.statusPurple;
      iconBg = AppColors.statusPurple.withOpacity(0.15);
    } else if (key == 'site_name') {
      headerIcon = Icons.storefront_rounded;
      iconColor = AppColors.accentGold;
      iconBg = AppColors.accentGold.withOpacity(0.15);
    } else if (isNumber) {
      headerIcon = Icons.tag_rounded;
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        final isDark = AppColors.isDark;
        final bgCard = isDark ? AppColors.darkCard : Colors.white;
        final borderCol = isDark ? AppColors.darkBorder : const Color(0xFFE5E7EB);
        final innerBg = isDark ? AppColors.darkSurface : const Color(0xFFFAFAFB);

        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(ctx).viewInsets.bottom,
          ),
          child: Container(
            decoration: BoxDecoration(
              color: bgCard,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.15),
                  blurRadius: 25,
                  offset: const Offset(0, -5),
                ),
              ],
            ),
            padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
            child: SafeArea(
              top: false,
              child: Form(
                key: formKey,
                child: SingleChildScrollView(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Top Drag Handle Bar
                      Center(
                        child: Container(
                          width: 36,
                          height: 4,
                          margin: const EdgeInsets.only(bottom: 20),
                          decoration: BoxDecoration(
                            color: isDark ? Colors.white24 : const Color(0xFFD1D5DB),
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                      ),

                      // Header Row (Icon Badge + Title/Subtitle + Close Button)
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Container(
                            width: 44,
                            height: 44,
                            decoration: BoxDecoration(
                              color: iconBg,
                              borderRadius: BorderRadius.circular(14),
                            ),
                            child: Icon(
                              headerIcon,
                              color: iconColor,
                              size: 22,
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Edit $label',
                                  style: GoogleFonts.poppins(
                                    color: AppColors.textPrimary,
                                    fontSize: 18,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  'Update $label details for your store',
                                  style: GoogleFonts.poppins(
                                    color: AppColors.textMuted,
                                    fontSize: 12,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          InkWell(
                            onTap: () => Navigator.pop(ctx),
                            borderRadius: BorderRadius.circular(20),
                            child: Container(
                              width: 36,
                              height: 36,
                              decoration: BoxDecoration(
                                color: isDark ? Colors.white10 : const Color(0xFFF3F4F6),
                                shape: BoxShape.circle,
                              ),
                              child: Icon(
                                Icons.close_rounded,
                                color: AppColors.textSecondary,
                                size: 20,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 22),

                      // Field Input Card Container
                      Container(
                        decoration: BoxDecoration(
                          color: innerBg,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: borderCol, width: 1.2),
                        ),
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        child: Row(
                          children: [
                            Container(
                              width: 38,
                              height: 38,
                              decoration: BoxDecoration(
                                color: iconBg,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Icon(
                                headerIcon,
                                color: iconColor,
                                size: 18,
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    label,
                                    style: GoogleFonts.poppins(
                                      color: AppColors.textPrimary,
                                      fontSize: 13,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  TextFormField(
                                    controller: ctrl,
                                    keyboardType: isNumber
                                        ? TextInputType.number
                                        : (isEmail
                                            ? TextInputType.emailAddress
                                            : (isPhone ? TextInputType.phone : TextInputType.text)),
                                    style: GoogleFonts.poppins(
                                      color: AppColors.textPrimary,
                                      fontSize: 14,
                                    ),
                                    decoration: InputDecoration(
                                      isDense: true,
                                      contentPadding: const EdgeInsets.only(top: 4, bottom: 2),
                                      border: InputBorder.none,
                                      enabledBorder: InputBorder.none,
                                      focusedBorder: InputBorder.none,
                                      errorBorder: InputBorder.none,
                                      hintText: hint ?? 'Enter new $label',
                                      hintStyle: GoogleFonts.poppins(
                                        color: AppColors.textMuted,
                                        fontSize: 13,
                                      ),
                                    ),
                                    validator: (v) {
                                      final allowEmpty = isEmail || isPhone || key == 'address' || key == 'site_name';
                                      if (!allowEmpty && (v == null || v.trim().isEmpty)) {
                                        return 'Value cannot be empty';
                                      }
                                      if (v != null && v.trim().isNotEmpty && isNumber && int.tryParse(v.trim()) == null) {
                                        return 'Must be a valid integer';
                                      }
                                      return null;
                                    },
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Action Buttons Row
                      Row(
                        children: [
                          Expanded(
                            child: SizedBox(
                              height: 52,
                              child: OutlinedButton(
                                onPressed: () => Navigator.pop(ctx),
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: AppColors.textPrimary,
                                  backgroundColor: bgCard,
                                  side: BorderSide(color: borderCol, width: 1.2),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                ),
                                child: Text(
                                  'Cancel',
                                  style: GoogleFonts.poppins(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: SizedBox(
                              height: 52,
                              child: ElevatedButton(
                                onPressed: () async {
                                  if (!formKey.currentState!.validate()) return;
                                  Navigator.pop(ctx);
                                  await _saveSetting(key, ctrl.text.trim());
                                },
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: AppColors.accentAmber,
                                  foregroundColor: AppColors.textOnAmber,
                                  elevation: 2,
                                  shadowColor: AppColors.accentAmber.withOpacity(0.4),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                ),
                                child: Text(
                                  'Save Changes',
                                  style: GoogleFonts.poppins(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w700,
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
              ),
            ),
          ),
        );
      },
    );
  }

  void _editThemeSetting(String currentTheme) {
    showDialog(
      context: context,
      builder: (ctx) => SimpleDialog(
        backgroundColor: AppColors.darkSurface,
        title: Text('Select Theme', style: GoogleFonts.poppins(color: AppColors.textPrimary, fontWeight: FontWeight.bold)),
        children: [
          _themeOption(ctx, 'brand', 'Classic Gold', const Color(0xFFF59E0B)),
          _themeOption(ctx, 'red', 'Zesty Red', const Color(0xFFEF4444)),
          _themeOption(ctx, 'green', 'Fresh Green', const Color(0xFF10B981)),
          _themeOption(ctx, 'blue', 'Ocean Blue', const Color(0xFF3B82F6)),
        ],
      ),
    );
  }

  Widget _themeOption(BuildContext ctx, String themeId, String label, Color color) {
    return SimpleDialogOption(
      onPressed: () async {
        Navigator.pop(ctx);
        await _saveSetting('theme', themeId);
      },
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 8),
        child: Row(
          children: [
            Container(
              width: 24,
              height: 24,
              decoration: BoxDecoration(color: color, shape: BoxShape.circle),
            ),
            const SizedBox(width: 14),
            Text(label, style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 14, fontWeight: FontWeight.w500)),
          ],
        ),
      ),
    );
  }

  void _toggleGuestQr(bool currentValue) async {
    await _saveSetting('enable_guest_qr', !currentValue);
  }

  void _toggleCompletedOrderEdit(bool currentValue) async {
    await _saveSetting('enable_completed_order_edit', !currentValue);
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final app = context.watch<AppProvider>();
    final user = auth.user;
    final isAdmin = user?.role == 'admin';

    return Scaffold(
      backgroundColor: AppColors.darkBg,
      appBar: AppBar(
        backgroundColor: AppColors.darkSurface,
        surfaceTintColor: Colors.transparent,
        title: Text(
          'Settings',
          style: GoogleFonts.poppins(
            color: AppColors.textPrimary,
            fontSize: 20,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // ── Profile Card ────────────────────────────────────────────────
          if (user != null) _ProfileCard(user: user),
          const SizedBox(height: 20),

          // ── Business Settings ───────────────────────────────────────────
          _SectionHeader(title: 'Business Settings', icon: Icons.business_rounded),
          const SizedBox(height: 10),
          _SettingsCard(children: [
            _TappableTile(
              icon: Icons.store_rounded,
              label: 'Site Name',
              value: app.siteName,
              iconColor: AppColors.accentAmber,
              onTap: isAdmin ? () => _editSetting(
                'site_name',
                'Site Name',
                // Edit the raw stored value (may be empty — fallback is tenant name)
                app.siteName == app.tenantName ? '' : app.siteName,
                hint: app.tenantName,
              ) : null,
            ),
            Divider(height: 1, indent: 56, color: AppColors.darkBorder),
            _TappableTile(
              icon: Icons.currency_rupee_rounded,
              label: 'Currency Symbol',
              value: app.currency,
              iconColor: AppColors.statusGreen,
              onTap: isAdmin ? () => _editSetting('currency_symbol', 'Currency Symbol', app.currency) : null,
            ),
            Divider(height: 1, indent: 56, color: AppColors.darkBorder),
            _TappableTile(
              icon: Icons.map_rounded,
              label: 'Address',
              value: app.address.isNotEmpty ? app.address : 'Not Set',
              iconColor: AppColors.statusPurple,
              onTap: isAdmin ? () => _editSetting('address', 'Address', app.address) : null,
            ),
          ]),
          const SizedBox(height: 16),

          // ── Branding & Visuals ─────────────────────────────────────────
          _SectionHeader(title: 'Branding & Visuals', icon: Icons.palette_rounded),
          const SizedBox(height: 10),
          _SettingsCard(children: [
            _TappableTile(
              icon: Icons.color_lens_rounded,
              label: 'Atmosphere Theme',
              value: app.themeColor.toUpperCase(),
              iconColor: AppColors.accentAmber,
              onTap: isAdmin ? () => _editThemeSetting(app.themeColor) : null,
            ),
          ]),
          const SizedBox(height: 16),

          // ── Kitchen & Features ─────────────────────────────────────────
          _SectionHeader(title: 'Kitchen & Features', icon: Icons.tune_rounded),
          const SizedBox(height: 10),
          _SettingsCard(children: [
            _TappableTile(
              icon: Icons.qr_code_scanner_rounded,
              label: 'Guest QR Ordering',
              value: app.enableGuestQr ? 'ENABLED' : 'DISABLED',
              iconColor: app.enableGuestQr ? AppColors.statusGreen : AppColors.statusRed,
              onTap: isAdmin ? () => _toggleGuestQr(app.enableGuestQr) : null,
            ),
            Divider(height: 1, indent: 56, color: AppColors.darkBorder),
            _TappableTile(
              icon: Icons.edit_note_rounded,
              label: 'Edit Completed Orders',
              value: app.enableCompletedOrderEdit ? 'ENABLED' : 'DISABLED',
              iconColor: app.enableCompletedOrderEdit ? AppColors.statusGreen : AppColors.statusRed,
              onTap: isAdmin ? () => _toggleCompletedOrderEdit(app.enableCompletedOrderEdit) : null,
            ),
            Divider(height: 1, indent: 56, color: AppColors.darkBorder),
            _TappableTile(
              icon: Icons.warning_amber_rounded,
              label: 'KDS Warning Limit',
              value: '${app.kdsWarningMins} minutes',
              iconColor: AppColors.statusAmber,
              onTap: isAdmin ? () => _editSetting('kds_warning_mins', 'KDS Warning Limit', app.kdsWarningMins.toString(), isNumber: true) : null,
            ),
            Divider(height: 1, indent: 56, color: AppColors.darkBorder),
            _TappableTile(
              icon: Icons.dangerous_rounded,
              label: 'KDS Critical Limit',
              value: '${app.kdsCriticalMins} minutes',
              iconColor: AppColors.statusRed,
              onTap: isAdmin ? () => _editSetting('kds_critical_mins', 'KDS Critical Limit', app.kdsCriticalMins.toString(), isNumber: true) : null,
            ),
          ]),
          const SizedBox(height: 16),

          // ── Contact Details ────────────────────────────────────────────
          _SectionHeader(title: 'Contact Details', icon: Icons.contact_mail_rounded),
          const SizedBox(height: 10),
          _SettingsCard(children: [
            _TappableTile(
              icon: Icons.email_rounded,
              label: 'Support Email',
              value: app.contactEmail.isNotEmpty ? app.contactEmail : 'Not Set',
              iconColor: AppColors.statusBlue,
              onTap: isAdmin ? () => _editSetting('contact_email', 'Support Email', app.contactEmail, isEmail: true) : null,
            ),
            Divider(height: 1, indent: 56, color: AppColors.darkBorder),
            _TappableTile(
              icon: Icons.phone_rounded,
              label: 'Support Phone',
              value: app.contactPhone.isNotEmpty ? app.contactPhone : 'Not Set',
              iconColor: AppColors.statusGreen,
              onTap: isAdmin ? () => _editSetting('contact_phone', 'Support Phone', app.contactPhone, isPhone: true) : null,
            ),
          ]),
          const SizedBox(height: 16),

          // ── Branch ──────────────────────────────────────────────────────
          _SectionHeader(title: 'Branch', icon: Icons.location_on_rounded),
          const SizedBox(height: 10),
          _SettingsCard(children: [
            _InfoTile(
              icon: Icons.store_mall_directory_rounded,
              label: 'Active Branch',
              value: app.branchDisplayName,
              iconColor: AppColors.statusPurple,
            ),
            Divider(height: 1, indent: 56, color: AppColors.darkBorder),
            _TappableTile(
              icon: Icons.store_rounded,
              label: 'Manage & Switch',
              iconColor: AppColors.statusAmber,
              onTap: isAdmin ? () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const BranchesScreen()),
                );
              } : null,
            ),
          ]),
          const SizedBox(height: 16),

          // ── App Preferences ─────────────────────────────────────────────
          _SectionHeader(title: 'App Preferences', icon: Icons.tune_rounded),
          const SizedBox(height: 10),
          _SettingsCard(children: [
            _SwitchTile(
              icon: Icons.dark_mode_rounded,
              label: 'Dark Mode',
              subtitle: app.isDarkMode ? 'Enable light CaféOS theme' : 'Enable dark CaféOS theme',
              iconColor: AppColors.statusPurple,
              value: app.isDarkMode,
              onChanged: (val) => app.setDarkMode(val),
            ),
            Divider(height: 1, indent: 56, color: AppColors.darkBorder),
            _TappableTile(
              icon: Icons.language_rounded,
              label: 'Language',
              value: 'English (EN)',
              iconColor: AppColors.statusBlue,
              onTap: () {
                showTopSnackBar(context, SnackBar(
                  content: Text('Language selection coming soon',
                      style: GoogleFonts.poppins(color: AppColors.textPrimary)),
                ));
              },
            ),
            Divider(height: 1, indent: 56, color: AppColors.darkBorder),
            Consumer<SupportProvider>(
              builder: (context, supportProv, _) {
                final unreadCount = supportProv.totalUnreadTickets;
                final valueText = unreadCount > 0 ? '$unreadCount New' : 'Tickets & Chat';
                return _TappableTile(
                  icon: Icons.contact_support_rounded,
                  label: 'Help & Support',
                  value: valueText,
                  iconColor: AppColors.accentGold,
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => const SupportScreen()),
                    );
                  },
                );
              },
            ),
          ]),
          const SizedBox(height: 16),

          // ── Security & Biometrics ──────────────────────────────────────
          _SectionHeader(title: 'Security & Biometrics', icon: Icons.security_rounded),
          const SizedBox(height: 10),
          _SettingsCard(children: [
            _SwitchTile(
              icon: Icons.fingerprint_rounded,
              label: 'Biometric Login',
              subtitle: 'Use fingerprint to log in quickly',
              iconColor: AppColors.statusRed,
              value: _biometricEnabled,
              onChanged: (val) => _toggleBiometricSetup(val),
            ),
          ]),
          const SizedBox(height: 16),

          // ── System configurations (Plan, Taxes, Performance) ───────────
          _SectionHeader(title: 'Administration', icon: Icons.admin_panel_settings_rounded),
          const SizedBox(height: 10),
          _SettingsCard(children: [
            Consumer<SubscriptionsProvider>(
              builder: (context, subProv, _) {
                String subText = 'Loading...';
                if (subProv.pendingRequest != null) {
                  subText = 'Verification Pending';
                } else if (subProv.currentSubscription != null) {
                  subText = subProv.currentSubscription!.isExpired
                      ? 'Expired (${subProv.currentSubscription!.planName})'
                      : 'Active ${subProv.currentSubscription!.planName}';
                } else if (subProv.trialInfo != null) {
                  subText = subProv.trialInfo!.isExpired
                      ? 'Trial Expired'
                      : 'Trial - ${subProv.trialInfo!.daysRemaining} Days Left';
                } else if (!subProv.isLoading) {
                  subText = 'Free Plan / Expired';
                }

                return _TappableTile(
                  icon: Icons.card_membership_rounded,
                  label: 'My Subscription Plan',
                  value: subText,
                  iconColor: AppColors.statusPurple,
                  onTap: isAdmin ? () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => const MyPlanScreen()),
                    );
                  } : null,
                );
              },
            ),
            Divider(height: 1, indent: 56, color: AppColors.darkBorder),
            Consumer<TaxesProvider>(
              builder: (context, taxesProv, _) {
                final activeTaxes = taxesProv.taxes.where((t) => t.status).toList();
                final valueText = activeTaxes.isEmpty
                    ? 'None active'
                    : activeTaxes.map((t) => '${t.name} (${t.rate.toStringAsFixed(0)}%)').join(', ');
                return _TappableTile(
                  icon: Icons.percent_rounded,
                  label: 'Tax Settings',
                  value: valueText,
                  iconColor: AppColors.statusAmber,
                  onTap: isAdmin ? () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (context) => const TaxesScreen()),
                    );
                  } : null,
                );
              },
            ),
            Divider(height: 1, indent: 56, color: AppColors.darkBorder),
            _TappableTile(
              icon: Icons.insights_rounded,
              label: 'Staff Performance',
              value: 'Analytics',
              iconColor: AppColors.statusGreen,
              onTap: isAdmin ? () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (context) => const StaffPerformanceScreen()),
                );
              } : null,
            ),
          ]),
          const SizedBox(height: 16),

          // ── Account ─────────────────────────────────────────────────────
          _SectionHeader(title: 'Account', icon: Icons.person_rounded),
          const SizedBox(height: 10),
          _SettingsCard(children: [
            _TappableTile(
              icon: Icons.lock_outline_rounded,
              label: 'Change Password',
              iconColor: AppColors.statusAmber,
              onTap: _showChangePasswordSheet,
            ),
          ]),
          const SizedBox(height: 12),

          // Logout button
          _LogoutButton(onTap: _showLogoutDialog),
          const SizedBox(height: 16),

          // App Version
          Center(
            child: Text(
              '${app.appName} ${app.appVersion} · Built with ☕',
              style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 11),
            ),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }
}

// ─── Profile Card ────────────────────────────────────────────────────────────

class _ProfileCard extends StatelessWidget {
  final dynamic user; // UserModel

  const _ProfileCard({required this.user});

  @override
  Widget build(BuildContext context) {
    final auth = context.read<AuthProvider>();
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: AppColors.isDark
            ? const LinearGradient(
                colors: [Color(0xFF2E1C0A), Color(0xFF1A0E05)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              )
            : LinearGradient(
                colors: [AppColors.accentAmber.withOpacity(0.12), AppColors.accentAmber.withOpacity(0.04)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.accentAmber.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          // Avatar
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              gradient: AppColors.primaryGradient,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Center(
              child: Text(
                user.initials ?? '??',
                style: GoogleFonts.poppins(
                  color: AppColors.textOnAmber,
                  fontSize: 22,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  user.name,
                  style: GoogleFonts.poppins(
                    color: AppColors.textPrimary,
                    fontSize: 17,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  user.email,
                  style: GoogleFonts.poppins(
                    color: AppColors.textSecondary,
                    fontSize: 12,
                  ),
                ),
                const SizedBox(height: 8),
                _RoleBadge(role: user.role),
              ],
            ),
          ),
          IconButton(
            onPressed: () => _showEditProfileSheet(context, auth),
            icon: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColors.accentAmber.withOpacity(0.15),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(Icons.edit_rounded, color: AppColors.accentAmber, size: 18),
            ),
          ),
        ],
      ),
    );
  }

  static void _showEditProfileSheet(BuildContext context, AuthProvider auth) {
    final nameCtrl = TextEditingController(text: auth.user?.name ?? '');
    final emailCtrl = TextEditingController(text: auth.user?.email ?? '');
    final phoneCtrl = TextEditingController(text: auth.user?.phone ?? '');
    final passwordCtrl = TextEditingController();
    
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.darkCard,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => Padding(
          padding: EdgeInsets.only(
            left: 24,
            right: 24,
            top: 24,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Edit Profile Details',
                style: GoogleFonts.poppins(
                  color: AppColors.textPrimary,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: nameCtrl,
                style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13),
                decoration: InputDecoration(
                  labelText: 'Full Name',
                  labelStyle: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 12),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: emailCtrl,
                keyboardType: TextInputType.emailAddress,
                style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13),
                decoration: InputDecoration(
                  labelText: 'Email Address',
                  labelStyle: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 12),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: phoneCtrl,
                keyboardType: TextInputType.phone,
                style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13),
                decoration: InputDecoration(
                  labelText: 'Phone Number (optional)',
                  labelStyle: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 12),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: passwordCtrl,
                obscureText: true,
                style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13),
                decoration: InputDecoration(
                  labelText: 'New Password (leave empty to keep current)',
                  labelStyle: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 12),
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: auth.isLoading
                      ? null
                      : () async {
                          if (nameCtrl.text.trim().isEmpty || emailCtrl.text.trim().isEmpty) {
                            showTopSnackBar(context, 
                              SnackBar(
                                content: Text('Please fill all required fields'),
                                backgroundColor: AppColors.statusRed,
                              ),
                            );
                            return;
                          }
                          
                          // Set loading state locally in sheet
                          setSheetState(() {});
                          
                          final success = await auth.updateProfile(
                            name: nameCtrl.text.trim(),
                            email: emailCtrl.text.trim(),
                            phone: phoneCtrl.text.trim().isEmpty ? null : phoneCtrl.text.trim(),
                            password: passwordCtrl.text.isEmpty ? null : passwordCtrl.text,
                          );
                          
                          if (success && ctx.mounted) {
                            Navigator.pop(ctx);
                            showTopSnackBar(context, 
                              SnackBar(
                                content: Text('Profile updated successfully'),
                                backgroundColor: AppColors.statusGreen,
                              ),
                            );
                          } else if (ctx.mounted) {
                            setSheetState(() {});
                            showTopSnackBar(context, 
                              SnackBar(
                                content: Text(auth.error ?? 'Failed to update profile'),
                                backgroundColor: AppColors.statusRed,
                              ),
                            );
                          }
                        },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.accentAmber,
                    foregroundColor: AppColors.textOnAmber,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  child: auth.isLoading
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                        )
                      : Text(
                          'Save Changes',
                          style: GoogleFonts.poppins(fontWeight: FontWeight.bold),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RoleBadge extends StatelessWidget {
  final String role;
  const _RoleBadge({required this.role});

  Color get _color {
    switch (role) {
      case 'admin': return AppColors.accentAmber;
      case 'super_admin': return AppColors.statusPurple;
      case 'kitchen': return AppColors.statusBlue;
      default: return AppColors.statusGreen;
    }
  }

  String get _label {
    switch (role) {
      case 'admin': return 'Administrator';
      case 'super_admin': return 'Super Admin';
      case 'kitchen': return 'Kitchen Staff';
      default: return 'Staff';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: _color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: _color.withOpacity(0.4)),
      ),
      child: Text(
        _label,
        style: GoogleFonts.poppins(color: _color, fontSize: 11, fontWeight: FontWeight.w600),
      ),
    );
  }
}

// ─── Shift Card ───────────────────────────────────────────────────────────────

class _ShiftCard extends StatelessWidget {
  final bool isClockedIn;
  final Duration elapsed;
  final DateTime? clockInTime;
  final String Function(Duration) formatDuration;
  final VoidCallback onToggle;

  const _ShiftCard({
    required this.isClockedIn,
    required this.elapsed,
    required this.clockInTime,
    required this.formatDuration,
    required this.onToggle,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.darkCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isClockedIn ? AppColors.statusGreen.withOpacity(0.4) : AppColors.darkBorder,
        ),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: (isClockedIn ? AppColors.statusGreen : AppColors.textMuted).withOpacity(0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  isClockedIn ? Icons.timer_rounded : Icons.timer_off_rounded,
                  color: isClockedIn ? AppColors.statusGreen : AppColors.textMuted,
                  size: 22,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      isClockedIn ? 'Shift Active' : 'No Active Shift',
                      style: GoogleFonts.poppins(
                        color: AppColors.textPrimary,
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    if (isClockedIn && clockInTime != null)
                      Text(
                        'Started at ${_formatTime(clockInTime!)}',
                        style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 11),
                      )
                    else
                      Text(
                        'Clock in to start tracking',
                        style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 11),
                      ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: isClockedIn ? AppColors.statusGreenBg : AppColors.darkSurface,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  isClockedIn ? 'ON' : 'OFF',
                  style: GoogleFonts.poppins(
                    color: isClockedIn ? AppColors.statusGreen : AppColors.textMuted,
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    letterSpacing: 1,
                  ),
                ),
              ),
            ],
          ),
          if (isClockedIn) ...[
            const SizedBox(height: 16),
            // Timer display
            Container(
              padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
              decoration: BoxDecoration(
                color: AppColors.darkSurface,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.statusGreen.withOpacity(0.3)),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.access_time_filled_rounded, color: AppColors.statusGreen, size: 20),
                  const SizedBox(width: 10),
                  Text(
                    formatDuration(elapsed),
                    style: GoogleFonts.poppins(
                      color: AppColors.statusGreen,
                      fontSize: 26,
                      fontWeight: FontWeight.w700,
                      letterSpacing: 2,
                    ),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: onToggle,
              style: ElevatedButton.styleFrom(
                backgroundColor: isClockedIn ? AppColors.statusRed : AppColors.statusGreen,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 13),
              ),
              icon: Icon(isClockedIn ? Icons.stop_circle_rounded : Icons.play_circle_filled_rounded, size: 20),
              label: Text(
                isClockedIn ? 'Clock Out' : 'Clock In',
                style: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 15),
              ),
            ),
          ),
        ],
      ),
    );
  }

  String _formatTime(DateTime dt) {
    final h = dt.hour > 12 ? dt.hour - 12 : dt.hour == 0 ? 12 : dt.hour;
    final m = dt.minute.toString().padLeft(2, '0');
    final period = dt.hour >= 12 ? 'PM' : 'AM';
    return '$h:$m $period';
  }
}

// ─── Section Header ───────────────────────────────────────────────────────────

class _SectionHeader extends StatelessWidget {
  final String title;
  final IconData icon;

  const _SectionHeader({required this.title, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 16, color: AppColors.accentAmber),
        const SizedBox(width: 8),
        Text(
          title.toUpperCase(),
          style: GoogleFonts.poppins(
            color: AppColors.accentAmber,
            fontSize: 11,
            fontWeight: FontWeight.w700,
            letterSpacing: 1.2,
          ),
        ),
      ],
    );
  }
}

// ─── Settings Card ────────────────────────────────────────────────────────────

class _SettingsCard extends StatelessWidget {
  final List<Widget> children;
  const _SettingsCard({required this.children});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.darkCard,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.darkBorder),
      ),
      child: Column(children: children),
    );
  }
}

// ─── Tile Variants ────────────────────────────────────────────────────────────

class _InfoTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color iconColor;

  const _InfoTile({required this.icon, required this.label, required this.value, required this.iconColor});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: iconColor.withOpacity(0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: iconColor, size: 18),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Text(label, style: GoogleFonts.poppins(color: AppColors.textSecondary, fontSize: 14)),
          ),
          Text(
            value,
            style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13, fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }
}

class _TappableTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String? value;
  final Color iconColor;
  final VoidCallback? onTap;

  const _TappableTile({
    required this.icon,
    required this.label,
    required this.iconColor,
    this.onTap,
    this.value,
  });

  @override
  Widget build(BuildContext context) {
    final isEnabled = onTap != null;
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      child: Opacity(
        opacity: isEnabled ? 1.0 : 0.6,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          child: Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: iconColor.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: iconColor, size: 18),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Text(label, style: GoogleFonts.poppins(color: AppColors.textSecondary, fontSize: 14)),
              ),
              if (value != null) ...[
                Text(value!, style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 13)),
                const SizedBox(width: 4),
              ],
              if (isEnabled)
                Icon(Icons.chevron_right_rounded, color: AppColors.textMuted, size: 20)
              else
                Icon(Icons.lock_outline_rounded, color: AppColors.textMuted, size: 16),
            ],
          ),
        ),
      ),
    );
  }
}

class _SwitchTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String? subtitle;
  final Color iconColor;
  final bool value;
  final ValueChanged<bool>? onChanged;

  const _SwitchTile({
    required this.icon,
    required this.label,
    required this.iconColor,
    required this.value,
    this.subtitle,
    this.onChanged,
  });

  @override
  Widget build(BuildContext context) {
    final isEnabled = onChanged != null;
    return Opacity(
      opacity: isEnabled ? 1.0 : 0.6,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        child: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: iconColor.withOpacity(0.12),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, color: iconColor, size: 18),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(label, style: GoogleFonts.poppins(color: AppColors.textSecondary, fontSize: 14)),
                  if (subtitle != null)
                    Text(subtitle!,
                        style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 11)),
                ],
              ),
            ),
            Switch(
              value: value,
              onChanged: onChanged,
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Logout Button ────────────────────────────────────────────────────────────

class _LogoutButton extends StatelessWidget {
  final VoidCallback onTap;
  const _LogoutButton({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 16),
        decoration: BoxDecoration(
          color: AppColors.statusRed.withOpacity(0.1),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.statusRed.withOpacity(0.3)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.logout_rounded, color: AppColors.statusRed, size: 20),
            const SizedBox(width: 10),
            Text(
              'Log Out',
              style: GoogleFonts.poppins(
                color: AppColors.statusRed,
                fontSize: 15,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}



// ─── Change Password Sheet ────────────────────────────────────────────────────

class _ChangePasswordSheet extends StatefulWidget {
  const _ChangePasswordSheet();

  @override
  State<_ChangePasswordSheet> createState() => _ChangePasswordSheetState();
}

class _ChangePasswordSheetState extends State<_ChangePasswordSheet> {
  final _currentCtrl = TextEditingController();
  final _newCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();
  bool _showCurrent = false;
  bool _showNew = false;
  bool _showConfirm = false;

  @override
  void dispose() {
    _currentCtrl.dispose();
    _newCtrl.dispose();
    _confirmCtrl.dispose();
    super.dispose();
  }

  void _save() {
    if (_newCtrl.text != _confirmCtrl.text) {
      showTopSnackBar(context, SnackBar(
        content: Text('Passwords do not match',
            style: GoogleFonts.poppins(color: AppColors.textPrimary)),
      ));
      return;
    }
    Navigator.pop(context);
    showTopSnackBar(context, SnackBar(
      content: Text('Password changed successfully',
          style: GoogleFonts.poppins(color: AppColors.textPrimary)),
    ));
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.darkCard,
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        padding: const EdgeInsets.fromLTRB(24, 20, 24, 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Change Password',
                    style: GoogleFonts.poppins(
                        color: AppColors.textPrimary, fontSize: 18, fontWeight: FontWeight.w700)),
                IconButton(
                  icon: Icon(Icons.close, color: AppColors.textMuted),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _currentCtrl,
              obscureText: !_showCurrent,
              style: TextStyle(color: AppColors.textPrimary),
              decoration: InputDecoration(
                labelText: 'Current Password',
                prefixIcon: const Icon(Icons.lock_outline_rounded),
                suffixIcon: IconButton(
                  icon: Icon(_showCurrent ? Icons.visibility_off_rounded : Icons.visibility_rounded,
                      color: AppColors.textMuted, size: 20),
                  onPressed: () => setState(() => _showCurrent = !_showCurrent),
                ),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _newCtrl,
              obscureText: !_showNew,
              style: TextStyle(color: AppColors.textPrimary),
              decoration: InputDecoration(
                labelText: 'New Password',
                prefixIcon: const Icon(Icons.lock_rounded),
                suffixIcon: IconButton(
                  icon: Icon(_showNew ? Icons.visibility_off_rounded : Icons.visibility_rounded,
                      color: AppColors.textMuted, size: 20),
                  onPressed: () => setState(() => _showNew = !_showNew),
                ),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _confirmCtrl,
              obscureText: !_showConfirm,
              style: TextStyle(color: AppColors.textPrimary),
              decoration: InputDecoration(
                labelText: 'Confirm New Password',
                prefixIcon: const Icon(Icons.lock_reset_rounded),
                suffixIcon: IconButton(
                  icon: Icon(_showConfirm ? Icons.visibility_off_rounded : Icons.visibility_rounded,
                      color: AppColors.textMuted, size: 20),
                  onPressed: () => setState(() => _showConfirm = !_showConfirm),
                ),
              ),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _save,
                icon: const Icon(Icons.check_rounded),
                label: const Text('Update Password'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
