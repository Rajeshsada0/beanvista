import '../core/utils/json_utils.dart';
import 'order_item_model.dart';
import 'customer_model.dart';
import 'table_model.dart';

class OrderModel {
  final int id;
  final String orderNumber;
  final int? tableId;
  final int? customerId;
  final int? waiterId;
  final String status;
  final double totalAmount;
  final double? discountPercentage;
  final double? discountAmount;
  final double? pointsRedeemed;
  final double? tipAmount;
  final double? taxAmount;
  final double grandTotal;
  final double? pointsEarned;
  final double? cashAmount;
  final double? onlineAmount;
  final double? creditAmount;
  final double? duePaymentAmount;
  final String? paymentMethod;
  final String? notes;
  final String orderType;
  final String? carPlate;
  final String? carDescription;
  final int? guestCount;
  final DateTime? scheduledAt;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final TableModel? table;
  final CustomerModel? customer;
  final List<OrderItemModel> items;
  final Map<String, dynamic>? waiter;

  const OrderModel({
    required this.id,
    required this.orderNumber,
    this.tableId,
    this.customerId,
    this.waiterId,
    required this.status,
    required this.totalAmount,
    this.discountPercentage,
    this.discountAmount,
    this.pointsRedeemed,
    this.tipAmount,
    this.taxAmount,
    required this.grandTotal,
    this.pointsEarned,
    this.cashAmount,
    this.onlineAmount,
    this.creditAmount,
    this.duePaymentAmount,
    this.paymentMethod,
    this.notes,
    this.orderType = 'Dine-In',
    this.carPlate,
    this.carDescription,
    this.guestCount,
    this.scheduledAt,
    this.createdAt,
    this.updatedAt,
    this.table,
    this.customer,
    this.items = const [],
    this.waiter,
  });

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    return OrderModel(
      id: JsonUtils.parseInt(json['id']),
      orderNumber: (json['display_number'] ?? json['order_number'] ?? json['number'] ?? '#${json['id']}').toString(),
      tableId: JsonUtils.parseIntNullable(json['table_id']),
      customerId: JsonUtils.parseIntNullable(json['customer_id']),
      waiterId: JsonUtils.parseIntNullable(json['waiter_id']),
      status: json['status'] ?? 'pending',
      totalAmount: double.tryParse(json['total_amount']?.toString() ?? '0') ?? 0,
      discountPercentage: json['discount_percentage'] != null
          ? double.tryParse(json['discount_percentage'].toString())
          : null,
      discountAmount: json['discount_amount'] != null
          ? double.tryParse(json['discount_amount'].toString())
          : null,
      pointsRedeemed: json['points_redeemed'] != null
          ? double.tryParse(json['points_redeemed'].toString())
          : null,
      tipAmount: json['tip_amount'] != null
          ? double.tryParse(json['tip_amount'].toString())
          : null,
      taxAmount: json['tax_amount'] != null
          ? double.tryParse(json['tax_amount'].toString())
          : null,
      grandTotal: double.tryParse(json['grand_total']?.toString() ?? '0') ?? 0,
      pointsEarned: json['points_earned'] != null
          ? double.tryParse(json['points_earned'].toString())
          : null,
      cashAmount: json['cash_amount'] != null
          ? double.tryParse(json['cash_amount'].toString())
          : null,
      onlineAmount: json['online_amount'] != null
          ? double.tryParse(json['online_amount'].toString())
          : null,
      creditAmount: json['credit_amount'] != null
          ? double.tryParse(json['credit_amount'].toString())
          : null,
      duePaymentAmount: json['due_payment_amount'] != null
          ? double.tryParse(json['due_payment_amount'].toString())
          : null,
      paymentMethod: json['payment_method'],
      notes: json['notes'],
      orderType: json['order_type'] ?? 'Dine-In',
      carPlate: json['car_plate'],
      carDescription: json['car_description'],
      guestCount: JsonUtils.parseIntNullable(json['guest_count']),
      scheduledAt: json['scheduled_at'] != null
          ? DateTime.tryParse(json['scheduled_at'])
          : null,
      createdAt: json['created_at'] != null
          ? DateTime.tryParse(json['created_at'])
          : null,
      updatedAt: json['updated_at'] != null
          ? DateTime.tryParse(json['updated_at'])
          : null,
      table: json['table'] != null ? TableModel.fromJson(json['table']) : null,
      customer: json['customer'] != null
          ? CustomerModel.fromJson(json['customer'])
          : null,
      items: json['items'] != null
          ? (json['items'] as List)
              .map((i) => OrderItemModel.fromJson(i))
              .toList()
          : [],
      waiter: json['waiter'],
    );
  }

  bool get isActive => !['completed', 'cancelled'].contains(status);
  bool get isCompleted => status == 'completed';
  bool get isCancelled => status == 'cancelled';
  bool get isDineIn => orderType == 'Dine-In';
  bool get isTakeaway => orderType == 'Takeaway';
  bool get isDelivery => orderType == 'Delivery';
  bool get isDriveThru => orderType == 'Drive-Thru';

  String get statusDisplay {
    switch (status) {
      case 'pending': return 'Pending';
      case 'preparing': return 'Preparing';
      case 'served': return 'Served';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  }

  String get orderTypeIcon {
    switch (orderType) {
      case 'Dine-In': return '🍽️';
      case 'Takeaway': return '🥡';
      case 'Delivery': return '🚚';
      case 'Drive-Thru': return '🚗';
      case 'Pre-Order': return '📅';
      default: return '🍽️';
    }
  }
}
