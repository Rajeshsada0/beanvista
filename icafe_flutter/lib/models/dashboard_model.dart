import '../core/utils/json_utils.dart';

class DashboardStats {
  final int totalItems;
  final int totalTables;
  final int activeTables;
  final double todaySales;
  final double todayCash;
  final double todayOnline;
  final double yesterdaySales;
  final double monthlySales;
  final double totalSales;
  final double avgTurnaroundMins;
  final int totalCustomers;

  const DashboardStats({
    this.totalItems = 0,
    this.totalTables = 0,
    this.activeTables = 0,
    this.todaySales = 0,
    this.todayCash = 0,
    this.todayOnline = 0,
    this.yesterdaySales = 0,
    this.monthlySales = 0,
    this.totalSales = 0,
    this.avgTurnaroundMins = 0,
    this.totalCustomers = 0,
  });

  factory DashboardStats.fromJson(Map<String, dynamic> json) {
    return DashboardStats(
      totalItems: JsonUtils.parseInt(json['total_items']),
      totalTables: JsonUtils.parseInt(json['total_tables']),
      activeTables: JsonUtils.parseInt(json['active_tables']),
      todaySales:
          double.tryParse(json['today_sales']?.toString() ?? '0') ?? 0,
      todayCash:
          double.tryParse(json['today_cash']?.toString() ?? '0') ?? 0,
      todayOnline:
          double.tryParse(json['today_online']?.toString() ?? '0') ?? 0,
      yesterdaySales:
          double.tryParse(json['yesterday_sales']?.toString() ?? '0') ?? 0,
      monthlySales:
          double.tryParse(json['monthly_sales']?.toString() ?? '0') ?? 0,
      totalSales:
          double.tryParse(json['total_sales']?.toString() ?? '0') ?? 0,
      avgTurnaroundMins:
          double.tryParse(json['avg_turnaround_mins']?.toString() ?? '0') ?? 0,
      totalCustomers: JsonUtils.parseInt(json['total_customers']),
    );
  }

  double get salesChangePercent {
    if (yesterdaySales == 0) return 0;
    return ((todaySales - yesterdaySales) / yesterdaySales * 100);
  }

  bool get isSalesUp => todaySales >= yesterdaySales;
}

class WeeklySalesPoint {
  final String day;
  final String date;
  final double total;

  const WeeklySalesPoint({
    required this.day,
    required this.date,
    required this.total,
  });

  factory WeeklySalesPoint.fromJson(Map<String, dynamic> json) {
    return WeeklySalesPoint(
      day: json['day'] ?? '',
      date: json['date'] ?? '',
      total: double.tryParse(json['total']?.toString() ?? '0') ?? 0,
    );
  }
}

class TopSellingItem {
  final String name;
  final String? category;
  final int quantity;
  final double revenue;
  final String? imageUrl;

  const TopSellingItem({
    required this.name,
    this.category,
    required this.quantity,
    required this.revenue,
    this.imageUrl,
  });

  factory TopSellingItem.fromJson(Map<String, dynamic> json) {
    return TopSellingItem(
      name: json['name'] ?? '',
      category: json['category'],
      quantity: JsonUtils.parseInt(json['quantity']),
      revenue: double.tryParse(json['revenue']?.toString() ?? '0') ?? 0,
      imageUrl: json['image_url'],
    );
  }
}

class LowStockItem {
  final String name;
  final double stock;
  final double threshold;
  final String unit;

  const LowStockItem({
    required this.name,
    required this.stock,
    required this.threshold,
    required this.unit,
  });

  factory LowStockItem.fromJson(Map<String, dynamic> json) {
    return LowStockItem(
      name: json['name'] ?? '',
      stock: double.tryParse(json['stock']?.toString() ?? '0') ?? 0,
      threshold:
          double.tryParse(json['threshold']?.toString() ?? '0') ?? 0,
      unit: json['unit'] ?? 'pcs',
    );
  }

  bool get isCritical => stock <= 0;
  double get stockPercent => threshold > 0 ? (stock / threshold).clamp(0.0, 1.0) : 0;
}
