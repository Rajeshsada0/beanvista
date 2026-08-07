import '../core/utils/json_utils.dart';
import 'menu_model.dart';

class OrderItemModel {
  final int id;
  final int? orderId;
  final int menuId;
  final String menuName;
  final int quantity;
  final double price;
  final String? kdsStatus;
  final bool isRedeemed;
  final double? pointsCost;
  final String? notes;
  final DateTime? startedAt;
  final DateTime? finishedAt;
  final DateTime? deliveredAt;
  final DateTime? createdAt;
  final MenuModel? menu;
  final List<AddonModel> addons;

  // For cart usage only (not from API)
  final List<AddonModel> selectedAddons;

  const OrderItemModel({
    required this.id,
    this.orderId,
    required this.menuId,
    required this.menuName,
    required this.quantity,
    required this.price,
    this.kdsStatus,
    this.isRedeemed = false,
    this.pointsCost,
    this.notes,
    this.startedAt,
    this.finishedAt,
    this.deliveredAt,
    this.createdAt,
    this.menu,
    this.addons = const [],
    this.selectedAddons = const [],
  });

  factory OrderItemModel.fromJson(Map<String, dynamic> json) {
    return OrderItemModel(
      id: JsonUtils.parseInt(json['id']),
      orderId: JsonUtils.parseIntNullable(json['order_id']),
      menuId: JsonUtils.parseInt(json['menu_id']),
      menuName: json['menu']?['name'] ?? json['menu_name'] ?? '',
      quantity: JsonUtils.parseInt(json['quantity'], 1),
      price: double.tryParse(json['price']?.toString() ?? '0') ?? 0,
      kdsStatus: json['kds_status'],
      isRedeemed: json['is_redeemed'] == true || json['is_redeemed'] == 1,
      pointsCost: json['points_cost'] != null
          ? double.tryParse(json['points_cost'].toString())
          : null,
      notes: json['notes'],
      startedAt: json['started_at'] != null
          ? DateTime.tryParse(json['started_at'])
          : null,
      finishedAt: json['finished_at'] != null
          ? DateTime.tryParse(json['finished_at'])
          : null,
      deliveredAt: json['delivered_at'] != null
          ? DateTime.tryParse(json['delivered_at'])
          : null,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'])
          : null,
      menu: json['menu'] != null ? MenuModel.fromJson(json['menu']) : null,
      addons: json['addons'] != null
          ? (json['addons'] as List)
              .map((a) => AddonModel.fromJson(a))
              .toList()
          : [],
    );
  }

  double get subtotal {
    final addonsTotal = selectedAddons.fold(0.0, (sum, a) => sum + a.price);
    return (price + addonsTotal) * quantity;
  }

  String get kdsStatusDisplay {
    switch (kdsStatus ?? 'pending') {
      case 'pending': return 'Pending';
      case 'preparing': return 'Preparing';
      case 'ready': return 'Ready';
      case 'delivered': return 'Delivered';
      default: return 'Pending';
    }
  }

  Duration? get waitDuration {
    if (createdAt == null) return null;
    return DateTime.now().difference(createdAt!);
  }

  OrderItemModel copyWith({
    int? id,
    int? orderId,
    int? menuId,
    String? menuName,
    int? quantity,
    double? price,
    String? kdsStatus,
    List<AddonModel>? selectedAddons,
    String? notes,
  }) {
    return OrderItemModel(
      id: id ?? this.id,
      orderId: orderId ?? this.orderId,
      menuId: menuId ?? this.menuId,
      menuName: menuName ?? this.menuName,
      quantity: quantity ?? this.quantity,
      price: price ?? this.price,
      kdsStatus: kdsStatus ?? this.kdsStatus,
      selectedAddons: selectedAddons ?? this.selectedAddons,
      notes: notes ?? this.notes,
      isRedeemed: isRedeemed,
      menu: menu,
      addons: addons,
    );
  }
}
