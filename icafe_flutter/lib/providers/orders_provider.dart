import 'package:flutter/foundation.dart';
import '../core/services/api_service.dart';
import '../core/utils/json_utils.dart';

import 'tables_provider.dart';

class BankAccountItem {
  final int id;
  final String name;
  final String number;
  final String bankName;
  final String type;
  final double balance;

  BankAccountItem({
    required this.id,
    required this.name,
    required this.number,
    required this.bankName,
    this.type = '',
    this.balance = 0.0,
  });

  String get accountName => name;
  String get accountNumber => number;

  factory BankAccountItem.fromJson(Map<String, dynamic> json) {
    return BankAccountItem(
      id: JsonUtils.parseInt(json['id']),
      name: (json['name'] ?? json['account_name'] ?? '').toString(),
      number: (json['number'] ?? json['account_number'] ?? '').toString(),
      bankName: (json['bank_name'] ?? json['bank'] ?? '').toString(),
      type: (json['type'] ?? json['account_type'] ?? '').toString(),
      balance: JsonUtils.parseDouble(json['balance'] ?? json['current_balance']),
    );
  }
}

class OrderItemDetails {
  final int? menuId;
  final String name;
  final int qty;
  final double price;
  final String? kdsStatus;

  OrderItemDetails({
    this.menuId,
    required this.name,
    required this.qty,
    required this.price,
    this.kdsStatus,
  });

  factory OrderItemDetails.fromJson(Map<String, dynamic> json) {
    return OrderItemDetails(
      menuId: JsonUtils.parseIntNullable(json['menu_id'] ?? json['id'] ?? json['menuId']),
      name: (json['name'] ?? json['item_name'] ?? json['title'] ?? '').toString(),
      qty: JsonUtils.parseInt(json['qty'] ?? json['quantity'] ?? json['count'] ?? 1),
      price: JsonUtils.parseDouble(json['price'] ?? json['unit_price'] ?? json['amount'] ?? json['rate']),
      kdsStatus: (json['kds_status'] ?? json['status'])?.toString(),
    );
  }
}

class OrderItemData {
  final int id;
  final String number;
  final String? type;
  final String? typeIcon;
  final String? table;
  final String? customer;
  final String status;
  final double total;
  final String time;
  final int itemsCount;
  final List<OrderItemDetails> itemsList;
  final List<dynamic> items;

  OrderItemData({
    required this.id,
    required this.number,
    this.type,
    this.typeIcon,
    this.table,
    this.customer,
    required this.status,
    required this.total,
    required this.time,
    required this.itemsCount,
    required this.itemsList,
    required this.items,
  });

  factory OrderItemData.fromJson(Map<String, dynamic> json) {
    final rawList = json['items_list'] ?? json['items'] ?? json['order_items'];
    List<OrderItemDetails> details = [];
    if (rawList is List) {
      for (var e in rawList) {
        if (e is Map<String, dynamic>) {
          details.add(OrderItemDetails.fromJson(e));
        } else if (e is Map) {
          details.add(OrderItemDetails.fromJson(Map<String, dynamic>.from(e)));
        }
      }
    }

    int parsedItemsCount = JsonUtils.parseInt(json['items_count'] ?? json['items_qty'] ?? json['total_items']);
    if (parsedItemsCount == 0 && details.isNotEmpty) {
      parsedItemsCount = details.length;
    }

    String tableStr = '';
    if (json['table'] != null) {
      if (json['table'] is Map) {
        tableStr = (json['table']['name'] ?? json['table']['number'] ?? '').toString();
      } else {
        tableStr = json['table'].toString();
      }
    }

    String customerStr = '';
    if (json['customer'] != null) {
      if (json['customer'] is Map) {
        customerStr = (json['customer']['name'] ?? json['customer']['phone'] ?? '').toString();
      } else {
        customerStr = json['customer'].toString();
      }
    }

    return OrderItemData(
      id: JsonUtils.parseInt(json['id'] ?? json['order_id']),
      number: (json['number'] ?? json['order_number'] ?? json['code'] ?? '').toString(),
      type: (json['type'] ?? json['order_type'] ?? 'Dine-In').toString(),
      typeIcon: json['typeIcon']?.toString(),
      table: tableStr.isNotEmpty ? tableStr : null,
      customer: customerStr.isNotEmpty ? customerStr : null,
      status: (json['status'] ?? 'pending').toString(),
      total: JsonUtils.parseDouble(json['total'] ?? json['total_amount'] ?? json['grand_total'] ?? json['amount']),
      time: (json['time'] ?? json['created_at'] ?? json['date'] ?? '').toString(),
      itemsCount: parsedItemsCount,
      itemsList: details,
      items: rawList is List ? rawList : [],
    );
  }

  OrderItemData copyWithNumber(String newNumber) {
    return OrderItemData(
      id: id,
      number: newNumber,
      type: type,
      typeIcon: typeIcon,
      table: table,
      customer: customer,
      status: status,
      total: total,
      time: time,
      itemsCount: itemsCount,
      itemsList: itemsList,
      items: items,
    );
  }
}

class OrdersProvider extends ChangeNotifier {
  final ApiService _apiService;
  TablesProvider? _tablesProvider;
  List<OrderItemData> _orders = [];
  List<BankAccountItem> _bankAccounts = [];
  bool _isLoading = false;
  String? _error;

  String? _preselectedOrderType;
  String? _preselectedTable;
  int? _modifyingOrderId;
  String? _modifyingOrderNumber;
  List<Map<String, dynamic>>? _modifyingCartItems;

  OrdersProvider({required ApiService apiService, TablesProvider? tablesProvider})
      : _apiService = apiService,
        _tablesProvider = tablesProvider;

  void setTablesProvider(TablesProvider tp) {
    _tablesProvider = tp;
  }

  void _refreshTablesAfterOrderChange() {
    _tablesProvider?.fetchTables();
    Future.delayed(const Duration(milliseconds: 300), () {
      _tablesProvider?.fetchTables();
    });
    Future.delayed(const Duration(milliseconds: 800), () {
      _tablesProvider?.fetchTables();
    });
  }

  List<OrderItemData> get orders => _orders;
  List<BankAccountItem> get bankAccounts => _bankAccounts;
  bool get isLoading => _isLoading;
  String? get error => _error;
  
  String? get preselectedOrderType => _preselectedOrderType;
  String? get preselectedTable => _preselectedTable;
  int? get modifyingOrderId => _modifyingOrderId;
  String? get modifyingOrderNumber => _modifyingOrderNumber;
  List<Map<String, dynamic>>? get modifyingCartItems => _modifyingCartItems;

  void setPreselectedOrder(String? type, String? table) {
    _preselectedOrderType = type;
    _preselectedTable = table;
    notifyListeners();
  }

  void startOrderModification(int orderId, String orderNumber, List<Map<String, dynamic>> items, String? type, String? table) {
    _modifyingOrderId = orderId;
    _modifyingOrderNumber = orderNumber;
    _modifyingCartItems = items;
    _preselectedOrderType = type;
    _preselectedTable = table;
    notifyListeners();
  }

  void clearModification() {
    _modifyingOrderId = null;
    _modifyingOrderNumber = null;
    _modifyingCartItems = null;
    notifyListeners();
  }

  Future<void> fetchBankAccounts() async {
    try {
      final response = await _apiService.get('/bank-accounts');
      if (response != null && response['data'] != null) {
        final list = response['data'] as List;
        _bankAccounts = list.map((e) => BankAccountItem.fromJson(e as Map<String, dynamic>)).toList();
        notifyListeners();
      }
    } catch (e) {
      debugPrint('Failed to fetch bank accounts: $e');
    }
  }

  List<OrderItemData> _formatTenantOrderNumbers(List<OrderItemData> items) {
    if (items.isEmpty) return items;

    final sorted = List<OrderItemData>.from(items)..sort((a, b) => a.id.compareTo(b.id));

    final Map<int, String> idToNumberMap = {};
    for (int i = 0; i < sorted.length; i++) {
      final item = sorted[i];
      final rawNum = item.number.trim();

      final isRawGlobalId = rawNum.isEmpty ||
          rawNum == item.id.toString() ||
          rawNum == '#${item.id}' ||
          (rawNum.startsWith('#') && int.tryParse(rawNum.substring(1)) == item.id);

      if (isRawGlobalId) {
        idToNumberMap[item.id] = '#${i + 1}';
      } else {
        idToNumberMap[item.id] = rawNum;
      }
    }

    return items.map((o) {
      final formatted = idToNumberMap[o.id];
      if (formatted != null && formatted != o.number) {
        return o.copyWithNumber(formatted);
      }
      return o;
    }).toList();
  }

  Future<void> fetchOrders({String status = 'all'}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.get('/orders?status=$status');
      if (response != null && response['error'] != true && response['data'] != null) {
        final list = response['data'] as List;
        final rawOrders = <OrderItemData>[];
        for (var e in list) {
          try {
            if (e is Map<String, dynamic>) {
              rawOrders.add(OrderItemData.fromJson(e));
            } else if (e is Map) {
              rawOrders.add(OrderItemData.fromJson(Map<String, dynamic>.from(e)));
            }
          } catch (err) {
            debugPrint('Error parsing order item: $err');
          }
        }
        _orders = _formatTenantOrderNumbers(rawOrders);
      }
    } catch (e) {
      _error = 'Failed to fetch orders: $e';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<OrderItemData?> fetchOrderById(int orderId) async {
    try {
      final response = await _apiService.get('/orders/$orderId');
      if (response != null && response['data'] != null) {
        try {
          final orderData = OrderItemData.fromJson(response['data'] as Map<String, dynamic>);
          return orderData;
        } catch (e) {
          debugPrint('Error parsing OrderItemData: $e');
        }
      }
    } catch (e) {
      debugPrint('Failed to fetch order $orderId: $e');
    }
    return null;
  }

  Future<bool> placeOrder({
    required int? tableId,
    required String orderType,
    required int? customerId,
    required List<Map<String, dynamic>> items,
    required String paymentMethod,
    required double cashAmount,
    required double onlineAmount,
    required String status,
    int? bankAccountId,
    int? orderId,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final payload = {
        'table_id': tableId,
        'order_type': orderType,
        'customer_id': customerId,
        'payment_method': paymentMethod,
        'cash_amount': cashAmount,
        'online_amount': onlineAmount,
        'status': status,
        'items': items.map((i) => {
          'menu_id': i['menu_id'],
          'quantity': i['quantity'],
          if (i['kds_status'] != null) 'kds_status': i['kds_status'],
        }).toList(),
        if (bankAccountId != null) 'bank_account_id': bankAccountId,
        if (orderId != null) 'order_id': orderId,
      };

      debugPrint('DEBUG PLACEORDER PAYLOAD: $payload');
      final response = await _apiService.post('/orders', payload);
      debugPrint('DEBUG PLACEORDER RESPONSE: $response');
      _isLoading = false;
      if (response != null && (response['success'] == true || response['status'] == 'success' || (response['error'] != true && response['id'] != null))) {
        _refreshTablesAfterOrderChange();
        _apiService.logActivity(
          'New Order Placed',
          'Placed $orderType order with ${items.length} item(s)',
          type: 'order',
        );
        notifyListeners();
        return true;
      } else {
        _error = response?['message'] ?? response?['error_message'] ?? 'Failed to place order';
        debugPrint('DEBUG PLACEORDER ERROR: $_error');
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      debugPrint('DEBUG PLACEORDER EXCEPTION: $e');
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> completeOrder(int orderId, {String? paymentMethod, int? bankAccountId}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final Map<String, dynamic> payload = {'status': 'completed'};
      if (paymentMethod != null) payload['payment_method'] = paymentMethod;
      if (bankAccountId != null) payload['bank_account_id'] = bankAccountId;
      final response = await _apiService.patch('/orders/$orderId', payload);
      final success = response != null && response['success'] == true;
      _isLoading = false;
      if (success) {
        _refreshTablesAfterOrderChange();
        _apiService.logActivity(
          'Order Completed',
          'Completed order #$orderId via ${paymentMethod ?? 'cash'}',
          type: 'payment',
        );
        fetchOrders();
      } else {
        notifyListeners();
      }
      return success;
    } catch (e) {
      _error = 'Failed to complete order: $e';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> updateOrderStatus(int orderId, String status) async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final response = await _apiService.patch('/orders/$orderId', {'status': status});
      final success = response != null && response['success'] == true;
      _isLoading = false;
      if (success) {
        _refreshTablesAfterOrderChange();
        _apiService.logActivity(
          'Order Status Updated',
          'Order #$orderId changed to $status',
          type: 'order',
        );
        fetchOrders();
      } else {
        notifyListeners();
      }
      return success;
    } catch (e) {
      _error = 'Failed to update order status: $e';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> updateKdsItemStatus(int itemId, String nextStatus) async {
    try {
      final response = await _apiService.post('/order-items/$itemId/status', {
        'status': nextStatus,
      });
      final success = response != null && response['success'] == true;
      if (success) {
        fetchOrders();
      }
      return success;
    } catch (e) {
      return false;
    }
  }

  Future<bool> bulkUpdateKdsItemStatus(List<int> itemIds, String nextStatus) async {
    try {
      final response = await _apiService.post('/order-items/bulk-status', {
        'item_ids': itemIds,
        'status': nextStatus,
      });
      final success = response != null && response['success'] == true;
      if (success) {
        fetchOrders();
      }
      return success;
    } catch (e) {
      return false;
    }
  }
}
