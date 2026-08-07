import 'package:flutter/material.dart';
import '../core/services/api_service.dart';

class ReportsProvider extends ChangeNotifier {
  final ApiService _apiService;

  bool _isLoading = false;
  String? _error;

  String _selectedRange = 'Today';
  DateTimeRange? _customDateRange;

  // Filters
  int? _selectedTableId;
  int? _selectedMenuId;
  String _selectedPayment = 'All'; // 'All', 'cash', 'online', 'due'
  String _searchQuery = '';
  int _activeTab = 0; // 0=TRANSACTIONS, 1=BY TABLE, 2=BY ITEM, 3=BY PAYMENT

  Map<String, dynamic> _stats = {
    'revenue': 0.0,
    'total_revenue': 0.0,
    'cash_collected': 0.0,
    'total_cash': 0.0,
    'online_payments': 0.0,
    'total_online': 0.0,
    'customer_due': 0.0,
    'total_due': 0.0,
    'total_tax': 0.0,
    'tips_collected': 0.0,
    'total_tips': 0.0,
    'discounts': 0.0,
    'total_discount': 0.0,
    'orders': 0.0,
    'total_orders': 0.0,
    'avgOrderValue': 0.0,
    'avg_sitting_mins': 0.0,
    'customersServed': 0.0,
  };
  List<dynamic> _hourlySales = [];
  List<dynamic> _categoryBreakdown = [];
  Map<String, dynamic> _paymentSplit = {
    'cash_amount': 0.0,
    'cash_pct': 0.0,
    'card_amount': 0.0,
    'card_pct': 0.0,
    'credit_amount': 0.0,
    'credit_pct': 0.0,
  };
  List<dynamic> _topItems = [];
  List<dynamic> _tableSales = [];
  List<dynamic> _paymentSales = [];
  List<dynamic> _transactions = [];
  List<dynamic> _allTables = [];
  List<dynamic> _allMenus = [];

  ReportsProvider({required ApiService apiService}) : _apiService = apiService;

  // Getters
  bool get isLoading => _isLoading;
  String? get error => _error;
  String get selectedRange => _selectedRange;
  DateTimeRange? get customDateRange => _customDateRange;

  int? get selectedTableId => _selectedTableId;
  int? get selectedMenuId => _selectedMenuId;
  String get selectedPayment => _selectedPayment;
  String get searchQuery => _searchQuery;
  int get activeTab => _activeTab;

  Map<String, dynamic> get stats => _stats;
  List<dynamic> get hourlySales => _hourlySales;
  List<dynamic> get categoryBreakdown => _categoryBreakdown;
  Map<String, dynamic> get paymentSplit => _paymentSplit;
  List<dynamic> get topItems => _topItems;
  List<dynamic> get tableSales => _tableSales;
  List<dynamic> get paymentSales => _paymentSales;
  List<dynamic> get transactions => _transactions;
  List<dynamic> get allTables => _allTables;
  List<dynamic> get allMenus => _allMenus;

  void setSelectedRange(String range, {DateTimeRange? customRange}) {
    _selectedRange = range;
    _customDateRange = customRange;
    notifyListeners();
  }

  void setFilterTableId(int? id) {
    _selectedTableId = id;
    notifyListeners();
    fetchReports();
  }

  void setFilterMenuId(int? id) {
    _selectedMenuId = id;
    notifyListeners();
    fetchReports();
  }

  void setFilterPayment(String payment) {
    _selectedPayment = payment;
    notifyListeners();
    fetchReports();
  }

  void setSearchQuery(String query) {
    _searchQuery = query;
    notifyListeners();
    fetchReports();
  }

  void setActiveTab(int index) {
    _activeTab = index;
    notifyListeners();
  }

  Future<void> fetchReports() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      String period = 'today';
      String dateParams = '';

      if (_selectedRange == 'Today') {
        period = 'today';
      } else if (_selectedRange == 'Yesterday') {
        period = 'yesterday';
      } else if (_selectedRange == 'This Week') {
        period = 'week';
      } else if (_selectedRange == 'This Month') {
        period = 'month';
      } else if (_selectedRange == 'Custom' && _customDateRange != null) {
        period = 'custom';
        final startStr = "${_customDateRange!.start.year}-${_customDateRange!.start.month.toString().padLeft(2, '0')}-${_customDateRange!.start.day.toString().padLeft(2, '0')}";
        final endStr = "${_customDateRange!.end.year}-${_customDateRange!.end.month.toString().padLeft(2, '0')}-${_customDateRange!.end.day.toString().padLeft(2, '0')}";
        dateParams = '&start_date=$startStr&end_date=$endStr';
      }

      String filterParams = '';
      if (_selectedTableId != null) filterParams += '&table_id=$_selectedTableId';
      if (_selectedMenuId != null) filterParams += '&menu_id=$_selectedMenuId';
      if (_selectedPayment != 'All') filterParams += '&payment=${_selectedPayment.toLowerCase()}';
      if (_searchQuery.trim().isNotEmpty) filterParams += '&search=${Uri.encodeComponent(_searchQuery.trim())}';

      final endpoint = '/reports?period=$period$dateParams$filterParams';
      final res = await _apiService.get(endpoint);

      if (res != null && res['success'] == true) {
        _stats = res['stats'] ?? {};
        _hourlySales = res['hourly_sales'] ?? [];
        _categoryBreakdown = res['category_breakdown'] ?? [];
        _paymentSplit = res['payment_split'] ?? {};
        _topItems = res['top_items'] ?? [];
        _tableSales = res['table_sales'] ?? [];
        _paymentSales = res['payment_sales'] ?? [];
        _transactions = res['transactions'] ?? [];
        _allTables = res['all_tables'] ?? [];
        _allMenus = res['all_menus'] ?? [];
      } else {
        _error = res?['message'] ?? 'Failed to load reports';
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<String?> exportReportsCsv() async {
    try {
      String period = 'today';
      String dateParams = '';

      if (_selectedRange == 'Today') {
        period = 'today';
      } else if (_selectedRange == 'Yesterday') {
        period = 'yesterday';
      } else if (_selectedRange == 'This Week') {
        period = 'week';
      } else if (_selectedRange == 'This Month') {
        period = 'month';
      } else if (_selectedRange == 'Custom' && _customDateRange != null) {
        period = 'custom';
        final startStr = "${_customDateRange!.start.year}-${_customDateRange!.start.month.toString().padLeft(2, '0')}-${_customDateRange!.start.day.toString().padLeft(2, '0')}";
        final endStr = "${_customDateRange!.end.year}-${_customDateRange!.end.month.toString().padLeft(2, '0')}-${_customDateRange!.end.day.toString().padLeft(2, '0')}";
        dateParams = '&start_date=$startStr&end_date=$endStr';
      }

      String filterParams = '';
      if (_selectedTableId != null) filterParams += '&table_id=$_selectedTableId';
      if (_selectedMenuId != null) filterParams += '&menu_id=$_selectedMenuId';
      if (_selectedPayment != 'All') filterParams += '&payment=${_selectedPayment.toLowerCase()}';
      if (_searchQuery.trim().isNotEmpty) filterParams += '&search=${Uri.encodeComponent(_searchQuery.trim())}';

      final endpoint = '/reports/export?period=$period$dateParams$filterParams';
      final res = await _apiService.get(endpoint);
      if (res != null && res['success'] == true) {
        return res['csv'];
      }
    } catch (e) {
      return null;
    }
    return null;
  }
}
