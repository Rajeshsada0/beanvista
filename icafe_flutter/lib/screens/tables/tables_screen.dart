import 'package:icafe_app/core/utils/snackbar_helper.dart';
import 'package:icafe_app/core/constants/app_constants.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/json_utils.dart';
import '../../core/services/api_service.dart';
import 'package:flutter/services.dart' show Clipboard, ClipboardData;
import 'package:url_launcher/url_launcher.dart';
import '../../providers/tables_provider.dart';
import '../../providers/orders_provider.dart';
import '../../providers/app_provider.dart';
import '../../components/order_view_sheet.dart';
import '../home_shell.dart';

class TablesScreen extends StatefulWidget {
  const TablesScreen({super.key});

  @override
  State<TablesScreen> createState() => _TablesScreenState();
}

class _TablesScreenState extends State<TablesScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<TablesProvider>().fetchTables();
    });
  }

  Color _tableColor(String status) {
    switch (status) {
      case 'available': return AppColors.tableAvailable;
      case 'occupied': return AppColors.tableOccupied;
      case 'reserved': return AppColors.tableReserved;
      default: return AppColors.textMuted;
    }
  }

  @override
  Widget build(BuildContext context) {
    final tablesProvider = context.watch<TablesProvider>();
    final tablesList = tablesProvider.tables;

    // Convert TableItem objects to maps for complete layout compatibility
    final _tables = tablesList.map((t) => {
      'id': t.id,
      'number': t.number,
      'capacity': t.capacity,
      'status': t.status,
      'order': t.order,
      'reservation': t.status == 'reserved' ? {'name': 'Reservation', 'time': '2:30 PM', 'guests': 2} : null,
    }).toList();

    final available = _tables.where((t) => t['status'] == 'available').length;
    final occupied = _tables.where((t) => t['status'] == 'occupied').length;
    final reserved = _tables.where((t) => t['status'] == 'reserved').length;

    return Scaffold(
      backgroundColor: AppColors.darkBg,
      appBar: AppBar(
        backgroundColor: AppColors.darkSurface,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.menu_rounded, color: AppColors.textPrimary, size: 24),
          onPressed: () => HomeShell.toggleMenu(),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Table Book',
                style: GoogleFonts.poppins(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary)),
            Text('Main Branch',
                style: GoogleFonts.poppins(
                    fontSize: 11, color: AppColors.textMuted)),
          ],
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.refresh_rounded,
                color: AppColors.textSecondary),
            onPressed: () => context.read<TablesProvider>().fetchTables(),
          ),
        ],
      ),
      body: Column(
        children: [
          // Stats row
          Container(
            color: AppColors.darkSurface,
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 14),
            child: Row(
              children: [
                Expanded(
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        _StatChip('Available', available, AppColors.tableAvailable),
                        const SizedBox(width: 8),
                        _StatChip('Occupied', occupied, AppColors.tableOccupied),
                        const SizedBox(width: 8),
                        _StatChip('Reserved', reserved, AppColors.tableReserved),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Text(
                  '${_tables.length} tables',
                  style: GoogleFonts.poppins(
                      fontSize: 12, color: AppColors.textMuted),
                ),
              ],
            ),
          ),
          Divider(color: AppColors.darkBorder, height: 1),
          // Grid or empty state
          Expanded(
            child: tablesProvider.isLoading && _tables.isEmpty
                ? Center(
                    child: CircularProgressIndicator(
                      color: AppColors.accentAmber,
                      strokeWidth: 2.5,
                    ),
                  )
                : _tables.isEmpty
                    ? _buildEmptyState()
                    : GridView.builder(
                        padding: const EdgeInsets.all(14),
                        gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
                          maxCrossAxisExtent: 130,
                          crossAxisSpacing: 10,
                          mainAxisSpacing: 10,
                          childAspectRatio: 0.76,
                        ),
                        itemCount: _tables.length,
                        itemBuilder: (ctx, i) => _buildTableCard(_tables[i]),
                      ),
          ),
        ],
      ),
      floatingActionButton: _tables.isNotEmpty
          ? FloatingActionButton(
              onPressed: () => _showAddTableSheet(),
              backgroundColor: AppColors.accentAmber,
              foregroundColor: Colors.white,
              child: const Icon(Icons.add_rounded),
            )
          : null,
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Illustration container
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                color: AppColors.accentAmber.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.table_restaurant_rounded,
                size: 60,
                color: AppColors.accentAmber.withOpacity(0.7),
              ),
            ),
            const SizedBox(height: 24),
            Text(
              'No Tables Yet',
              style: GoogleFonts.poppins(
                fontSize: 22,
                fontWeight: FontWeight.w700,
                color: AppColors.textPrimary,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'You haven\'t added any tables.\nCreate your first table to start managing orders.',
              textAlign: TextAlign.center,
              style: GoogleFonts.poppins(
                fontSize: 13,
                color: AppColors.textMuted,
                height: 1.5,
              ),
            ),
            const SizedBox(height: 32),
            ElevatedButton.icon(
              onPressed: () => _showAddTableSheet(),
              icon: const Icon(Icons.add_rounded, size: 20),
              label: Text(
                'Create First Table',
                style: GoogleFonts.poppins(
                  fontWeight: FontWeight.w600,
                  fontSize: 15,
                ),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.accentAmber,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
                elevation: 4,
                shadowColor: AppColors.accentAmber.withOpacity(0.4),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTableCard(Map<String, dynamic> table) {
    final status = table['status'] as String;
    final color = _tableColor(status);
    final isOccupied = status == 'occupied';
    final isReserved = status == 'reserved';

    return GestureDetector(
      onTap: () => _showTableDetail(table),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        decoration: BoxDecoration(
          color: AppColors.darkCard,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color.withOpacity(0.5), width: 2),
          boxShadow: [
            BoxShadow(
              color: color.withOpacity(0.08),
              blurRadius: 10,
              spreadRadius: 0,
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(10),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Status dot
              Container(
                width: 10,
                height: 10,
                decoration: BoxDecoration(
                  color: color,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: color.withOpacity(0.5),
                      blurRadius: 6,
                      spreadRadius: 1,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 6),
              // Table number
              Text(
                table['number'],
                style: GoogleFonts.poppins(
                  fontSize: 17,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary,
                ),
              ),
              Text(
                '${table['capacity']} seats',
                style: GoogleFonts.poppins(
                    fontSize: 10, color: AppColors.textMuted),
              ),
              const SizedBox(height: 6),
              // Status info
              if (isOccupied && table['order'] != null) ...[
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                  decoration: BoxDecoration(
                    color: AppColors.statusRedBg,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    '${AppConstants.currencySymbol} ${JsonUtils.parseDouble(table['order']['total']).toStringAsFixed(0)}',
                    style: GoogleFonts.poppins(
                      fontSize: 11,
                      color: AppColors.tableOccupied,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  '${table['order']['items']} items',
                  style: GoogleFonts.poppins(
                      fontSize: 9, color: AppColors.textMuted),
                ),
              ] else if (isReserved && table['reservation'] != null) ...[
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                  decoration: BoxDecoration(
                    color: AppColors.statusAmberBg,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    table['reservation']['time'],
                    style: GoogleFonts.poppins(
                      fontSize: 11,
                      color: AppColors.tableReserved,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  table['reservation']['name'],
                  style: GoogleFonts.poppins(
                      fontSize: 9, color: AppColors.textMuted),
                  overflow: TextOverflow.ellipsis,
                ),
              ] else ...[
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: AppColors.statusGreenBg,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    'Free',
                    style: GoogleFonts.poppins(
                      fontSize: 11,
                      color: AppColors.tableAvailable,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  void _showTableDetail(Map<String, dynamic> table) {
    final status = table['status'] as String;
    final color = _tableColor(status);

    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.darkCard,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Handle
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.darkBorder,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Text(
                  table['number'],
                  style: GoogleFonts.poppins(
                    fontSize: 22,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(width: 10),
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: color.withOpacity(0.4)),
                  ),
                  child: Text(
                    status.toUpperCase(),
                    style: GoogleFonts.poppins(
                      fontSize: 11,
                      color: color,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
                const Spacer(),
                IconButton(
                  icon: Icon(Icons.edit_rounded, color: AppColors.textSecondary, size: 20),
                  onPressed: () {
                    Navigator.pop(ctx);
                    _showTableFormSheet(table: table);
                  },
                ),
                if (context.read<AppProvider>().enableGuestQr)
                  IconButton(
                    icon: const Icon(Icons.qr_code_rounded, color: Colors.blueAccent, size: 20),
                    onPressed: () {
                      Navigator.pop(ctx);
                      _showTableQrDialog(table);
                    },
                  ),
                IconButton(
                  icon: Icon(Icons.delete_outline_rounded, color: AppColors.statusRed, size: 20),
                  onPressed: () {
                    Navigator.pop(ctx);
                    _showDeleteConfirmDialog(table);
                  },
                ),
                const SizedBox(width: 8),
                Text(
                  '${table['capacity']} seats',
                  style: GoogleFonts.poppins(
                      fontSize: 13, color: AppColors.textMuted),
                ),
              ],
            ),
            const SizedBox(height: 16),

            if (status == 'occupied' && table['order'] != null) ...[
              _orderSummaryCard(table['order']),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () {
                        Navigator.pop(ctx);
                        _showOrderViewSheet(table);
                      },
                      icon: const Icon(Icons.receipt_long_outlined, size: 16),
                      label: const Text('View Order'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.accentAmber,
                        side: BorderSide(color: AppColors.accentAmber),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10)),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () {
                        Navigator.pop(ctx);
                        _showOrderViewSheet(table);
                      },
                      icon: const Icon(Icons.payment_rounded, size: 16),
                      label: const Text('Pay & Complete'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.statusGreen,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10)),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                ],
              ),
            ] else if (status == 'reserved' && table['reservation'] != null) ...[
              _reservationCard(table['reservation']),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(ctx),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.accentAmber,
                    foregroundColor: AppColors.textOnAmber,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: Text('Check In Customer',
                      style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
                ),
              ),
            ] else ...[
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () {
                    Navigator.pop(ctx);
                    context.read<OrdersProvider>().setPreselectedOrder('Dine-In', table['number']);
                    HomeShell.selectTabByLabel('POS');
                  },
                  icon: const Icon(Icons.point_of_sale_rounded),
                  label: const Text('New Order'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.accentAmber,
                    foregroundColor: AppColors.textOnAmber,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12)),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  void _showOrderViewSheet(Map<String, dynamic> table) {
    // Fetch bank accounts ahead of time so PaymentModal has them ready
    context.read<OrdersProvider>().fetchBankAccounts();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => OrderViewSheet(
        order: table['order'] as Map<String, dynamic>,
        tableNumber: table['number'] as String,
      ),
    );
  }

  Widget _orderSummaryCard(Map<String, dynamic> order) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.darkSurface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.darkBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Current Order',
              style: GoogleFonts.poppins(
                  fontSize: 12,
                  color: AppColors.textMuted,
                  fontWeight: FontWeight.w500)),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(order['number'],
                  style: GoogleFonts.poppins(
                      fontSize: 14,
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w600)),
              Text('${AppConstants.currencySymbol} ${JsonUtils.parseDouble(order['total']).toStringAsFixed(2)}',
                  style: GoogleFonts.poppins(
                      fontSize: 16,
                      color: AppColors.accentAmber,
                      fontWeight: FontWeight.w700)),
            ],
          ),
          const SizedBox(height: 4),
          Row(
            children: [
              Icon(Icons.restaurant_menu_outlined,
                  size: 13, color: AppColors.textMuted),
              const SizedBox(width: 4),
              Text('${order['items']} items',
                  style: GoogleFonts.poppins(
                      fontSize: 12, color: AppColors.textMuted)),
              const SizedBox(width: 12),
              Icon(Icons.person_outline_rounded,
                  size: 13, color: AppColors.textMuted),
              const SizedBox(width: 4),
              Text('Waiter: ${order['waiter']}',
                  style: GoogleFonts.poppins(
                      fontSize: 12, color: AppColors.textMuted)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _reservationCard(Map<String, dynamic> res) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.statusAmberBg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
            color: AppColors.tableReserved.withOpacity(0.3)),
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: AppColors.tableReserved.withOpacity(0.2),
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.calendar_today_rounded,
                color: AppColors.tableReserved, size: 20),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(res['name'],
                  style: GoogleFonts.poppins(
                      fontSize: 14,
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w600)),
              Text('${res['time']} • ${res['guests']} guests',
                  style: GoogleFonts.poppins(
                      fontSize: 12, color: AppColors.textSecondary)),
            ],
          ),
        ],
      ),
    );
  }

  void _showAddTableSheet() {
    _showTableFormSheet();
  }

  void _showTableFormSheet({Map<String, dynamic>? table}) {
    final isEdit = table != null;
    final numberController = TextEditingController(text: isEdit ? table['number'] : '');
    final capacityController = TextEditingController(text: isEdit ? table['capacity'].toString() : '2');
    String status = isEdit ? table['status'] : 'available';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) => Container(
          decoration: BoxDecoration(
            color: AppColors.darkCard,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
            border: Border.all(color: AppColors.darkBorder, width: 1),
          ),
          padding: EdgeInsets.only(
            top: 20,
            left: 20,
            right: 20,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Handle
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppColors.darkBorder,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Text(
                isEdit ? 'Edit Table' : 'Add New Table',
                style: GoogleFonts.poppins(
                  fontSize: 18,
                  fontWeight: FontWeight.w700,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: numberController,
                decoration: const InputDecoration(
                  labelText: 'Table Number',
                  hintText: 'e.g. T1 or Table 5',
                ),
                style: TextStyle(color: AppColors.textPrimary),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: capacityController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(
                  labelText: 'Capacity (Seats)',
                  hintText: 'e.g. 4',
                ),
                style: TextStyle(color: AppColors.textPrimary),
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                value: status,
                dropdownColor: AppColors.darkCard,
                decoration: const InputDecoration(
                  labelText: 'Status',
                ),
                style: TextStyle(color: AppColors.textPrimary),
                items: const [
                  DropdownMenuItem(value: 'available', child: Text('Available')),
                  DropdownMenuItem(value: 'reserved', child: Text('Reserved')),
                  DropdownMenuItem(value: 'occupied', child: Text('Occupied')),
                ],
                onChanged: (val) {
                  if (val != null) {
                    setModalState(() {
                      status = val;
                    });
                  }
                },
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () async {
                    final number = numberController.text.trim();
                    final capacity = int.tryParse(capacityController.text.trim()) ?? 0;
                    if (number.isEmpty || capacity <= 0) {
                      showTopSnackBar(context, 
                        SnackBar(
                          content: Text('Please enter valid table details.', style: GoogleFonts.poppins()),
                          backgroundColor: AppColors.statusRedBg,
                        ),
                      );
                      return;
                    }

                    Navigator.pop(ctx);

                    bool success;
                    if (isEdit) {
                      success = await context.read<TablesProvider>().updateTable(
                        table['id'] as int,
                        tableNumber: number,
                        capacity: capacity,
                        status: status,
                      );
                    } else {
                      success = await context.read<TablesProvider>().addTable(
                        tableNumber: number,
                        capacity: capacity,
                        status: status,
                      );
                    }

                    if (success) {
                      showTopSnackBar(this.context, 
                        SnackBar(
                          content: Text(
                            isEdit ? 'Table updated successfully!' : 'Table added successfully!',
                            style: GoogleFonts.poppins(),
                          ),
                          backgroundColor: AppColors.statusGreen,
                        ),
                      );
                    } else {
                      final err = context.read<TablesProvider>().error ?? 'Operation failed';
                      showTopSnackBar(this.context, 
                        SnackBar(
                          content: Text(err, style: GoogleFonts.poppins()),
                          backgroundColor: AppColors.statusRed,
                        ),
                      );
                    }
                  },
                  child: Text(
                    isEdit ? 'Save Changes' : 'Create Table',
                    style: GoogleFonts.poppins(fontWeight: FontWeight.w600),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showDeleteConfirmDialog(Map<String, dynamic> table) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.darkCard,
        title: Text(
          'Delete Table',
          style: GoogleFonts.poppins(fontWeight: FontWeight.w700, color: AppColors.textPrimary),
        ),
        content: Text(
          'Are you sure you want to delete table ${table['number']}?',
          style: GoogleFonts.poppins(color: AppColors.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(
              'Cancel',
              style: GoogleFonts.poppins(color: AppColors.textMuted),
            ),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.statusRed,
              foregroundColor: Colors.white,
            ),
            onPressed: () async {
              Navigator.pop(ctx);
              final success = await context.read<TablesProvider>().deleteTable(table['id'] as int);
              if (success) {
                showTopSnackBar(this.context, 
                  SnackBar(
                    content: Text('Table deleted successfully!', style: GoogleFonts.poppins()),
                    backgroundColor: AppColors.statusGreen,
                  ),
                );
              } else {
                final err = context.read<TablesProvider>().error ?? 'Failed to delete table';
                showTopSnackBar(this.context, 
                  SnackBar(
                    content: Text(err, style: GoogleFonts.poppins()),
                    backgroundColor: AppColors.statusRed,
                  ),
                );
              }
            },
            child: Text(
              'Delete',
              style: GoogleFonts.poppins(fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }

  void _showTableQrDialog(Map<String, dynamic> table) async {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => const Center(
        child: CircularProgressIndicator(),
      ),
    );

    try {
      final api = context.read<ApiService>();
      final res = await api.get('/tables/${table['id']}/qr');
      
      if (!mounted) return;
      Navigator.pop(context); // Dismiss loading spinner

      if (res != null && res['success'] == true) {
        final qrImageUrl = res['qr_image_url'] as String;
        final qrUrl = res['qr_url'] as String;

        showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            backgroundColor: AppColors.darkCard,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            title: Text(
              'Table ${table['number']} QR Code',
              style: GoogleFonts.poppins(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 16),
              textAlign: TextAlign.center,
            ),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Image.network(
                    qrImageUrl,
                    width: 200,
                    height: 200,
                    fit: BoxFit.contain,
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'Scan this code to view guest menu and place orders.',
                  style: GoogleFonts.poppins(color: AppColors.textSecondary, fontSize: 11),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
            actionsAlignment: MainAxisAlignment.center,
            actions: [
              OutlinedButton.icon(
                onPressed: () {
                  Clipboard.setData(ClipboardData(text: qrUrl));
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('URL copied to clipboard!', style: GoogleFonts.poppins(color: Colors.white)),
                      backgroundColor: AppColors.statusGreen,
                    ),
                  );
                },
                icon: const Icon(Icons.copy_rounded, size: 16),
                label: const Text('Copy URL'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.accentAmber,
                  side: BorderSide(color: AppColors.accentAmber),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
              ),
              ElevatedButton.icon(
                onPressed: () {
                  launchUrl(Uri.parse(qrImageUrl), mode: LaunchMode.externalApplication);
                },
                icon: const Icon(Icons.download_rounded, size: 16),
                label: const Text('Download'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.statusGreen,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
              ),
            ],
          ),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to load QR code', style: GoogleFonts.poppins(color: Colors.white)),
            backgroundColor: AppColors.statusRed,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        Navigator.pop(context); // Dismiss loading spinner
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error loading QR: $e', style: GoogleFonts.poppins(color: Colors.white)),
            backgroundColor: AppColors.statusRed,
          ),
        );
      }
    }
  }
}

class _StatChip extends StatelessWidget {
  final String label;
  final int count;
  final Color color;
  const _StatChip(this.label, this.count, this.color);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 7,
            height: 7,
            decoration: BoxDecoration(color: color, shape: BoxShape.circle),
          ),
          const SizedBox(width: 5),
          Text('$count $label',
              style: GoogleFonts.poppins(
                  fontSize: 11,
                  color: color,
                  fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
