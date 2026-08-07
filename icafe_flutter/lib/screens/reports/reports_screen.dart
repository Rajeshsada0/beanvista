import 'package:icafe_app/core/utils/snackbar_helper.dart';
import 'package:icafe_app/core/constants/app_constants.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/json_utils.dart';
import '../../providers/reports_provider.dart';

// ─── Helpers ─────────────────────────────────────────────────────────────────

final _currencyFmt = NumberFormat('#,##0.00', 'en_IN');
String _fmt(double v) => '${AppConstants.currencySymbol} ${_currencyFmt.format(v)}';

// ─── Main Screen ─────────────────────────────────────────────────────────────

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> {
  final _ranges = ['Today', 'Yesterday', 'This Week', 'This Month', 'Custom'];
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ReportsProvider>().fetchReports();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _handleRangeSelect(String range, ReportsProvider provider) async {
    if (range == 'Custom') {
      final picked = await showDateRangePicker(
        context: context,
        firstDate: DateTime(2020),
        lastDate: DateTime.now().add(const Duration(days: 1)),
        builder: (context, child) {
          return Theme(
            data: Theme.of(context).copyWith(
              colorScheme: Theme.of(context).colorScheme.copyWith(
                primary: AppColors.accentAmber,
                onPrimary: Colors.white,
              ),
              datePickerTheme: DatePickerThemeData(
                rangeSelectionBackgroundColor: AppColors.accentAmber.withOpacity(0.15),
              ),
            ),
            child: child!,
          );
        },
      );
      if (picked != null) {
        provider.setSelectedRange(range, customRange: picked);
        provider.fetchReports();
      }
    } else {
      provider.setSelectedRange(range);
      provider.fetchReports();
    }
  }

  Future<void> _handleExport(ReportsProvider provider) async {
    final messenger = ScaffoldMessenger.of(context);
    showTopSnackBarWithMessenger(
      messenger,
      context,
      SnackBar(
        backgroundColor: AppColors.darkSurface,
        content: Row(
          children: [
            SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                valueColor: AlwaysStoppedAnimation<Color>(AppColors.accentAmber),
              ),
            ),
            const SizedBox(width: 12),
            Text('Generating CSV report...',
                style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13)),
          ],
        ),
      ),
    );

    final csv = await provider.exportReportsCsv();

    messenger.hideCurrentSnackBar();
    if (csv != null) {
      await Clipboard.setData(ClipboardData(text: csv));
      showTopSnackBarWithMessenger(
        messenger,
        context,
        SnackBar(
          backgroundColor: AppColors.statusGreenBg,
          content: Row(
            children: [
              Icon(Icons.check_circle_outline, color: AppColors.statusGreen, size: 20),
              const SizedBox(width: 10),
              Expanded(
                child: Text('Report CSV copied to clipboard!',
                    style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13)),
              ),
            ],
          ),
        ),
      );
    } else {
      showTopSnackBarWithMessenger(
        messenger,
        context,
        SnackBar(
          backgroundColor: AppColors.statusRedBg,
          content: Row(
            children: [
              Icon(Icons.error_outline, color: AppColors.statusRed, size: 20),
              const SizedBox(width: 10),
              Text('Failed to generate report CSV.',
                  style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13)),
            ],
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<ReportsProvider>();

    return Scaffold(
      backgroundColor: AppColors.darkBg,
      appBar: AppBar(
        title: Text(
          'Financial Reports',
          style: GoogleFonts.poppins(
            color: AppColors.textPrimary,
            fontSize: 20,
            fontWeight: FontWeight.w700,
          ),
        ),
        backgroundColor: AppColors.darkSurface,
        surfaceTintColor: Colors.transparent,
        actions: [
          IconButton(
            onPressed: () => _handleExport(provider),
            icon: Icon(Icons.download_rounded, color: AppColors.textSecondary),
            tooltip: 'Export CSV',
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: provider.fetchReports,
        color: AppColors.accentAmber,
        backgroundColor: AppColors.darkSurface,
        child: ListView(
          padding: const EdgeInsets.all(16),
          physics: const AlwaysScrollableScrollPhysics(),
          children: [
            // Date Period Chips
            SizedBox(
              height: 36,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: _ranges.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (_, i) {
                  final r = _ranges[i];
                  final sel = r == provider.selectedRange;
                  return GestureDetector(
                    onTap: () => _handleRangeSelect(r, provider),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                      decoration: BoxDecoration(
                        color: sel ? AppColors.accentAmber : AppColors.darkCard,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: sel ? AppColors.accentAmber : AppColors.darkBorder),
                      ),
                      child: Text(
                        sel && r == 'Custom' && provider.customDateRange != null
                            ? '${DateFormat('MMM dd').format(provider.customDateRange!.start)} - ${DateFormat('MMM dd').format(provider.customDateRange!.end)}'
                            : r.toUpperCase(),
                        style: GoogleFonts.poppins(
                          color: sel ? AppColors.textOnAmber : AppColors.textSecondary,
                          fontSize: 11,
                          fontWeight: sel ? FontWeight.w700 : FontWeight.w500,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 16),

            // Search Bar & Filter Controls
            _buildFilterControls(provider),
            const SizedBox(height: 16),

            if (provider.error != null)
              Container(
                margin: const EdgeInsets.only(bottom: 16),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.statusRedBg,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.statusRed.withOpacity(0.3)),
                ),
                child: Row(
                  children: [
                    Icon(Icons.error_outline, color: AppColors.statusRed),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        provider.error!,
                        style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13),
                      ),
                    ),
                    IconButton(
                      icon: Icon(Icons.refresh, color: AppColors.textPrimary),
                      onPressed: provider.fetchReports,
                    ),
                  ],
                ),
              ),

            if (provider.isLoading)
              SizedBox(
                height: 300,
                child: Center(
                  child: CircularProgressIndicator(
                    valueColor: AlwaysStoppedAnimation<Color>(AppColors.accentAmber),
                  ),
                ),
              )
            else ...[
              // 8 KPI Metrics Cards Grid
              _KpiGrid(),
              const SizedBox(height: 20),

              // Report Mode Tabs (TRANSACTIONS, BY TABLE, BY ITEM, BY PAYMENT)
              _ReportTabHeader(),
              const SizedBox(height: 16),

              // Selected Tab Content Body
              _buildTabBody(provider),
              const SizedBox(height: 40),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildFilterControls(ReportsProvider provider) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.darkCard,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.darkBorder),
      ),
      child: Column(
        children: [
          // Search Input
          TextField(
            controller: _searchController,
            style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13),
            decoration: InputDecoration(
              hintText: 'Search order #, table, or customer...',
              hintStyle: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 13),
              prefixIcon: Icon(Icons.search_rounded, color: AppColors.textMuted, size: 20),
              suffixIcon: _searchController.text.isNotEmpty
                  ? IconButton(
                      icon: Icon(Icons.clear_rounded, color: AppColors.textMuted, size: 18),
                      onPressed: () {
                        _searchController.clear();
                        provider.setSearchQuery('');
                      },
                    )
                  : null,
              filled: true,
              fillColor: AppColors.darkBg,
              contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
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
            onSubmitted: (val) => provider.setSearchQuery(val),
          ),
          const SizedBox(height: 12),

          // Dropdown Filters Row
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                // Table Filter Dropdown
                _buildDropdown<int?>(
                  label: 'Table',
                  value: provider.selectedTableId,
                  items: [
                    DropdownMenuItem<int?>(
                      value: null,
                      child: Text('All Tables', style: GoogleFonts.poppins(fontSize: 12)),
                    ),
                    ...provider.allTables.map((t) {
                      final id = JsonUtils.parseIntNullable(t['id']);
                      final num = t['table_number']?.toString() ?? 'N/A';
                      return DropdownMenuItem<int?>(
                        value: id,
                        child: Text(num, style: GoogleFonts.poppins(fontSize: 12)),
                      );
                    }),
                  ],
                  onChanged: (val) => provider.setFilterTableId(val),
                ),
                const SizedBox(width: 8),

                // Menu Item Filter Dropdown
                _buildDropdown<int?>(
                  label: 'Menu',
                  value: provider.selectedMenuId,
                  items: [
                    DropdownMenuItem<int?>(
                      value: null,
                      child: Text('All Menu Items', style: GoogleFonts.poppins(fontSize: 12)),
                    ),
                    ...provider.allMenus.map((m) {
                      final id = JsonUtils.parseIntNullable(m['id']);
                      final name = m['name']?.toString() ?? 'Item';
                      return DropdownMenuItem<int?>(
                        value: id,
                        child: Text(name, style: GoogleFonts.poppins(fontSize: 12)),
                      );
                    }),
                  ],
                  onChanged: (val) => provider.setFilterMenuId(val),
                ),
                const SizedBox(width: 8),

                // Payment Method Filter Dropdown
                _buildDropdown<String>(
                  label: 'Payment',
                  value: provider.selectedPayment,
                  items: const [
                    DropdownMenuItem(value: 'All', child: Text('All Payments')),
                    DropdownMenuItem(value: 'Cash', child: Text('Cash')),
                    DropdownMenuItem(value: 'Online', child: Text('Online')),
                    DropdownMenuItem(value: 'Due', child: Text('Customer Due')),
                  ],
                  onChanged: (val) => provider.setFilterPayment(val ?? 'All'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDropdown<T>({
    required String label,
    required T value,
    required List<DropdownMenuItem<T>> items,
    required ValueChanged<T?> onChanged,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10),
      decoration: BoxDecoration(
        color: AppColors.darkBg,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.darkBorder),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<T>(
          value: value,
          items: items,
          onChanged: onChanged,
          dropdownColor: AppColors.darkCard,
          style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 12),
          icon: Icon(Icons.arrow_drop_down_rounded, color: AppColors.textMuted, size: 20),
          isDense: true,
        ),
      ),
    );
  }

  Widget _buildTabBody(ReportsProvider provider) {
    switch (provider.activeTab) {
      case 0:
        return _TransactionsTab();
      case 1:
        return _SalesByTableTab();
      case 2:
        return _SalesByItemTab();
      case 3:
        return _SalesByPaymentTab();
      default:
        return _TransactionsTab();
    }
  }
}

// ─── 8 KPI Grid ──────────────────────────────────────────────────────────────

class _KpiGrid extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final provider = context.watch<ReportsProvider>();
    final stats = provider.stats;

    final rev = JsonUtils.parseDouble(stats['total_revenue'] ?? stats['revenue']);
    final cash = JsonUtils.parseDouble(stats['total_cash'] ?? stats['cash_collected']);
    final online = JsonUtils.parseDouble(stats['total_online'] ?? stats['online_payments']);
    final due = JsonUtils.parseDouble(stats['total_due'] ?? stats['customer_due']);
    final tax = JsonUtils.parseDouble(stats['total_tax']);
    final tips = JsonUtils.parseDouble(stats['total_tips'] ?? stats['tips_collected']);
    final discount = JsonUtils.parseDouble(stats['total_discount'] ?? stats['discounts']);
    final orders = JsonUtils.parseDouble(stats['total_orders'] ?? stats['orders']).toInt();

    final kpis = [
      {
        'label': 'TOTAL REVENUE',
        'value': _fmt(rev),
        'icon': Icons.account_balance_wallet_rounded,
        'color': AppColors.statusGreen,
        'bg': AppColors.statusGreen.withOpacity(0.12),
      },
      {
        'label': 'CASH COLLECTED',
        'value': _fmt(cash),
        'icon': Icons.payments_rounded,
        'color': AppColors.statusGreen,
        'bg': AppColors.statusGreen.withOpacity(0.12),
      },
      {
        'label': 'ONLINE PAYMENTS',
        'value': _fmt(online),
        'icon': Icons.credit_card_rounded,
        'color': AppColors.statusBlue,
        'bg': AppColors.statusBlue.withOpacity(0.12),
      },
      {
        'label': 'CUSTOMER DUE',
        'value': _fmt(due),
        'icon': Icons.schedule_rounded,
        'color': AppColors.statusAmber,
        'bg': AppColors.statusAmber.withOpacity(0.12),
      },
      {
        'label': 'TOTAL TAX',
        'value': _fmt(tax),
        'icon': Icons.percent_rounded,
        'color': AppColors.accentAmber,
        'bg': AppColors.accentAmber.withOpacity(0.12),
      },
      {
        'label': 'TIPS COLLECTED',
        'value': _fmt(tips),
        'icon': Icons.emoji_events_rounded,
        'color': AppColors.statusPurple,
        'bg': AppColors.statusPurple.withOpacity(0.12),
      },
      {
        'label': 'DISCOUNTS',
        'value': _fmt(discount),
        'icon': Icons.local_offer_rounded,
        'color': AppColors.statusAmber,
        'bg': AppColors.statusAmber.withOpacity(0.12),
      },
      {
        'label': 'TOTAL ORDERS',
        'value': '$orders',
        'icon': Icons.tag_rounded,
        'color': AppColors.statusPurple,
        'bg': AppColors.statusPurple.withOpacity(0.12),
      },
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 10,
        mainAxisSpacing: 10,
        childAspectRatio: 1.6,
      ),
      itemCount: kpis.length,
      itemBuilder: (_, i) {
        final k = kpis[i];
        return Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppColors.darkCard,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.darkBorder),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(
                      color: k['bg'] as Color,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(k['icon'] as IconData, color: k['color'] as Color, size: 16),
                  ),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    k['label'] as String,
                    style: GoogleFonts.poppins(
                      color: AppColors.textMuted,
                      fontSize: 10,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 0.5,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    k['value'] as String,
                    style: GoogleFonts.poppins(
                      color: AppColors.textPrimary,
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }
}

// ─── Tab Bar Header ──────────────────────────────────────────────────────────

class _ReportTabHeader extends StatelessWidget {
  final _tabs = [
    {'title': 'TRANSACTIONS', 'icon': Icons.receipt_long_rounded},
    {'title': 'BY TABLE', 'icon': Icons.table_restaurant_rounded},
    {'title': 'BY ITEM', 'icon': Icons.fastfood_rounded},
    {'title': 'BY PAYMENT', 'icon': Icons.payments_rounded},
  ];

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<ReportsProvider>();
    final active = provider.activeTab;

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: List.generate(_tabs.length, (i) {
          final isSel = active == i;
          final t = _tabs[i];
          return Padding(
            padding: const EdgeInsets.only(right: 8),
            child: GestureDetector(
              onTap: () => provider.setActiveTab(i),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                decoration: BoxDecoration(
                  color: isSel ? AppColors.accentAmber : AppColors.darkCard,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: isSel ? AppColors.accentAmber : AppColors.darkBorder,
                  ),
                  boxShadow: isSel
                      ? [
                          BoxShadow(
                            color: AppColors.accentAmber.withOpacity(0.3),
                            blurRadius: 8,
                            offset: const Offset(0, 3),
                          ),
                        ]
                      : null,
                ),
                child: Row(
                  children: [
                    Icon(
                      t['icon'] as IconData,
                      size: 16,
                      color: isSel ? AppColors.textOnAmber : AppColors.textMuted,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      t['title'] as String,
                      style: GoogleFonts.poppins(
                        color: isSel ? AppColors.textOnAmber : AppColors.textSecondary,
                        fontSize: 12,
                        fontWeight: isSel ? FontWeight.bold : FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        }),
      ),
    );
  }
}

// ─── 1. Transactions Tab ──────────────────────────────────────────────────────

class _TransactionsTab extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final provider = context.watch<ReportsProvider>();
    final txns = provider.transactions;

    if (txns.isEmpty) {
      return _buildEmptyContainer('No transaction records found.');
    }

    return Column(
      children: txns.map((t) {
        final Map<String, dynamic> item = Map<String, dynamic>.from(t);
        final num = item['order_number']?.toString() ?? '#';
        final table = item['table_number']?.toString() ?? '-';
        final total = JsonUtils.parseDouble(item['total']);
        final discount = JsonUtils.parseDouble(item['discount']);
        final tax = JsonUtils.parseDouble(item['tax']);
        final paymentStr = item['payment']?.toString() ?? 'Cash';
        final timeStr = item['completed_at']?.toString() ?? item['ordered_at']?.toString() ?? '';
        final dur = item['duration']?.toString() ?? 'N/A';

        final isDue = paymentStr.toLowerCase().contains('due');
        final isOnline = paymentStr.toLowerCase().contains('online');

        Color statusColor = AppColors.statusGreen;
        Color statusBg = AppColors.statusGreen.withOpacity(0.12);
        if (isDue) {
          statusColor = AppColors.statusRed;
          statusBg = AppColors.statusRed.withOpacity(0.12);
        } else if (isOnline) {
          statusColor = AppColors.statusBlue;
          statusBg = AppColors.statusBlue.withOpacity(0.12);
        }

        return Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.darkCard,
            borderRadius: BorderRadius.circular(18),
            border: Border.all(color: AppColors.darkBorder),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Top Row: Order # + Status Badge
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Text(
                        num,
                        style: GoogleFonts.poppins(
                          color: AppColors.textPrimary,
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppColors.darkBg,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(color: AppColors.darkBorder),
                        ),
                        child: Text(
                          table,
                          style: GoogleFonts.poppins(color: AppColors.textSecondary, fontSize: 11),
                        ),
                      ),
                    ],
                  ),
                  Text(
                    _fmt(total),
                    style: GoogleFonts.poppins(
                      color: AppColors.textPrimary,
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),

              // Details Row: Date, Duration, Discount, Tax
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      timeStr,
                      style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 11),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: statusBg,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      paymentStr,
                      style: GoogleFonts.poppins(
                        color: statusColor,
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
              if (discount > 0 || tax > 0 || dur != 'N/A') ...[
                const SizedBox(height: 8),
                Divider(height: 1, color: AppColors.darkBorder),
                const SizedBox(height: 8),
                Row(
                  children: [
                    if (dur != 'N/A') ...[
                      Icon(Icons.timer_outlined, size: 14, color: AppColors.textMuted),
                      const SizedBox(width: 4),
                      Text(dur, style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 11)),
                      const SizedBox(width: 12),
                    ],
                    if (discount > 0) ...[
                      Text('Disc: ${_fmt(discount)}',
                          style: GoogleFonts.poppins(color: AppColors.statusAmber, fontSize: 11)),
                      const SizedBox(width: 12),
                    ],
                    if (tax > 0) ...[
                      Text('Tax: ${_fmt(tax)}',
                          style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 11)),
                    ],
                  ],
                ),
              ],
            ],
          ),
        );
      }).toList(),
    );
  }
}

// ─── 2. Sales by Table Tab ────────────────────────────────────────────────────

class _SalesByTableTab extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final provider = context.watch<ReportsProvider>();
    final tables = provider.tableSales;

    if (tables.isEmpty) {
      return _buildEmptyContainer('No table sales recorded for this period.');
    }

    final maxRev = tables.map((t) => JsonUtils.parseDouble(t['total_revenue'])).reduce((a, b) => a > b ? a : b);
    final totalRev = tables.fold<double>(0.0, (sum, t) => sum + JsonUtils.parseDouble(t['total_revenue']));
    final totalOrds = tables.fold<int>(0, (sum, t) => sum + JsonUtils.parseInt(t['order_count']));

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Sales by Table',
                style: GoogleFonts.poppins(
                  color: AppColors.textPrimary,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                'REVENUE PER TABLE',
                style: GoogleFonts.poppins(
                  color: AppColors.textMuted,
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
        ListView.separated(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: tables.length,
          separatorBuilder: (_, __) => const SizedBox(height: 10),
          itemBuilder: (_, i) {
            final t = Map<String, dynamic>.from(tables[i]);
            final num = t['table_number']?.toString() ?? 'Table';
            final ords = JsonUtils.parseInt(t['order_count']);
            final rev = JsonUtils.parseDouble(t['total_revenue']);
            final avg = JsonUtils.parseDouble(t['avg_order_value']);
            final pct = maxRev > 0 ? (rev / maxRev).clamp(0.0, 1.0) : 0.0;

            return Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.darkCard,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: AppColors.darkBorder),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: AppColors.accentAmber.withOpacity(0.12),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Icon(Icons.table_restaurant_rounded, color: AppColors.accentAmber, size: 18),
                          ),
                          const SizedBox(width: 12),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Table $num',
                                style: GoogleFonts.poppins(
                                  color: AppColors.textPrimary,
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              Text(
                                '$ords ORDERS',
                                style: GoogleFonts.poppins(
                                  color: AppColors.textMuted,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            _fmt(rev),
                            style: GoogleFonts.poppins(
                              color: AppColors.statusGreen,
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text(
                            'avg ${_fmt(avg)}',
                            style: GoogleFonts.poppins(
                              color: AppColors.textMuted,
                              fontSize: 11,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: pct,
                      minHeight: 6,
                      backgroundColor: AppColors.darkBg,
                      valueColor: AlwaysStoppedAnimation<Color>(AppColors.accentAmber),
                    ),
                  ),
                ],
              ),
            );
          },
        ),
        const SizedBox(height: 16),

        // Summary Bar
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.darkSurface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.darkBorder),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('TOTAL TABLES',
                      style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 10, fontWeight: FontWeight.w600)),
                  Text('${tables.length}',
                      style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.bold)),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('TOTAL ORDERS',
                      style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 10, fontWeight: FontWeight.w600)),
                  Text('$totalOrds',
                      style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.bold)),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text('COMBINED REVENUE',
                      style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 10, fontWeight: FontWeight.w600)),
                  Text(_fmt(totalRev),
                      style: GoogleFonts.poppins(color: AppColors.statusGreen, fontSize: 16, fontWeight: FontWeight.bold)),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// ─── 3. Sales by Item Tab ────────────────────────────────────────────────────

class _SalesByItemTab extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final provider = context.watch<ReportsProvider>();
    final items = provider.topItems;

    if (items.isEmpty) {
      return _buildEmptyContainer('No item sales recorded for this period.');
    }

    final maxQty = items.map((i) => JsonUtils.parseDouble(i['total_quantity'] ?? i['qty'])).reduce((a, b) => a > b ? a : b);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Sales by Item',
                style: GoogleFonts.poppins(
                  color: AppColors.textPrimary,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                'TOP ITEMS BY QUANTITY',
                style: GoogleFonts.poppins(
                  color: AppColors.textMuted,
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
        ListView.separated(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: items.length,
          separatorBuilder: (_, __) => const SizedBox(height: 10),
          itemBuilder: (_, index) {
            final item = Map<String, dynamic>.from(items[index]);
            final rank = index + 1;
            final name = item['name']?.toString() ?? 'Item';
            final qty = JsonUtils.parseDouble(item['total_quantity'] ?? item['qty']).toInt();
            final rev = JsonUtils.parseDouble(item['total_revenue'] ?? item['revenue']);
            final pct = maxQty > 0 ? (qty / maxQty).clamp(0.0, 1.0) : 0.0;

            Widget rankBadge;
            if (rank == 1) {
              rankBadge = Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: const Color(0xFFFEF3C7), shape: BoxShape.circle),
                child: const Icon(Icons.emoji_events_rounded, color: Color(0xFFD97706), size: 18),
              );
            } else if (rank == 2) {
              rankBadge = Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: const Color(0xFFF1F5F9), shape: BoxShape.circle),
                child: const Icon(Icons.emoji_events_rounded, color: Color(0xFF64748B), size: 18),
              );
            } else if (rank == 3) {
              rankBadge = Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: const Color(0xFFFFEDD5), shape: BoxShape.circle),
                child: const Icon(Icons.emoji_events_rounded, color: Color(0xFFC2410C), size: 18),
              );
            } else {
              rankBadge = Container(
                width: 34,
                height: 34,
                decoration: BoxDecoration(color: AppColors.darkBg, shape: BoxShape.circle),
                child: Center(
                  child: Text(
                    '#$rank',
                    style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 12, fontWeight: FontWeight.bold),
                  ),
                ),
              );
            }

            return Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.darkCard,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: AppColors.darkBorder),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          rankBadge,
                          const SizedBox(width: 12),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                name,
                                style: GoogleFonts.poppins(
                                  color: AppColors.textPrimary,
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              Text(
                                '$qty sold',
                                style: GoogleFonts.poppins(
                                  color: AppColors.textMuted,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                      Text(
                        _fmt(rev),
                        style: GoogleFonts.poppins(
                          color: AppColors.statusGreen,
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: pct,
                      minHeight: 6,
                      backgroundColor: AppColors.darkBg,
                      valueColor: AlwaysStoppedAnimation<Color>(AppColors.accentAmber),
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ],
    );
  }
}

// ─── 4. Sales by Payment Tab ──────────────────────────────────────────────────

class _SalesByPaymentTab extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final provider = context.watch<ReportsProvider>();
    final payments = provider.paymentSales;

    if (payments.isEmpty) {
      return _buildEmptyContainer('No payment method data recorded.');
    }

    final maxRev = payments.map((p) => JsonUtils.parseDouble(p['total_revenue'])).reduce((a, b) => a > b ? a : b);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Sales by Payment Source',
                style: GoogleFonts.poppins(
                  color: AppColors.textPrimary,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                'CHANNEL BREAKDOWN',
                style: GoogleFonts.poppins(
                  color: AppColors.textMuted,
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
        ListView.separated(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: payments.length,
          separatorBuilder: (_, __) => const SizedBox(height: 10),
          itemBuilder: (_, i) {
            final p = Map<String, dynamic>.from(payments[i]);
            final name = p['name']?.toString() ?? 'Payment';
            final ords = JsonUtils.parseInt(p['order_count']);
            final rev = JsonUtils.parseDouble(p['total_revenue']);
            final pct = maxRev > 0 ? (rev / maxRev).clamp(0.0, 1.0) : 0.0;

            IconData icon = Icons.payments_rounded;
            Color iconColor = AppColors.statusGreen;
            if (name.toLowerCase().contains('online') || name.toLowerCase().contains('digital')) {
              icon = Icons.credit_card_rounded;
              iconColor = AppColors.statusBlue;
            } else if (name.toLowerCase().contains('due') || name.toLowerCase().contains('credit')) {
              icon = Icons.schedule_rounded;
              iconColor = AppColors.statusAmber;
            }

            return Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.darkCard,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: AppColors.darkBorder),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: iconColor.withOpacity(0.12),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Icon(icon, color: iconColor, size: 20),
                          ),
                          const SizedBox(width: 12),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                name,
                                style: GoogleFonts.poppins(
                                  color: AppColors.textPrimary,
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              Text(
                                '$ords ORDERS',
                                style: GoogleFonts.poppins(
                                  color: AppColors.textMuted,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                      Text(
                        _fmt(rev),
                        style: GoogleFonts.poppins(
                          color: AppColors.statusGreen,
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: pct,
                      minHeight: 6,
                      backgroundColor: AppColors.darkBg,
                      valueColor: AlwaysStoppedAnimation<Color>(iconColor),
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ],
    );
  }
}

Widget _buildEmptyContainer(String message) {
  return Container(
    padding: const EdgeInsets.all(32),
    decoration: BoxDecoration(
      color: AppColors.darkCard,
      borderRadius: BorderRadius.circular(20),
      border: Border.all(color: AppColors.darkBorder),
    ),
    child: Center(
      child: Text(
        message,
        style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 13),
      ),
    ),
  );
}
