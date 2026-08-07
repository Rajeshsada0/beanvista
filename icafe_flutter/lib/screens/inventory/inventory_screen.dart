import 'package:icafe_app/core/utils/snackbar_helper.dart';
import 'package:icafe_app/core/constants/app_constants.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/json_utils.dart';
import '../../providers/inventory_provider.dart';

class InventoryScreen extends StatefulWidget {
  final bool showAdd;
  const InventoryScreen({super.key, this.showAdd = false});

  @override
  State<InventoryScreen> createState() => _InventoryScreenState();
}

class _InventoryScreenState extends State<InventoryScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 6, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<InventoryProvider>().fetchInventory();
      if (widget.showAdd) {
        _showAddSheet();
      }
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  bool _isLow(Map<String, dynamic> item) =>
      JsonUtils.parseDouble(item['stock']) < JsonUtils.parseDouble(item['threshold']);

  bool _isCritical(Map<String, dynamic> item) =>
      JsonUtils.parseDouble(item['stock']) <= 0;

  double _stockRatio(Map<String, dynamic> item) {
    final threshold = JsonUtils.parseDouble(item['threshold']);
    if (threshold <= 0) return 1.0;
    return (JsonUtils.parseDouble(item['stock']) / threshold).clamp(0.0, 1.5);
  }

  Color _stockColor(Map<String, dynamic> item) {
    final ratio = _stockRatio(item);
    if (ratio <= 0) return AppColors.statusRed;
    if (ratio < 0.5) return AppColors.statusAmber;
    return AppColors.statusGreen;
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<InventoryProvider>();
    final lowCount = provider.items.where(_isLow).length;

    return Scaffold(
      backgroundColor: AppColors.darkBg,
      appBar: AppBar(
        backgroundColor: AppColors.darkSurface,
        elevation: 0,
        title: Row(
          children: [
            Text('Inventory',
                style: GoogleFonts.poppins(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary)),
            if (lowCount > 0) ...[
              const SizedBox(width: 10),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppColors.statusRedBg,
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.statusRed.withOpacity(0.4)),
                ),
                child: Text('$lowCount low',
                    style: GoogleFonts.poppins(
                        fontSize: 11,
                        color: AppColors.statusRed,
                        fontWeight: FontWeight.w600)),
              ),
            ],
          ],
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.refresh_rounded, color: AppColors.textSecondary),
            onPressed: () => provider.fetchInventory(),
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          indicatorColor: AppColors.accentAmber,
          labelColor: AppColors.accentAmber,
          unselectedLabelColor: AppColors.textMuted,
          labelStyle: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w600),
          unselectedLabelStyle: GoogleFonts.poppins(fontSize: 12),
          tabs: const [
            Tab(text: 'Items'),
            Tab(text: 'Purchases'),
            Tab(text: 'Usages'),
            Tab(text: 'Recipes'),
            Tab(text: 'Suppliers'),
            Tab(text: 'Settings'),
          ],
        ),
      ),
      body: provider.isLoading && provider.items.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabController,
              children: [
                _buildItemsTab(provider.items),
                _buildPurchasesTab(provider.purchases),
                _buildUsagesTab(provider.usages),
                _buildRecipesTab(),
                _buildSuppliersTab(provider.suppliers),
                _buildSettingsTab(),
              ],
            ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showAddSheet(),
        backgroundColor: AppColors.accentAmber,
        foregroundColor: Colors.white,
        child: const Icon(Icons.add_rounded),
      ),
    );
  }

  Widget _buildItemsTab(List<Map<String, dynamic>> items) {
    if (items.isEmpty) {
      return Center(
        child: Text('No inventory items found',
            style: GoogleFonts.poppins(color: AppColors.textMuted)),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(12, 12, 12, 100),
      itemCount: items.length,
      itemBuilder: (ctx, i) {
        final item = items[i];
        final color = _stockColor(item);
        final ratio = _stockRatio(item).clamp(0.0, 1.0);
        final isLow = _isLow(item);

        return Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.darkCard,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: isLow ? color.withOpacity(0.4) : AppColors.darkBorder,
            ),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: color,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(item['name'] ?? '',
                        style: GoogleFonts.poppins(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textPrimary)),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppColors.darkSurface,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(item['group'] ?? '',
                        style: GoogleFonts.poppins(
                            fontSize: 10, color: AppColors.textMuted)),
                  ),
                  const SizedBox(width: 4),
                  PopupMenuButton<String>(
                    icon: Icon(Icons.more_vert_rounded, color: AppColors.textSecondary, size: 20),
                    onSelected: (val) {
                      if (val == 'edit') {
                        _showEditItemSheet(item);
                      } else if (val == 'delete') {
                        _confirmDelete(item);
                      }
                    },
                    itemBuilder: (ctx) => [
                      const PopupMenuItem(
                        value: 'edit',
                        child: Text('Edit Item'),
                      ),
                      const PopupMenuItem(
                        value: 'delete',
                        child: Text('Delete Item', style: TextStyle(color: Colors.red)),
                      ),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Text(
                    '${item['stock']} ${item['unit']}',
                    style: GoogleFonts.poppins(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                      color: color),
                  ),
                  const Spacer(),
                  Text(
                    'Min: ${item['threshold']} ${item['unit']}',
                    style: GoogleFonts.poppins(
                      fontSize: 11, color: AppColors.textMuted),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: ratio,
                  backgroundColor: AppColors.darkSurface,
                  valueColor: AlwaysStoppedAnimation<Color>(color),
                  minHeight: 5,
                ),
              ),
              if (isLow) ...[
                const SizedBox(height: 6),
                Row(
                  children: [
                    Icon(Icons.warning_amber_rounded,
                        size: 12, color: color),
                    const SizedBox(width: 4),
                    Text(
                      _isCritical(item) ? 'Out of stock!' : 'Low stock — reorder needed',
                      style: GoogleFonts.poppins(fontSize: 11, color: color),
                    ),
                  ],
                ),
              ],
            ],
          ),
        );
      },
    );
  }

  Widget _buildPurchasesTab(List<Map<String, dynamic>> purchases) {
    if (purchases.isEmpty) {
      return Center(
        child: Text('No recent purchases logged',
            style: GoogleFonts.poppins(color: AppColors.textMuted)),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(12, 12, 12, 100),
      itemCount: purchases.length,
      itemBuilder: (ctx, i) {
        final p = purchases[i];
        return Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.darkCard,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.darkBorder),
          ),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: AppColors.statusBlueBg,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(Icons.local_shipping_outlined,
                    color: AppColors.statusBlue, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(p['item'] ?? '',
                        style: GoogleFonts.poppins(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textPrimary)),
                    Text(p['supplier'] ?? '',
                        style: GoogleFonts.poppins(
                            fontSize: 12, color: AppColors.textMuted)),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text('${AppConstants.currencySymbol} ${JsonUtils.parseDouble(p['cost']).toStringAsFixed(0)}',
                      style: GoogleFonts.poppins(
                          fontSize: 13,
                          fontWeight: FontWeight.w700,
                          color: AppColors.accentAmber)),
                  Text('${p['qty']} ${p['unit']} • ${p['date']}',
                      style: GoogleFonts.poppins(
                          fontSize: 11, color: AppColors.textMuted)),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildUsagesTab(List<Map<String, dynamic>> usages) {
    if (usages.isEmpty) {
      return Center(
        child: Text('No usage logs found',
            style: GoogleFonts.poppins(color: AppColors.textMuted)),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(12, 12, 12, 100),
      itemCount: usages.length,
      itemBuilder: (ctx, i) {
        final u = usages[i];
        return Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.darkCard,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.darkBorder),
          ),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: AppColors.statusAmberBg,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(Icons.kitchen_outlined,
                    color: AppColors.statusAmber, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(u['ingredient'] ?? '',
                        style: GoogleFonts.poppins(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textPrimary)),
                    Text('Used: ${u['menu']}',
                        style: GoogleFonts.poppins(
                            fontSize: 12, color: AppColors.textMuted)),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text('${u['qty']} ${u['unit']}',
                      style: GoogleFonts.poppins(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: AppColors.statusAmber)),
                  Text(u['date'] ?? '',
                      style: GoogleFonts.poppins(
                          fontSize: 11, color: AppColors.textMuted)),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildSuppliersTab(List<Map<String, dynamic>> suppliers) {
    if (suppliers.isEmpty) {
      return Center(
        child: Text('No suppliers added yet',
            style: GoogleFonts.poppins(color: AppColors.textMuted)),
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(12, 12, 12, 100),
      itemCount: suppliers.length,
      itemBuilder: (ctx, i) {
        final s = suppliers[i];
        final hasOutstanding = JsonUtils.parseDouble(s['outstanding']) > 0;

        return Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.darkCard,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: hasOutstanding
                  ? AppColors.statusRed.withOpacity(0.3)
                  : AppColors.darkBorder,
            ),
          ),
          child: Row(
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: AppColors.darkSurface,
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(
                    s['name'] != null && s['name'].toString().isNotEmpty
                        ? s['name'].toString().substring(0, 1).toUpperCase()
                        : 'S',
                    style: GoogleFonts.poppins(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: AppColors.accentAmber),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(s['name'] ?? '',
                        style: GoogleFonts.poppins(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textPrimary)),
                    Text('${s['items'] ?? 0} items supplied',
                        style: GoogleFonts.poppins(
                            fontSize: 12, color: AppColors.textMuted)),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  if (hasOutstanding)
                    Text(
                        '${AppConstants.currencySymbol} ${JsonUtils.parseDouble(s['outstanding']).toStringAsFixed(0)} due',
                        style: GoogleFonts.poppins(
                            fontSize: 12,
                            color: AppColors.statusRed,
                            fontWeight: FontWeight.w600))
                  else
                    Text('Settled',
                        style: GoogleFonts.poppins(
                            fontSize: 12, color: AppColors.statusGreen)),
                  const SizedBox(height: 2),
                  Text(s['contact'] ?? '',
                      style: GoogleFonts.poppins(
                          fontSize: 11, color: AppColors.textMuted)),
                ],
              ),
              const SizedBox(width: 8),
              PopupMenuButton<String>(
                icon: Icon(Icons.more_vert_rounded, color: AppColors.textSecondary, size: 20),
                onSelected: (val) {
                  if (val == 'edit') {
                    _showEditSupplierSheet(s);
                  } else if (val == 'delete') {
                    _confirmDeleteSupplier(s);
                  }
                },
                itemBuilder: (ctx) => [
                  const PopupMenuItem(
                    value: 'edit',
                    child: Text('Edit Supplier'),
                  ),
                  const PopupMenuItem(
                    value: 'delete',
                    child: Text('Delete Supplier', style: TextStyle(color: Colors.red)),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  void _showAddSheet() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => const _AddInventorySheet(),
    );
  }

  void _showEditItemSheet(Map<String, dynamic> item) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _AddInventorySheet(itemToEdit: item),
    );
  }

  void _confirmDelete(Map<String, dynamic> item) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.darkCard,
        title: Text('Delete Item', style: GoogleFonts.poppins(color: AppColors.textPrimary)),
        content: Text('Are you sure you want to delete ${item['name']}? This will remove the item from inventory.',
            style: GoogleFonts.poppins(color: AppColors.textSecondary)),
        actions: [
          TextButton(
            child: Text('Cancel', style: GoogleFonts.poppins(color: AppColors.textMuted)),
            onPressed: () => Navigator.pop(ctx),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.statusRed),
            child: Text('Delete', style: GoogleFonts.poppins(color: Colors.white)),
            onPressed: () async {
              Navigator.pop(ctx);
              final success = await context.read<InventoryProvider>().deleteItem(JsonUtils.parseInt(item['id']));
              if (mounted) {
                showTopSnackBar(context, 
                  SnackBar(
                    content: Text(success ? 'Item deleted' : 'Failed to delete item'),
                    backgroundColor: success ? AppColors.statusGreen : AppColors.statusRed,
                  ),
                );
              }
            },
          ),
        ],
      ),
    );
  }

  void _showEditSupplierSheet(Map<String, dynamic> supplier) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _AddInventorySheet(supplierToEdit: supplier),
    );
  }

  void _confirmDeleteSupplier(Map<String, dynamic> supplier) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.darkCard,
        title: Text('Delete Supplier', style: GoogleFonts.poppins(color: AppColors.textPrimary)),
        content: Text('Are you sure you want to delete ${supplier['name']}? This will remove the supplier and all their records.',
            style: GoogleFonts.poppins(color: AppColors.textSecondary)),
        actions: [
          TextButton(
            child: Text('Cancel', style: GoogleFonts.poppins(color: AppColors.textMuted)),
            onPressed: () => Navigator.pop(ctx),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.statusRed),
            child: Text('Delete', style: GoogleFonts.poppins(color: Colors.white)),
            onPressed: () async {
              Navigator.pop(ctx);
              final success = await context.read<InventoryProvider>().deleteSupplier(JsonUtils.parseInt(supplier['id']));
              if (mounted) {
                showTopSnackBar(context, 
                  SnackBar(
                    content: Text(success ? 'Supplier deleted' : 'Failed to delete supplier'),
                    backgroundColor: success ? AppColors.statusGreen : AppColors.statusRed,
                  ),
                );
              }
            },
          ),
        ],
      ),
    );
  }

  // ── Recipes Tab ─────────────────────────────────────────────────────────────
  Widget _buildRecipesTab() {
    final provider = context.watch<InventoryProvider>();
    final menus = provider.menus;

    if (menus.isEmpty) {
      return Center(
        child: Text(
          'No menu items found.\nAdd menus in the main Menu screen.',
          textAlign: TextAlign.center,
          style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 14),
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: menus.length,
      separatorBuilder: (context, index) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final menu = menus[index];
        final menuId = JsonUtils.parseInt(menu['id']);
        final menuRecipes = provider.recipes.where((r) => JsonUtils.parseInt(r['menu_id']) == menuId).toList();

        return Card(
          color: AppColors.darkCard,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: BorderSide(color: AppColors.darkBorder),
          ),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        menu['name'] ?? '',
                        style: GoogleFonts.poppins(
                          color: AppColors.textPrimary,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        menu['category'] ?? 'General',
                        style: GoogleFonts.poppins(
                          color: AppColors.textMuted,
                          fontSize: 12,
                        ),
                      ),
                      const SizedBox(height: 8),
                      if (menuRecipes.isEmpty)
                        Text(
                          'No ingredients configured',
                          style: GoogleFonts.poppins(
                            color: AppColors.statusRed,
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        )
                      else
                        Wrap(
                          spacing: 8,
                          runSpacing: 4,
                          children: menuRecipes.map<Widget>((r) {
                            return Chip(
                              label: Text('${r['item_name']} (${r['qty']} ${r['unit']})'),
                              backgroundColor: AppColors.darkBg,
                              labelStyle: GoogleFonts.poppins(color: AppColors.textSecondary, fontSize: 11),
                              padding: EdgeInsets.zero,
                              materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                            );
                          }).toList(),
                        ),
                    ],
                  ),
                ),
                IconButton(
                  icon: Icon(Icons.edit_note_rounded, color: AppColors.accentAmber),
                  onPressed: () => _showRecipeEditor(menu, menuRecipes, provider.items),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _showRecipeEditor(
    Map<String, dynamic> menu,
    List<Map<String, dynamic>> existingIngredients,
    List<Map<String, dynamic>> availableItems,
  ) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.darkBg,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return _RecipeEditorSheet(
          menu: menu,
          initialIngredients: existingIngredients,
          availableItems: availableItems,
          onSave: (ingredients) async {
            final success = await context.read<InventoryProvider>().saveRecipe(
                  menuId: JsonUtils.parseInt(menu['id']),
                  ingredients: ingredients,
                );
            if (success && mounted) {
              showTopSnackBar(context, 
                const SnackBar(content: Text('Recipe saved successfully!')),
              );
            }
            return success;
          },
        );
      },
    );
  }

  // ── Settings Tab ────────────────────────────────────────────────────────────
  Widget _buildSettingsTab() {
    final provider = context.watch<InventoryProvider>();

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Measuring Units Section
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Measuring Units',
              style: GoogleFonts.poppins(
                color: AppColors.textPrimary,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            TextButton.icon(
              icon: const Icon(Icons.add_rounded, size: 18),
              label: const Text('Add Unit'),
              style: TextButton.styleFrom(foregroundColor: AppColors.accentAmber),
              onPressed: () => _showAddEditUnitDialog(),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: AppColors.darkCard,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.darkBorder),
          ),
          child: ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: provider.units.length,
            separatorBuilder: (context, index) => Divider(color: AppColors.darkBorder, height: 1),
            itemBuilder: (context, index) {
              final unit = provider.units[index];
              return ListTile(
                title: Text(
                  unit['name'] ?? '',
                  style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 14, fontWeight: FontWeight.w500),
                ),
                subtitle: Text(
                  'Short name: ${unit['short_name'] ?? ''}',
                  style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 12),
                ),
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    IconButton(
                      icon: Icon(Icons.edit_rounded, size: 18, color: AppColors.textSecondary),
                      onPressed: () => _showAddEditUnitDialog(unit),
                    ),
                    IconButton(
                      icon: Icon(Icons.delete_rounded, size: 18, color: AppColors.statusRed),
                      onPressed: () => _confirmDeleteUnit(unit),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 24),

        // Stock Groups Section
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Stock Groups',
              style: GoogleFonts.poppins(
                color: AppColors.textPrimary,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            TextButton.icon(
              icon: const Icon(Icons.add_rounded, size: 18),
              label: const Text('Add Group'),
              style: TextButton.styleFrom(foregroundColor: AppColors.accentAmber),
              onPressed: () => _showAddEditGroupDialog(),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: AppColors.darkCard,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.darkBorder),
          ),
          child: ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: provider.groups.length,
            separatorBuilder: (context, index) => Divider(color: AppColors.darkBorder, height: 1),
            itemBuilder: (context, index) {
              final group = provider.groups[index];
              return ListTile(
                title: Text(
                  group['name'] ?? '',
                  style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 14, fontWeight: FontWeight.w500),
                ),
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    IconButton(
                      icon: Icon(Icons.edit_rounded, size: 18, color: AppColors.textSecondary),
                      onPressed: () => _showAddEditGroupDialog(group),
                    ),
                    IconButton(
                      icon: Icon(Icons.delete_rounded, size: 18, color: AppColors.statusRed),
                      onPressed: () => _confirmDeleteGroup(group),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  void _showAddEditUnitDialog([Map<String, dynamic>? unit]) {
    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (context) => _UnitFormDialog(unit: unit),
    );
  }

  void _confirmDeleteUnit(Map<String, dynamic> unit) {
    showDialog(
      context: context,
      builder: (context) {
        return Dialog(
          backgroundColor: AppColors.darkCard,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          child: Container(
            constraints: const BoxConstraints(maxWidth: 400),
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.statusRed.withOpacity(0.12),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(Icons.delete_outline_rounded, color: AppColors.statusRed, size: 28),
                ),
                const SizedBox(height: 16),
                Text(
                  'Delete Measuring Unit?',
                  style: GoogleFonts.poppins(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Are you sure you want to delete "${unit['name']}"? This action cannot be undone.',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.poppins(
                    fontSize: 13,
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 24),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => Navigator.pop(context),
                        style: OutlinedButton.styleFrom(
                          side: BorderSide(color: AppColors.darkBorder),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: Text(
                          'Cancel',
                          style: GoogleFonts.poppins(
                            color: AppColors.textSecondary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.statusRed,
                          foregroundColor: Colors.white,
                          elevation: 0,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: Text(
                          'Delete',
                          style: GoogleFonts.poppins(fontWeight: FontWeight.bold),
                        ),
                        onPressed: () async {
                          final ok = await context.read<InventoryProvider>().deleteUnit(unit['id']);
                          if (ok && context.mounted) {
                            Navigator.pop(context);
                          }
                        },
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _showAddEditGroupDialog([Map<String, dynamic>? group]) {
    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (context) => _GroupFormDialog(group: group),
    );
  }

  void _confirmDeleteGroup(Map<String, dynamic> group) {
    showDialog(
      context: context,
      builder: (context) {
        return Dialog(
          backgroundColor: AppColors.darkCard,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          child: Container(
            constraints: const BoxConstraints(maxWidth: 400),
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.statusRed.withOpacity(0.12),
                    shape: BoxShape.circle,
                  ),
                  child: Icon(Icons.delete_outline_rounded, color: AppColors.statusRed, size: 28),
                ),
                const SizedBox(height: 16),
                Text(
                  'Delete Stock Group?',
                  style: GoogleFonts.poppins(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Are you sure you want to delete "${group['name']}"? This action cannot be undone.',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.poppins(
                    fontSize: 13,
                    color: AppColors.textSecondary,
                  ),
                ),
                const SizedBox(height: 24),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => Navigator.pop(context),
                        style: OutlinedButton.styleFrom(
                          side: BorderSide(color: AppColors.darkBorder),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: Text(
                          'Cancel',
                          style: GoogleFonts.poppins(
                            color: AppColors.textSecondary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.statusRed,
                          foregroundColor: Colors.white,
                          elevation: 0,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        child: Text(
                          'Delete',
                          style: GoogleFonts.poppins(fontWeight: FontWeight.bold),
                        ),
                        onPressed: () async {
                          final ok = await context.read<InventoryProvider>().deleteGroup(group['id']);
                          if (ok && context.mounted) {
                            Navigator.pop(context);
                          }
                        },
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _AddInventorySheet extends StatefulWidget {
  final Map<String, dynamic>? itemToEdit;
  final Map<String, dynamic>? supplierToEdit;
  
  const _AddInventorySheet({this.itemToEdit, this.supplierToEdit});

  @override
  State<_AddInventorySheet> createState() => _AddInventorySheetState();
}

class _AddInventorySheetState extends State<_AddInventorySheet> {
  final _formKey = GlobalKey<FormState>();
  String _activeType = 'item'; // 'item', 'purchase', 'usage', 'supplier'
  
  // Item fields
  final _itemNameController = TextEditingController();
  final _itemThresholdController = TextEditingController(text: '0.0');
  final _itemStockController = TextEditingController(text: '0.0');
  int? _selectedGroupId;
  int? _selectedUnitId;

  // Purchase fields
  int? _purchaseItemId;
  int? _purchaseSupplierId;
  final _purchaseQtyController = TextEditingController();
  final _purchasePriceController = TextEditingController();
  final _purchaseTotalController = TextEditingController();
  DateTime _purchaseDate = DateTime.now();
  final _purchaseNotesController = TextEditingController();

  // Usage fields
  int? _usageItemId;
  final _usageQtyController = TextEditingController();
  DateTime _usageDate = DateTime.now();
  final _usageNotesController = TextEditingController();

  // Supplier fields
  final _supplierNameController = TextEditingController();
  final _supplierContactPersonController = TextEditingController();
  final _supplierPhoneController = TextEditingController();
  final _supplierEmailController = TextEditingController();
  final _supplierAddressController = TextEditingController();

  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    if (widget.itemToEdit != null) {
      _activeType = 'item';
      final item = widget.itemToEdit!;
      _itemNameController.text = item['name'] ?? '';
      _itemThresholdController.text = (item['threshold'] ?? 0.0).toString();
      _itemStockController.text = (item['stock'] ?? 0.0).toString();
      _selectedGroupId = JsonUtils.parseIntNullable(item['stock_group_id']);
      _selectedUnitId = JsonUtils.parseIntNullable(item['measuring_unit_id']);
    } else if (widget.supplierToEdit != null) {
      _activeType = 'supplier';
      final s = widget.supplierToEdit!;
      _supplierNameController.text = s['name'] ?? '';
      _supplierContactPersonController.text = s['contact_person'] ?? '';
      _supplierPhoneController.text = s['phone'] ?? '';
      _supplierEmailController.text = s['email'] ?? '';
      _supplierAddressController.text = s['address'] ?? '';
    }
  }

  @override
  void dispose() {
    _itemNameController.dispose();
    _itemThresholdController.dispose();
    _itemStockController.dispose();
    _purchaseQtyController.dispose();
    _purchasePriceController.dispose();
    _purchaseTotalController.dispose();
    _purchaseNotesController.dispose();
    _usageQtyController.dispose();
    _usageNotesController.dispose();
    _supplierNameController.dispose();
    _supplierContactPersonController.dispose();
    _supplierPhoneController.dispose();
    _supplierEmailController.dispose();
    _supplierAddressController.dispose();
    super.dispose();
  }

  void _calculateTotal() {
    final qty = double.tryParse(_purchaseQtyController.text) ?? 0;
    final price = double.tryParse(_purchasePriceController.text) ?? 0;
    if (qty > 0 && price > 0) {
      setState(() {
        _purchaseTotalController.text = (qty * price).toStringAsFixed(2);
      });
    }
  }

  Future<void> _selectDate(BuildContext context, bool isPurchase) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: isPurchase ? _purchaseDate : _usageDate,
      firstDate: DateTime(2025),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked != null) {
      setState(() {
        if (isPurchase) {
          _purchaseDate = picked;
        } else {
          _usageDate = picked;
        }
      });
    }
  }

  Future<void> _submitForm() async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() => _isSaving = true);
    final provider = context.read<InventoryProvider>();
    bool success = false;

    if (_activeType == 'item') {
      final name = _itemNameController.text.trim();
      final threshold = double.tryParse(_itemThresholdController.text) ?? 0.0;
      final stock = double.tryParse(_itemStockController.text) ?? 0.0;
      
      if (widget.itemToEdit != null) {
        success = await provider.updateItem(
          id: JsonUtils.parseInt(widget.itemToEdit!['id']),
          name: name,
          lowStockThreshold: threshold,
          currentStock: stock,
          stockGroupId: _selectedGroupId,
          measuringUnitId: _selectedUnitId,
        );
      } else {
        success = await provider.createItem(
          name: name,
          lowStockThreshold: threshold,
          currentStock: stock,
          stockGroupId: _selectedGroupId,
          measuringUnitId: _selectedUnitId,
        );
      }
    } else if (_activeType == 'purchase') {
      success = await provider.createPurchase(
        inventoryItemId: _purchaseItemId!,
        supplierId: _purchaseSupplierId,
        quantity: double.parse(_purchaseQtyController.text),
        unitPrice: double.parse(_purchasePriceController.text),
        totalPrice: double.parse(_purchaseTotalController.text),
        purchaseDate: _purchaseDate.toIso8601String().split('T')[0],
        notes: _purchaseNotesController.text.trim(),
      );
    } else if (_activeType == 'usage') {
      success = await provider.createUsage(
        inventoryItemId: _usageItemId!,
        quantityUsed: double.parse(_usageQtyController.text),
        usageDate: _usageDate.toIso8601String().split('T')[0],
        notes: _usageNotesController.text.trim(),
      );
    } else if (_activeType == 'supplier') {
      if (widget.supplierToEdit != null) {
        success = await provider.updateSupplier(
          id: JsonUtils.parseInt(widget.supplierToEdit!['id']),
          name: _supplierNameController.text.trim(),
          contactPerson: _supplierContactPersonController.text.trim(),
          phone: _supplierPhoneController.text.trim(),
          email: _supplierEmailController.text.trim(),
          address: _supplierAddressController.text.trim(),
        );
      } else {
        success = await provider.createSupplier(
          name: _supplierNameController.text.trim(),
          contactPerson: _supplierContactPersonController.text.trim(),
          phone: _supplierPhoneController.text.trim(),
          email: _supplierEmailController.text.trim(),
          address: _supplierAddressController.text.trim(),
        );
      }
    }

    if (mounted) {
      setState(() => _isSaving = false);
      if (success) {
        Navigator.pop(context);
        showTopSnackBar(context, 
          SnackBar(
            content: Text(widget.itemToEdit != null
                ? 'Item updated successfully'
                : 'Added successfully'),
            backgroundColor: AppColors.statusGreen,
          ),
        );
      } else {
        showTopSnackBar(context, 
          SnackBar(
            content: Text(provider.error ?? 'An error occurred'),
            backgroundColor: AppColors.statusRed,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<InventoryProvider>();
    final size = MediaQuery.of(context).size;

    return Container(
      height: size.height * 0.85,
      decoration: BoxDecoration(
        color: AppColors.darkSurface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: EdgeInsets.only(
        top: 20,
        left: 20,
        right: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Text(
                widget.itemToEdit != null ? 'Edit Inventory Item' : (widget.supplierToEdit != null ? 'Edit Supplier' : 'Log / Add Inventory'),
                style: GoogleFonts.poppins(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
              const Spacer(),
              IconButton(
                icon: Icon(Icons.close, color: AppColors.textMuted),
                onPressed: () => Navigator.pop(context),
              )
            ],
          ),
          const SizedBox(height: 10),
          
          if (widget.itemToEdit == null && widget.supplierToEdit == null) ...[
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _typeChip('item', 'New Item', Icons.inventory_2_outlined),
                  const SizedBox(width: 8),
                  _typeChip('purchase', 'Log Purchase', Icons.add_shopping_cart_rounded),
                  const SizedBox(width: 8),
                  _typeChip('usage', 'Log Usage', Icons.remove_shopping_cart_rounded),
                  const SizedBox(width: 8),
                  _typeChip('supplier', 'Add Supplier', Icons.person_add_alt_1_outlined),
                ],
              ),
            ),
            const SizedBox(height: 20),
          ],

          Expanded(
            child: SingleChildScrollView(
              child: Form(
                key: _formKey,
                child: _buildFormFields(provider),
              ),
            ),
          ),
          
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: _isSaving ? null : _submitForm,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.accentAmber,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              child: _isSaving
                  ? const CircularProgressIndicator(color: Colors.white)
                  : Text(
                      widget.itemToEdit != null ? 'Save Changes' : 'Submit',
                      style: GoogleFonts.poppins(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                      ),
                    ),
            ),
          )
        ],
      ),
    );
  }

  Widget _typeChip(String type, String label, IconData icon) {
    final active = _activeType == type;
    return ChoiceChip(
      showCheckmark: false,
      avatar: Icon(icon, color: active ? Colors.white : AppColors.textSecondary, size: 16),
      label: Text(label, style: GoogleFonts.poppins(fontSize: 12)),
      selected: active,
      selectedColor: AppColors.accentAmber,
      backgroundColor: AppColors.darkCard,
      labelStyle: TextStyle(color: active ? Colors.white : AppColors.textSecondary),
      onSelected: (selected) {
        if (selected) {
          setState(() {
            _activeType = type;
          });
        }
      },
    );
  }

  Widget _buildFormFields(InventoryProvider provider) {
    if (_activeType == 'item') {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _fieldLabel('Item Name'),
          _textInput(_itemNameController, 'e.g. Coffee Beans', validator: (v) => v!.isEmpty ? 'Required' : null),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _fieldLabel('Stock Group'),
                    DropdownButtonFormField<int>(
                      value: _selectedGroupId,
                      dropdownColor: AppColors.darkCard,
                      decoration: _inputDecoration('Group'),
                      items: provider.groups.map((g) => DropdownMenuItem<int>(
                        value: JsonUtils.parseInt(g['id']),
                        child: Text(g['name'] ?? '', style: GoogleFonts.poppins(color: AppColors.textPrimary)),
                      )).toList(),
                      onChanged: (val) => setState(() => _selectedGroupId = val),
                    )
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _fieldLabel('Measuring Unit'),
                    DropdownButtonFormField<int>(
                      value: _selectedUnitId,
                      dropdownColor: AppColors.darkCard,
                      decoration: _inputDecoration('Unit'),
                      items: provider.units.map((u) => DropdownMenuItem<int>(
                        value: JsonUtils.parseInt(u['id']),
                        child: Text(u['name'] ?? '', style: GoogleFonts.poppins(color: AppColors.textPrimary)),
                      )).toList(),
                      onChanged: (val) => setState(() => _selectedUnitId = val),
                    )
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _fieldLabel('Low Stock Alert Min'),
                    _textInput(_itemThresholdController, '0.0', keyboard: TextInputType.number),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _fieldLabel('Opening Stock'),
                    _textInput(_itemStockController, '0.0', keyboard: TextInputType.number, enabled: widget.itemToEdit == null),
                  ],
                ),
              ),
            ],
          ),
        ],
      );
    } else if (_activeType == 'purchase') {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _fieldLabel('Inventory Item'),
          DropdownButtonFormField<int>(
            value: _purchaseItemId,
            dropdownColor: AppColors.darkCard,
            decoration: _inputDecoration('Select Item'),
            validator: (v) => v == null ? 'Required' : null,
            items: provider.items.map((i) => DropdownMenuItem<int>(
              value: JsonUtils.parseInt(i['id']),
              child: Text(i['name'] ?? '', style: GoogleFonts.poppins(color: AppColors.textPrimary)),
            )).toList(),
            onChanged: (val) => setState(() => _purchaseItemId = val),
          ),
          const SizedBox(height: 16),
          _fieldLabel('Supplier'),
          DropdownButtonFormField<int>(
            value: _purchaseSupplierId,
            dropdownColor: AppColors.darkCard,
            decoration: _inputDecoration('Select Supplier'),
            items: provider.suppliers.map((s) => DropdownMenuItem<int>(
              value: JsonUtils.parseInt(s['id']),
              child: Text(s['name'] ?? '', style: GoogleFonts.poppins(color: AppColors.textPrimary)),
            )).toList(),
            onChanged: (val) => setState(() => _purchaseSupplierId = val),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _fieldLabel('Quantity'),
                    _textInput(_purchaseQtyController, '0.0', keyboard: TextInputType.number, onChanged: (v) => _calculateTotal(), validator: (v) => double.tryParse(v ?? '') == null ? 'Invalid number' : null),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _fieldLabel('Unit Price'),
                    _textInput(_purchasePriceController, '0.0', keyboard: TextInputType.number, onChanged: (v) => _calculateTotal(), validator: (v) => double.tryParse(v ?? '') == null ? 'Invalid price' : null),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _fieldLabel('Total Cost'),
                    _textInput(_purchaseTotalController, '0.0', keyboard: TextInputType.number, validator: (v) => double.tryParse(v ?? '') == null ? 'Invalid total' : null),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _fieldLabel('Purchase Date'),
                    InkWell(
                      onTap: () => _selectDate(context, true),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                        decoration: BoxDecoration(
                          color: AppColors.darkCard,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: AppColors.darkBorder),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.calendar_today_rounded, size: 16, color: AppColors.textSecondary),
                            const SizedBox(width: 8),
                            Text(
                              '${_purchaseDate.year}-${_purchaseDate.month.toString().padLeft(2, '0')}-${_purchaseDate.day.toString().padLeft(2, '0')}',
                              style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 14),
                            ),
                          ],
                        ),
                      ),
                    )
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _fieldLabel('Notes'),
          _textInput(_purchaseNotesController, 'Additional details...'),
        ],
      );
    } else if (_activeType == 'usage') {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _fieldLabel('Inventory Item'),
          DropdownButtonFormField<int>(
            value: _usageItemId,
            dropdownColor: AppColors.darkCard,
            decoration: _inputDecoration('Select Item'),
            validator: (v) => v == null ? 'Required' : null,
            items: provider.items.map((i) => DropdownMenuItem<int>(
              value: JsonUtils.parseInt(i['id']),
              child: Text(i['name'] ?? '', style: GoogleFonts.poppins(color: AppColors.textPrimary)),
            )).toList(),
            onChanged: (val) => setState(() => _usageItemId = val),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _fieldLabel('Quantity Used'),
                    _textInput(_usageQtyController, '0.0', keyboard: TextInputType.number, validator: (v) => double.tryParse(v ?? '') == null ? 'Invalid quantity' : null),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _fieldLabel('Usage Date'),
                    InkWell(
                      onTap: () => _selectDate(context, false),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                        decoration: BoxDecoration(
                          color: AppColors.darkCard,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: AppColors.darkBorder),
                        ),
                        child: Row(
                          children: [
                            Icon(Icons.calendar_today_rounded, size: 16, color: AppColors.textSecondary),
                            const SizedBox(width: 8),
                            Text(
                              '${_usageDate.year}-${_usageDate.month.toString().padLeft(2, '0')}-${_usageDate.day.toString().padLeft(2, '0')}',
                              style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 14),
                            ),
                          ],
                        ),
                      ),
                    )
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _fieldLabel('Notes / Purpose'),
          _textInput(_usageNotesController, 'e.g. Used for Baking, Latte recipe, etc.'),
        ],
      );
    } else {
      // Supplier fields
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _fieldLabel('Supplier Name'),
          _textInput(_supplierNameController, 'Supplier / Shop name', validator: (v) => v!.isEmpty ? 'Required' : null),
          const SizedBox(height: 16),
          _fieldLabel('Contact Person'),
          _textInput(_supplierContactPersonController, 'Name of contact person'),
          const SizedBox(height: 16),
          _fieldLabel('Phone Number'),
          _textInput(_supplierPhoneController, 'Supplier phone number', keyboard: TextInputType.phone),
          const SizedBox(height: 16),
          _fieldLabel('Email Address'),
          _textInput(_supplierEmailController, 'supplier@email.com', keyboard: TextInputType.emailAddress),
          const SizedBox(height: 16),
          _fieldLabel('Address'),
          _textInput(_supplierAddressController, 'Supplier physical address'),
        ],
      );
    }
  }



  Widget _fieldLabel(String label) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Text(
        label,
        style: GoogleFonts.poppins(
          fontSize: 12,
          fontWeight: FontWeight.w500,
          color: AppColors.textSecondary,
        ),
      ),
    );
  }

  Widget _textInput(
    TextEditingController controller,
    String hint, {
    TextInputType keyboard = TextInputType.text,
    bool enabled = true,
    FormFieldValidator<String>? validator,
    ValueChanged<String>? onChanged,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboard,
      enabled: enabled,
      validator: validator,
      onChanged: onChanged,
      style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 14),
      decoration: _inputDecoration(hint),
    );
  }

  InputDecoration _inputDecoration(String hint) {
    return InputDecoration(
      hintText: hint,
      filled: true,
      fillColor: AppColors.darkCard,
      hintStyle: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 14),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide(color: AppColors.darkBorder),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide(color: AppColors.darkBorder),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(14),
        borderSide: BorderSide(color: AppColors.accentAmber, width: 2),
      ),
    );
  }
}

// ── Recipe Editor Bottom Sheet ────────────────────────────────────────────────
class _RecipeEditorSheet extends StatefulWidget {
  final Map<String, dynamic> menu;
  final List<Map<String, dynamic>> initialIngredients;
  final List<Map<String, dynamic>> availableItems;
  final Future<bool> Function(List<Map<String, dynamic>> ingredients) onSave;

  const _RecipeEditorSheet({
    required this.menu,
    required this.initialIngredients,
    required this.availableItems,
    required this.onSave,
  });

  @override
  State<_RecipeEditorSheet> createState() => _RecipeEditorSheetState();
}

class _RecipeEditorSheetState extends State<_RecipeEditorSheet> {
  final List<Map<String, dynamic>> _ingredients = [];
  int? _selectedItemId;
  final _qtyController = TextEditingController();
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    for (final ing in widget.initialIngredients) {
      _ingredients.add({
        'inventory_item_id': JsonUtils.parseInt(ing['inventory_item_id']),
        'item_name': ing['item_name'],
        'qty': ing['qty'],
        'unit': ing['unit'],
      });
    }
  }

  @override
  void dispose() {
    _qtyController.dispose();
    super.dispose();
  }

  void _addIngredient() {
    if (_selectedItemId == null || _qtyController.text.trim().isEmpty) return;

    final qty = double.tryParse(_qtyController.text.trim());
    if (qty == null || qty <= 0) return;

    final selectedItem = widget.availableItems.firstWhere((item) => JsonUtils.parseInt(item['id']) == _selectedItemId);
    
    // Check if ingredient already in list
    final existsIdx = _ingredients.indexWhere((ing) => ing['inventory_item_id'] == _selectedItemId);
    if (existsIdx != -1) {
      setState(() {
        _ingredients[existsIdx]['qty'] = qty;
      });
    } else {
      setState(() {
        _ingredients.add({
          'inventory_item_id': _selectedItemId,
          'item_name': selectedItem['name'],
          'qty': qty,
          'unit': selectedItem['unit'],
        });
      });
    }

    _qtyController.clear();
    setState(() {
      _selectedItemId = null;
    });
  }

  Map<String, dynamic>? _calculateYield() {
    if (_ingredients.isEmpty) return null;
    
    int? maxServings;
    Map<String, dynamic>? bottleneck;
    
    for (final ing in _ingredients) {
      final itemId = JsonUtils.parseInt(ing['inventory_item_id']);
      final qty = JsonUtils.parseDouble(ing['qty']);
      if (qty <= 0) continue;
      
      final invItem = widget.availableItems.firstWhere(
        (item) => JsonUtils.parseInt(item['id']) == itemId,
        orElse: () => {},
      );
      
      if (invItem.isEmpty) continue;
      
      final stock = JsonUtils.parseDouble(invItem['stock']);
      final canMake = (stock / qty).floor();
      
      if (maxServings == null || canMake < maxServings) {
        maxServings = canMake;
        bottleneck = {
          'name': invItem['name'],
          'stock': stock,
          'qty': qty,
          'unit': ing['unit'] ?? invItem['unit'] ?? '',
          'canMake': canMake,
        };
      }
    }
    
    if (maxServings == null) return null;
    
    return {
      'maxServings': maxServings,
      'bottleneck': bottleneck,
    };
  }

  @override
  Widget build(BuildContext context) {
    final mediaQuery = MediaQuery.of(context);
    final yieldData = _calculateYield();

    return Padding(
      padding: EdgeInsets.only(
        top: 24,
        left: 24,
        right: 24,
        bottom: mediaQuery.viewInsets.bottom + 24,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Edit Recipe',
                      style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 20, fontWeight: FontWeight.bold),
                    ),
                    Text(
                      widget.menu['name'] ?? '',
                      style: GoogleFonts.poppins(color: AppColors.accentAmber, fontSize: 14, fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
              ),
              IconButton(
                icon: Icon(Icons.close_rounded, color: AppColors.textSecondary),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Add Ingredient Row
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.darkCard,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.darkBorder),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Add/Update Ingredient',
                  style: GoogleFonts.poppins(color: AppColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      flex: 3,
                      child: DropdownButtonFormField<int>(
                        value: _selectedItemId,
                        hint: Text('Select Item', style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 13)),
                        dropdownColor: AppColors.darkCard,
                        style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13),
                        decoration: InputDecoration(
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          filled: true,
                          fillColor: AppColors.darkBg,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide: BorderSide.none,
                          ),
                        ),
                        items: widget.availableItems.map((item) {
                          return DropdownMenuItem<int>(
                            value: JsonUtils.parseInt(item['id']),
                            child: Text(item['name'] ?? ''),
                          );
                        }).toList(),
                        onChanged: (val) {
                          setState(() {
                            _selectedItemId = val;
                          });
                        },
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      flex: 2,
                      child: TextFormField(
                        controller: _qtyController,
                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                        style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13),
                        decoration: InputDecoration(
                          hintText: 'Qty',
                          hintStyle: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 13),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          filled: true,
                          fillColor: AppColors.darkBg,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide: BorderSide.none,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    IconButton(
                      icon: Icon(Icons.add_circle_rounded, color: AppColors.accentAmber, size: 32),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                      onPressed: _addIngredient,
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Ingredients list
          Text(
            'Recipe Ingredients',
            style: GoogleFonts.poppins(color: AppColors.textSecondary, fontSize: 13, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          if (_ingredients.isEmpty)
            Container(
              height: 100,
              alignment: Alignment.center,
              child: Text(
                'No ingredients added to this recipe.',
                style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 13),
              ),
            )
          else
            ConstrainedBox(
              constraints: const BoxConstraints(maxHeight: 250),
              child: ListView.separated(
                shrinkWrap: true,
                itemCount: _ingredients.length,
                separatorBuilder: (context, index) => const SizedBox(height: 8),
                itemBuilder: (context, index) {
                  final ing = _ingredients[index];
                  return Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: AppColors.darkCard,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            ing['item_name'] ?? '',
                            style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 14, fontWeight: FontWeight.w500),
                          ),
                        ),
                        Text(
                          '${ing['qty']} ${ing['unit']}',
                          style: GoogleFonts.poppins(color: AppColors.accentAmber, fontSize: 14, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(width: 12),
                        IconButton(
                          icon: Icon(Icons.delete_rounded, color: AppColors.statusRed, size: 20),
                          padding: EdgeInsets.zero,
                          constraints: const BoxConstraints(),
                          onPressed: () {
                            setState(() {
                              _ingredients.removeAt(index);
                            });
                          },
                        ),
                      ],
                    ),
                  );
                },
              ),
            ),
          const SizedBox(height: 24),

          // Yield badge card
          if (yieldData != null) ...[
            Builder(
              builder: (context) {
                final maxServings = yieldData['maxServings'] as int;
                final bottleneck = yieldData['bottleneck'] as Map<String, dynamic>?;
                
                final isZero = maxServings == 0;
                final isLow = maxServings <= 5;
                
                final bgColor = isZero 
                    ? const Color(0xFFFEF2F2) 
                    : (isLow ? const Color(0xFFFFFBEB) : const Color(0xFFEEF2FF));
                final borderColor = isZero 
                    ? const Color(0xFFFCA5A5) 
                    : (isLow ? const Color(0xFFFCD34D) : const Color(0xFFC7D2FE));
                final textColor = isZero 
                    ? const Color(0xFF991B1B) 
                    : (isLow ? const Color(0xFF92400E) : const Color(0xFF3730A3));
                final iconColor = isZero 
                    ? const Color(0xFFEF4444) 
                    : (isLow ? const Color(0xFFF59E0B) : const Color(0xFF4F46E5));
                
                return Container(
                  margin: const EdgeInsets.only(bottom: 24),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: bgColor,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: borderColor),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.8),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Icon(
                          isZero 
                              ? Icons.error_outline_rounded 
                              : (isLow ? Icons.info_outline_rounded : Icons.restaurant_rounded),
                          color: iconColor,
                          size: 24,
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              '$maxServings ${maxServings == 1 ? "serving" : "servings"} can be made',
                              style: GoogleFonts.poppins(
                                color: textColor,
                                fontSize: 15,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            if (bottleneck != null && maxServings < 9999) ...[
                              const SizedBox(height: 4),
                              Text(
                                'Limited by: ${bottleneck['name']} (${bottleneck['stock']} ${bottleneck['unit']} remaining - ${bottleneck['qty']} per serving)',
                                style: GoogleFonts.poppins(
                                  color: textColor.withValues(alpha: 0.8),
                                  fontSize: 11,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ],

          // Save Button
          SizedBox(
            width: double.infinity,
            height: 50,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.accentAmber,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
              onPressed: _isSaving
                  ? null
                  : () async {
                      setState(() {
                        _isSaving = true;
                      });
                      final list = _ingredients.map((ing) => {
                        'inventory_item_id': ing['inventory_item_id'],
                        'quantity_per_serving': ing['qty'],
                      }).toList();

                      final ok = await widget.onSave(list);
                      if (ok && mounted) {
                        Navigator.pop(context);
                      } else {
                        setState(() {
                          _isSaving = false;
                        });
                      }
                    },
              child: _isSaving
                  ? const CircularProgressIndicator(color: Colors.white)
                  : Text(
                      'Save Recipe',
                      style: GoogleFonts.poppins(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}

class _UnitFormDialog extends StatefulWidget {
  final Map<String, dynamic>? unit;

  const _UnitFormDialog({this.unit});

  @override
  State<_UnitFormDialog> createState() => _UnitFormDialogState();
}

class _UnitFormDialogState extends State<_UnitFormDialog> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameController;
  late TextEditingController _shortController;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.unit?['name']);
    _shortController = TextEditingController(text: widget.unit?['short_name']);
  }

  @override
  void dispose() {
    _nameController.dispose();
    _shortController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSaving = true);
    final provider = context.read<InventoryProvider>();
    bool ok = false;

    if (widget.unit == null) {
      ok = await provider.createUnit(
        name: _nameController.text.trim(),
        shortName: _shortController.text.trim(),
      );
    } else {
      ok = await provider.updateUnit(
        id: widget.unit!['id'],
        name: _nameController.text.trim(),
        shortName: _shortController.text.trim(),
      );
    }

    if (mounted) {
      setState(() => _isSaving = false);
      if (ok) {
        Navigator.pop(context);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.unit != null;

    return Dialog(
      backgroundColor: AppColors.darkCard,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      child: Container(
        constraints: const BoxConstraints(maxWidth: 420),
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.accentAmber.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Icon(
                      Icons.square_foot_rounded,
                      color: AppColors.accentAmber,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          isEdit ? 'Edit Measuring Unit' : 'Add Measuring Unit',
                          style: GoogleFonts.poppins(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          isEdit ? 'Update measurement unit details' : 'Define unit name and symbol',
                          style: GoogleFonts.poppins(
                            fontSize: 12,
                            color: AppColors.textMuted,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: Icon(Icons.close_rounded, color: AppColors.textMuted, size: 20),
                    splashRadius: 20,
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
                ],
              ),
              const SizedBox(height: 22),
              // Field 1: Unit Name
              Text(
                'Unit Name',
                style: GoogleFonts.poppins(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _nameController,
                style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 14),
                validator: (val) {
                  if (val == null || val.trim().isEmpty) {
                    return 'Please enter unit name';
                  }
                  return null;
                },
                decoration: InputDecoration(
                  hintText: 'e.g. Kilogram',
                  hintStyle: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 14),
                  prefixIcon: Icon(Icons.label_outlined, color: AppColors.textSecondary, size: 20),
                  filled: true,
                  fillColor: AppColors.darkBg,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide(color: AppColors.darkBorder),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide(color: AppColors.darkBorder),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide(color: AppColors.accentAmber, width: 1.5),
                  ),
                  errorBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide(color: AppColors.statusRed),
                  ),
                  focusedErrorBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide(color: AppColors.statusRed, width: 1.5),
                  ),
                ),
              ),
              const SizedBox(height: 18),
              // Field 2: Short Name / Symbol
              Text(
                'Short Name / Symbol',
                style: GoogleFonts.poppins(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _shortController,
                style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 14),
                validator: (val) {
                  if (val == null || val.trim().isEmpty) {
                    return 'Please enter symbol (e.g. kg)';
                  }
                  return null;
                },
                decoration: InputDecoration(
                  hintText: 'e.g. kg',
                  hintStyle: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 14),
                  prefixIcon: Icon(Icons.short_text_rounded, color: AppColors.textSecondary, size: 22),
                  filled: true,
                  fillColor: AppColors.darkBg,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide(color: AppColors.darkBorder),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide(color: AppColors.darkBorder),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide(color: AppColors.accentAmber, width: 1.5),
                  ),
                  errorBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide(color: AppColors.statusRed),
                  ),
                  focusedErrorBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide(color: AppColors.statusRed, width: 1.5),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              // Buttons
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: _isSaving ? null : () => Navigator.pop(context),
                      style: OutlinedButton.styleFrom(
                        side: BorderSide(color: AppColors.darkBorder),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      child: Text(
                        'Cancel',
                        style: GoogleFonts.poppins(
                          color: AppColors.textSecondary,
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: _isSaving ? null : _submit,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.accentAmber,
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      child: _isSaving
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                              ),
                            )
                          : Text(
                              isEdit ? 'Save Changes' : 'Add Unit',
                              style: GoogleFonts.poppins(
                                color: Colors.white,
                                fontWeight: FontWeight.w600,
                                fontSize: 14,
                              ),
                            ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _GroupFormDialog extends StatefulWidget {
  final Map<String, dynamic>? group;

  const _GroupFormDialog({this.group});

  @override
  State<_GroupFormDialog> createState() => _GroupFormDialogState();
}

class _GroupFormDialogState extends State<_GroupFormDialog> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameController;
  late TextEditingController _descController;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.group?['name']);
    _descController = TextEditingController(text: widget.group?['description']);
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSaving = true);
    final provider = context.read<InventoryProvider>();
    bool ok = false;

    if (widget.group == null) {
      ok = await provider.createGroup(
        name: _nameController.text.trim(),
        description: _descController.text.trim(),
      );
    } else {
      ok = await provider.updateGroup(
        id: widget.group!['id'],
        name: _nameController.text.trim(),
        description: _descController.text.trim(),
      );
    }

    if (mounted) {
      setState(() => _isSaving = false);
      if (ok) {
        Navigator.pop(context);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.group != null;

    return Dialog(
      backgroundColor: AppColors.darkCard,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      child: Container(
        constraints: const BoxConstraints(maxWidth: 420),
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.accentAmber.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Icon(
                      Icons.category_rounded,
                      color: AppColors.accentAmber,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          isEdit ? 'Edit Stock Group' : 'Add Stock Group',
                          style: GoogleFonts.poppins(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          isEdit ? 'Update stock group category' : 'Organize inventory items into categories',
                          style: GoogleFonts.poppins(
                            fontSize: 12,
                            color: AppColors.textMuted,
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: Icon(Icons.close_rounded, color: AppColors.textMuted, size: 20),
                    splashRadius: 20,
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
                ],
              ),
              const SizedBox(height: 22),
              // Field 1: Group Name
              Text(
                'Group Name',
                style: GoogleFonts.poppins(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _nameController,
                style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 14),
                validator: (val) {
                  if (val == null || val.trim().isEmpty) {
                    return 'Please enter group name';
                  }
                  return null;
                },
                decoration: InputDecoration(
                  hintText: 'e.g. Dairy',
                  hintStyle: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 14),
                  prefixIcon: Icon(Icons.folder_outlined, color: AppColors.textSecondary, size: 20),
                  filled: true,
                  fillColor: AppColors.darkBg,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide(color: AppColors.darkBorder),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide(color: AppColors.darkBorder),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide(color: AppColors.accentAmber, width: 1.5),
                  ),
                  errorBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide(color: AppColors.statusRed),
                  ),
                  focusedErrorBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide(color: AppColors.statusRed, width: 1.5),
                  ),
                ),
              ),
              const SizedBox(height: 18),
              // Field 2: Description (Optional)
              Text(
                'Description (Optional)',
                style: GoogleFonts.poppins(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              TextFormField(
                controller: _descController,
                style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 14),
                decoration: InputDecoration(
                  hintText: 'Brief description',
                  hintStyle: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 14),
                  prefixIcon: Icon(Icons.notes_rounded, color: AppColors.textSecondary, size: 20),
                  filled: true,
                  fillColor: AppColors.darkBg,
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide(color: AppColors.darkBorder),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide(color: AppColors.darkBorder),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide(color: AppColors.accentAmber, width: 1.5),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              // Buttons
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: _isSaving ? null : () => Navigator.pop(context),
                      style: OutlinedButton.styleFrom(
                        side: BorderSide(color: AppColors.darkBorder),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      child: Text(
                        'Cancel',
                        style: GoogleFonts.poppins(
                          color: AppColors.textSecondary,
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: _isSaving ? null : _submit,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.accentAmber,
                        elevation: 0,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      child: _isSaving
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                              ),
                            )
                          : Text(
                              isEdit ? 'Save Changes' : 'Add Group',
                              style: GoogleFonts.poppins(
                                color: Colors.white,
                                fontWeight: FontWeight.w600,
                                fontSize: 14,
                              ),
                            ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

