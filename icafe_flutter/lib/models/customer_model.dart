import '../core/utils/json_utils.dart';

class CustomerModel {
  final int id;
  final String name;
  final String? phone;
  final String? email;
  final double loyaltyPoints;
  final double lifetimePoints;
  final double? totalSpent;
  final String? birthday;
  final double? creditLimit;
  final double? dueAmount;
  final int? ordersCount;
  final DateTime? createdAt;

  const CustomerModel({
    required this.id,
    required this.name,
    this.phone,
    this.email,
    this.loyaltyPoints = 0,
    this.lifetimePoints = 0,
    this.totalSpent,
    this.birthday,
    this.creditLimit,
    this.dueAmount,
    this.ordersCount,
    this.createdAt,
  });

  factory CustomerModel.fromJson(Map<String, dynamic> json) {
    return CustomerModel(
      id: JsonUtils.parseInt(json['id']),
      name: json['name'] ?? '',
      phone: json['phone'],
      email: json['email'],
      loyaltyPoints: json['loyalty_points'] != null 
          ? (double.tryParse(json['loyalty_points']?.toString() ?? '0') ?? 0)
          : (double.tryParse(json['points']?.toString() ?? '0') ?? 0),
      lifetimePoints:
          double.tryParse(json['lifetime_points']?.toString() ?? '0') ?? 0,
      totalSpent: json['total_spent'] != null
          ? double.tryParse(json['total_spent'].toString())
          : null,
      birthday: json['birthday'],
      creditLimit: json['credit_limit'] != null
          ? double.tryParse(json['credit_limit'].toString())
          : null,
      dueAmount: json['due_amount'] != null
          ? double.tryParse(json['due_amount'].toString())
          : null,
      ordersCount: JsonUtils.parseIntNullable(json['orders_count']),
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'])
          : null,
    );
  }

  String get initials {
    final parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return name.substring(0, name.length >= 2 ? 2 : 1).toUpperCase();
  }

  bool get hasDueAmount => (dueAmount ?? 0) > 0;
  bool get hasCredit => (creditLimit ?? 0) > 0;
}
