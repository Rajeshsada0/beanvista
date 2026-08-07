import '../core/utils/json_utils.dart';

class CategoryModel {
  final int id;
  final String name;
  final bool status;
  final String? description;

  const CategoryModel({
    required this.id,
    required this.name,
    this.status = true,
    this.description,
  });

  factory CategoryModel.fromJson(Map<String, dynamic> json) {
    return CategoryModel(
      id: JsonUtils.parseInt(json['id']),
      name: json['name'] ?? '',
      status: json['status'] == true || json['status'] == 1,
      description: json['description'],
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'status': status,
    'description': description,
  };
}

class MenuModel {
  final int id;
  final String name;
  final String? category;
  final int? categoryId;
  final double price;
  final double? originalPrice;
  final double? costPrice;
  final bool status;
  final String? imagePath;
  final String? imageUrl;
  final String? iconPath;
  final String? iconUrl;
  final CategoryModel? categoryGroup;
  final bool outOfStock;

  const MenuModel({
    required this.id,
    required this.name,
    this.category,
    this.categoryId,
    required this.price,
    this.originalPrice,
    this.costPrice,
    this.status = true,
    this.imagePath,
    this.imageUrl,
    this.iconPath,
    this.iconUrl,
    this.categoryGroup,
    this.outOfStock = false,
  });

  factory MenuModel.fromJson(Map<String, dynamic> json) {
    return MenuModel(
      id: JsonUtils.parseInt(json['id']),
      name: json['name'] ?? '',
      category: json['category'],
      categoryId: JsonUtils.parseIntNullable(json['category_id']),
      price: double.tryParse(json['price']?.toString() ?? '0') ?? 0,
      originalPrice: json['original_price'] != null
          ? double.tryParse(json['original_price'].toString())
          : null,
      costPrice: json['cost_price'] != null
          ? double.tryParse(json['cost_price'].toString())
          : null,
      status: json['status'] == true || json['status'] == 1,
      imagePath: json['image_path'],
      imageUrl: json['image_url'],
      iconPath: json['icon_path'],
      iconUrl: json['icon_url'],
      categoryGroup: json['category_group'] != null
          ? CategoryModel.fromJson(json['category_group'])
          : null,
      outOfStock: json['out_of_stock'] == true || json['out_of_stock'] == 1,
    );
  }

  bool get hasDiscount =>
      originalPrice != null && originalPrice! > price;

  double get discountPercent {
    if (!hasDiscount) return 0;
    return ((originalPrice! - price) / originalPrice! * 100).roundToDouble();
  }
}

class AddonModel {
  final int id;
  final String name;
  final double price;
  final bool status;

  const AddonModel({
    required this.id,
    required this.name,
    required this.price,
    this.status = true,
  });

  factory AddonModel.fromJson(Map<String, dynamic> json) {
    return AddonModel(
      id: JsonUtils.parseInt(json['id']),
      name: json['name'] ?? '',
      price: double.tryParse(json['price']?.toString() ?? '0') ?? 0,
      status: json['status'] == true || json['status'] == 1,
    );
  }
}
