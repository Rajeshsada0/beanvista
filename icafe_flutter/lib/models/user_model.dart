// Models
import '../core/utils/json_utils.dart';

import 'subscription_model.dart';

class UserModel {
  final int id;
  final String name;
  final String email;
  final String? phone;
  final String role;
  final int? tenantId;
  final int? primaryBranchId;
  final String? token;
  final String? emailVerifiedAt;
  final bool isVerified;
  final SubscriptionModel? subscription;

  const UserModel({
    required this.id,
    required this.name,
    required this.email,
    this.phone,
    required this.role,
    this.tenantId,
    this.primaryBranchId,
    this.token,
    this.emailVerifiedAt,
    this.isVerified = false,
    this.subscription,
  });


  factory UserModel.fromJson(Map<String, dynamic> json) {
    final emailVerifiedAt = json['email_verified_at'];
    final isVerifiedBool = json['is_verified'] == true || json['is_verified'] == 1 || json['is_verified'] == '1';
    final hasVerifiedDate = emailVerifiedAt != null && emailVerifiedAt.toString().isNotEmpty && emailVerifiedAt.toString() != 'null';

    return UserModel(
      id: JsonUtils.parseInt(json['id']),
      name: json['name'] ?? '',
      email: json['email'] ?? '',
      phone: json['phone'],
      role: json['role'] ?? 'staff',
      tenantId: JsonUtils.parseIntNullable(json['tenant_id']),
      primaryBranchId: JsonUtils.parseIntNullable(json['primary_branch_id']),
      token: json['token'],
      emailVerifiedAt: emailVerifiedAt?.toString(),
      isVerified: isVerifiedBool || hasVerifiedDate,
      subscription: json['subscription'] != null ? SubscriptionModel.fromJson(json['subscription']) : null,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'email': email,
    'phone': phone,
    'role': role,
    'tenant_id': tenantId,
    'primary_branch_id': primaryBranchId,
    'email_verified_at': emailVerifiedAt,
    'is_verified': isVerified,
    'subscription': subscription?.toJson(),
  };

  bool get isAdmin => role == 'admin';
  bool get isStaff => role == 'staff' || role == 'admin';
  bool get isKitchen => role == 'kitchen';
  bool get isSuperAdmin => role == 'super_admin';

  String get initials {
    final parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return name.substring(0, name.length >= 2 ? 2 : 1).toUpperCase();
  }
}
