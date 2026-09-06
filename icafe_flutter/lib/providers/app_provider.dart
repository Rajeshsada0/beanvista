import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/constants/app_constants.dart';
import '../core/services/api_service.dart';
import '../core/theme/app_theme.dart';

class AppProvider extends ChangeNotifier {
  String _currency = 'Rs.';
  String _siteName = AppConstants.appName;
  String _tenantName = ''; // canonical cafe name from Tenant record
  bool _isDarkMode = false;
  int? _activeBranchId;
  String? _activeBranchName;
  bool _isLoading = false;
  
  String _themeColor = 'brand';
  int _kdsWarningMins = 10;
  int _kdsCriticalMins = 20;
  bool _enableGuestQr = false;
  bool _enableCompletedOrderEdit = false;
  String _address = '';
  String _contactPhone = '';
  String _contactEmail = '';

  // Dynamic superadmin options
  bool _enableBiometricSetting = true;
  bool _enableContactCall = true;
  String _contactCallNumber = '';
  bool _enableContactEmail = true;
  String _contactEmailAddress = '';
  bool _enableContactWhatsapp = true;
  String _contactWhatsappNumber = '';

  // Global app name and version (from superadmin settings)
  String _appName = 'Bean Vista';
  String _appVersion = 'v1.0';
  String _activeTabLabel = 'Dashboard';

  String get currency => _currency;
  /// User-configurable display name; falls back to tenant's cafe name.
  String get siteName => _siteName.isNotEmpty ? _siteName : (_tenantName.isNotEmpty ? _tenantName : AppConstants.appName);
  /// The canonical tenant cafe name from the tenants table (read-only).
  String get tenantName => _tenantName;
  bool get isDarkMode => _isDarkMode;
  int? get activeBranchId => _activeBranchId;
  String? get activeBranchName => _activeBranchName;
  bool get isLoading => _isLoading;
  String get branchDisplayName => _activeBranchName ?? 'Main Branch';
  String get activeTabLabel => _activeTabLabel;
  
  String get themeColor => _themeColor;
  int get kdsWarningMins => _kdsWarningMins;
  int get kdsCriticalMins => _kdsCriticalMins;
  bool get enableGuestQr => _enableGuestQr;
  bool get enableCompletedOrderEdit => _enableCompletedOrderEdit;
  String get address => _address;
  String get contactPhone => _contactPhone;
  String get contactEmail => _contactEmail;

  bool get enableBiometricSetting => _enableBiometricSetting;
  bool get enableContactCall => _enableContactCall;
  String get contactCallNumber => _contactCallNumber;
  bool get enableContactEmail => _enableContactEmail;
  String get contactEmailAddress => _contactEmailAddress;
  bool get enableContactWhatsapp => _enableContactWhatsapp;
  String get contactWhatsappNumber => _contactWhatsappNumber;

  String get appName => _appName;
  String get appVersion => _appVersion;

  void setActiveTabLabel(String label) {
    if (_activeTabLabel != label) {
      _activeTabLabel = label;
      notifyListeners();
    }
  }

  void setCurrency(String c) {
    _currency = c;
    AppConstants.currencySymbol = c;
    _saveToPrefs();
    notifyListeners();
  }

  void setSiteName(String n) {
    _siteName = n;
    _saveToPrefs();
    notifyListeners();
  }

  void setDarkMode(bool value) {
    _isDarkMode = value;
    // Update AppColors immediately so all static getters reflect new mode
    // before any widget rebuilds (avoids one-frame flicker)
    AppColors.isDark = value;
    _saveToPrefs();
    notifyListeners();
  }

  void setActiveBranch(int id, String name) {
    _activeBranchId = id;
    _activeBranchName = name;
    _saveToPrefs();
    notifyListeners();
  }

  void clearActiveBranch() {
    _activeBranchId = null;
    _activeBranchName = null;
    _saveToPrefs();
    notifyListeners();
  }

  Future<void> loadSettings() async {
    _isLoading = true;
    notifyListeners();

    try {
      final prefs = await SharedPreferences.getInstance();
      _currency = prefs.getString('pref_currency') ?? 'Rs.';
      AppConstants.currencySymbol = _currency;
      _siteName = prefs.getString('pref_site_name') ?? AppConstants.appName;
      _tenantName = prefs.getString('pref_tenant_name') ?? '';
      _isDarkMode = prefs.getBool(AppConstants.themeKey) ?? false;
      _activeBranchId = prefs.getInt('pref_branch_id');
      _activeBranchName = prefs.getString('pref_branch_name');
      
      _themeColor = prefs.getString('pref_theme_color') ?? 'brand';
      _kdsWarningMins = prefs.getInt('pref_kds_warning_mins') ?? 10;
      _kdsCriticalMins = prefs.getInt('pref_kds_critical_mins') ?? 20;
      _enableGuestQr = prefs.getBool('pref_enable_guest_qr') ?? false;
      _enableCompletedOrderEdit = prefs.getBool('pref_enable_completed_order_edit') ?? false;
      _address = prefs.getString('pref_address') ?? '';
      _contactPhone = prefs.getString('pref_contact_phone') ?? '';
      _contactEmail = prefs.getString('pref_contact_email') ?? '';

      _enableBiometricSetting = prefs.getBool('pref_enable_biometric_setting') ?? true;
      _enableContactCall = prefs.getBool('pref_enable_contact_call') ?? true;
      _contactCallNumber = prefs.getString('pref_contact_call_number') ?? '';
      _enableContactEmail = prefs.getBool('pref_enable_contact_email') ?? true;
      _contactEmailAddress = prefs.getString('pref_contact_email_address') ?? '';
      _enableContactWhatsapp = prefs.getBool('pref_enable_contact_whatsapp') ?? true;
      _contactWhatsappNumber = prefs.getString('pref_contact_whatsapp_number') ?? '';

      _appName = prefs.getString('pref_app_name') ?? 'Bean Vista';
      _appVersion = prefs.getString('pref_app_version') ?? 'v1.0';
    } catch (_) {}

    _isLoading = false;
    notifyListeners();
  }

  Future<void> _saveToPrefs() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await Future.wait([
        prefs.setString('pref_currency', _currency),
        prefs.setString('pref_site_name', _siteName),
        prefs.setString('pref_tenant_name', _tenantName),
        prefs.setBool(AppConstants.themeKey, _isDarkMode),
        prefs.setString('pref_theme_color', _themeColor),
        prefs.setInt('pref_kds_warning_mins', _kdsWarningMins),
        prefs.setInt('pref_kds_critical_mins', _kdsCriticalMins),
        prefs.setBool('pref_enable_guest_qr', _enableGuestQr),
        prefs.setBool('pref_enable_completed_order_edit', _enableCompletedOrderEdit),
        prefs.setString('pref_address', _address),
        prefs.setString('pref_contact_phone', _contactPhone),
        prefs.setString('pref_contact_email', _contactEmail),
        prefs.setBool('pref_enable_biometric_setting', _enableBiometricSetting),
        prefs.setBool('pref_enable_contact_call', _enableContactCall),
        prefs.setString('pref_contact_call_number', _contactCallNumber),
        prefs.setBool('pref_enable_contact_email', _enableContactEmail),
        prefs.setString('pref_contact_email_address', _contactEmailAddress),
        prefs.setBool('pref_enable_contact_whatsapp', _enableContactWhatsapp),
        prefs.setString('pref_contact_whatsapp_number', _contactWhatsappNumber),
        prefs.setString('pref_app_name', _appName),
        prefs.setString('pref_app_version', _appVersion),
        if (_activeBranchId != null)
          prefs.setInt('pref_branch_id', _activeBranchId!)
        else
          prefs.remove('pref_branch_id'),
        if (_activeBranchName != null)
          prefs.setString('pref_branch_name', _activeBranchName!)
        else
          prefs.remove('pref_branch_name'),
      ]);
    } catch (_) {}
  }

  void resetToDefaults() {
    _currency = 'Rs.';
    AppConstants.currencySymbol = _currency;
    _siteName = AppConstants.appName;
    _tenantName = '';
    _isDarkMode = false;
    _activeBranchId = null;
    _activeBranchName = null;
    _themeColor = 'brand';
    _kdsWarningMins = 10;
    _kdsCriticalMins = 20;
    _enableGuestQr = false;
    _enableCompletedOrderEdit = false;
    _address = '';
    _contactPhone = '';
    _contactEmail = '';
    _enableBiometricSetting = true;
    _enableContactCall = true;
    _contactCallNumber = '';
    _enableContactEmail = true;
    _contactEmailAddress = '';
    _enableContactWhatsapp = true;
    _contactWhatsappNumber = '';
    _appName = 'Bean Vista';
    _appVersion = 'v1.0';
    _saveToPrefs();
    notifyListeners();
  }

  Future<void> fetchSettings(ApiService api) async {
    try {
      final res = await api.get('/settings');
      if (res != null && res['success'] == true && res['data'] != null) {
        final data = res['data'] as Map<String, dynamic>;

        // Always update all fields unconditionally from server response
        _siteName = data['site_name'] as String? ?? '';
        // tenant_name is the canonical name from the tenants table
        _tenantName = data['tenant_name'] as String? ?? _tenantName;
        _currency = data['currency_symbol'] as String? ?? 'Rs.';
        AppConstants.currencySymbol = _currency;
        _themeColor = data['theme'] as String? ?? 'brand';
        _kdsWarningMins = int.tryParse(data['kds_warning_mins']?.toString() ?? '') ?? 10;
        _kdsCriticalMins = int.tryParse(data['kds_critical_mins']?.toString() ?? '') ?? 20;
        _enableGuestQr = data['enable_guest_qr']?.toString() == 'true' || data['enable_guest_qr']?.toString() == '1';
        _enableCompletedOrderEdit = data['enable_completed_order_edit']?.toString() == 'true' || data['enable_completed_order_edit']?.toString() == '1';
        _address = data['address'] as String? ?? '';
        _contactPhone = data['contact_phone'] as String? ?? '';
        _contactEmail = data['contact_email'] as String? ?? '';
        _appName = data['app_name'] as String? ?? 'Bean Vista';
        _appVersion = data['app_version'] as String? ?? 'v1.0';

        await _saveToPrefs();
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Failed to sync settings from server: $e');
    }
  }

  Future<void> fetchPublicSettings(ApiService api) async {
    try {
      final res = await api.get('/public-settings');
      if (res != null && res['success'] == true && res['data'] != null) {
        final data = res['data'] as Map<String, dynamic>;

        // Always update unconditionally from server response
        _enableBiometricSetting = data['enable_biometric']?.toString() != 'false';
        _enableContactCall = data['enable_contact_call']?.toString() != 'false';
        _contactCallNumber = data['contact_call_number']?.toString() ?? '';
        _enableContactEmail = data['enable_contact_email']?.toString() != 'false';
        _contactEmailAddress = data['contact_email_address']?.toString() ?? '';
        _enableContactWhatsapp = data['enable_contact_whatsapp']?.toString() != 'false';
        _contactWhatsappNumber = data['contact_whatsapp_number']?.toString() ?? '';

        await _saveToPrefs();
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Failed to sync public settings from server: $e');
    }
  }
}
