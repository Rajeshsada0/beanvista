import 'package:flutter/foundation.dart';
import 'package:image_picker/image_picker.dart';
import '../core/services/api_service.dart';
import '../core/utils/json_utils.dart';

class SubscriptionPlan {
  final int id;
  final String name;
  final String description;
  final double priceMonthly;
  final double price3Months;
  final double price6Months;
  final double priceYearly;
  final int trialDays;
  final int maxBranches;
  final int maxTables;
  final int maxAccounts;
  final int maxUsers;
  final List<String> features;
  final bool isActive;

  SubscriptionPlan({
    required this.id,
    required this.name,
    required this.description,
    required this.priceMonthly,
    required this.price3Months,
    required this.price6Months,
    required this.priceYearly,
    required this.trialDays,
    required this.maxBranches,
    required this.maxTables,
    required this.maxAccounts,
    required this.maxUsers,
    required this.features,
    required this.isActive,
  });

  factory SubscriptionPlan.fromJson(Map<String, dynamic> json) {
    List<String> feats = [];
    if (json['features'] != null) {
      if (json['features'] is List) {
        feats = List<String>.from(json['features'].map((e) => e.toString()));
      } else if (json['features'] is Map) {
        feats = List<String>.from((json['features'] as Map).values.map((e) => e.toString()));
      }
    }

    return SubscriptionPlan(
      id: JsonUtils.parseInt(json['id']),
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      priceMonthly: JsonUtils.parseDouble(json['price_monthly']),
      price3Months: JsonUtils.parseDouble(json['price_3_months']),
      price6Months: JsonUtils.parseDouble(json['price_6_months']),
      priceYearly: JsonUtils.parseDouble(json['price_yearly']),
      trialDays: JsonUtils.parseInt(json['trial_days']),
      maxBranches: JsonUtils.parseInt(json['max_branches']),
      maxTables: JsonUtils.parseInt(json['max_tables']),
      maxAccounts: JsonUtils.parseInt(json['max_accounts']),
      maxUsers: JsonUtils.parseInt(json['max_users']),
      features: feats,
      isActive: json['is_active'] == true || json['is_active'] == 1 || json['is_active'] == '1',
    );
  }
}

class SubscriptionInfo {
  final int id;
  final int planId;
  final String planName;
  final String status;
  final String billingCycle;
  final double amountPaid;
  final String? startDate;
  final String? endsAt;
  final bool isExpired;

  SubscriptionInfo({
    required this.id,
    required this.planId,
    required this.planName,
    required this.status,
    required this.billingCycle,
    required this.amountPaid,
    this.startDate,
    this.endsAt,
    required this.isExpired,
  });

  factory SubscriptionInfo.fromJson(Map<String, dynamic> json) {
    return SubscriptionInfo(
      id: JsonUtils.parseInt(json['id']),
      planId: JsonUtils.parseInt(json['plan_id']),
      planName: json['plan_name'] ?? 'N/A',
      status: json['status'] ?? '',
      billingCycle: json['billing_cycle'] ?? '',
      amountPaid: JsonUtils.parseDouble(json['amount_paid']),
      startDate: json['start_date'],
      endsAt: json['ends_at'],
      isExpired: json['is_expired'] == true || json['is_expired'] == 1 || json['is_expired'] == '1',
    );
  }
}

class PaymentMethodInfo {
  final int id;
  final String type;
  final String title;
  final String details;
  final String? qrCodeUrl;
  final bool isActive;

  PaymentMethodInfo({
    required this.id,
    required this.type,
    required this.title,
    required this.details,
    this.qrCodeUrl,
    required this.isActive,
  });

  factory PaymentMethodInfo.fromJson(Map<String, dynamic> json) {
    return PaymentMethodInfo(
      id: JsonUtils.parseInt(json['id']),
      type: json['type'] ?? '',
      title: json['title'] ?? '',
      details: json['details'] ?? '',
      qrCodeUrl: json['qr_code_url'],
      isActive: json['is_active'] == true || json['is_active'] == 1 || json['is_active'] == '1',
    );
  }
}

class PaymentRequestInfo {
  final int id;
  final int planId;
  final String planName;
  final String billingCycle;
  final double amount;
  final int paymentMethodId;
  final String paymentMethodTitle;
  final String referenceNumber;
  final String? receiptUrl;
  final String? notes;
  final String status;
  final String? rejectionReason;

  PaymentRequestInfo({
    required this.id,
    required this.planId,
    required this.planName,
    required this.billingCycle,
    required this.amount,
    required this.paymentMethodId,
    required this.paymentMethodTitle,
    required this.referenceNumber,
    this.receiptUrl,
    this.notes,
    required this.status,
    this.rejectionReason,
  });

  factory PaymentRequestInfo.fromJson(Map<String, dynamic> json) {
    final planJson = json['plan'] ?? {};
    final pmJson = json['payment_method'] ?? {};
    return PaymentRequestInfo(
      id: JsonUtils.parseInt(json['id']),
      planId: JsonUtils.parseInt(json['plan_id']),
      planName: planJson['name'] ?? 'N/A',
      billingCycle: json['billing_cycle'] ?? '',
      amount: JsonUtils.parseDouble(json['amount']),
      paymentMethodId: JsonUtils.parseInt(json['payment_method_id']),
      paymentMethodTitle: pmJson['title'] ?? 'N/A',
      referenceNumber: json['reference_number'] ?? '',
      receiptUrl: json['receipt_url'],
      notes: json['notes'],
      status: json['status'] ?? 'pending',
      rejectionReason: json['rejection_reason'],
    );
  }
}

class TrialInfo {
  final String endsAt;
  final int daysRemaining;
  final bool isExpired;

  TrialInfo({
    required this.endsAt,
    required this.daysRemaining,
    required this.isExpired,
  });

  factory TrialInfo.fromJson(Map<String, dynamic> json) {
    return TrialInfo(
      endsAt: json['ends_at'] ?? '',
      daysRemaining: JsonUtils.parseInt(json['days_remaining']),
      isExpired: json['is_expired'] == true || json['is_expired'] == 1 || json['is_expired'] == '1',
    );
  }
}

class SubscriptionsProvider extends ChangeNotifier {
  final ApiService _apiService;

  List<SubscriptionPlan> _plans = [];
  List<PaymentMethodInfo> _paymentMethods = [];
  SubscriptionInfo? _currentSubscription;
  PaymentRequestInfo? _pendingRequest;
  TrialInfo? _trialInfo;

  bool _isLoading = false;
  String? _error;

  SubscriptionsProvider({required ApiService apiService}) : _apiService = apiService;

  List<SubscriptionPlan> get plans => _plans;
  List<PaymentMethodInfo> get paymentMethods => _paymentMethods;
  SubscriptionInfo? get currentSubscription => _currentSubscription;
  PaymentRequestInfo? get pendingRequest => _pendingRequest;
  TrialInfo? get trialInfo => _trialInfo;

  bool get isLoading => _isLoading;
  String? get error => _error;
  String? get token => _apiService.token;

  Future<void> fetchSubscriptionDetails() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await _apiService.get('/subscription');
      if (res != null && res['success'] == true) {
        final List<dynamic> planList = res['plans'] ?? [];
        _plans = planList.map((json) => SubscriptionPlan.fromJson(json as Map<String, dynamic>)).toList();

        final List<dynamic> pmList = res['payment_methods'] ?? [];
        _paymentMethods = pmList.map((json) => PaymentMethodInfo.fromJson(json as Map<String, dynamic>)).toList();

        if (res['subscription'] != null) {
          _currentSubscription = SubscriptionInfo.fromJson(res['subscription'] as Map<String, dynamic>);
        } else {
          _currentSubscription = null;
        }

        if (res['pending_request'] != null) {
          _pendingRequest = PaymentRequestInfo.fromJson(res['pending_request'] as Map<String, dynamic>);
        } else {
          _pendingRequest = null;
        }

        if (res['trial'] != null) {
          _trialInfo = TrialInfo.fromJson(res['trial'] as Map<String, dynamic>);
        } else {
          _trialInfo = null;
        }
      } else {
        _error = res?['message'] ?? 'Failed to load subscription details';
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> checkout({
    required int planId,
    required String billingCycle,
    required double amount,
    required int paymentMethodId,
    required String referenceNumber,
    required XFile receiptFile,
    String? notes,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final Map<String, String> fields = {
        'plan_id': planId.toString(),
        'billing_cycle': billingCycle,
        'amount': amount.toString(),
        'payment_method_id': paymentMethodId.toString(),
        'reference_number': referenceNumber,
        if (notes != null) 'notes': notes,
      };

      final res = await _apiService.postMultipart(
        '/subscription/checkout',
        fields,
        receiptFile,
        fileFieldKey: 'receipt',
      );

      if (res != null && res['success'] == true) {
        if (res['pending_request'] != null) {
          _pendingRequest = PaymentRequestInfo.fromJson(res['pending_request'] as Map<String, dynamic>);
        }
        notifyListeners();
        return true;
      }
      _error = res?['message'] ?? 'Failed to submit verification request';
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
    return false;
  }

  Future<bool> cancelPendingRequest(int requestId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await _apiService.delete('/subscription/cancel-request/$requestId');
      if (res) {
        _pendingRequest = null;
        notifyListeners();
        return true;
      }
      _error = 'Failed to cancel verification request';
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
    return false;
  }
}
