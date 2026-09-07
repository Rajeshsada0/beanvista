import 'package:flutter/foundation.dart';
import 'package:image_picker/image_picker.dart';
import '../core/services/api_service.dart';
import '../core/utils/json_utils.dart';

class FinanceProvider extends ChangeNotifier {
  final ApiService _apiService;

  bool _isLoading = false;
  String? _error;

  // Date Filters
  DateTime _startDate = DateTime(DateTime.now().year, DateTime.now().month, 1);
  DateTime _endDate = DateTime(DateTime.now().year, DateTime.now().month + 1, 0);

  // States
  Map<String, dynamic> _overview = {};
  Map<String, dynamic> _profitLoss = {};
  Map<String, dynamic> _balanceSheet = {};
  Map<String, dynamic> _trialBalance = {};
  Map<String, dynamic> _cashFlow = {};
  List<dynamic> _generalLedger = [];
  List<dynamic> _accounts = [];
  List<dynamic> _journalEntries = [];
  List<dynamic> _expenses = [];
  List<dynamic> _expenseCategories = [];
  List<dynamic> _supplierBills = [];
  List<dynamic> _suppliers = [];
  List<dynamic> _cashAccounts = [];
  List<dynamic> _budgets = [];
  List<dynamic> _bankAccounts = [];
  List<dynamic> _bankTransactions = [];
  Map<String, dynamic> _cashRegister = {};

  FinanceProvider({required ApiService apiService}) : _apiService = apiService;

  // Getters
  bool get isLoading => _isLoading;
  String? get error => _error;
  DateTime get startDate => _startDate;
  DateTime get endDate => _endDate;

  String get startDateStr => "${_startDate.year}-${_startDate.month.toString().padLeft(2, '0')}-${_startDate.day.toString().padLeft(2, '0')}";
  String get endDateStr => "${_endDate.year}-${_endDate.month.toString().padLeft(2, '0')}-${_endDate.day.toString().padLeft(2, '0')}";

  Map<String, dynamic> get overview => _overview;
  Map<String, dynamic> get profitLoss => _profitLoss;
  Map<String, dynamic> get balanceSheet => _balanceSheet;
  Map<String, dynamic> get trialBalance => _trialBalance;
  Map<String, dynamic> get cashFlow => _cashFlow;
  List<dynamic> get generalLedger => _generalLedger;
  List<dynamic> get accounts => _accounts;
  List<dynamic> get journalEntries => _journalEntries;
  List<dynamic> get expenses => _expenses;
  List<dynamic> get expenseCategories => _expenseCategories;
  List<dynamic> get supplierBills => _supplierBills;
  List<dynamic> get suppliers => _suppliers;
  List<dynamic> get cashAccounts => _cashAccounts;
  List<dynamic> get budgets => _budgets;
  List<dynamic> get bankAccounts => _bankAccounts;
  List<dynamic> get bankTransactions => _bankTransactions;
  Map<String, dynamic> get cashRegister => _cashRegister;
  double get counterExpenses => JsonUtils.parseDouble(_cashRegister['counterExpenses']);
  double get counterCashIn => JsonUtils.parseDouble(_cashRegister['counterCashIn']);
  List<dynamic> get todayCounterExpenses => _cashRegister['todayCounterExpenses'] is List ? _cashRegister['todayCounterExpenses'] : [];
  List<dynamic> get counterExpenseCategories => _cashRegister['expenseCategories'] is List ? _cashRegister['expenseCategories'] : [];

  // Set Date Range
  void setDateRange(DateTime start, DateTime end) {
    _startDate = start;
    _endDate = end;
    notifyListeners();
  }

  // --- Fetch Methods ---

  Future<void> fetchFinanceDashboardData() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await Future.wait([
        _fetchOverviewSilent(),
        _fetchExpensesSilent(),
        _fetchCashCounterSilent(),
        _fetchBankingSilent(),
      ]);
    } catch (e) {
      _error = 'Failed to load dashboard data: $e';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> _fetchOverviewSilent() async {
    try {
      final res = await _apiService.get('/finance/overview?start_date=$startDateStr&end_date=$endDateStr');
      if (res != null && res['success'] == true) {
        _overview = res;
      }
    } catch (_) {}
  }

  Future<void> _fetchExpensesSilent() async {
    try {
      final res = await _apiService.get('/finance/expenses');
      if (res != null && res['success'] == true) {
        _expenses = res['expenses'] ?? [];
        _expenseCategories = res['categories'] ?? [];
      }
    } catch (_) {}
  }

  Future<void> _fetchBankingSilent() async {
    try {
      final res = await _apiService.get('/finance/banking');
      if (res != null && res['success'] == true) {
        _bankAccounts = res['accounts'] ?? [];
        _bankTransactions = res['transactions'] ?? [];
      }
    } catch (_) {}
  }

  Future<void> _fetchCashCounterSilent() async {
    try {
      final res = await _apiService.get('/finance/cash-counter');
      if (res != null && res['success'] == true) {
        _cashRegister = res;
      }
    } catch (_) {}
  }

  Future<void> fetchOverview() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await _apiService.get('/finance/overview?start_date=$startDateStr&end_date=$endDateStr');
      if (res != null && res['success'] == true) {
        _overview = res;
      } else {
        _error = res?['message'] ?? 'Failed to load finance overview';
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchProfitLoss() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await _apiService.get('/finance/profit-loss?start_date=$startDateStr&end_date=$endDateStr');
      if (res != null && res['success'] == true) {
        _profitLoss = res;
      } else {
        _error = res?['message'] ?? 'Failed to load Profit & Loss details';
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchBalanceSheet() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await _apiService.get('/finance/balance-sheet?end_date=$endDateStr');
      if (res != null && res['success'] == true) {
        _balanceSheet = res;
      } else {
        _error = res?['message'] ?? 'Failed to load Balance Sheet';
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchTrialBalance() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await _apiService.get('/finance/trial-balance?start_date=$startDateStr&end_date=$endDateStr');
      if (res != null && res['success'] == true) {
        _trialBalance = res;
      } else {
        _error = res?['message'] ?? 'Failed to load Trial Balance';
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchCashFlow() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await _apiService.get('/finance/cash-flow?start_date=$startDateStr&end_date=$endDateStr');
      if (res != null && res['success'] == true) {
        _cashFlow = res;
      } else {
        _error = res?['message'] ?? 'Failed to load Cash Flow Statement';
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchGeneralLedger() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await _apiService.get('/finance/general-ledger?start_date=$startDateStr&end_date=$endDateStr');
      if (res != null && res['success'] == true) {
        _generalLedger = res['accounts'] ?? [];
      } else {
        _error = res?['message'] ?? 'Failed to load General Ledger';
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchChartOfAccounts() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await _apiService.get('/finance/accounts');
      if (res != null && res['success'] == true) {
        _accounts = res['accounts'] ?? [];
      } else {
        _error = res?['message'] ?? 'Failed to load Chart of Accounts';
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> createAccount(Map<String, dynamic> data) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await _apiService.post('/finance/accounts', data);
      if (res != null && res['success'] == true) {
        await fetchChartOfAccounts();
        return true;
      } else {
        _error = res?['message'] ?? 'Failed to create account';
        return false;
      }
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchJournalEntries() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await _apiService.get('/finance/journal-entries');
      if (res != null && res['success'] == true) {
        _journalEntries = res['entries'] ?? [];
        _accounts = res['accounts'] ?? [];
      } else {
        _error = res?['message'] ?? 'Failed to load Journal Entries';
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> createJournalEntry(Map<String, dynamic> data) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await _apiService.post('/finance/journal-entries', data);
      if (res != null && res['success'] == true) {
        await fetchJournalEntries();
        return true;
      } else {
        _error = res?['message'] ?? 'Failed to create journal entry';
        return false;
      }
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchExpenses() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await _apiService.get('/finance/expenses');
      if (res != null && res['success'] == true) {
        _expenses = res['expenses'] ?? [];
        _expenseCategories = res['categories'] ?? [];
      } else {
        _error = res?['message'] ?? 'Failed to load Expenses';
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> createExpense(Map<String, dynamic> data) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await _apiService.post('/finance/expenses', data);
      if (res != null && res['success'] == true) {
        await fetchExpenses();
        await fetchOverview(); // Recalculate dashboard totals
        return true;
      } else {
        _error = res?['message'] ?? 'Failed to log expense';
        return false;
      }
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> deleteExpense(int id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final success = await _apiService.delete('/finance/expenses/$id');
      if (success) {
        await fetchExpenses();
        await fetchOverview(); // Recalculate dashboard totals
        return true;
      } else {
        _error = 'Failed to delete expense';
        return false;
      }
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> createExpenseCategory(String name) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await _apiService.post('/finance/expense-categories', {'name': name});
      if (res != null && res['success'] == true) {
        await fetchExpenses();
        return true;
      } else {
        _error = res?['message'] ?? 'Failed to create category';
        return false;
      }
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> updateExpenseCategory(int id, String name) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await _apiService.put('/finance/expense-categories/$id', {'name': name});
      if (res != null && res['success'] == true) {
        await fetchExpenses();
        return true;
      } else {
        _error = res?['message'] ?? 'Failed to update category';
        return false;
      }
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> deleteExpenseCategory(int id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final success = await _apiService.delete('/finance/expense-categories/$id');
      if (success) {
        await fetchExpenses();
        return true;
      } else {
        _error = 'Failed to delete category (make sure it has no expenses)';
        return false;
      }
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchSupplierBills() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await _apiService.get('/finance/supplier-bills');
      if (res != null && res['success'] == true) {
        _supplierBills = res['bills'] ?? [];
        _suppliers = res['suppliers'] ?? [];
        _expenseCategories = res['categories'] ?? [];
        _cashAccounts = res['cashAccounts'] ?? [];
      } else {
        _error = res?['message'] ?? 'Failed to load Supplier Bills';
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> createSupplier(String name) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.post('/inventory/suppliers', {
        'name': name,
      });

      if (response != null && response['success'] == true) {
        await fetchSupplierBills();
        return true;
      }
      _error = response?['message'] ?? 'Failed to create supplier';
      return false;
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> createSupplierBill(Map<String, dynamic> data) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await _apiService.post('/finance/supplier-bills', data);
      if (res != null && res['success'] == true) {
        await fetchSupplierBills();
        await fetchOverview();
        return true;
      } else {
        _error = res?['message'] ?? 'Failed to save supplier bill';
        return false;
      }
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> paySupplierBill(int id, double amount, int cashAccountId, String? notes) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await _apiService.post('/finance/supplier-bills/$id/pay', {
        'amount': amount,
        'cash_account_id': cashAccountId,
        'notes': notes,
      });
      if (res != null && res['success'] == true) {
        await fetchSupplierBills();
        await fetchOverview();
        return true;
      } else {
        _error = res?['message'] ?? 'Failed to post bill payment';
        return false;
      }
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchBudgets() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await _apiService.get('/finance/budgets');
      if (res != null && res['success'] == true) {
        _budgets = res['budgets'] ?? [];
        _accounts = res['accounts'] ?? [];
      } else {
        _error = res?['message'] ?? 'Failed to load Budgets';
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> createBudget(Map<String, dynamic> data) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await _apiService.post('/finance/budgets', data);
      if (res != null && res['success'] == true) {
        await fetchBudgets();
        return true;
      } else {
        _error = res?['message'] ?? 'Failed to create budget';
        return false;
      }
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchBanking() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await _apiService.get('/finance/banking');
      if (res != null && res['success'] == true) {
        _bankAccounts = res['accounts'] ?? [];
        _bankTransactions = res['transactions'] ?? [];
      } else {
        _error = res?['message'] ?? 'Failed to load Banking details';
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> createBankAccount(Map<String, dynamic> data, {XFile? qrImage}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      Map<String, dynamic>? res;
      if (qrImage != null) {
        final Map<String, String> fields = data.map((key, value) => MapEntry(key, value?.toString() ?? ''));
        res = await _apiService.postMultipart(
          '/finance/bank-accounts',
          fields,
          qrImage,
          fileFieldKey: 'qr_code',
        );
      } else {
        res = await _apiService.post('/finance/bank-accounts', data);
      }

      if (res != null && (res['success'] == true || res['account'] != null)) {
        await fetchBanking();
        return true;
      } else {
        _error = res?['message'] ?? 'Failed to create bank account';
        return false;
      }
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> updateBankAccount(int id, Map<String, dynamic> data, {XFile? qrImage, bool removeQr = false}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      Map<String, dynamic>? res;
      if (qrImage != null || removeQr) {
        final Map<String, String> fields = data.map((key, value) => MapEntry(key, value?.toString() ?? ''));
        if (removeQr) {
          fields['remove_qr'] = '1';
        }
        res = await _apiService.postMultipart(
          '/finance/bank-accounts/$id',
          fields,
          qrImage,
          method: 'POST',
          fileFieldKey: 'qr_code',
        );
      } else {
        res = await _apiService.put('/finance/bank-accounts/$id', data);
      }

      if (res != null && (res['success'] == true || res['account'] != null)) {
        await fetchBanking();
        return true;
      } else {
        _error = res?['message'] ?? 'Failed to update bank account';
        return false;
      }
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> deleteBankAccount(int id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final success = await _apiService.delete('/finance/bank-accounts/$id');
      if (success) {
        await fetchBanking();
        return true;
      } else {
        _error = 'Failed to delete bank account';
        return false;
      }
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchCashCounter() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await _apiService.get('/finance/cash-counter');
      if (res != null && res['success'] == true) {
        _cashRegister = res;
      } else {
        _error = res?['message'] ?? 'Failed to load Cash Register Counter';
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> openCashRegister(double openingBalance, String? notes) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await _apiService.post('/finance/cash-counter/open', {
        'opening_balance': openingBalance,
        'notes': notes,
      });
      if (res != null && res['success'] == true) {
        await fetchCashCounter();
        return true;
      } else {
        _error = res?['message'] ?? 'Failed to open register session';
        return false;
      }
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> closeCashRegister(int sessionId, double closingBalance, String? notes) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await _apiService.post('/finance/cash-counter/close/$sessionId', {
        'closing_balance': closingBalance,
        'notes': notes,
      });
      if (res != null && res['success'] == true) {
        await fetchCashCounter();
        return true;
      } else {
        _error = res?['message'] ?? 'Failed to close register session';
        return false;
      }
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> addCashCounterTransaction({
    required double amount,
    required String notes,
    required String type,
    int? expenseCategoryId,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await _apiService.post('/finance/cash-counter/transaction', {
        'amount': amount,
        'notes': notes,
        'type': type,
        if (expenseCategoryId != null) 'expense_category_id': expenseCategoryId,
      });
      if (res != null && res['success'] == true) {
        await fetchCashCounter();
        return true;
      } else {
        _error = res?['message'] ?? 'Failed to record drawer transaction';
        return false;
      }
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> deleteCashCounterTransaction(int transactionId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await _apiService.delete('/finance/cash-counter/transaction/$transactionId');
      if (res == true) {
        await fetchCashCounter();
        return true;
      } else {
        _error = 'Failed to delete counter transaction';
        return false;
      }
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
