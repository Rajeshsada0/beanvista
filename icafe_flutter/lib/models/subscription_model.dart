import '../core/utils/json_utils.dart';

class SubscriptionModel {
  final String status;
  final String planName;
  final bool isTrial;
  final String? trialEndsAt;
  final int trialDaysRemaining;
  final int ordersUsedThisMonth;
  final int maxOrdersPerMonth;
  final int? ordersRemainingThisMonth;
  final bool isOrderLimitReached;
  final bool canTakeOrders;

  const SubscriptionModel({
    required this.status,
    required this.planName,
    required this.isTrial,
    this.trialEndsAt,
    required this.trialDaysRemaining,
    required this.ordersUsedThisMonth,
    required this.maxOrdersPerMonth,
    this.ordersRemainingThisMonth,
    required this.isOrderLimitReached,
    required this.canTakeOrders,
  });

  factory SubscriptionModel.fromJson(Map<String, dynamic> json) {
    return SubscriptionModel(
      status: json['status'] ?? 'none',
      planName: json['plan_name'] ?? 'Free Trial',
      isTrial: json['is_trial'] ?? false,
      trialEndsAt: json['trial_ends_at'],
      trialDaysRemaining: JsonUtils.parseInt(json['trial_days_remaining']),
      ordersUsedThisMonth: JsonUtils.parseInt(json['orders_used_this_month']),
      maxOrdersPerMonth: JsonUtils.parseInt(json['max_orders_per_month'], -1),
      ordersRemainingThisMonth: JsonUtils.parseIntNullable(json['orders_remaining_this_month']),
      isOrderLimitReached: json['is_order_limit_reached'] ?? false,
      canTakeOrders: json['can_take_orders'] ?? true,
    );
  }

  Map<String, dynamic> toJson() => {
    'status': status,
    'plan_name': planName,
    'is_trial': isTrial,
    'trial_ends_at': trialEndsAt,
    'trial_days_remaining': trialDaysRemaining,
    'orders_used_this_month': ordersUsedThisMonth,
    'max_orders_per_month': maxOrdersPerMonth,
    'orders_remaining_this_month': ordersRemainingThisMonth,
    'is_order_limit_reached': isOrderLimitReached,
    'can_take_orders': canTakeOrders,
  };

  bool get isUnlimitedOrders => maxOrdersPerMonth == -1;
}
