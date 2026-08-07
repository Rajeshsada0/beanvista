import '../core/utils/json_utils.dart';
import 'menu_model.dart';

class LoyaltyRewardModel {
  final int id;
  final String name;
  final String? description;
  final int pointsRequired;
  final String type; // gift, discount, voucher
  final int? menuItemId;
  final String? discountType; // percentage, fixed
  final double? discountValue;
  final String? code;
  final bool status;
  final String? imagePath;
  final MenuModel? menuItem;

  const LoyaltyRewardModel({
    required this.id,
    required this.name,
    this.description,
    this.pointsRequired = 0,
    required this.type,
    this.menuItemId,
    this.discountType,
    this.discountValue,
    this.code,
    this.status = true,
    this.imagePath,
    this.menuItem,
  });

  factory LoyaltyRewardModel.fromJson(Map<String, dynamic> json) {
    return LoyaltyRewardModel(
      id: JsonUtils.parseInt(json['id']),
      name: json['name'] ?? '',
      description: json['description'],
      pointsRequired: JsonUtils.parseInt(json['points_required']),
      type: json['type'] ?? 'gift',
      menuItemId: JsonUtils.parseIntNullable(json['menu_item_id']),
      discountType: json['discount_type'],
      discountValue: json['discount_value'] != null
          ? double.tryParse(json['discount_value'].toString())
          : null,
      code: json['code'],
      status: json['status'] == 1 || json['status'] == true,
      imagePath: json['image_path'],
      menuItem: json['menu_item'] != null
          ? MenuModel.fromJson(json['menu_item'])
          : null,
    );
  }

  LoyaltyRewardModel copyWith({
    int? id,
    String? name,
    String? description,
    int? pointsRequired,
    String? type,
    int? menuItemId,
    String? discountType,
    double? discountValue,
    String? code,
    bool? status,
    String? imagePath,
    MenuModel? menuItem,
  }) {
    return LoyaltyRewardModel(
      id: id ?? this.id,
      name: name ?? this.name,
      description: description ?? this.description,
      pointsRequired: pointsRequired ?? this.pointsRequired,
      type: type ?? this.type,
      menuItemId: menuItemId ?? this.menuItemId,
      discountType: discountType ?? this.discountType,
      discountValue: discountValue ?? this.discountValue,
      code: code ?? this.code,
      status: status ?? this.status,
      imagePath: imagePath ?? this.imagePath,
      menuItem: menuItem ?? this.menuItem,
    );
  }
}
