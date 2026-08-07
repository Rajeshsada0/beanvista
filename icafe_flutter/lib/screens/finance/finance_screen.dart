import 'package:icafe_app/core/utils/snackbar_helper.dart';
import 'package:icafe_app/core/constants/app_constants.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/json_utils.dart';
import '../../providers/finance_provider.dart';
import 'finance_reports_screens.dart';

final _currencyFmt = NumberFormat('#,##0.00', 'en_IN');
String _fmt(double v) => '${AppConstants.currencySymbol} ${_currencyFmt.format(v)}';

class FinanceScreen extends StatefulWidget {
  final bool showAddBankAccount;
  const FinanceScreen({super.key, this.showAddBankAccount = false});

  @override
  State<FinanceScreen> createState() => _FinanceScreenState();
}

class _FinanceScreenState extends State<FinanceScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _tabController.addListener(() => setState(() {}));

    WidgetsBinding.instance.addPostFrameCallback((_) {
      final provider = context.read<FinanceProvider>();
      provider.fetchFinanceDashboardData();
      if (widget.showAddBankAccount) {
        _tabController.index = 3;
        _BankingTab._showAddBankAccountSheet(context, provider);
      }
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<FinanceProvider>();

    return Scaffold(
      backgroundColor: AppColors.darkBg,
      body: NestedScrollView(
        headerSliverBuilder: (context, innerBoxIsScrolled) => [
          SliverAppBar(
            pinned: true,
            floating: true,
            backgroundColor: AppColors.darkSurface,
            surfaceTintColor: Colors.transparent,
            title: Text(
              'Finance',
              style: GoogleFonts.poppins(
                color: AppColors.textPrimary,
                fontSize: 20,
                fontWeight: FontWeight.w700,
              ),
            ),
            actions: [
              _DateRangeChip(),
              const SizedBox(width: 8),
              IconButton(
                icon: Icon(Icons.refresh_rounded, color: AppColors.textSecondary),
                onPressed: () {
                  provider.fetchFinanceDashboardData();
                },
              ),
            ],
            bottom: TabBar(
              controller: _tabController,
              isScrollable: true,
              tabAlignment: TabAlignment.start,
              indicatorColor: AppColors.accentAmber,
              labelColor: AppColors.accentAmber,
              unselectedLabelColor: AppColors.textMuted,
              tabs: const [
                Tab(text: 'Overview'),
                Tab(text: 'Expenses'),
                Tab(text: 'Cash Counter'),
                Tab(text: 'Banking'),
              ],
            ),
          ),
        ],
        body: TabBarView(
          controller: _tabController,
          children: [
            _OverviewTab(),
            _ExpensesTab(),
            _CashCounterTab(),
            const _BankingTab(),
          ],
        ),
      ),
    );
  }
}

// ─── Date Range Chip ───
class _DateRangeChip extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final provider = context.watch<FinanceProvider>();
    final startFmt = DateFormat('MMM d').format(provider.startDate);
    final endFmt = DateFormat('MMM d, yyyy').format(provider.endDate);

    return GestureDetector(
      onTap: () async {
        await selectDateRange(context, provider);
        provider.fetchFinanceDashboardData();
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: AppColors.darkCard,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.darkBorder),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.calendar_month_rounded, size: 14, color: AppColors.accentAmber),
            const SizedBox(width: 6),
            Text(
              '$startFmt - $endFmt',
              style: GoogleFonts.poppins(
                color: AppColors.textPrimary,
                fontSize: 11,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(width: 4),
            Icon(Icons.keyboard_arrow_down_rounded, size: 14, color: AppColors.textMuted),
          ],
        ),
      ),
    );
  }
}

// ─── Overview Tab ───
class _OverviewTab extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final provider = context.watch<FinanceProvider>();
    if (provider.isLoading && provider.overview.isEmpty) {
      return Center(child: CircularProgressIndicator(color: AppColors.accentAmber));
    }

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _QuickStatsGrid(),
        const SizedBox(height: 16),
        _PLCard(),
        const SizedBox(height: 16),
        _PaymentMethodsCard(),
        const SizedBox(height: 16),
        _RecentTransactionsList(),
        const SizedBox(height: 20),
        _ReportsGrid(),
        const SizedBox(height: 24),
      ],
    );
  }
}

// ─── Quick Stats Grid ───
class _QuickStatsGrid extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final provider = context.watch<FinanceProvider>();
    final o = provider.overview;
    final rev = JsonUtils.parseDouble(o['revenue']);
    final exp = JsonUtils.parseDouble(o['expensesTotal']);
    final net = JsonUtils.parseDouble(o['netProfit']);
    final pending = JsonUtils.parseInt(o['pendingBills']);

    final items = [
      {
        'label': 'Revenue',
        'value': _fmt(rev),
        'icon': Icons.trending_up_rounded,
        'color': AppColors.statusGreen,
        'bg': AppColors.statusGreen.withOpacity(0.12),
      },
      {
        'label': 'Expenses',
        'value': _fmt(exp),
        'icon': Icons.trending_down_rounded,
        'color': AppColors.statusRed,
        'bg': AppColors.statusRed.withOpacity(0.12),
      },
      {
        'label': 'Net Profit',
        'value': _fmt(net),
        'icon': Icons.account_balance_wallet_rounded,
        'color': AppColors.accentAmber,
        'bg': AppColors.accentAmber.withOpacity(0.12),
      },
      {
        'label': 'Pending Bills',
        'value': '$pending',
        'icon': Icons.receipt_long_rounded,
        'color': AppColors.statusPurple,
        'bg': AppColors.statusPurple.withOpacity(0.12),
      },
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 1.32,
      ),
      itemCount: items.length,
      itemBuilder: (_, i) {
        final item = items[i];
        return Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.darkCard,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.darkBorder),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: item['bg'] as Color,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(item['icon'] as IconData, color: item['color'] as Color, size: 18),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item['value'] as String,
                    style: GoogleFonts.poppins(
                      color: AppColors.textPrimary,
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  Text(
                    item['label'] as String,
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
        );
      },
    );
  }
}

// ─── P&L Card ───
class _PLCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final provider = context.watch<FinanceProvider>();
    final o = provider.overview;
    final revenue = JsonUtils.parseDouble(o['revenue']);
    final expenses = JsonUtils.parseDouble(o['expensesTotal']);
    final profit = JsonUtils.parseDouble(o['netProfit']);
    final expRatio = revenue > 0 ? (expenses / revenue).clamp(0.0, 1.0) : 0.0;
    final profitMargin = revenue > 0 ? (profit / revenue * 100) : 0.0;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.darkCard,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.darkBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'P&L Summary',
                style: GoogleFonts.poppins(
                  color: AppColors.textPrimary,
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: profitMargin >= 0 ? AppColors.statusGreen.withOpacity(0.12) : AppColors.statusRed.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  '${profitMargin >= 0 ? '+' : ''}${profitMargin.toStringAsFixed(1)}% margin',
                  style: GoogleFonts.poppins(
                    color: profitMargin >= 0 ? AppColors.statusGreen : AppColors.statusRed,
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          _BarRow(label: 'Revenue', value: revenue, ratio: 1.0, color: AppColors.statusGreen),
          const SizedBox(height: 14),
          _BarRow(label: 'Expenses', value: expenses, ratio: expRatio, color: AppColors.statusRed),
          const SizedBox(height: 20),
          Divider(color: AppColors.darkBorder),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Net Profit',
                  style: GoogleFonts.poppins(color: AppColors.textSecondary, fontSize: 14, fontWeight: FontWeight.w500)),
              Text(_fmt(profit),
                  style: GoogleFonts.poppins(color: AppColors.accentAmber, fontSize: 16, fontWeight: FontWeight.w700)),
            ],
          ),
        ],
      ),
    );
  }
}

class _BarRow extends StatelessWidget {
  final String label;
  final double value;
  final double ratio;
  final Color color;

  const _BarRow({required this.label, required this.value, required this.ratio, required this.color});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: GoogleFonts.poppins(color: AppColors.textSecondary, fontSize: 13)),
            Text(_fmt(value), style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13, fontWeight: FontWeight.w600)),
          ],
        ),
        const SizedBox(height: 8),
        ClipRRect(
          borderRadius: BorderRadius.circular(6),
          child: LinearProgressIndicator(
            value: ratio,
            backgroundColor: AppColors.darkBorder,
            valueColor: AlwaysStoppedAnimation<Color>(color),
            minHeight: 10,
          ),
        ),
      ],
    );
  }
}

// ─── Payment Methods Card ───
class _PaymentMethodsCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final provider = context.watch<FinanceProvider>();
    final o = provider.overview;
    final cash = JsonUtils.parseDouble(o['cashSales']);
    final card = JsonUtils.parseDouble(o['cardSales']);
    final credit = JsonUtils.parseDouble(o['creditSales']);
    final total = cash + card + credit;

    final methods = [
      {'label': 'Cash', 'icon': Icons.payments_rounded, 'value': cash, 'color': AppColors.statusGreen},
      {'label': 'Card', 'icon': Icons.credit_card_rounded, 'value': card, 'color': AppColors.statusBlue},
      {'label': 'Credit', 'icon': Icons.receipt_long_rounded, 'value': credit, 'color': AppColors.statusPurple},
    ];

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.darkCard,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.darkBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Payment Methods',
              style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.w600)),
          const SizedBox(height: 16),
          ...methods.map((m) {
            final double val = m['value'] as double;
            final double pct = total > 0 ? (val / total) : 0.0;
            final color = m['color'] as Color;
            return Padding(
              padding: const EdgeInsets.only(bottom: 14),
              child: Column(
                children: [
                  Row(
                    children: [
                      Icon(m['icon'] as IconData, size: 16, color: color),
                      const SizedBox(width: 8),
                      Text(m['label'] as String, style: GoogleFonts.poppins(color: AppColors.textSecondary, fontSize: 13)),
                      const Spacer(),
                      Text('${(pct * 100).toStringAsFixed(1)}%',
                          style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 12)),
                      const SizedBox(width: 8),
                      Text(_fmt(val),
                          style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13, fontWeight: FontWeight.w600)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: LinearProgressIndicator(
                      value: pct,
                      backgroundColor: AppColors.darkBorder,
                      valueColor: AlwaysStoppedAnimation<Color>(color),
                      minHeight: 8,
                    ),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}

// ─── Recent Transactions ───
class _RecentTransactionsList extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final provider = context.watch<FinanceProvider>();
    final txns = provider.overview['recentTransactions'] as List? ?? [];

    return Container(
      decoration: BoxDecoration(
        color: AppColors.darkCard,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.darkBorder),
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Recent Transactions',
                    style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.w600)),
              ],
            ),
          ),
          Divider(height: 1, color: AppColors.darkBorder),
          if (txns.isEmpty)
            Padding(
              padding: const EdgeInsets.all(32),
              child: Text('No transactions recorded in this period.', style: GoogleFonts.poppins(color: AppColors.textMuted)),
            )
          else
            ...txns.asMap().entries.map((entry) => Column(
                  children: [
                    _TransactionTile(transaction: Map<String, dynamic>.from(entry.value)),
                    if (entry.key < txns.length - 1)
                      Divider(height: 1, indent: 20, endIndent: 20, color: AppColors.darkBorder),
                  ],
                )),
        ],
      ),
    );
  }
}

String _formatDateTime(String? raw) {
  if (raw == null || raw.trim().isEmpty) return '';
  try {
    final dt = DateTime.parse(raw).toLocal();
    if (dt.hour != 0 || dt.minute != 0 || dt.second != 0) {
      return DateFormat('MMM d, yyyy • hh:mm a').format(dt);
    } else {
      return DateFormat('MMM d, yyyy').format(dt);
    }
  } catch (_) {
    if (raw.contains('T')) {
      final parts = raw.split('T');
      try {
        final dt = DateTime.parse(parts[0]);
        return DateFormat('MMM d, yyyy').format(dt);
      } catch (_) {
        return parts[0];
      }
    }
    return raw;
  }
}

class _TransactionTile extends StatelessWidget {
  final Map<String, dynamic> transaction;
  const _TransactionTile({required this.transaction});

  @override
  Widget build(BuildContext context) {
    final isCredit = transaction['type'] == 'credit';
    final formattedTime = _formatDateTime(transaction['time'] as String?);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: isCredit ? AppColors.statusGreen.withOpacity(0.12) : AppColors.statusRed.withOpacity(0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(
              isCredit ? Icons.arrow_downward_rounded : Icons.arrow_upward_rounded,
              color: isCredit ? AppColors.statusGreen : AppColors.statusRed,
              size: 18,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(transaction['desc'] ?? '',
                    style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13, fontWeight: FontWeight.w500)),
                if (formattedTime.isNotEmpty)
                  Text(formattedTime,
                      style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 11)),
              ],
            ),
          ),
          Text(
            '${isCredit ? '+' : '-'}${_fmt(JsonUtils.parseDouble(transaction['amount']))}',
            style: GoogleFonts.poppins(
              color: isCredit ? AppColors.statusGreen : AppColors.statusRed,
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Financial Reports Grid ───
class _ReportsGrid extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final reports = [
      {'name': 'P&L Statement', 'icon': Icons.assignment_outlined, 'screen': const ProfitLossDetailScreen()},
      {'name': 'Balance Sheet', 'icon': Icons.account_balance_outlined, 'screen': const BalanceSheetScreen()},
      {'name': 'Trial Balance', 'icon': Icons.checklist_rtl_rounded, 'screen': const TrialBalanceScreen()},
      {'name': 'Cash Flow', 'icon': Icons.swap_horiz_rounded, 'screen': const CashFlowScreen()},
      {'name': 'General Ledger', 'icon': Icons.menu_book_outlined, 'screen': const GeneralLedgerScreen()},
      {'name': 'Chart of Accounts', 'icon': Icons.format_list_bulleted_rounded, 'screen': const ChartOfAccountsScreen()},
      {'name': 'Journal Entries', 'icon': Icons.library_books_outlined, 'screen': const JournalEntriesScreen()},
      {'name': 'Supplier Bills', 'icon': Icons.receipt_long_rounded, 'screen': const SupplierBillsScreen()},
      {'name': 'Budgets', 'icon': Icons.pie_chart_outline_rounded, 'screen': const BudgetsScreen()},
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Financial Reports & Tools',
            style: GoogleFonts.poppins(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 15)),
        const SizedBox(height: 12),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
            childAspectRatio: 0.95,
          ),
          itemCount: reports.length,
          itemBuilder: (ctx, i) {
            final rep = reports[i];
            return InkWell(
              onTap: () {
                Navigator.push(context, MaterialPageRoute(builder: (context) => rep['screen'] as Widget));
              },
              child: Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.darkCard,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.darkBorder),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(rep['icon'] as IconData, color: AppColors.accentAmber, size: 24),
                    const SizedBox(height: 8),
                    Text(
                      rep['name'] as String,
                      style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 10, fontWeight: FontWeight.w600),
                      textAlign: TextAlign.center,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ],
    );
  }
}

// ─── Expenses Tab ───
class _ExpensesTab extends StatefulWidget {
  @override
  State<_ExpensesTab> createState() => _ExpensesTabState();
}

class _ExpensesTabState extends State<_ExpensesTab> {
  String _selectedCategory = 'All';

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<FinanceProvider>();
    final expenses = provider.expenses;

    final categories = ['All', ...provider.expenseCategories.map((c) => c['name'].toString())];

    final filtered = expenses.where((e) {
      if (_selectedCategory == 'All') return true;
      return e['category']?['name'] == _selectedCategory;
    }).toList();

    final total = filtered.fold(0.0, (s, e) => s + JsonUtils.parseDouble(e['amount']));

    return Scaffold(
      backgroundColor: AppColors.darkBg,
      floatingActionButton: FloatingActionButton(
        heroTag: 'expense_fab',
        onPressed: () => _showAddSheet(context),
        backgroundColor: AppColors.accentAmber,
        foregroundColor: Colors.white,
        child: const Icon(Icons.add_rounded),
      ),
      body: provider.isLoading && expenses.isEmpty
          ? Center(child: CircularProgressIndicator(color: AppColors.accentAmber))
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: AppColors.statusRed.withOpacity(0.08),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppColors.statusRed.withOpacity(0.3)),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.statusRed.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(14),
                        ),
                        child: Icon(Icons.trending_down_rounded, color: AppColors.statusRed, size: 24),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('Total Expenses',
                                style: GoogleFonts.poppins(color: AppColors.textSecondary, fontSize: 13)),
                            Text(_fmt(total),
                                style: GoogleFonts.poppins(color: AppColors.statusRed, fontSize: 22, fontWeight: FontWeight.w700)),
                          ],
                        ),
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text('${filtered.length} items',
                              style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 12)),
                          Text(DateFormat('MMM yyyy').format(provider.startDate),
                              style: GoogleFonts.poppins(color: AppColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w500)),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    // Manage Categories Button
                    GestureDetector(
                      onTap: () => _showManageCategoriesSheet(context),
                      child: Container(
                        height: 36,
                        width: 36,
                        decoration: BoxDecoration(
                          color: AppColors.darkCard,
                          shape: BoxShape.circle,
                          border: Border.all(color: AppColors.darkBorder),
                        ),
                        child: Icon(Icons.style_outlined, size: 16, color: AppColors.accentAmber),
                      ),
                    ),
                    const SizedBox(width: 8),
                    // Categories horizontal list
                    Expanded(
                      child: SizedBox(
                        height: 36,
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          itemCount: categories.length,
                          separatorBuilder: (_, __) => const SizedBox(width: 8),
                          itemBuilder: (_, i) {
                            final cat = categories[i];
                            final sel = cat == _selectedCategory;
                            return GestureDetector(
                              onTap: () => setState(() => _selectedCategory = cat),
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 200),
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                                decoration: BoxDecoration(
                                  color: sel ? AppColors.accentAmber.withOpacity(0.15) : AppColors.darkCard,
                                  borderRadius: BorderRadius.circular(20),
                                  border: Border.all(color: sel ? AppColors.accentAmber : AppColors.darkBorder),
                                ),
                                child: Center(
                                  child: Text(cat,
                                      style: GoogleFonts.poppins(
                                        color: sel ? AppColors.accentAmber : AppColors.textSecondary,
                                        fontSize: 12,
                                        fontWeight: sel ? FontWeight.w600 : FontWeight.w400,
                                      )),
                                ),
                              ),
                            );
                          },
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Container(
                  decoration: BoxDecoration(
                    color: AppColors.darkCard,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppColors.darkBorder),
                  ),
                  child: filtered.isEmpty
                      ? Padding(
                          padding: const EdgeInsets.all(40),
                          child: Center(
                            child: Text('No expenses logged.',
                                style: GoogleFonts.poppins(color: AppColors.textMuted)),
                          ),
                        )
                      : Column(
                          children: filtered.asMap().entries.map((entry) => Column(
                                children: [
                                  _ExpenseTile(expense: Map<String, dynamic>.from(entry.value)),
                                  if (entry.key < filtered.length - 1)
                                    Divider(height: 1, indent: 20, endIndent: 20, color: AppColors.darkBorder),
                                ],
                              )).toList(),
                        ),
                ),
                const SizedBox(height: 80),
              ],
            ),
    );
  }

  void _showAddSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => const _AddExpenseSheet(),
    );
  }

  void _showManageCategoriesSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => const _ManageCategoriesSheet(),
    );
  }
}

class _ExpenseTile extends StatelessWidget {
  final Map<String, dynamic> expense;
  const _ExpenseTile({required this.expense});

  @override
  Widget build(BuildContext context) {
    final catName = expense['category']?['name'] ?? 'Other';
    final amt = JsonUtils.parseDouble(expense['amount']);
    final date = expense['date'] ?? '';
    final notes = expense['notes'] ?? '';

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: AppColors.statusRed.withOpacity(0.12),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Center(
              child: Text(catName[0].toUpperCase(),
                  style: GoogleFonts.poppins(color: AppColors.statusRed, fontSize: 16, fontWeight: FontWeight.w700)),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(notes.isNotEmpty ? notes : catName,
                    style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13, fontWeight: FontWeight.w500)),
                const SizedBox(height: 4),
                Wrap(
                  crossAxisAlignment: WrapCrossAlignment.center,
                  spacing: 8,
                  runSpacing: 4,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppColors.darkSurface,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(catName,
                          style: GoogleFonts.poppins(color: AppColors.textSecondary, fontSize: 10, fontWeight: FontWeight.w600)),
                    ),
                    Text(date, style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 11)),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(_fmt(amt), style: GoogleFonts.poppins(color: AppColors.statusRed, fontSize: 13, fontWeight: FontWeight.w600)),
              const SizedBox(height: 4),
              GestureDetector(
                onTap: () {
                  showDialog(
                    context: context,
                    builder: (ctx) => AlertDialog(
                      backgroundColor: AppColors.darkCard,
                      title: Text('Delete Expense', style: GoogleFonts.poppins(color: AppColors.textPrimary)),
                      content: Text('Are you sure you want to delete this expense of ${_fmt(amt)}?', style: GoogleFonts.poppins(color: AppColors.textSecondary)),
                      actions: [
                        TextButton(
                          onPressed: () => Navigator.pop(ctx),
                          child: Text('Cancel', style: GoogleFonts.poppins(color: AppColors.textMuted)),
                        ),
                        TextButton(
                          onPressed: () async {
                            Navigator.pop(ctx);
                            final success = await context.read<FinanceProvider>().deleteExpense(JsonUtils.parseInt(expense['id']));
                            if (success && context.mounted) {
                              showTopSnackBar(context, SnackBar(
                                content: const Text('Expense deleted successfully!'),
                                backgroundColor: AppColors.statusGreen,
                              ));
                            } else if (context.mounted) {
                              showTopSnackBar(context, SnackBar(
                                content: const Text('Failed to delete expense'),
                                backgroundColor: AppColors.statusRed,
                              ));
                            }
                          },
                          child: Text('Delete', style: GoogleFonts.poppins(color: AppColors.statusRed)),
                        ),
                      ],
                    ),
                  );
                },
                child: Padding(
                  padding: const EdgeInsets.all(4),
                  child: Icon(Icons.delete_outline_rounded, color: AppColors.textMuted, size: 18),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ─── Add Expense Sheet ───
class _AddExpenseSheet extends StatefulWidget {
  const _AddExpenseSheet();

  @override
  State<_AddExpenseSheet> createState() => _AddExpenseSheetState();
}

class _AddExpenseSheetState extends State<_AddExpenseSheet> {
  final _descCtrl = TextEditingController();
  final _amountCtrl = TextEditingController();
  final _quickCategoryCtrl = TextEditingController();
  int? _selectedCategoryId;

  @override
  void dispose() {
    _descCtrl.dispose();
    _amountCtrl.dispose();
    _quickCategoryCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<FinanceProvider>();
    final categories = provider.expenseCategories;

    if (_selectedCategoryId == null) {
      if (categories.isNotEmpty) {
        _selectedCategoryId = JsonUtils.parseInt(categories.first['id']);
      } else {
        _selectedCategoryId = -1; // Default to Quick Add Category option
      }
    }

    final bool isQuickAdding = _selectedCategoryId == -1;

    final List<DropdownMenuItem<int>> dropdownItems = [];
    dropdownItems.addAll(categories.map((c) {
      return DropdownMenuItem<int>(
        value: JsonUtils.parseInt(c['id']),
        child: Text(c['name'] ?? '', style: GoogleFonts.poppins(color: AppColors.textPrimary)),
      );
    }));
    dropdownItems.add(DropdownMenuItem<int>(
      value: -1,
      child: Row(
        children: [
          Icon(Icons.add_rounded, size: 16, color: AppColors.accentAmber),
          const SizedBox(width: 6),
          Text(
            'Add Category', 
            style: GoogleFonts.poppins(
              color: AppColors.accentAmber,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    ));

    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.darkCard,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: const EdgeInsets.fromLTRB(24, 20, 24, 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Add Expense',
                    style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 18, fontWeight: FontWeight.w700)),
                IconButton(
                  icon: Icon(Icons.close, color: AppColors.textMuted),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
            const SizedBox(height: 16),
            
            isQuickAdding
                ? Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _quickCategoryCtrl,
                          style: TextStyle(color: AppColors.textPrimary),
                          decoration: InputDecoration(
                            labelText: 'New Category Name',
                            hintText: 'Enter category name...',
                            prefixIcon: const Icon(Icons.style_outlined),
                            filled: true,
                            fillColor: AppColors.darkSurface,
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      IconButton(
                        icon: const Icon(Icons.check_circle_rounded, color: Colors.green, size: 28),
                        onPressed: () async {
                          final name = _quickCategoryCtrl.text.trim();
                          if (name.isEmpty) return;
                          final success = await provider.createExpenseCategory(name);
                          if (success) {
                            _quickCategoryCtrl.clear();
                            final newCats = provider.expenseCategories;
                            if (newCats.isNotEmpty) {
                              final newCat = newCats.firstWhere(
                                (c) => c['name'].toString().trim().toLowerCase() == name.toLowerCase(),
                                orElse: () => newCats.first,
                              );
                              setState(() {
                                _selectedCategoryId = JsonUtils.parseInt(newCat['id']);
                              });
                            }
                          } else if (mounted) {
                            showTopSnackBar(context, SnackBar(
                              content: Text(provider.error ?? 'Failed to add category'),
                              backgroundColor: AppColors.statusRed,
                            ));
                          }
                        },
                      ),
                      if (categories.isNotEmpty)
                        IconButton(
                          icon: Icon(Icons.cancel_rounded, color: AppColors.textMuted, size: 28),
                          onPressed: () {
                            setState(() {
                              _selectedCategoryId = JsonUtils.parseInt(categories.first['id']);
                            });
                          },
                        ),
                    ],
                  )
                : DropdownButtonFormField<int>(
                    value: _selectedCategoryId,
                    dropdownColor: AppColors.darkCard,
                    style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13),
                    decoration: InputDecoration(
                      labelText: 'Category',
                      filled: true,
                      fillColor: AppColors.darkSurface,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    items: dropdownItems,
                    onChanged: (v) => setState(() => _selectedCategoryId = v),
                  ),
            const SizedBox(height: 12),
            TextField(
              controller: _descCtrl,
              style: TextStyle(color: AppColors.textPrimary),
              decoration: const InputDecoration(
                labelText: 'Notes / Description',
                prefixIcon: Icon(Icons.description_outlined),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _amountCtrl,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              style: TextStyle(color: AppColors.textPrimary),
              decoration: const InputDecoration(
                labelText: 'Amount (Rs.)',
                prefixIcon: Icon(Icons.payments_outlined),
              ),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton.icon(
                onPressed: () async {
                  final amt = double.tryParse(_amountCtrl.text) ?? 0.0;
                  if (_selectedCategoryId == null || amt <= 0) {
                    showTopSnackBar(context, SnackBar(content: Text('Please select category and enter amount'), backgroundColor: AppColors.statusRed));
                    return;
                  }

                  final success = await provider.createExpense({
                    'expense_category_id': _selectedCategoryId,
                    'amount': amt,
                    'date': DateTime.now().toString().split(' ')[0],
                    'notes': _descCtrl.text.trim(),
                  });

                  if (success && mounted) {
                    Navigator.pop(context);
                    showTopSnackBar(context, SnackBar(content: Text('Expense logged successfully'), backgroundColor: AppColors.statusGreen));
                  } else if (mounted) {
                    showTopSnackBar(context, SnackBar(content: Text(provider.error ?? 'Failed to add expense'), backgroundColor: AppColors.statusRed));
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.accentAmber,
                  foregroundColor: AppColors.textOnAmber,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                icon: const Icon(Icons.check_rounded),
                label: Text('Save Expense', style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Cash Counter Tab ───
class _CashCounterTab extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final provider = context.watch<FinanceProvider>();
    final reg = provider.cashRegister;
    final active = reg['activeSession'] != null;

    final openBal = JsonUtils.parseDouble(active ? reg['activeSession']['opening_balance'] : 0.0);
    final sales = JsonUtils.parseDouble(reg['cashSales']);
    final deposits = JsonUtils.parseDouble(reg['cashDeposits']);
    final withdrawals = JsonUtils.parseDouble(reg['cashWithdrawals']);
    final expected = openBal + sales + deposits - withdrawals;

    final List<dynamic> previousSessions = reg['previousSessions'] is List ? reg['previousSessions'] : [];

    return provider.isLoading && reg.isEmpty
        ? Center(child: CircularProgressIndicator(color: AppColors.accentAmber))
        : ListView(
            padding: const EdgeInsets.all(16),
            children: [
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: (active ? AppColors.statusGreen : AppColors.statusRed).withOpacity(0.08),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: (active ? AppColors.statusGreen : AppColors.statusRed).withOpacity(0.3)),
                ),
                child: Column(
                  children: [
                    Container(
                      width: 72,
                      height: 72,
                      decoration: BoxDecoration(
                        color: (active ? AppColors.statusGreen : AppColors.statusRed).withOpacity(0.15),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Icon(
                        active ? Icons.lock_open_rounded : Icons.lock_rounded,
                        color: active ? AppColors.statusGreen : AppColors.statusRed,
                        size: 36,
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text('Cash Register', style: GoogleFonts.poppins(color: AppColors.textSecondary, fontSize: 14)),
                    const SizedBox(height: 4),
                    Text(
                      active ? 'OPEN' : 'CLOSED',
                      style: GoogleFonts.poppins(
                        color: active ? AppColors.statusGreen : AppColors.statusRed,
                        fontSize: 28,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 2,
                      ),
                    ),
                    if (active) ...[
                      const SizedBox(height: 4),
                      Text("Opened at: ${reg['activeSession']['opened_at']}",
                          style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 11)),
                    ],
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      height: 48,
                      child: ElevatedButton.icon(
                        onPressed: () {
                          if (active) {
                            _showCloseRegisterSheet(context, provider, reg['activeSession']['id'], expected);
                          } else {
                            _showOpenRegisterSheet(context, provider);
                          }
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: active ? AppColors.statusRed : AppColors.statusGreen,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        icon: Icon(active ? Icons.lock_rounded : Icons.lock_open_rounded, size: 18),
                        label: Text(active ? 'Close Register' : 'Open Register', style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ],
                ),
              ),
              if (active) ...[
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: AppColors.darkCard,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppColors.darkBorder),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Session Summary',
                          style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 16),
                      _CashRow(label: 'Opening Balance', value: openBal, color: AppColors.textPrimary),
                      _CashRow(label: 'Cash Sales', value: sales, color: AppColors.statusGreen, prefix: '+'),
                      _CashRow(label: 'Deposits', value: deposits, color: AppColors.statusGreen, prefix: '+'),
                      _CashRow(label: 'Withdrawals', value: withdrawals, color: AppColors.statusRed, prefix: '-'),
                      Divider(color: AppColors.darkBorder, height: 24),
                      _CashRow(label: 'Expected Balance', value: expected, color: AppColors.accentAmber, isBold: true),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 24),
              Text(
                'Session Reconciliation History',
                style: GoogleFonts.poppins(
                  color: AppColors.textPrimary,
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 12),
              if (previousSessions.isEmpty)
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: AppColors.darkCard,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppColors.darkBorder),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    'No session history found.',
                    style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 13),
                  ),
                )
              else
                ...previousSessions.map((session) {
                  return _SessionHistoryCard(session: Map<String, dynamic>.from(session));
                }),
              const SizedBox(height: 24),
            ],
          );
  }

  void _showOpenRegisterSheet(BuildContext context, FinanceProvider provider) {
    final balanceCtrl = TextEditingController();
    final notesCtrl = TextEditingController();

    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.darkCard,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(left: 24, right: 24, top: 24, bottom: MediaQuery.of(ctx).viewInsets.bottom + 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Open Cash Register', style: GoogleFonts.poppins(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 16),
            TextField(
              controller: balanceCtrl,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              style: TextStyle(color: AppColors.textPrimary),
              decoration: const InputDecoration(labelText: 'Opening Balance Amount (Rs.)'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: notesCtrl,
              style: TextStyle(color: AppColors.textPrimary),
              decoration: const InputDecoration(labelText: 'Opening Notes (optional)'),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: () async {
                  final bal = double.tryParse(balanceCtrl.text) ?? 0.0;
                  final success = await provider.openCashRegister(bal, notesCtrl.text.trim());
                  if (success && ctx.mounted) {
                    Navigator.pop(ctx);
                    showTopSnackBar(context, SnackBar(content: Text('Cash register opened successfully'), backgroundColor: AppColors.statusGreen));
                  } else if (ctx.mounted) {
                    showTopSnackBar(context, SnackBar(content: Text(provider.error ?? 'Failed to open register'), backgroundColor: AppColors.statusRed));
                  }
                },
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.statusGreen, foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
                child: Text('Confirm Open', style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showCloseRegisterSheet(BuildContext context, FinanceProvider provider, int sessionId, double expected) {
    final balanceCtrl = TextEditingController(text: expected.toStringAsFixed(2));
    final notesCtrl = TextEditingController();

    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.darkCard,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(left: 24, right: 24, top: 24, bottom: MediaQuery.of(ctx).viewInsets.bottom + 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Close Cash Register Session', style: GoogleFonts.poppins(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 8),
            Text('Expected drawer balance: ${_fmt(expected)}', style: GoogleFonts.poppins(color: AppColors.textSecondary, fontSize: 12)),
            const SizedBox(height: 16),
            TextField(
              controller: balanceCtrl,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              style: TextStyle(color: AppColors.textPrimary),
              decoration: const InputDecoration(labelText: 'Actual Drawer Cash Counted (Rs.)'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: notesCtrl,
              style: TextStyle(color: AppColors.textPrimary),
              decoration: const InputDecoration(labelText: 'Closing Notes (optional)'),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: () async {
                  final bal = double.tryParse(balanceCtrl.text) ?? 0.0;
                  final discrepancy = bal - expected;

                  // Simple confirm warning if there's discrepancy
                  if (discrepancy.abs() > 0.01) {
                    final confirm = await showDialog<bool>(
                      context: context,
                      builder: (c) => AlertDialog(
                        backgroundColor: AppColors.darkCard,
                        title: Text('Discrepancy Warning', style: GoogleFonts.poppins(color: AppColors.textPrimary, fontWeight: FontWeight.bold)),
                        content: Text(
                          'Counted balance differs from expected by Rs. ${discrepancy.toStringAsFixed(2)}. A GL adjustment entry will be automatically posted. Continue?',
                          style: GoogleFonts.poppins(color: AppColors.textSecondary),
                        ),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.pop(c, false),
                            child: Text(
                              'Back',
                              style: GoogleFonts.poppins(
                                color: AppColors.textMuted,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          ElevatedButton(
                            onPressed: () => Navigator.pop(c, true),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.accentAmber,
                              foregroundColor: Colors.white,
                              elevation: 0,
                              shadowColor: Colors.transparent,
                              shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(10)),
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 16, vertical: 8),
                            ),
                            child: Text(
                              'Continue',
                              style: GoogleFonts.poppins(
                                  fontWeight: FontWeight.bold),
                            ),
                          ),
                        ],
                      ),
                    );
                    if (confirm != true) return;
                  }

                  final success = await provider.closeCashRegister(sessionId, bal, notesCtrl.text.trim());
                  if (success && ctx.mounted) {
                    Navigator.pop(ctx);
                    showTopSnackBar(context, SnackBar(content: Text('Cash register closed and reconciled'), backgroundColor: AppColors.statusGreen));
                  } else if (ctx.mounted) {
                    showTopSnackBar(context, SnackBar(content: Text(provider.error ?? 'Failed to close register'), backgroundColor: AppColors.statusRed));
                  }
                },
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.statusRed, foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
                child: Text('Confirm Close & Reconcile', style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CashRow extends StatelessWidget {
  final String label;
  final double value;
  final Color color;
  final String prefix;
  final bool isBold;

  const _CashRow({
    required this.label,
    required this.value,
    required this.color,
    this.prefix = '',
    this.isBold = false,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label,
              style: GoogleFonts.poppins(
                color: AppColors.textSecondary,
                fontSize: 13,
                fontWeight: isBold ? FontWeight.w600 : FontWeight.w400,
              )),
          Text('$prefix${_fmt(value)}',
              style: GoogleFonts.poppins(
                color: color,
                fontSize: isBold ? 15 : 13,
                fontWeight: isBold ? FontWeight.w700 : FontWeight.w500,
              )),
        ],
      ),
    );
  }
}
// ─── Banking Tab ───
class _BankingTab extends StatelessWidget {
  const _BankingTab();

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<FinanceProvider>();
    final accounts = provider.bankAccounts;
    final txns = provider.bankTransactions;

    return Scaffold(
      backgroundColor: AppColors.darkBg,
      floatingActionButton: FloatingActionButton(
        heroTag: 'banking_fab',
        onPressed: () => _showAddBankAccountSheet(context, provider),
        backgroundColor: AppColors.accentAmber,
        foregroundColor: Colors.white,
        child: const Icon(Icons.add_rounded),
      ),
      body: provider.isLoading && accounts.isEmpty
          ? Center(child: CircularProgressIndicator(color: AppColors.accentAmber))
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Text('Accounts', style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.w600)),
                const SizedBox(height: 12),
                if (accounts.isEmpty)
                  Padding(
                    padding: const EdgeInsets.all(20),
                    child: Text('No banking accounts registered.', style: GoogleFonts.poppins(color: AppColors.textMuted)),
                  )
                else
                  ...accounts.map((acc) => _BankAccountCard(account: Map<String, dynamic>.from(acc), provider: provider)),
                const SizedBox(height: 20),
                Text('Recent Transactions', style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.w600)),
                const SizedBox(height: 12),
                Container(
                  decoration: BoxDecoration(
                    color: AppColors.darkCard,
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppColors.darkBorder),
                  ),
                  child: txns.isEmpty
                      ? Padding(
                          padding: const EdgeInsets.all(32),
                          child: Text('No recent transactions logged.', style: GoogleFonts.poppins(color: AppColors.textMuted)),
                        )
                      : Column(
                          children: txns.asMap().entries.map((entry) => Column(
                                children: [
                                  _TransactionTile(transaction: {
                                    'desc': entry.value['notes'] ?? 'Transfer',
                                    'type': entry.value['type'] == 'deposit' ? 'credit' : 'debit',
                                    'amount': JsonUtils.parseDouble(entry.value['amount']),
                                    'time': entry.value['date'] ?? '',
                                  }),
                                  if (entry.key < txns.length - 1)
                                    Divider(height: 1, indent: 20, endIndent: 20, color: AppColors.darkBorder),
                                ],
                              )).toList(),
                        ),
                ),
                const SizedBox(height: 80),
              ],
            ),
    );
  }

  static void _showAddBankAccountSheet(BuildContext context, FinanceProvider provider) {
    final nameCtrl = TextEditingController();
    final numberCtrl = TextEditingController();
    final bankCtrl = TextEditingController();
    final balanceCtrl = TextEditingController(text: '0');
    String type = 'checking';

    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.darkCard,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(left: 24, right: 24, top: 24, bottom: MediaQuery.of(ctx).viewInsets.bottom + 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Register Bank Account', style: GoogleFonts.poppins(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 16),
            TextField(
              controller: nameCtrl,
              style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13),
              decoration: InputDecoration(
                labelText: 'Account Name (e.g. Primary Checking)',
                labelStyle: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 12),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: numberCtrl,
              style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13),
              decoration: InputDecoration(
                labelText: 'Account Number (optional)',
                labelStyle: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 12),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: bankCtrl,
              style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13),
              decoration: InputDecoration(
                labelText: 'Bank Name (e.g. Standard Chartered)',
                labelStyle: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 12),
              ),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: type,
              dropdownColor: AppColors.darkCard,
              style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13),
              decoration: InputDecoration(
                labelText: 'Account Type',
                filled: true,
                fillColor: AppColors.darkSurface,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              items: ['checking', 'cash', 'online']
                  .map((t) => DropdownMenuItem(value: t, child: Text(t.toUpperCase(), style: GoogleFonts.poppins(color: AppColors.textPrimary))))
                  .toList(),
              onChanged: (v) {
                if (v != null) type = v;
              },
            ),
            const SizedBox(height: 12),
            TextField(
              controller: balanceCtrl,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13),
              decoration: InputDecoration(
                labelText: 'Starting Balance (Rs.)',
                labelStyle: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 12),
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: () async {
                  final bal = double.tryParse(balanceCtrl.text) ?? 0.0;
                  if (nameCtrl.text.trim().isEmpty || bal < 0) {
                    showTopSnackBar(context, SnackBar(content: Text('Please fill all required fields'), backgroundColor: AppColors.statusRed));
                    return;
                  }

                  final success = await provider.createBankAccount({
                    'account_name': nameCtrl.text.trim(),
                    'account_number': numberCtrl.text.trim(),
                    'bank_name': bankCtrl.text.trim(),
                    'account_type': type,
                    'balance': bal,
                  });

                  if (success && ctx.mounted) {
                    Navigator.pop(ctx);
                    showTopSnackBar(context, SnackBar(content: Text('Bank Account registered successfully'), backgroundColor: AppColors.statusGreen));
                  } else if (ctx.mounted) {
                    showTopSnackBar(context, SnackBar(content: Text(provider.error ?? 'Failed to register account'), backgroundColor: AppColors.statusRed));
                  }
                },
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.accentAmber, foregroundColor: AppColors.textOnAmber, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
                child: Text('Complete Registration', style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  static void _showEditBankAccountSheet(BuildContext context, FinanceProvider provider, Map<String, dynamic> account) {
    final nameCtrl = TextEditingController(text: account['account_name'] ?? '');
    final numberCtrl = TextEditingController(text: account['account_number'] ?? '');
    final bankCtrl = TextEditingController(text: account['bank_name'] ?? '');
    final balanceCtrl = TextEditingController(text: account['balance']?.toString() ?? '0');
    String type = account['account_type'] ?? 'checking';

    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.darkCard,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(left: 24, right: 24, top: 24, bottom: MediaQuery.of(ctx).viewInsets.bottom + 24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Edit Bank Account', style: GoogleFonts.poppins(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 16)),
            const SizedBox(height: 16),
            TextField(
              controller: nameCtrl,
              style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13),
              decoration: InputDecoration(
                labelText: 'Account Name (e.g. Primary Checking)',
                labelStyle: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 12),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: numberCtrl,
              style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13),
              decoration: InputDecoration(
                labelText: 'Account Number (optional)',
                labelStyle: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 12),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: bankCtrl,
              style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13),
              decoration: InputDecoration(
                labelText: 'Bank Name (e.g. Standard Chartered)',
                labelStyle: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 12),
              ),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: type,
              dropdownColor: AppColors.darkCard,
              style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13),
              decoration: InputDecoration(
                labelText: 'Account Type',
                filled: true,
                fillColor: AppColors.darkSurface,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              items: ['checking', 'cash', 'online']
                  .map((t) => DropdownMenuItem(value: t, child: Text(t.toUpperCase(), style: GoogleFonts.poppins(color: AppColors.textPrimary))))
                  .toList(),
              onChanged: (v) {
                if (v != null) type = v;
              },
            ),
            const SizedBox(height: 12),
            TextField(
              controller: balanceCtrl,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13),
              decoration: InputDecoration(
                labelText: 'Balance (Rs.)',
                labelStyle: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 12),
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: () async {
                  final bal = double.tryParse(balanceCtrl.text) ?? 0.0;
                  if (nameCtrl.text.trim().isEmpty || bal < 0) {
                    showTopSnackBar(context, SnackBar(content: Text('Please fill all required fields'), backgroundColor: AppColors.statusRed));
                    return;
                  }

                  final success = await provider.updateBankAccount(account['id'], {
                    'account_name': nameCtrl.text.trim(),
                    'account_number': numberCtrl.text.trim(),
                    'bank_name': bankCtrl.text.trim(),
                    'account_type': type,
                    'balance': bal,
                  });

                  if (success && ctx.mounted) {
                    Navigator.pop(ctx);
                    showTopSnackBar(context, SnackBar(content: Text('Bank Account updated successfully'), backgroundColor: AppColors.statusGreen));
                  } else if (ctx.mounted) {
                    showTopSnackBar(context, SnackBar(content: Text(provider.error ?? 'Failed to update account'), backgroundColor: AppColors.statusRed));
                  }
                },
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.accentAmber, foregroundColor: AppColors.textOnAmber, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
                child: Text('Save Changes', style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  static void _showDeleteConfirmDialog(BuildContext context, FinanceProvider provider, Map<String, dynamic> account) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.darkCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text('Delete Account', style: GoogleFonts.poppins(color: AppColors.textPrimary, fontWeight: FontWeight.bold)),
        content: Text(
          'Are you sure you want to delete "${account['account_name']}"?\nThis action cannot be undone.',
          style: GoogleFonts.poppins(color: AppColors.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text('Cancel', style: GoogleFonts.poppins(color: AppColors.textMuted)),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx); // Close dialog
              final success = await provider.deleteBankAccount(account['id']);
              if (success) {
                showTopSnackBar(context, SnackBar(
                  content: Text('Bank Account deleted successfully'),
                  backgroundColor: AppColors.statusGreen,
                ));
              } else {
                showTopSnackBar(context, SnackBar(
                  content: Text(provider.error ?? 'Failed to delete account'),
                  backgroundColor: AppColors.statusRed,
                ));
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.statusRed,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: Text('Delete', style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }
}

class _BankAccountCard extends StatelessWidget {
  final Map<String, dynamic> account;
  final FinanceProvider provider;
  const _BankAccountCard({required this.account, required this.provider});

  @override
  Widget build(BuildContext context) {
    final type = account['account_type'] ?? 'checking';
    final isCash = type == 'cash';
    final accentColor = isCash ? AppColors.statusGreen : AppColors.statusBlue;
    final isMobile = MediaQuery.of(context).size.width < 720;

    final Widget accountDetails = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(account['account_name'] ?? '',
            style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 15, fontWeight: FontWeight.w600)),
        Text(isCash ? 'Cash Account' : "${account['bank_name'] ?? 'Bank'} (${type.toString().toUpperCase()})",
            style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 12)),
      ],
    );

    final Widget iconContainer = Container(
      width: 50,
      height: 50,
      decoration: BoxDecoration(
        color: accentColor.withOpacity(0.12),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Icon(
        isCash ? Icons.payments_rounded : Icons.account_balance_rounded,
        color: accentColor,
        size: 24,
      ),
    );

    final Widget balanceWidget = Column(
      crossAxisAlignment: isMobile ? CrossAxisAlignment.start : CrossAxisAlignment.end,
      mainAxisSize: MainAxisSize.min,
      children: [
        if (!isMobile) ...[
          Text(_fmt(JsonUtils.parseDouble(account['balance'])),
              style: GoogleFonts.poppins(color: AppColors.accentAmber, fontSize: 16, fontWeight: FontWeight.w700)),
          Text('Balance', style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 11)),
        ] else
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Balance', style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 12)),
              Text(_fmt(JsonUtils.parseDouble(account['balance'])),
                  style: GoogleFonts.poppins(color: AppColors.accentAmber, fontSize: 16, fontWeight: FontWeight.w700)),
            ],
          ),
      ],
    );

    final Widget optionsButton = PopupMenuButton<String>(
      icon: Icon(Icons.more_vert_rounded, color: AppColors.textMuted, size: 20),
      onSelected: (value) {
        if (value == 'edit') {
          _BankingTab._showEditBankAccountSheet(context, provider, account);
        } else if (value == 'delete') {
          _BankingTab._showDeleteConfirmDialog(context, provider, account);
        }
      },
      itemBuilder: (context) => [
        PopupMenuItem(
          value: 'edit',
          child: Row(children: [
            Icon(Icons.edit_rounded, color: AppColors.accentAmber, size: 18),
            const SizedBox(width: 10),
            Text('Edit Details', style: GoogleFonts.poppins(color: AppColors.textPrimary)),
          ]),
        ),
        PopupMenuItem(
          value: 'delete',
          child: Row(children: [
            Icon(Icons.delete_rounded, color: AppColors.statusRed, size: 18),
            const SizedBox(width: 10),
            Text('Delete Account', style: GoogleFonts.poppins(color: AppColors.textPrimary)),
          ]),
        ),
      ],
    );

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.darkCard,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.darkBorder),
      ),
      child: isMobile
          ? Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    iconContainer,
                    const SizedBox(width: 14),
                    Expanded(child: accountDetails),
                    optionsButton,
                  ],
                ),
                const SizedBox(height: 12),
                Divider(height: 1, color: AppColors.darkBorder),
                const SizedBox(height: 12),
                balanceWidget,
              ],
            )
          : Row(
              children: [
                iconContainer,
                const SizedBox(width: 16),
                Expanded(child: accountDetails),
                balanceWidget,
                const SizedBox(width: 8),
                optionsButton,
              ],
            ),
    );
  }
}

// ─── Manage Categories Sheet ───
class _ManageCategoriesSheet extends StatefulWidget {
  const _ManageCategoriesSheet();

  @override
  State<_ManageCategoriesSheet> createState() => _ManageCategoriesSheetState();
}

class _ManageCategoriesSheetState extends State<_ManageCategoriesSheet> {
  final _nameCtrl = TextEditingController();
  final _editNameCtrl = TextEditingController();
  int? _editingCategoryId;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _editNameCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<FinanceProvider>();
    final categories = provider.expenseCategories;

    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.darkCard,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: const EdgeInsets.fromLTRB(24, 20, 24, 32),
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.7,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Manage Categories',
                  style: GoogleFonts.poppins(
                    color: AppColors.textPrimary,
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                IconButton(
                  icon: Icon(Icons.close, color: AppColors.textMuted),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Add new category form
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _nameCtrl,
                    style: TextStyle(color: AppColors.textPrimary),
                    decoration: const InputDecoration(
                      hintText: 'New category name...',
                      contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                ElevatedButton(
                  onPressed: () async {
                    final name = _nameCtrl.text.trim();
                    if (name.isEmpty) return;
                    final success = await provider.createExpenseCategory(name);
                    if (success) {
                      _nameCtrl.clear();
                      if (mounted) {
                        showTopSnackBar(context, SnackBar(
                          content: const Text('Category added successfully!'),
                          backgroundColor: AppColors.statusGreen,
                        ));
                      }
                    } else if (mounted) {
                      showTopSnackBar(context, SnackBar(
                        content: Text(provider.error ?? 'Failed to add category'),
                        backgroundColor: AppColors.statusRed,
                      ));
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.accentAmber,
                    foregroundColor: AppColors.textOnAmber,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  ),
                  child: Text(
                    'Add',
                    style: GoogleFonts.poppins(fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Categories list
            Expanded(
              child: categories.isEmpty
                  ? Center(
                      child: Text(
                        'No categories found.',
                        style: GoogleFonts.poppins(color: AppColors.textMuted),
                      ),
                    )
                  : ListView.separated(
                      itemCount: categories.length,
                      separatorBuilder: (_, __) => Divider(color: AppColors.darkBorder, height: 1),
                      itemBuilder: (context, idx) {
                        final cat = categories[idx];
                        final catId = JsonUtils.parseInt(cat['id']);
                        final isEditing = _editingCategoryId == catId;

                        return Padding(
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          child: Row(
                            children: [
                              Expanded(
                                child: isEditing
                                    ? TextField(
                                        controller: _editNameCtrl,
                                        style: TextStyle(color: AppColors.textPrimary),
                                        decoration: const InputDecoration(
                                          contentPadding: EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                                        ),
                                        autofocus: true,
                                      )
                                    : Text(
                                        cat['name'] ?? '',
                                        style: GoogleFonts.poppins(
                                          color: AppColors.textPrimary,
                                          fontSize: 14,
                                          fontWeight: FontWeight.w500,
                                        ),
                                      ),
                              ),
                              if (isEditing) ...[
                                IconButton(
                                  icon: const Icon(Icons.check_rounded, color: Colors.green),
                                  onPressed: () async {
                                    final name = _editNameCtrl.text.trim();
                                    if (name.isEmpty) return;
                                    final success = await provider.updateExpenseCategory(catId, name);
                                    if (success) {
                                      setState(() => _editingCategoryId = null);
                                      if (mounted) {
                                        showTopSnackBar(context, SnackBar(
                                          content: const Text('Category updated successfully!'),
                                          backgroundColor: AppColors.statusGreen,
                                        ));
                                      }
                                    } else if (mounted) {
                                      showTopSnackBar(context, SnackBar(
                                        content: Text(provider.error ?? 'Failed to update category'),
                                        backgroundColor: AppColors.statusRed,
                                      ));
                                    }
                                  },
                                ),
                                IconButton(
                                  icon: Icon(Icons.close_rounded, color: AppColors.textMuted),
                                  onPressed: () => setState(() => _editingCategoryId = null),
                                ),
                              ] else ...[
                                IconButton(
                                  icon: const Icon(Icons.edit_outlined, size: 20),
                                  onPressed: () {
                                    setState(() {
                                      _editingCategoryId = catId;
                                      _editNameCtrl.text = cat['name'] ?? '';
                                    });
                                  },
                                ),
                                IconButton(
                                  icon: Icon(Icons.delete_outline_rounded, color: AppColors.statusRed, size: 20),
                                  onPressed: () {
                                    showDialog(
                                      context: context,
                                      builder: (ctx) => AlertDialog(
                                        backgroundColor: AppColors.darkCard,
                                        title: Text('Delete Category', style: GoogleFonts.poppins(color: AppColors.textPrimary)),
                                        content: Text('Are you sure you want to delete "${cat['name']}"?', style: GoogleFonts.poppins(color: AppColors.textSecondary)),
                                        actions: [
                                          TextButton(
                                            onPressed: () => Navigator.pop(ctx),
                                            child: Text('Cancel', style: GoogleFonts.poppins(color: AppColors.textMuted)),
                                          ),
                                          TextButton(
                                            onPressed: () async {
                                              Navigator.pop(ctx);
                                              final success = await provider.deleteExpenseCategory(catId);
                                              if (success && mounted) {
                                                showTopSnackBar(context, SnackBar(
                                                  content: const Text('Category deleted successfully!'),
                                                  backgroundColor: AppColors.statusGreen,
                                                ));
                                              } else if (mounted) {
                                                showTopSnackBar(context, SnackBar(
                                                  content: Text(provider.error ?? 'Failed to delete category'),
                                                  backgroundColor: AppColors.statusRed,
                                                ));
                                              }
                                            },
                                            child: Text('Delete', style: GoogleFonts.poppins(color: AppColors.statusRed)),
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
      ),
    );
  }
}

class _SessionHistoryCard extends StatelessWidget {
  final Map<String, dynamic> session;

  const _SessionHistoryCard({Key? key, required this.session}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final int sessionId = JsonUtils.parseInt(session['id']);
    final double openBal = JsonUtils.parseDouble(session['opening_balance']);
    final double closedBal = JsonUtils.parseDouble(session['closing_balance']);
    final double expectedBal = JsonUtils.parseDouble(session['expected_balance']);
    final double discrepancy = JsonUtils.parseDouble(session['discrepancy']);
    final String status = session['status'] ?? 'closed';
    final bool isOpen = status == 'open';

    final openedAt = session['opened_at'] != null 
        ? session['opened_at'].toString().replaceAll('T', ' ').substring(0, 16)
        : '';
    final closedAt = session['closed_at'] != null 
        ? session['closed_at'].toString().replaceAll('T', ' ').substring(0, 16)
        : '';

    final closedByUser = session['closed_by'] ?? session['closedBy'];
    final closedByName = closedByUser != null ? closedByUser['name'] : 'Unknown';

    final notes = session['notes'];
    final closingNotes = session['closing_notes'];

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.darkCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.darkBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Session #$sessionId',
                style: GoogleFonts.poppins(
                  color: AppColors.textPrimary,
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: (isOpen ? AppColors.statusGreen : AppColors.textMuted).withOpacity(0.15),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  isOpen ? 'OPEN' : 'CLOSED',
                  style: GoogleFonts.poppins(
                    color: isOpen ? AppColors.statusGreen : AppColors.textMuted,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            isOpen ? 'Opened: $openedAt' : 'Period: $openedAt - ${closedAt.split(' ').last}',
            style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 11),
          ),
          Divider(color: AppColors.darkBorder, height: 20),
          Row(
            children: [
              Expanded(
                child: _MetricItem(
                  label: 'Opening',
                  value: openBal,
                  color: AppColors.textPrimary,
                ),
              ),
              Expanded(
                child: _MetricItem(
                  label: 'Expected',
                  value: expectedBal,
                  color: AppColors.textPrimary,
                ),
              ),
              Expanded(
                child: _MetricItem(
                  label: 'Closed',
                  value: closedBal,
                  color: AppColors.textPrimary,
                ),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Discrepancy',
                      style: GoogleFonts.poppins(
                        color: AppColors.textSecondary,
                        fontSize: 11,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        if (discrepancy != 0.0)
                          Icon(
                            discrepancy > 0.0 ? Icons.trending_up_rounded : Icons.trending_down_rounded,
                            size: 14,
                            color: discrepancy > 0.0 ? AppColors.statusGreen : AppColors.statusRed,
                          ),
                        if (discrepancy != 0.0) const SizedBox(width: 2),
                        Text(
                          (discrepancy >= 0.0 ? '+' : '') + _fmt(discrepancy),
                          style: GoogleFonts.poppins(
                            color: discrepancy == 0.0
                                ? AppColors.textSecondary
                                : discrepancy > 0.0
                                    ? AppColors.statusGreen
                                    : AppColors.statusRed,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          if ((notes != null && notes.toString().isNotEmpty) || 
              (closingNotes != null && closingNotes.toString().isNotEmpty)) ...[
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(10),
              width: double.infinity,
              decoration: BoxDecoration(
                color: AppColors.darkSurface,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (notes != null && notes.toString().isNotEmpty)
                    Text(
                      'Opening Notes: "$notes"',
                      style: GoogleFonts.poppins(
                        color: AppColors.textMuted,
                        fontSize: 11,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                  if (notes != null && notes.toString().isNotEmpty && 
                      closingNotes != null && closingNotes.toString().isNotEmpty)
                    const SizedBox(height: 4),
                  if (closingNotes != null && closingNotes.toString().isNotEmpty)
                    Text(
                      'Closing Notes: "$closingNotes"',
                      style: GoogleFonts.poppins(
                        color: AppColors.textMuted,
                        fontSize: 11,
                        fontStyle: FontStyle.italic,
                      ),
                    ),
                ],
              ),
            ),
          ],
          if (!isOpen) ...[
            const SizedBox(height: 8),
            Align(
              alignment: Alignment.centerRight,
              child: Text(
                'Closed by: $closedByName',
                style: GoogleFonts.poppins(
                  color: AppColors.textMuted,
                  fontSize: 10,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _MetricItem extends StatelessWidget {
  final String label;
  final double value;
  final Color color;

  const _MetricItem({
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GoogleFonts.poppins(
            color: AppColors.textSecondary,
            fontSize: 11,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          _fmt(value),
          style: GoogleFonts.poppins(
            color: color,
            fontSize: 12,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }
}
