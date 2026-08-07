import '../core/utils/json_utils.dart';

class TableModel {
  final int id;
  final String tableNumber;
  final int capacity;
  final String status;
  final int? branchId;
  final List<dynamic> orders;
  final List<dynamic> reservations;

  const TableModel({
    required this.id,
    required this.tableNumber,
    required this.capacity,
    required this.status,
    this.branchId,
    this.orders = const [],
    this.reservations = const [],
  });

  factory TableModel.fromJson(Map<String, dynamic> json) {
    return TableModel(
      id: JsonUtils.parseInt(json['id']),
      tableNumber: json['table_number'] ?? '',
      capacity: JsonUtils.parseInt(json['capacity'], 1),
      status: json['status'] ?? 'available',
      branchId: JsonUtils.parseIntNullable(json['branch_id']),
      orders: json['orders'] ?? json['active_orders'] ?? [],
      reservations: json['reservations'] ?? [],
    );
  }

  bool get isAvailable => status == 'available';
  bool get isOccupied => status == 'occupied';
  bool get isReserved => status == 'reserved';

  String get statusDisplay {
    switch (status) {
      case 'available': return 'Available';
      case 'occupied': return 'Occupied';
      case 'reserved': return 'Reserved';
      default: return status;
    }
  }
}

