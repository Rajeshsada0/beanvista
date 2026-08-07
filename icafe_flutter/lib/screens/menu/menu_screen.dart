import 'dart:io';
import 'package:icafe_app/core/utils/snackbar_helper.dart';
import 'package:icafe_app/core/constants/app_constants.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/json_utils.dart';
import '../../providers/menu_provider.dart';
import '../media/media_screen.dart';

// ──────────────────────────────────────────────────────────────────────────────
//  MOCK DATA
// ──────────────────────────────────────────────────────────────────────────────
const List<String> kMenuCategories = [
  'All', 'Coffee', 'Food', 'Beverages', 'Desserts',
];

final List<Map<String, dynamic>> kMockMenuItems = [
  {'id': 1,  'name': 'Cappuccino',     'category': 'Coffee',    'price': 350.0, 'cost': 80.0,  'emoji': '☕',          'active': true},
  {'id': 2,  'name': 'Latte',          'category': 'Coffee',    'price': 380.0, 'cost': 90.0,  'emoji': '🥛',       'active': true},
  {'id': 3,  'name': 'Americano',      'category': 'Coffee',    'price': 280.0, 'cost': 60.0,  'emoji': '☕',          'active': true},
  {'id': 4,  'name': 'Espresso',       'category': 'Coffee',    'price': 220.0, 'cost': 45.0,  'emoji': '☕',          'active': true},
  {'id': 5,  'name': 'Club Sandwich',  'category': 'Food',      'price': 550.0, 'cost': 200.0, 'emoji': '🥪',       'active': true},
  {'id': 6,  'name': 'Pasta Carbonara','category': 'Food',      'price': 720.0, 'cost': 280.0, 'emoji': '🍝',       'active': true},
  {'id': 7,  'name': 'Burger Deluxe',  'category': 'Food',      'price': 680.0, 'cost': 250.0, 'emoji': '🍔',       'active': false},
  {'id': 8,  'name': 'Caesar Salad',   'category': 'Food',      'price': 420.0, 'cost': 130.0, 'emoji': '🥗',       'active': true},
  {'id': 9,  'name': 'Fresh Juice',    'category': 'Beverages', 'price': 250.0, 'cost': 70.0,  'emoji': '🍹',       'active': true},
  {'id': 10, 'name': 'Iced Tea',       'category': 'Beverages', 'price': 200.0, 'cost': 50.0,  'emoji': '🧊',       'active': true},
  {'id': 11, 'name': 'Cheesecake',     'category': 'Desserts',  'price': 450.0, 'cost': 160.0, 'emoji': '🍰',       'active': true},
  {'id': 12, 'name': 'Chocolate Lava', 'category': 'Desserts',  'price': 490.0, 'cost': 175.0, 'emoji': '🍫',       'active': false},
  {'id': 13, 'name': 'Iced Coffee',    'category': 'Coffee',    'price': 400.0, 'cost': 100.0, 'emoji': '🧋',       'active': true},
  {'id': 14, 'name': 'Flat White',     'category': 'Coffee',    'price': 360.0, 'cost': 85.0,  'emoji': '☕',          'active': true},
  {'id': 15, 'name': 'Pancakes',       'category': 'Desserts',  'price': 380.0, 'cost': 120.0, 'emoji': '🥞',       'active': true},
  {'id': 16, 'name': 'Mineral Water',  'category': 'Beverages', 'price': 80.0,  'cost': 20.0,  'emoji': '💧',       'active': true},
];

// Standard unified branding colors
const Map<String, Color> kMenuCategoryColors = {};

// ──────────────────────────────────────────────────────────────────────────────
//  SCREEN
// ──────────────────────────────────────────────────────────────────────────────
class MenuScreen extends StatefulWidget {
  final bool showAdd;
  final bool showCategories;
  const MenuScreen({super.key, this.showAdd = false, this.showCategories = false});

  @override
  State<MenuScreen> createState() => _MenuScreenState();
}

class _MenuScreenState extends State<MenuScreen> {
  final TextEditingController _searchCtrl = TextEditingController();
  String _selectedCategory = 'All';
  bool _isGridView = true;

  @override
  void initState() {
    super.initState();
    _searchCtrl.addListener(() => setState(() {}));
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      await context.read<MenuProvider>().fetchMenus();
      if (widget.showAdd) {
        final cats = _categoriesList(kMockMenuItems, context.read<MenuProvider>());
        _openAddEditSheet(availableCategories: cats);
      } else if (widget.showCategories) {
        _openCategoryManager();
      }
    });
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  List<String> _categoriesList(List<Map<String, dynamic>> items, MenuProvider provider) {
    final providerCats = provider.categories.map((c) => c.name).toList();
    if (providerCats.isEmpty) {
      final cats = items.map((it) => it['category'] as String).toSet().toList();
      cats.sort();
      return ['All', ...cats];
    }
    providerCats.sort();
    return ['All', ...providerCats];
  }

  List<Map<String, dynamic>> _filtered(List<Map<String, dynamic>> items) {
    final q = _searchCtrl.text.toLowerCase().trim();
    return items.where((item) {
      final catOk = _selectedCategory == 'All' || item['category'] == _selectedCategory;
      final nameOk = q.isEmpty || (item['name'] as String).toLowerCase().contains(q);
      return catOk && nameOk;
    }).toList();
  }

  void _toggleActive(int id, Map<String, dynamic> item) async {
    final active = item['active'] as bool;
    final success = await context.read<MenuProvider>().updateMenu(
      id,
      item['name'] as String,
      item['category'] as String,
      item['price'] as double,
      item['cost'] as double,
    );
    // Note: status toggling can be further customized as needed
  }

  void _deleteItem(int id) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: AppColors.darkCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text('Delete Item?', style: GoogleFonts.poppins(
            color: AppColors.textPrimary, fontWeight: FontWeight.w700)),
        content: Text('This menu item will be permanently removed.',
            style: GoogleFonts.poppins(color: AppColors.textSecondary)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Cancel', style: GoogleFonts.poppins(color: AppColors.textMuted)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.statusRed, foregroundColor: Colors.white,
            ),
            onPressed: () async {
              Navigator.pop(context);
              final success = await context.read<MenuProvider>().deleteMenu(id);
              if (success && mounted) {
                showTopSnackBar(context, SnackBar(
                  content: Text('Item deleted.',
                      style: GoogleFonts.poppins(color: AppColors.textPrimary)),
                ));
              }
            },
            child: Text('Delete', style: GoogleFonts.poppins()),
          ),
        ],
      ),
    );
  }

  void _openAddEditSheet({Map<String, dynamic>? existing, required List<String> availableCategories}) {
    final sheetCats = availableCategories.where((c) => c != 'All').toList();
    final finalCats = sheetCats.isNotEmpty ? sheetCats : ['Coffee', 'Food', 'Beverages', 'Desserts'];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => MenuItemSheet(
        existing: existing,
        categories: finalCats,
        onSave: (item, imageFile, serverImagePath) async {
          final provider = context.read<MenuProvider>();
          bool success;
          if (existing == null) {
            success = await provider.createMenu(
              item['name'] as String,
              item['category'] as String,
              item['price'] as double,
              item['cost'] as double,
              sendToKitchen: item['send_to_kitchen'] as bool? ?? true,
              imageFile: imageFile,
              serverImagePath: serverImagePath,
            );
          } else {
            success = await provider.updateMenu(
              existing['id'] as int,
              item['name'] as String,
              item['category'] as String,
              item['price'] as double,
              item['cost'] as double,
              status: item['active'] as bool,
              sendToKitchen: item['send_to_kitchen'] as bool? ?? true,
              imageFile: imageFile,
              serverImagePath: serverImagePath,
            );
          }
          if (success && mounted) {
            showTopSnackBar(context, SnackBar(
              content: Text(existing == null ? 'Item created.' : 'Item updated.',
                  style: GoogleFonts.poppins(color: AppColors.textPrimary)),
            ));
          }
        },
      ),
    );
  }

  void _openCategoryManager() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const _CategoryManagerSheet(),
    );
  }

  // ── BUILD ─────────────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    final menuProvider = context.watch<MenuProvider>();
    final items = menuProvider.menus.map((m) => {
      'id': m.id,
      'name': m.name,
      'category': m.category,
      'price': m.price,
      'cost': m.costPrice,
      'emoji': m.category == 'Coffee' ? '☕' : (m.category == 'Food' ? '🥪' : (m.category == 'Beverages' ? '🍹' : (m.category == 'Drink' ? '🥤' : '🍰'))),
      'image_url': m.imageUrl,
      'active': m.status,
      'send_to_kitchen': m.sendToKitchen,
    }).toList();

    if (menuProvider.isLoading && items.isEmpty) {
      return Scaffold(
        backgroundColor: AppColors.darkBg,
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    final cats = _categoriesList(items, menuProvider);
    final filtered = _filtered(items);
    final activeCount  = items.where((i) => i['active'] == true).length;
    final inactiveCount = items.length - activeCount;

    return Scaffold(
      backgroundColor: AppColors.darkBg,
      appBar: _buildAppBar(items.length, activeCount, inactiveCount),
      body: Column(children: [
        _buildSearchBar(),
        _buildStatsRow(items),
        _buildCategoryTabs(items, cats, menuProvider),
        Expanded(
          child: filtered.isEmpty
              ? _buildEmpty()
              : _isGridView
                  ? _buildGrid(filtered)
                  : _buildList(filtered, cats),
        ),
      ]),
      floatingActionButton: FloatingActionButton.extended(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        onPressed: () => _openAddEditSheet(availableCategories: cats),
        backgroundColor: AppColors.accentAmber,
        foregroundColor: AppColors.textOnAmber,
        icon: const Icon(Icons.add),
        label: Text('Add Item', style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
      ),
    );
  }

  AppBar _buildAppBar(int total, int active, int inactive) {
    final double screenWidth = MediaQuery.of(context).size.width;
    final bool showIcon = screenWidth >= 400;

    return AppBar(
      backgroundColor: AppColors.darkSurface,
      elevation: 0,
      titleSpacing: 0,
      title: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (showIcon) ...[
            ShaderMask(
              shaderCallback: (b) => AppColors.primaryGradient.createShader(b),
              child: const Icon(Icons.restaurant_menu, color: Colors.white, size: 20),
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Text(
              'Menu Items',
              overflow: TextOverflow.ellipsis,
              style: GoogleFonts.poppins(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w700,
                fontSize: screenWidth < 360 ? 15 : 17,
              ),
            ),
          ),
          const SizedBox(width: 6),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              gradient: AppColors.primaryGradient,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(
              '$total',
              style: GoogleFonts.poppins(
                color: AppColors.textOnAmber,
                fontSize: 10,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.category_outlined),
          color: AppColors.textPrimary,
          tooltip: 'Manage Categories',
          onPressed: () => _openCategoryManager(),
        ),
        const SizedBox(width: 4),
        // Grid / List toggle
        Container(
          margin: const EdgeInsets.only(right: 8),
          padding: const EdgeInsets.all(3),
          decoration: BoxDecoration(
            color: AppColors.darkCard,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: AppColors.darkBorder),
          ),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            _ViewToggleBtn(
              icon: Icons.grid_view_rounded,
              selected: _isGridView,
              onTap: () => setState(() => _isGridView = true),
            ),
            _ViewToggleBtn(
              icon: Icons.list_rounded,
              selected: !_isGridView,
              onTap: () => setState(() => _isGridView = false),
            ),
          ]),
        ),
      ],
    );
  }

  Widget _buildSearchBar() {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 12, 16, 4),
      color: AppColors.darkSurface,
      child: TextField(
        controller: _searchCtrl,
        style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 14),
        decoration: InputDecoration(
          hintText: 'Search menu items...',
          hintStyle: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 14),
          prefixIcon: Icon(Icons.search, color: AppColors.textMuted, size: 20),
          suffixIcon: _searchCtrl.text.isNotEmpty
              ? GestureDetector(
                  onTap: () { _searchCtrl.clear(); setState(() {}); },
                  child: Icon(Icons.close, color: AppColors.textMuted, size: 20),
                )
              : null,
          filled: true,
          fillColor: AppColors.darkCard,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: AppColors.darkBorder),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: AppColors.darkBorder),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: AppColors.accentAmber, width: 1.5),
          ),
        ),
      ),
    );
  }

  Widget _buildStatsRow(List<Map<String, dynamic>> items) {
    final active   = items.where((i) => i['active'] == true).length;
    final inactive = items.length - active;
    final avgPrice = items.isEmpty
        ? 0.0
        : items.fold(0.0, (s, i) => s + JsonUtils.parseDouble(i['price'])) / items.length;

    return Container(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
      color: AppColors.darkSurface,
      child: Row(children: [
        _StatChip(label: 'Active',   value: '$active',   color: AppColors.statusGreen),
        const SizedBox(width: 8),
        _StatChip(label: 'Inactive', value: '$inactive', color: AppColors.statusRed),
        const SizedBox(width: 8),
        _StatChip(
          label: 'Avg Price',
          value: '${AppConstants.currencySymbol} ${avgPrice.toStringAsFixed(0)}',
          color: AppColors.accentAmber,
        ),
      ]),
    );
  }

  Widget _buildCategoryTabs(List<Map<String, dynamic>> items, List<String> cats, MenuProvider provider) {
    return Container(
      height: 50,
      color: AppColors.darkSurface,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        itemCount: cats.length,
        itemBuilder: (_, i) {
          final cat = cats[i];
          final sel = _selectedCategory == cat;
          final count = cat == 'All'
              ? items.length
              : items.where((it) => it['category'] == cat).length;
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: GestureDetector(
              onTap: () => setState(() => _selectedCategory = cat),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
                decoration: BoxDecoration(
                  gradient: sel ? AppColors.primaryGradient : null,
                  color: sel ? null : AppColors.darkCard,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                      color: sel ? AppColors.accentAmber : AppColors.darkBorder),
                ),
                child: Row(children: [
                  Text(cat, style: GoogleFonts.poppins(
                    color: sel ? AppColors.textOnAmber : AppColors.textSecondary,
                    fontSize: 12,
                    fontWeight: sel ? FontWeight.w700 : FontWeight.w400,
                  )),
                  const SizedBox(width: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                    decoration: BoxDecoration(
                      color: sel
                          ? AppColors.textOnAmber.withOpacity(0.2)
                          : AppColors.darkSurface,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text('$count', style: GoogleFonts.poppins(
                      color: sel ? AppColors.textOnAmber : AppColors.textMuted,
                      fontSize: 10, fontWeight: FontWeight.w600,
                    )),
                  ),
                ]),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        const Text('🔍', style: TextStyle(fontSize: 52)),
        const SizedBox(height: 12),
        Text('No items found', style: GoogleFonts.poppins(
            color: AppColors.textMuted, fontSize: 16, fontWeight: FontWeight.w500)),
        Text('Try adjusting your search or category filter',
            style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 12)),
      ]),
    );
  }

  Widget _buildGrid(List<Map<String, dynamic>> items) {
    return GridView.builder(
      padding: const EdgeInsets.fromLTRB(14, 14, 14, 100),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 12, crossAxisSpacing: 12,
        childAspectRatio: 0.72,
      ),
      itemCount: items.length,
      itemBuilder: (_, i) => _MenuGridCard(
        item: items[i],
        onToggle:  () => _toggleActive(items[i]['id'] as int, items[i]),
        onEdit:    () => _openAddEditSheet(existing: items[i], availableCategories: _categoriesList(items, context.read<MenuProvider>())),
        onDelete:  () => _deleteItem(items[i]['id'] as int),
      ),
    );
  }

  Widget _buildList(List<Map<String, dynamic>> items, List<String> cats) {
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(14, 14, 14, 100),
      itemCount: items.length,
      separatorBuilder: (_, __) => const SizedBox(height: 8),
      itemBuilder: (_, i) => _MenuListTile(
        item: items[i],
        onToggle: () => _toggleActive(items[i]['id'] as int, items[i]),
        onEdit:   () => _openAddEditSheet(existing: items[i], availableCategories: cats),
        onDelete: () => _deleteItem(items[i]['id'] as int),
      ),
    );
  }
}

// ──────────────────────────────────────────────────────────────────────────────
//  GRID CARD
// ──────────────────────────────────────────────────────────────────────────────
class _MenuGridCard extends StatelessWidget {
  final Map<String, dynamic> item;
  final VoidCallback onToggle;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const _MenuGridCard({
    required this.item, required this.onToggle,
    required this.onEdit, required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final active = item['active'] as bool;
    final bg     = AppColors.accentAmber;
    final price  = item['price'] as double;
    final cost   = item['cost'] as double;
    final margin = price - cost;
    final marginPct = (margin / price * 100).toStringAsFixed(0);

    return Container(
      decoration: BoxDecoration(
        gradient: AppColors.isDark
            ? const LinearGradient(
                begin: Alignment.topLeft, end: Alignment.bottomRight,
                colors: [Color(0xFF231507), Color(0xFF1A0E05)],
              )
            : const LinearGradient(
                begin: Alignment.topLeft, end: Alignment.bottomRight,
                colors: [Color(0xFFFFFFFF), Color(0xFFFFFFFF)],
              ),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: active ? AppColors.darkBorder : AppColors.statusRed.withOpacity(0.3),
        ),
      ),
      child: Column(children: [
        // Hero
        Expanded(
          flex: 5,
          child: Stack(children: [
            Container(
              width: double.infinity,
              decoration: BoxDecoration(
                color: (active ? bg : AppColors.darkBorder).withOpacity(0.3),
                borderRadius: const BorderRadius.vertical(top: Radius.circular(11)),
              ),
              child: item['image_url'] != null && (item['image_url'] as String).isNotEmpty
                  ? ClipRRect(
                      borderRadius: const BorderRadius.vertical(top: Radius.circular(11)),
                      child: Image.network(
                        item['image_url'],
                        fit: BoxFit.cover,
                        width: double.infinity,
                        height: double.infinity,
                        errorBuilder: (context, error, stackTrace) => Center(
                          child: Container(
                            width: 64, height: 64,
                            decoration: BoxDecoration(
                              color: active ? bg : AppColors.darkBorder,
                              shape: BoxShape.circle,
                            ),
                            child: Center(
                              child: Text(item['emoji'] as String,
                                  style: TextStyle(
                                      fontSize: 28,
                                      color: active ? null : Colors.grey)),
                            ),
                          ),
                        ),
                      ),
                    )
                  : Center(
                      child: Container(
                        width: 64, height: 64,
                        decoration: BoxDecoration(
                          color: active ? bg : AppColors.darkBorder,
                          shape: BoxShape.circle,
                        ),
                        child: Center(
                          child: Text(item['emoji'] as String,
                              style: TextStyle(
                                  fontSize: 28,
                                  color: active ? null : Colors.grey)),
                        ),
                      ),
                    ),
            ),
            // Status badge
            Positioned(
              top: 8, left: 8,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                decoration: BoxDecoration(
                  color: active ? AppColors.statusGreenBg : AppColors.statusRedBg,
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(
                    color: active
                        ? AppColors.statusGreen.withOpacity(0.4)
                        : AppColors.statusRed.withOpacity(0.4),
                  ),
                ),
                child: Text(
                  active ? 'Active' : 'Inactive',
                  style: GoogleFonts.poppins(
                    color: active ? AppColors.statusGreen : AppColors.statusRed,
                    fontSize: 9, fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
            // Category badge
            Positioned(
              top: 8, right: 8,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: bg,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  item['category'] as String,
                  style: GoogleFonts.poppins(
                    color: Colors.white,
                    fontSize: 8,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ),
          ]),
        ),
        // Details
        Expanded(
          flex: 6,
          child: Padding(
            padding: const EdgeInsets.all(10),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(item['name'] as String,
                  style: GoogleFonts.poppins(
                    color: active ? AppColors.textPrimary : AppColors.textMuted,
                    fontWeight: FontWeight.w600, fontSize: 12.5, height: 1.2,
                  ),
                  maxLines: 2, overflow: TextOverflow.ellipsis),
              const SizedBox(height: 4),
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                Text('${AppConstants.currencySymbol} ${price.toStringAsFixed(0)}',
                    style: GoogleFonts.poppins(
                      color: AppColors.accentAmber,
                      fontWeight: FontWeight.w700, fontSize: 14,
                    )),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppColors.statusGreenBg,
                    borderRadius: BorderRadius.circular(5),
                  ),
                  child: Text('$marginPct%', style: GoogleFonts.poppins(
                      color: AppColors.statusGreen,
                      fontSize: 9, fontWeight: FontWeight.w600)),
                ),
              ]),
              Text('Cost: Rs. ${cost.toStringAsFixed(0)}',
                  style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 10)),
              const Spacer(),
              Row(children: [
                // Toggle
                GestureDetector(
                  onTap: onToggle,
                  child: Container(
                    width: 34, height: 20,
                    decoration: BoxDecoration(
                      color: active
                          ? AppColors.statusGreen.withOpacity(0.2)
                          : AppColors.darkBorder,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                          color: active ? AppColors.statusGreen : AppColors.darkBorder),
                    ),
                    child: AnimatedAlign(
                      duration: const Duration(milliseconds: 200),
                      alignment: active ? Alignment.centerRight : Alignment.centerLeft,
                      child: Container(
                        width: 14, height: 14,
                        margin: const EdgeInsets.symmetric(horizontal: 2),
                        decoration: BoxDecoration(
                          color: active ? AppColors.statusGreen : AppColors.textMuted,
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                  ),
                ),
                const Spacer(),
                // Edit
                _IconActionBtn(
                  icon: Icons.edit_outlined,
                  color: AppColors.accentAmber,
                  onTap: onEdit,
                ),
                const SizedBox(width: 4),
                // Delete
                _IconActionBtn(
                  icon: Icons.delete_outline,
                  color: AppColors.statusRed,
                  onTap: onDelete,
                ),
              ]),
            ]),
          ),
        ),
      ]),
    );
  }
}

// ──────────────────────────────────────────────────────────────────────────────
//  LIST TILE
// ──────────────────────────────────────────────────────────────────────────────
class _MenuListTile extends StatelessWidget {
  final Map<String, dynamic> item;
  final VoidCallback onToggle;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const _MenuListTile({
    required this.item, required this.onToggle,
    required this.onEdit, required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    final active = item['active'] as bool;
    final bg     = AppColors.accentAmber;
    final price  = item['price'] as double;
    final cost   = item['cost'] as double;
    final margin = price - cost;
    final marginPct = (margin / price * 100).toStringAsFixed(0);

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        gradient: AppColors.isDark
            ? const LinearGradient(
                colors: [Color(0xFF231507), Color(0xFF1A0E05)],
              )
            : const LinearGradient(
                colors: [Color(0xFFFFFFFF), Color(0xFFFFFFFF)],
              ),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: active ? AppColors.darkBorder : AppColors.statusRed.withOpacity(0.25),
        ),
      ),
      child: Row(children: [
        // Image / Emoji
        Container(
          width: 52, height: 52,
          decoration: BoxDecoration(
            color: active ? bg : AppColors.darkBorder,
            borderRadius: BorderRadius.circular(8),
          ),
          child: item['image_url'] != null && (item['image_url'] as String).isNotEmpty
              ? ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.network(
                    item['image_url'],
                    fit: BoxFit.cover,
                    width: 52,
                    height: 52,
                    errorBuilder: (context, error, stackTrace) => Center(
                      child: Text(item['emoji'] as String,
                          style: const TextStyle(fontSize: 24)),
                    ),
                  ),
                )
              : Center(
                  child: Text(item['emoji'] as String,
                      style: const TextStyle(fontSize: 24)),
                ),
        ),
        const SizedBox(width: 12),
        // Info
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Expanded(
                child: Text(item['name'] as String,
                    style: GoogleFonts.poppins(
                      color: active ? AppColors.textPrimary : AppColors.textMuted,
                      fontWeight: FontWeight.w600, fontSize: 14,
                    )),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: bg,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  item['category'] as String,
                  style: GoogleFonts.poppins(
                    color: Colors.white,
                    fontSize: 9,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ]),
            const SizedBox(height: 4),
            Wrap(
              spacing: 8,
              runSpacing: 4,
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                Text('${AppConstants.currencySymbol} ${price.toStringAsFixed(2)}',
                    style: GoogleFonts.poppins(
                      color: AppColors.accentAmber,
                      fontWeight: FontWeight.w700, fontSize: 13,
                    )),
                Text('Cost: Rs. ${cost.toStringAsFixed(2)}',
                    style: GoogleFonts.poppins(
                        color: AppColors.textMuted, fontSize: 11)),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                  decoration: BoxDecoration(
                    color: AppColors.statusGreenBg,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text('$marginPct% margin',
                      style: GoogleFonts.poppins(
                          color: AppColors.statusGreen,
                          fontSize: 9, fontWeight: FontWeight.w600)),
                ),
              ],
            ),
          ]),
        ),
        const SizedBox(width: 8),
        // Actions
        Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Transform.scale(
            scale: 0.75,
            child: Switch(
              value: active,
              onChanged: (_) => onToggle(),
              activeColor: AppColors.statusGreen,
              activeTrackColor: AppColors.statusGreen.withOpacity(0.25),
              inactiveThumbColor: AppColors.textMuted,
              inactiveTrackColor: AppColors.darkCard,
              materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
          ),
          Row(children: [
            _IconActionBtn(icon: Icons.edit_outlined,
                color: AppColors.accentAmber, onTap: onEdit),
            const SizedBox(width: 4),
            _IconActionBtn(icon: Icons.delete_outline,
                color: AppColors.statusRed, onTap: onDelete),
          ]),
        ]),
      ]),
    );
  }
}

// ──────────────────────────────────────────────────────────────────────────────
//  ADD / EDIT BOTTOM SHEET
// ──────────────────────────────────────────────────────────────────────────────
class MenuItemSheet extends StatefulWidget {
  final Map<String, dynamic>? existing;
  final List<String> categories;
  final Function(Map<String, dynamic> item, XFile? imageFile, String? serverImagePath) onSave;

  const MenuItemSheet({this.existing, required this.categories, required this.onSave});

  @override
  State<MenuItemSheet> createState() => _MenuItemSheetState();
}

class _MenuItemSheetState extends State<MenuItemSheet> {
  final _formKey   = GlobalKey<FormState>();
  late TextEditingController _nameCtrl;
  late TextEditingController _priceCtrl;
  late TextEditingController _costCtrl;
  late String  _category;
  late bool    _active;
  late bool    _sendToKitchen;
  late String  _emoji;
  XFile? _imageFile;
  String? _serverImagePath;
  String? _serverImageUrl;

  static const _emojis = [
    '☕', '🥛', '🍹', '🧊',
    '🥪', '🍝', '🍔', '🥗',
    '🍰', '🍫', '🥞', '💧',
    '🧋', '🍑', '🎂', '🍦',
  ];

  @override
  void initState() {
    super.initState();
    final e = widget.existing;
    _nameCtrl  = TextEditingController(text: e?['name'] as String? ?? '');
    _priceCtrl = TextEditingController(
        text: e != null ? JsonUtils.parseDouble(e['price']).toStringAsFixed(2) : '');
    _costCtrl  = TextEditingController(
        text: e != null ? JsonUtils.parseDouble(e['cost']).toStringAsFixed(2) : '');
    
    // Dynamically retrieve categories from provider to avoid stale list
    final menuProvider = context.read<MenuProvider>();
    final availableCats = menuProvider.categories.map((c) => c.name).where((name) => name != 'All').toList();
    final list = availableCats.isNotEmpty ? availableCats : widget.categories;
    final defaultCat = list.isNotEmpty ? list.first : 'Coffee';
    
    _category  = e?['category'] as String? ?? defaultCat;
    if (list.isNotEmpty && !list.contains(_category)) {
      _category = defaultCat;
    }
    _active    = e?['active'] as bool? ?? true;
    _sendToKitchen = e?['send_to_kitchen'] as bool? ?? true;
    _emoji     = e?['emoji'] as String? ?? '☕';
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _priceCtrl.dispose();
    _costCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.darkSurface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return SafeArea(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                leading: Icon(Icons.photo_library_outlined, color: AppColors.textPrimary),
                title: Text('Choose from Media Library', style: GoogleFonts.poppins(color: AppColors.textPrimary)),
                onTap: () async {
                  Navigator.pop(context);
                  final selectedData = await Navigator.push<Map<String, dynamic>?>(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const MediaScreen(isSelector: true),
                    ),
                  );
                  if (selectedData != null) {
                    setState(() {
                      _serverImagePath = selectedData['path'];
                      _serverImageUrl = selectedData['url'];
                      _imageFile = null;
                    });
                  }
                },
              ),
              ListTile(
                leading: Icon(Icons.add_photo_alternate_outlined, color: AppColors.textPrimary),
                title: Text('Upload from Device', style: GoogleFonts.poppins(color: AppColors.textPrimary)),
                onTap: () async {
                  Navigator.pop(context);
                  final picker = ImagePicker();
                  final img = await picker.pickImage(source: ImageSource.gallery, imageQuality: 85);
                  if (img != null) {
                    setState(() {
                      _imageFile = img;
                      _serverImagePath = null;
                      _serverImageUrl = null;
                    });
                  }
                },
              ),
              if (_imageFile != null || _serverImagePath != null || (widget.existing?['image_url'] != null && (widget.existing!['image_url'] as String).isNotEmpty))
                ListTile(
                  leading: Icon(Icons.delete_outline, color: AppColors.statusRed),
                  title: Text('Remove Image', style: GoogleFonts.poppins(color: AppColors.statusRed)),
                  onTap: () {
                    Navigator.pop(context);
                    setState(() {
                      _imageFile = null;
                      _serverImagePath = '';
                      _serverImageUrl = null;
                    });
                  },
                ),
            ],
          ),
        );
      },
    );
  }

  void _showAddCategoryDialog(BuildContext context) {
    final ctrl = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.darkSurface,
        title: Text('Add Category',
            style: GoogleFonts.poppins(
                color: AppColors.textPrimary, fontWeight: FontWeight.bold)),
        content: TextField(
          controller: ctrl,
          style: GoogleFonts.poppins(color: AppColors.textPrimary),
          decoration: InputDecoration(
            hintText: 'Category Name',
            hintStyle: GoogleFonts.poppins(color: AppColors.textMuted),
            enabledBorder: UnderlineInputBorder(
                borderSide: BorderSide(color: AppColors.darkBorder)),
            focusedBorder: UnderlineInputBorder(
                borderSide: BorderSide(color: AppColors.accentAmber)),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text('Cancel',
                style: GoogleFonts.poppins(color: AppColors.textMuted)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.accentAmber,
              foregroundColor: AppColors.textOnAmber,
            ),
            onPressed: () async {
              final name = ctrl.text.trim();
              if (name.isNotEmpty) {
                Navigator.pop(ctx);
                final success = await context.read<MenuProvider>().createCategory(name);
                if (success && mounted) {
                  setState(() {
                    _category = name;
                  });
                  showTopSnackBar(context, SnackBar(
                    content: Text('Category created successfully!',
                        style: GoogleFonts.poppins(color: Colors.white)),
                    backgroundColor: AppColors.statusGreen,
                  ));
                } else if (mounted) {
                  showTopSnackBar(context, SnackBar(
                    content: Text('Failed to create category',
                        style: GoogleFonts.poppins(color: Colors.white)),
                    backgroundColor: AppColors.statusRed,
                  ));
                }
              }
            },
            child: Text('Add', style: GoogleFonts.poppins()),
          ),
        ],
      ),
    );
  }

  void _save() {
    if (!_formKey.currentState!.validate()) return;
    widget.onSave({
      'name':     _nameCtrl.text.trim(),
      'category': _category,
      'price':    double.parse(_priceCtrl.text),
      'cost':     double.parse(_costCtrl.text),
      'active':   _active,
      'send_to_kitchen': _sendToKitchen,
      'emoji':    _emoji,
    }, _imageFile, _serverImagePath);
    Navigator.pop(context);
    showTopSnackBar(context, SnackBar(
      content: Row(children: [
        Icon(Icons.check_circle, color: AppColors.statusGreen, size: 18),
        const SizedBox(width: 8),
        Text('Menu item saved!',
            style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13)),
      ]),
    ));
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.existing != null;
    final menuProvider = context.watch<MenuProvider>();
    final availableCats = menuProvider.categories.map((c) => c.name).where((name) => name != 'All').toList();
    final cats = availableCats.isNotEmpty ? availableCats : widget.categories;

    return Container(
      decoration: BoxDecoration(
        color: AppColors.darkCard,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        border: Border(
          top:   BorderSide(color: AppColors.darkBorder),
          left:  BorderSide(color: AppColors.darkBorder),
          right: BorderSide(color: AppColors.darkBorder),
        ),
      ),
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            // Handle
            Center(
              child: Container(
                width: 40, height: 4,
                margin: const EdgeInsets.only(bottom: 20),
                decoration: BoxDecoration(
                    color: AppColors.darkBorder,
                    borderRadius: BorderRadius.circular(2)),
              ),
            ),
            // Title
            Row(children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  gradient: AppColors.primaryGradient,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(
                  isEdit ? Icons.edit_outlined : Icons.add_circle_outline,
                  color: AppColors.textOnAmber, size: 20,
                ),
              ),
              const SizedBox(width: 12),
              Text(isEdit ? 'Edit Menu Item' : 'Add Menu Item',
                  style: GoogleFonts.poppins(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.w700, fontSize: 18,
                  )),
            ]),
            const SizedBox(height: 24),

            // Image Picker
            Text('Item Image', style: GoogleFonts.poppins(
                color: AppColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            GestureDetector(
              onTap: _pickImage,
              child: Container(
                height: 120,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: AppColors.darkSurface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.darkBorder),
                ),
                child: _imageFile != null
                    ? ClipRRect(
                        borderRadius: BorderRadius.circular(16),
                        child: Image.file(
                          File(_imageFile!.path),
                          fit: BoxFit.cover,
                          width: double.infinity,
                          height: 120,
                        ),
                      )
                    : (_serverImageUrl != null && _serverImagePath != '')
                        ? ClipRRect(
                            borderRadius: BorderRadius.circular(16),
                            child: Image.network(
                              _serverImageUrl!,
                              fit: BoxFit.cover,
                              width: double.infinity,
                              height: 120,
                              errorBuilder: (_, __, ___) => Center(
                                child: Icon(Icons.broken_image_outlined, color: AppColors.textMuted, size: 40),
                              ),
                            ),
                          )
                        : (widget.existing?['image_url'] != null && (widget.existing!['image_url'] as String).isNotEmpty && _serverImagePath != '')
                            ? ClipRRect(
                                borderRadius: BorderRadius.circular(16),
                                child: Image.network(
                                  widget.existing!['image_url'] as String,
                                  fit: BoxFit.cover,
                                  width: double.infinity,
                                  height: 120,
                                  errorBuilder: (_, __, ___) => Center(
                                    child: Icon(Icons.image_outlined, color: AppColors.textMuted, size: 40),
                                  ),
                                ),
                              )
                            : Center(
                                child: Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(Icons.add_photo_alternate_outlined, color: AppColors.textMuted, size: 36),
                                    const SizedBox(height: 6),
                                    Text(
                                      'Upload Product Image',
                                      style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 13),
                                    ),
                                  ],
                                ),
                              ),
              ),
            ),
            const SizedBox(height: 20),

            // Emoji picker
            Text('Icon', style: GoogleFonts.poppins(
                color: AppColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            SizedBox(
              height: 60,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: _emojis.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (_, i) {
                  final em  = _emojis[i];
                  final sel = _emoji == em;
                  return GestureDetector(
                    onTap: () => setState(() => _emoji = em),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      width: 52, height: 52,
                      decoration: BoxDecoration(
                        color: sel
                            ? AppColors.accentAmber.withOpacity(0.2)
                            : AppColors.darkSurface,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: sel ? AppColors.accentAmber : AppColors.darkBorder,
                          width: sel ? 2 : 1,
                        ),
                      ),
                      child: Center(
                        child: Text(em, style: const TextStyle(fontSize: 24)),
                      ),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 16),

            // Name
            Text('Item Name', style: GoogleFonts.poppins(
                color: AppColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w600)),
            const SizedBox(height: 6),
            TextFormField(
              controller: _nameCtrl,
              style: GoogleFonts.poppins(color: AppColors.textPrimary),
              decoration: InputDecoration(
                hintText: 'e.g. Caramel Macchiato',
                prefixIcon: Icon(Icons.label_outline, color: AppColors.textMuted, size: 18),
              ),
              validator: (v) => v == null || v.trim().isEmpty ? 'Name is required' : null,
            ),
            const SizedBox(height: 14),

            // Category
            Text('Category', style: GoogleFonts.poppins(
                color: AppColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w600)),
            const SizedBox(height: 6),
            Row(
              children: [
                Expanded(
                  child: LayoutBuilder(
                    builder: (context, constraints) {
                      final entries = cats.map((c) => DropdownMenuEntry<String>(
                        value: c,
                        label: c,
                        leadingIcon: Container(
                          width: 8, height: 8,
                          decoration: BoxDecoration(
                            color: AppColors.accentAmber,
                            shape: BoxShape.circle,
                          ),
                        ),
                        style: MenuItemButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          textStyle: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13),
                        ),
                      )).toList();

                      return DropdownMenu<String>(
                        width: constraints.maxWidth,
                        initialSelection: cats.contains(_category) ? _category : (cats.isNotEmpty ? cats.first : null),
                        hintText: cats.isEmpty ? 'No categories found' : 'Select Category',
                        dropdownMenuEntries: entries,
                        onSelected: cats.isEmpty ? null : (v) {
                          if (v != null) {
                            setState(() => _category = v);
                          }
                        },
                        inputDecorationTheme: Theme.of(context).inputDecorationTheme.copyWith(
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                          isDense: true,
                          prefixIconColor: AppColors.textMuted,
                        ),
                        leadingIcon: Icon(Icons.category_outlined, color: AppColors.textMuted, size: 18),
                        menuStyle: MenuStyle(
                          backgroundColor: WidgetStatePropertyAll(AppColors.darkCard),
                          surfaceTintColor: const WidgetStatePropertyAll(Colors.transparent),
                          shape: WidgetStatePropertyAll(
                            RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                        ),
                        textStyle: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13),
                      );
                    },
                  ),
                ),
                const SizedBox(width: 10),
                IconButton.filled(
                  style: IconButton.styleFrom(
                    backgroundColor: AppColors.accentAmber.withOpacity(0.15),
                    foregroundColor: AppColors.accentAmber,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                      side: BorderSide(color: AppColors.accentAmber.withOpacity(0.3)),
                    ),
                    padding: const EdgeInsets.all(12),
                  ),
                  icon: const Icon(Icons.add_rounded, size: 22),
                  tooltip: 'Add Category',
                  onPressed: () => _showAddCategoryDialog(context),
                ),
              ],
            ),
            const SizedBox(height: 14),

            // Price & Cost
            Row(children: [
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('Selling Price', style: GoogleFonts.poppins(
                      color: AppColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 6),
                  TextFormField(
                    controller: _priceCtrl,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    style: GoogleFonts.poppins(color: AppColors.textPrimary),
                    decoration: InputDecoration(
                      prefixText: '${AppConstants.currencySymbol} ',
                      hintText: '0.00',
                    ),
                    validator: (v) {
                      if (v == null || v.trim().isEmpty) return 'Required';
                      if (double.tryParse(v) == null) return 'Invalid';
                      return null;
                    },
                  ),
                ]),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('Cost Price', style: GoogleFonts.poppins(
                      color: AppColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w600)),
                  const SizedBox(height: 6),
                  TextFormField(
                    controller: _costCtrl,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    style: GoogleFonts.poppins(color: AppColors.textPrimary),
                    decoration: InputDecoration(
                      prefixText: '${AppConstants.currencySymbol} ',
                      hintText: '0.00',
                    ),
                    validator: (v) {
                      if (v == null || v.trim().isEmpty) return 'Required';
                      if (double.tryParse(v) == null) return 'Invalid';
                      return null;
                    },
                  ),
                ]),
              ),
            ]),
            const SizedBox(height: 14),

            // Status toggle
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: AppColors.darkSurface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.darkBorder),
              ),
              child: Row(children: [
                Icon(Icons.toggle_on_outlined, color: AppColors.textMuted, size: 20),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('Item Status', style: GoogleFonts.poppins(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.w500, fontSize: 14)),
                    Text(_active ? 'Visible on POS' : 'Hidden from POS',
                        style: GoogleFonts.poppins(
                          color: _active ? AppColors.statusGreen : AppColors.statusRed,
                          fontSize: 11,
                        )),
                  ]),
                ),
                Switch(
                  value: _active,
                  onChanged: (v) => setState(() => _active = v),
                  activeColor: AppColors.statusGreen,
                  activeTrackColor: AppColors.statusGreen.withOpacity(0.25),
                  inactiveThumbColor: AppColors.textMuted,
                  inactiveTrackColor: AppColors.darkCard,
                ),
              ]),
            ),
            const SizedBox(height: 14),

            // Send to Kitchen toggle
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: AppColors.darkSurface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.darkBorder),
              ),
              child: Row(children: [
                Icon(Icons.kitchen_outlined, color: AppColors.textMuted, size: 20),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text('Kitchen Routing', style: GoogleFonts.poppins(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.w500, fontSize: 14)),
                    Text(_sendToKitchen ? 'Send to Kitchen (e.g. Coffee, Food)' : 'Bypass Kitchen (e.g. Beer, Wine, Smoke)',
                        style: GoogleFonts.poppins(
                          color: _sendToKitchen ? AppColors.accentAmber : AppColors.textMuted,
                          fontSize: 11,
                        )),
                  ]),
                ),
                Switch(
                  value: _sendToKitchen,
                  onChanged: (v) => setState(() => _sendToKitchen = v),
                  activeColor: AppColors.accentAmber,
                  activeTrackColor: AppColors.accentAmber.withOpacity(0.25),
                  inactiveThumbColor: AppColors.textMuted,
                  inactiveTrackColor: AppColors.darkCard,
                ),
              ]),
            ),
            const SizedBox(height: 24),

            // Save button
            SizedBox(
              width: double.infinity, height: 52,
              child: ElevatedButton(
                onPressed: _save,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.accentAmber,
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14)),
                  elevation: 0,
                ),
                child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                  Icon(isEdit ? Icons.save_outlined : Icons.add_circle_outline,
                      color: AppColors.textOnAmber, size: 20),
                  const SizedBox(width: 10),
                  Text(isEdit ? 'Save Changes' : 'Add Menu Item',
                      style: GoogleFonts.poppins(
                        color: AppColors.textOnAmber,
                        fontWeight: FontWeight.w700, fontSize: 15,
                      )),
                ]),
              ),
            ),
          ]),
        ),
      ),
    );
  }
}

// ──────────────────────────────────────────────────────────────────────────────
//  HELPER WIDGETS
// ──────────────────────────────────────────────────────────────────────────────
class _StatChip extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _StatChip({required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Text(label, style: GoogleFonts.poppins(color: color, fontSize: 11)),
        const SizedBox(width: 4),
        Text(value, style: GoogleFonts.poppins(
            color: color, fontSize: 12, fontWeight: FontWeight.w700)),
      ]),
    );
  }
}

class _IconActionBtn extends StatelessWidget {
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _IconActionBtn({required this.icon, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 28, height: 28,
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(7),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Icon(icon, color: color, size: 15),
      ),
    );
  }
}

class _ViewToggleBtn extends StatelessWidget {
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  const _ViewToggleBtn({required this.icon, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(6),
        decoration: BoxDecoration(
          gradient: selected ? AppColors.primaryGradient : null,
          borderRadius: BorderRadius.circular(7),
        ),
        child: Icon(icon,
            color: selected ? AppColors.textOnAmber : AppColors.textMuted,
            size: 18),
      ),
    );
  }
}

// ──────────────────────────────────────────────────────────────────────────────
//  CATEGORY MANAGER SHEET
// ──────────────────────────────────────────────────────────────────────────────
class _CategoryManagerSheet extends StatefulWidget {
  const _CategoryManagerSheet();

  @override
  State<_CategoryManagerSheet> createState() => _CategoryManagerSheetState();
}

class _CategoryManagerSheetState extends State<_CategoryManagerSheet> {
  final TextEditingController _addCtrl = TextEditingController();
  final Map<int, String> _editNames = {};
  final Map<int, bool> _editing = {};

  @override
  void dispose() {
    _addCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final menuProvider = context.watch<MenuProvider>();
    final categories = menuProvider.categories;

    return Container(
      decoration: BoxDecoration(
        color: AppColors.darkSurface,
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(20),
          topRight: Radius.circular(20),
        ),
        border: Border(
          top: BorderSide(color: AppColors.darkBorder),
          left: BorderSide(color: AppColors.darkBorder),
          right: BorderSide(color: AppColors.darkBorder),
        ),
      ),
      padding: EdgeInsets.only(
        top: 20, left: 20, right: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 40, height: 4,
              margin: const EdgeInsets.only(bottom: 20),
              decoration: BoxDecoration(
                color: AppColors.darkBorder,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          Text(
            'Manage Categories',
            style: GoogleFonts.poppins(
              color: AppColors.textPrimary,
              fontWeight: FontWeight.w700,
              fontSize: 18,
            ),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _addCtrl,
                  style: GoogleFonts.poppins(color: AppColors.textPrimary),
                  decoration: InputDecoration(
                    hintText: 'Add new category...',
                    hintStyle: GoogleFonts.poppins(color: AppColors.textMuted),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              IconButton.filled(
                style: IconButton.styleFrom(
                  backgroundColor: AppColors.accentAmber,
                  foregroundColor: AppColors.textOnAmber,
                ),
                icon: const Icon(Icons.add),
                onPressed: () async {
                  final name = _addCtrl.text.trim();
                  if (name.isNotEmpty) {
                    _addCtrl.clear();
                    await menuProvider.createCategory(name);
                  }
                },
              ),
            ],
          ),
          const SizedBox(height: 16),
          Flexible(
            child: categories.isEmpty
                ? Padding(
                    padding: const EdgeInsets.symmetric(vertical: 24),
                    child: Center(
                      child: Text(
                        'No categories found',
                        style: GoogleFonts.poppins(color: AppColors.textMuted),
                      ),
                    ),
                  )
                : ListView.separated(
                    shrinkWrap: true,
                    itemCount: categories.length,
                    separatorBuilder: (_, __) => Divider(color: AppColors.darkDivider),
                    itemBuilder: (context, idx) {
                      final cat = categories[idx];
                      final isEditing = _editing[cat.id] ?? false;

                      return ListTile(
                        contentPadding: EdgeInsets.zero,
                        title: isEditing
                            ? TextField(
                                autofocus: true,
                                style: GoogleFonts.poppins(color: AppColors.textPrimary),
                                controller: TextEditingController(text: _editNames[cat.id] ?? cat.name)
                                  ..selection = TextSelection.fromPosition(
                                    TextPosition(offset: (_editNames[cat.id] ?? cat.name).length),
                                  ),
                                onChanged: (val) {
                                  _editNames[cat.id] = val;
                                },
                                onSubmitted: (val) async {
                                  if (val.trim().isNotEmpty) {
                                    setState(() => _editing[cat.id] = false);
                                    await menuProvider.updateCategory(cat.id, val.trim());
                                  }
                                },
                              )
                            : Text(
                                cat.name,
                                style: GoogleFonts.poppins(
                                  color: AppColors.textPrimary,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            if (isEditing) ...[
                              IconButton(
                                icon: Icon(Icons.check, color: AppColors.statusGreen),
                                onPressed: () async {
                                  final val = _editNames[cat.id] ?? cat.name;
                                  if (val.trim().isNotEmpty) {
                                    setState(() => _editing[cat.id] = false);
                                    await menuProvider.updateCategory(cat.id, val.trim());
                                  }
                                },
                              ),
                              IconButton(
                                icon: Icon(Icons.close, color: AppColors.statusRed),
                                onPressed: () {
                                  setState(() => _editing[cat.id] = false);
                                },
                              ),
                            ] else ...[
                              IconButton(
                                icon: Icon(Icons.edit_outlined, color: AppColors.textMuted),
                                onPressed: () {
                                  setState(() {
                                    _editing[cat.id] = true;
                                    _editNames[cat.id] = cat.name;
                                  });
                                },
                              ),
                              IconButton(
                                icon: Icon(Icons.delete_outline, color: AppColors.statusRed),
                                onPressed: () async {
                                  showDialog(
                                    context: context,
                                    builder: (_) => AlertDialog(
                                      backgroundColor: AppColors.darkCard,
                                      title: Text(
                                        'Delete Category?',
                                        style: GoogleFonts.poppins(color: AppColors.textPrimary, fontWeight: FontWeight.bold),
                                      ),
                                      content: Text(
                                        'Delete "${cat.name}" category? This will not delete the menu items but will remove the category tab.',
                                        style: GoogleFonts.poppins(color: AppColors.textSecondary),
                                      ),
                                      actions: [
                                        TextButton(
                                          onPressed: () => Navigator.pop(context),
                                          child: Text('Cancel', style: GoogleFonts.poppins(color: AppColors.textMuted)),
                                        ),
                                        ElevatedButton(
                                          style: ElevatedButton.styleFrom(backgroundColor: AppColors.statusRed),
                                          onPressed: () async {
                                            Navigator.pop(context);
                                            await menuProvider.deleteCategory(cat.id);
                                          },
                                          child: Text('Delete', style: GoogleFonts.poppins(color: Colors.white)),
                                        ),
                                      ],
                                    ),
                                  );
                                },
                              ),
                            ],
                          ],
                        ),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}
