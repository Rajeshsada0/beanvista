import 'package:icafe_app/core/utils/snackbar_helper.dart';
import 'package:icafe_app/core/constants/app_constants.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/json_utils.dart';
import '../../providers/finance_provider.dart';

final _currencyFmt = NumberFormat('#,##0.00', 'en_IN');
String _fmt(double v) => '${AppConstants.currencySymbol} ${_currencyFmt.format(v)}';

// ─── HELPER FOR DATE RANGE PICKING ───
Future<void> selectDateRange(BuildContext context, FinanceProvider provider) async {
  final picked = await showDateRangePicker(
    context: context,
    initialDateRange: DateTimeRange(start: provider.startDate, end: provider.endDate),
    firstDate: DateTime(DateTime.now().year - 3),
    lastDate: DateTime(DateTime.now().year + 1),
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
    provider.setDateRange(picked.start, picked.end);
  }
}

// ─── 1. PROFIT & LOSS DETAIL SCREEN ───
class ProfitLossDetailScreen extends StatefulWidget {
  const ProfitLossDetailScreen({super.key});

  @override
  State<ProfitLossDetailScreen> createState() => _ProfitLossDetailScreenState();
}

class _ProfitLossDetailScreenState extends State<ProfitLossDetailScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<FinanceProvider>().fetchProfitLoss();
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<FinanceProvider>();
    final pl = provider.profitLoss;
    final rev = JsonUtils.parseDouble(pl['revenue']);
    final exp = JsonUtils.parseDouble(pl['expensesTotal']);
    final gross = JsonUtils.parseDouble(pl['grossProfit']);
    final net = JsonUtils.parseDouble(pl['netProfit']);
    final catList = pl['expensesByCategory'] as List? ?? [];

    return Scaffold(
      backgroundColor: AppColors.darkBg,
      appBar: AppBar(
        backgroundColor: AppColors.darkSurface,
        title: Text('Profit & Loss Statement', style: GoogleFonts.poppins(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 16)),
        actions: [
          IconButton(
            icon: Icon(Icons.calendar_month_rounded, color: AppColors.accentAmber),
            onPressed: () async {
              await selectDateRange(context, provider);
              provider.fetchProfitLoss();
            },
          ),
        ],
      ),
      body: provider.isLoading
          ? Center(child: CircularProgressIndicator(color: AppColors.accentAmber))
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
                  decoration: BoxDecoration(color: AppColors.darkCard, borderRadius: BorderRadius.circular(12)),
                  child: Center(
                    child: Text(
                      'Period: ${provider.startDateStr} to ${provider.endDateStr}',
                      style: GoogleFonts.poppins(color: AppColors.textSecondary, fontSize: 12),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                _buildMetricCard('Operating Revenue', rev, AppColors.statusGreen),
                const SizedBox(height: 12),
                _buildMetricCard('Gross Profit', gross, AppColors.statusGreen),
                const SizedBox(height: 12),
                _buildMetricCard('Total Expenses', exp, AppColors.statusRed),
                const SizedBox(height: 12),
                _buildMetricCard('Net Profit / Loss', net, net >= 0 ? AppColors.accentAmber : AppColors.statusRed),
                const SizedBox(height: 24),
                Text('Expenses by Category', style: GoogleFonts.poppins(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 15)),
                const SizedBox(height: 12),
                if (catList.isEmpty)
                  Center(child: Padding(padding: const EdgeInsets.all(20), child: Text('No expense transactions recorded in this period.', style: GoogleFonts.poppins(color: AppColors.textMuted))))
                else
                  ...catList.map((c) {
                    final name = c['name'] ?? 'Uncategorized';
                    final amt = JsonUtils.parseDouble(c['total']);
                    return Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(color: AppColors.darkCard, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.darkBorder)),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(name, style: GoogleFonts.poppins(color: AppColors.textSecondary, fontSize: 13)),
                          Text(_fmt(amt), style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    );
                  }),
              ],
            ),
    );
  }

  Widget _buildMetricCard(String title, double value, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.darkCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.darkBorder),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(title, style: GoogleFonts.poppins(color: AppColors.textPrimary, fontWeight: FontWeight.w600, fontSize: 14)),
          Text(_fmt(value), style: GoogleFonts.poppins(color: color, fontWeight: FontWeight.bold, fontSize: 15)),
        ],
      ),
    );
  }
}

// ─── 2. BALANCE SHEET SCREEN ───
class BalanceSheetScreen extends StatefulWidget {
  const BalanceSheetScreen({super.key});

  @override
  State<BalanceSheetScreen> createState() => _BalanceSheetScreenState();
}

class _BalanceSheetScreenState extends State<BalanceSheetScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<FinanceProvider>().fetchBalanceSheet();
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<FinanceProvider>();
    final bs = provider.balanceSheet;
    final assets = bs['assets'] as List? ?? [];
    final liabilities = bs['liabilities'] as List? ?? [];
    final equity = bs['equity'] as List? ?? [];
    final retained = JsonUtils.parseDouble(bs['retainedEarnings']);

    final totalAssets = assets.map((a) => JsonUtils.parseDouble(a['balance'])).fold(0.0, (prev, val) => prev + val);
    final totalLiabilities = liabilities.map((a) => JsonUtils.parseDouble(a['balance'])).fold(0.0, (prev, val) => prev + val);
    final totalEquity = equity.map((a) => JsonUtils.parseDouble(a['balance'])).fold(0.0, (prev, val) => prev + val) + retained;

    return Scaffold(
      backgroundColor: AppColors.darkBg,
      appBar: AppBar(
        backgroundColor: AppColors.darkSurface,
        title: Text('Balance Sheet', style: GoogleFonts.poppins(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 16)),
        actions: [
          IconButton(
            icon: Icon(Icons.calendar_month_rounded, color: AppColors.accentAmber),
            onPressed: () async {
              await selectDateRange(context, provider);
              provider.fetchBalanceSheet();
            },
          ),
        ],
      ),
      body: provider.isLoading
          ? Center(child: CircularProgressIndicator(color: AppColors.accentAmber))
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
                  decoration: BoxDecoration(color: AppColors.darkCard, borderRadius: BorderRadius.circular(12)),
                  child: Center(
                    child: Text('As of Date: ${provider.endDateStr}', style: GoogleFonts.poppins(color: AppColors.textSecondary, fontSize: 12)),
                  ),
                ),
                const SizedBox(height: 20),
                _buildSection('Assets', assets, totalAssets, AppColors.statusGreen),
                const SizedBox(height: 20),
                _buildSection('Liabilities', liabilities, totalLiabilities, AppColors.statusRed),
                const SizedBox(height: 20),
                _buildEquitySection(equity, retained, totalEquity),
              ],
            ),
    );
  }

  Widget _buildSection(String title, List items, double total, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: GoogleFonts.poppins(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 15)),
        const SizedBox(height: 8),
        if (items.isEmpty)
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: AppColors.darkCard, borderRadius: BorderRadius.circular(12)),
            child: Center(child: Text('No balances found', style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 13))),
          )
        else
          ...items.map((i) => _buildRow(i['name'] ?? '', JsonUtils.parseDouble(i['balance']))),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(color: AppColors.darkCard, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.darkBorder)),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Total $title', style: GoogleFonts.poppins(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 13)),
              Text(_fmt(total), style: GoogleFonts.poppins(color: color, fontWeight: FontWeight.w900, fontSize: 13)),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildEquitySection(List items, double retained, double total) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Equity', style: GoogleFonts.poppins(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 15)),
        const SizedBox(height: 8),
        ...items.map((i) => _buildRow(i['name'] ?? '', JsonUtils.parseDouble(i['balance']))),
        _buildRow('Retained Earnings', retained),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(color: AppColors.darkCard, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.darkBorder)),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Total Equity', style: GoogleFonts.poppins(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 13)),
              Text(_fmt(total), style: GoogleFonts.poppins(color: AppColors.accentAmber, fontWeight: FontWeight.w900, fontSize: 13)),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildRow(String name, double val) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(name, style: GoogleFonts.poppins(color: AppColors.textSecondary, fontSize: 13)),
          Text(_fmt(val), style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }
}

// ─── 3. TRIAL BALANCE SCREEN ───
class TrialBalanceScreen extends StatefulWidget {
  const TrialBalanceScreen({super.key});

  @override
  State<TrialBalanceScreen> createState() => _TrialBalanceScreenState();
}

class _TrialBalanceScreenState extends State<TrialBalanceScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<FinanceProvider>().fetchTrialBalance();
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<FinanceProvider>();
    final tb = provider.trialBalance;
    final accounts = tb['accounts'] as List? ?? [];
    final totalDeb = JsonUtils.parseDouble(tb['totalDebit']);
    final totalCred = JsonUtils.parseDouble(tb['totalCredit']);

    return Scaffold(
      backgroundColor: AppColors.darkBg,
      appBar: AppBar(
        backgroundColor: AppColors.darkSurface,
        title: Text('Trial Balance', style: GoogleFonts.poppins(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 16)),
        actions: [
          IconButton(
            icon: Icon(Icons.calendar_month_rounded, color: AppColors.accentAmber),
            onPressed: () async {
              await selectDateRange(context, provider);
              provider.fetchTrialBalance();
            },
          ),
        ],
      ),
      body: provider.isLoading
          ? Center(child: CircularProgressIndicator(color: AppColors.accentAmber))
          : Column(
              children: [
                Container(
                  margin: const EdgeInsets.all(16),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: AppColors.darkCard, borderRadius: BorderRadius.circular(12)),
                  child: Center(
                    child: Text('Period: ${provider.startDateStr} to ${provider.endDateStr}', style: GoogleFonts.poppins(color: AppColors.textSecondary, fontSize: 12)),
                  ),
                ),
                Expanded(
                  child: accounts.isEmpty
                      ? Center(child: Text('No trial balance entries logged.', style: GoogleFonts.poppins(color: AppColors.textMuted)))
                      : ListView(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          children: [
                            // Header Row
                            _buildListRow('Account', 'Debit', 'Credit', isHeader: true),
                            Divider(color: AppColors.darkBorder),
                            ...accounts.map((a) {
                              final name = "${a['code']} - ${a['name']}";
                              final deb = JsonUtils.parseDouble(a['debit']);
                              final cred = JsonUtils.parseDouble(a['credit']);
                              return _buildListRow(name, deb > 0 ? _fmt(deb) : '-', cred > 0 ? _fmt(cred) : '-');
                            }),
                            Divider(color: AppColors.darkBorder),
                            _buildListRow('Total', _fmt(totalDeb), _fmt(totalCred), isHeader: true),
                          ],
                        ),
                ),
              ],
            ),
    );
  }

  Widget _buildListRow(String c1, String c2, String c3, {bool isHeader = false}) {
    final style = GoogleFonts.poppins(
      color: isHeader ? AppColors.textPrimary : AppColors.textSecondary,
      fontWeight: isHeader ? FontWeight.bold : FontWeight.normal,
      fontSize: 12,
    );
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
      child: Row(
        children: [
          Expanded(flex: 3, child: Text(c1, style: style)),
          Expanded(flex: 2, child: Text(c2, style: style, textAlign: TextAlign.right)),
          Expanded(flex: 2, child: Text(c3, style: style, textAlign: TextAlign.right)),
        ],
      ),
    );
  }
}

// ─── 4. CASH FLOW SCREEN ───
class CashFlowScreen extends StatefulWidget {
  const CashFlowScreen({super.key});

  @override
  State<CashFlowScreen> createState() => _CashFlowScreenState();
}

class _CashFlowScreenState extends State<CashFlowScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<FinanceProvider>().fetchCashFlow();
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<FinanceProvider>();
    final cf = provider.cashFlow;
    final operating = cf['operatingActivities'] as List? ?? [];
    final investing = cf['investingActivities'] as List? ?? [];
    final financing = cf['financingActivities'] as List? ?? [];
    final netFlow = JsonUtils.parseDouble(cf['netCashFlow']);

    return Scaffold(
      backgroundColor: AppColors.darkBg,
      appBar: AppBar(
        backgroundColor: AppColors.darkSurface,
        title: Text('Cash Flow Statement', style: GoogleFonts.poppins(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 16)),
        actions: [
          IconButton(
            icon: Icon(Icons.calendar_month_rounded, color: AppColors.accentAmber),
            onPressed: () async {
              await selectDateRange(context, provider);
              provider.fetchCashFlow();
            },
          ),
        ],
      ),
      body: provider.isLoading
          ? Center(child: CircularProgressIndicator(color: AppColors.accentAmber))
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
                  decoration: BoxDecoration(color: AppColors.darkCard, borderRadius: BorderRadius.circular(12)),
                  child: Center(
                    child: Text('Period: ${provider.startDateStr} to ${provider.endDateStr}', style: GoogleFonts.poppins(color: AppColors.textSecondary, fontSize: 12)),
                  ),
                ),
                const SizedBox(height: 20),
                _buildCategory('Operating Activities', operating, AppColors.statusGreen),
                const SizedBox(height: 20),
                _buildCategory('Investing Activities', investing, AppColors.statusBlue),
                const SizedBox(height: 20),
                _buildCategory('Financing Activities', financing, AppColors.statusPurple),
                const SizedBox(height: 24),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(color: AppColors.darkCard, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.darkBorder)),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Net Cash Flow Increase/Decrease', style: GoogleFonts.poppins(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 13)),
                      Text(_fmt(netFlow), style: GoogleFonts.poppins(color: netFlow >= 0 ? AppColors.statusGreen : AppColors.statusRed, fontWeight: FontWeight.w900, fontSize: 14)),
                    ],
                  ),
                ),
              ],
            ),
    );
  }

  Widget _buildCategory(String title, List items, Color color) {
    final subTotal = items.map((i) => JsonUtils.parseDouble(i['amount'])).fold(0.0, (prev, val) => prev + val);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: GoogleFonts.poppins(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 14)),
        const SizedBox(height: 8),
        if (items.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 12),
            child: Text('No activities recorded', style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 12)),
          )
        else
          ...items.map((i) {
            final desc = i['description'] ?? '';
            final amt = JsonUtils.parseDouble(i['amount']);
            return Padding(
              padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 12),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(desc, style: GoogleFonts.poppins(color: AppColors.textSecondary, fontSize: 13)),
                  Text(_fmt(amt), style: GoogleFonts.poppins(color: amt >= 0 ? AppColors.statusGreen : AppColors.statusRed, fontSize: 13)),
                ],
              ),
            );
          }),
        const SizedBox(height: 6),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Subtotal $title', style: GoogleFonts.poppins(color: AppColors.textPrimary, fontWeight: FontWeight.w600, fontSize: 12)),
              Text(_fmt(subTotal), style: GoogleFonts.poppins(color: color, fontWeight: FontWeight.bold, fontSize: 12)),
            ],
          ),
        ),
        Divider(color: AppColors.darkBorder),
      ],
    );
  }
}

// ─── 5. GENERAL LEDGER SCREEN ───
class GeneralLedgerScreen extends StatefulWidget {
  const GeneralLedgerScreen({super.key});

  @override
  State<GeneralLedgerScreen> createState() => _GeneralLedgerScreenState();
}

class _GeneralLedgerScreenState extends State<GeneralLedgerScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<FinanceProvider>().fetchGeneralLedger();
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<FinanceProvider>();
    final accounts = provider.generalLedger;

    return Scaffold(
      backgroundColor: AppColors.darkBg,
      appBar: AppBar(
        backgroundColor: AppColors.darkSurface,
        title: Text('General Ledger', style: GoogleFonts.poppins(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 16)),
        actions: [
          IconButton(
            icon: Icon(Icons.calendar_month_rounded, color: AppColors.accentAmber),
            onPressed: () async {
              await selectDateRange(context, provider);
              provider.fetchGeneralLedger();
            },
          ),
        ],
      ),
      body: provider.isLoading
          ? Center(child: CircularProgressIndicator(color: AppColors.accentAmber))
          : Column(
              children: [
                Container(
                  margin: const EdgeInsets.all(16),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: AppColors.darkCard, borderRadius: BorderRadius.circular(12)),
                  child: Center(
                    child: Text('Period: ${provider.startDateStr} to ${provider.endDateStr}', style: GoogleFonts.poppins(color: AppColors.textSecondary, fontSize: 12)),
                  ),
                ),
                Expanded(
                  child: accounts.isEmpty
                      ? Center(child: Text('No ledger entries recorded.', style: GoogleFonts.poppins(color: AppColors.textMuted)))
                      : ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: accounts.length,
                          itemBuilder: (ctx, idx) {
                            final act = accounts[idx];
                            final name = "${act['code']} - ${act['name']}";
                            final lines = act['lines'] as List? ?? [];
                            final endBal = JsonUtils.parseDouble(act['ending_balance']);

                            return Container(
                              margin: const EdgeInsets.only(bottom: 16),
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: AppColors.darkCard,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(color: AppColors.darkBorder),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(name, style: GoogleFonts.poppins(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 14)),
                                  Divider(color: AppColors.darkBorder),
                                  ...lines.map((l) {
                                    final date = l['date'] ?? '';
                                    final desc = l['description'] ?? '';
                                    final deb = JsonUtils.parseDouble(l['debit']);
                                    final cred = JsonUtils.parseDouble(l['credit']);
                                    final bal = JsonUtils.parseDouble(l['balance']);
                                    return Padding(
                                      padding: const EdgeInsets.symmetric(vertical: 4),
                                      child: Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Text(desc, style: GoogleFonts.poppins(color: AppColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w500)),
                                                Text(date, style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 10)),
                                              ],
                                            ),
                                          ),
                                          Column(
                                            crossAxisAlignment: CrossAxisAlignment.end,
                                            children: [
                                              if (deb > 0) Text("Dr. ${_fmt(deb)}", style: GoogleFonts.poppins(color: AppColors.statusGreen, fontSize: 11)),
                                              if (cred > 0) Text("Cr. ${_fmt(cred)}", style: GoogleFonts.poppins(color: AppColors.statusRed, fontSize: 11)),
                                              Text("Bal: ${_fmt(bal)}", style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 11, fontWeight: FontWeight.bold)),
                                            ],
                                          ),
                                        ],
                                      ),
                                    );
                                  }),
                                  Divider(color: AppColors.darkBorder),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text('Ending Balance', style: GoogleFonts.poppins(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 12)),
                                      Text(_fmt(endBal), style: GoogleFonts.poppins(color: AppColors.accentAmber, fontWeight: FontWeight.bold, fontSize: 13)),
                                    ],
                                  ),
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

// ─── 6. CHART OF ACCOUNTS SCREEN ───
class ChartOfAccountsScreen extends StatefulWidget {
  const ChartOfAccountsScreen({super.key});

  @override
  State<ChartOfAccountsScreen> createState() => _ChartOfAccountsScreenState();
}

class _ChartOfAccountsScreenState extends State<ChartOfAccountsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<FinanceProvider>().fetchChartOfAccounts();
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<FinanceProvider>();
    final accounts = provider.accounts;

    return Scaffold(
      backgroundColor: AppColors.darkBg,
      appBar: AppBar(
        backgroundColor: AppColors.darkSurface,
        title: Text('Chart of Accounts', style: GoogleFonts.poppins(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 16)),
      ),
      body: provider.isLoading
          ? Center(child: CircularProgressIndicator(color: AppColors.accentAmber))
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: accounts.length,
              itemBuilder: (ctx, idx) {
                final a = accounts[idx];
                final code = a['code'] ?? '';
                final name = a['name'] ?? '';
                final type = a['type'] ?? '';
                final desc = a['description'] ?? '';

                return Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.darkCard,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.darkBorder),
                  ),
                  child: Row(
                    children: [
                      Container(
                        width: 50,
                        padding: const EdgeInsets.symmetric(vertical: 6),
                        decoration: BoxDecoration(color: AppColors.accentAmber.withOpacity(0.12), borderRadius: BorderRadius.circular(8)),
                        child: Center(
                          child: Text(code, style: GoogleFonts.poppins(color: AppColors.accentAmber, fontWeight: FontWeight.bold, fontSize: 12)),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(name, style: GoogleFonts.poppins(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 13)),
                            if (desc.isNotEmpty) Text(desc, style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 11)),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppColors.darkSurface,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(type.toUpperCase(), style: GoogleFonts.poppins(color: AppColors.textSecondary, fontSize: 9, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                );
              },
            ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showAddAccountSheet(),
        backgroundColor: AppColors.accentAmber,
        foregroundColor: Colors.white,
        shape: const StadiumBorder(),
        icon: const Icon(Icons.add_rounded),
        label: Text('Add Account', style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
      ),
    );
  }

  void _showAddAccountSheet() {
    final provider = context.read<FinanceProvider>();
    final nameCtrl = TextEditingController();
    final codeCtrl = TextEditingController();
    final descCtrl = TextEditingController();
    String type = 'asset';

    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.darkCard,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Padding(
          padding: EdgeInsets.only(left: 24, right: 24, top: 24, bottom: MediaQuery.of(ctx).viewInsets.bottom + 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Add New Financial Account', style: GoogleFonts.poppins(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 16)),
              const SizedBox(height: 16),
              TextField(
                controller: codeCtrl,
                keyboardType: TextInputType.number,
                style: GoogleFonts.poppins(color: AppColors.textPrimary),
                decoration: InputDecoration(
                  labelText: 'Account Code',
                  prefixIcon: const Icon(Icons.pin_outlined),
                  filled: true,
                  fillColor: AppColors.darkSurface,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: nameCtrl,
                style: GoogleFonts.poppins(color: AppColors.textPrimary),
                decoration: InputDecoration(
                  labelText: 'Account Name',
                  prefixIcon: const Icon(Icons.abc_rounded),
                  filled: true,
                  fillColor: AppColors.darkSurface,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
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
                items: ['asset', 'liability', 'equity', 'revenue', 'expense']
                    .map((t) => DropdownMenuItem(value: t, child: Text(t.toUpperCase(), style: GoogleFonts.poppins(color: AppColors.textPrimary))))
                    .toList(),
                onChanged: (v) {
                  if (v != null) setModalState(() => type = v);
                },
              ),
              const SizedBox(height: 12),
              TextField(
                controller: descCtrl,
                style: GoogleFonts.poppins(color: AppColors.textPrimary),
                decoration: InputDecoration(
                  labelText: 'Description (optional)',
                  prefixIcon: const Icon(Icons.description_outlined),
                  filled: true,
                  fillColor: AppColors.darkSurface,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: () async {
                    if (codeCtrl.text.trim().isEmpty || nameCtrl.text.trim().isEmpty) {
                      showTopSnackBar(context, SnackBar(content: Text('Please fill all required fields'), backgroundColor: AppColors.statusRed));
                      return;
                    }
                    final success = await provider.createAccount({
                      'code': codeCtrl.text.trim(),
                      'name': nameCtrl.text.trim(),
                      'type': type,
                      'description': descCtrl.text.trim(),
                    });
                    if (success && mounted) {
                      Navigator.pop(ctx);
                      showTopSnackBar(context, SnackBar(content: Text('Account added successfully'), backgroundColor: AppColors.statusGreen));
                    } else if (mounted) {
                      showTopSnackBar(context, SnackBar(content: Text(provider.error ?? 'Failed to add account'), backgroundColor: AppColors.statusRed));
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.accentAmber,
                    foregroundColor: AppColors.textOnAmber,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: Text('Create Account', style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── 7. JOURNAL ENTRIES SCREEN ───
class JournalEntriesScreen extends StatefulWidget {
  const JournalEntriesScreen({super.key});

  @override
  State<JournalEntriesScreen> createState() => _JournalEntriesScreenState();
}

class _JournalEntriesScreenState extends State<JournalEntriesScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<FinanceProvider>().fetchJournalEntries();
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<FinanceProvider>();
    final entries = provider.journalEntries;

    return Scaffold(
      backgroundColor: AppColors.darkBg,
      appBar: AppBar(
        backgroundColor: AppColors.darkSurface,
        title: Text('Journal Entries', style: GoogleFonts.poppins(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 16)),
      ),
      body: provider.isLoading
          ? Center(child: CircularProgressIndicator(color: AppColors.accentAmber))
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: entries.length,
              itemBuilder: (ctx, idx) {
                final e = entries[idx];
                final date = e['date'] ?? '';
                final ref = e['reference'] ?? '';
                final desc = e['description'] ?? '';
                final lines = e['lines'] as List? ?? [];

                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(14),
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
                          Text(date, style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 11)),
                          if (ref.toString().isNotEmpty)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(color: AppColors.darkSurface, borderRadius: BorderRadius.circular(8)),
                              child: Text('Ref: $ref', style: GoogleFonts.poppins(color: AppColors.textSecondary, fontSize: 10)),
                            ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(desc, style: GoogleFonts.poppins(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 13)),
                      Divider(color: AppColors.darkBorder),
                      ...lines.map((l) {
                        final accountName = l['account']?['name'] ?? '';
                        final dVal = JsonUtils.parseDouble(l['debit']);
                        final cVal = JsonUtils.parseDouble(l['credit']);

                        return Padding(
                          padding: const EdgeInsets.symmetric(vertical: 3),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(accountName, style: GoogleFonts.poppins(color: AppColors.textSecondary, fontSize: 12)),
                              Text(
                                dVal > 0 ? "Dr. ${_fmt(dVal)}" : "Cr. ${_fmt(cVal)}",
                                style: GoogleFonts.poppins(color: dVal > 0 ? AppColors.statusGreen : AppColors.statusRed, fontSize: 12, fontWeight: FontWeight.w500),
                              ),
                            ],
                          ),
                        );
                      }),
                    ],
                  ),
                );
              },
            ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showAddEntrySheet(),
        backgroundColor: AppColors.accentAmber,
        foregroundColor: Colors.white,
        shape: const StadiumBorder(),
        icon: const Icon(Icons.add_rounded),
        label: Text('New Entry', style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
      ),
    );
  }

  void _showAddEntrySheet() {
    final provider = context.read<FinanceProvider>();
    final descCtrl = TextEditingController();
    final refCtrl = TextEditingController();
    DateTime date = DateTime.now();

    List<Map<String, dynamic>> lines = [
      {'account_id': null, 'description': '', 'debit': 0.0, 'credit': 0.0},
      {'account_id': null, 'description': '', 'debit': 0.0, 'credit': 0.0},
    ];

    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.darkCard,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) {
          final totalDeb = lines.map((l) => l['debit'] as double).fold(0.0, (prev, val) => prev + val);
          final totalCred = lines.map((l) => l['credit'] as double).fold(0.0, (prev, val) => prev + val);
          final balanced = (totalDeb - totalCred).abs() < 0.01;

          return Padding(
            padding: EdgeInsets.only(left: 24, right: 24, top: 24, bottom: MediaQuery.of(ctx).viewInsets.bottom + 24),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('New Journal Entry', style: GoogleFonts.poppins(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 16)),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: InkWell(
                          onTap: () async {
                            final picked = await showDatePicker(context: context, initialDate: date, firstDate: DateTime(2025), lastDate: DateTime(2028));
                            if (picked != null) setModalState(() => date = picked);
                          },
                          child: InputDecorator(
                            decoration: InputDecoration(labelText: 'Date', border: OutlineInputBorder(borderRadius: BorderRadius.circular(12))),
                            child: Text("${date.day}/${date.month}/${date.year}", style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13)),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextField(
                          controller: refCtrl,
                          style: GoogleFonts.poppins(color: AppColors.textPrimary),
                          decoration: InputDecoration(labelText: 'Reference #', border: OutlineInputBorder(borderRadius: BorderRadius.circular(12))),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: descCtrl,
                    style: GoogleFonts.poppins(color: AppColors.textPrimary),
                    decoration: InputDecoration(labelText: 'Overall Description', border: OutlineInputBorder(borderRadius: BorderRadius.circular(12))),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Entry Lines', style: GoogleFonts.poppins(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 14)),
                      TextButton.icon(
                        icon: Icon(Icons.add_circle_outline, size: 16, color: AppColors.accentAmber),
                        label: Text('Add Line', style: GoogleFonts.poppins(color: AppColors.accentAmber, fontSize: 12)),
                        onPressed: () => setModalState(() => lines.add({'account_id': null, 'description': '', 'debit': 0.0, 'credit': 0.0})),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),

                  ...List.generate(lines.length, (idx) {
                    final line = lines[idx];
                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(color: AppColors.darkSurface, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.darkBorder)),
                      child: Column(
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: DropdownButtonFormField<int>(
                                  value: line['account_id'],
                                  dropdownColor: AppColors.darkCard,
                                  decoration: const InputDecoration(labelText: 'Account', isDense: true),
                                  style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 12),
                                  items: provider.accounts.map((a) {
                                    return DropdownMenuItem<int>(
                                      value: JsonUtils.parseInt(a['id']),
                                      child: Text("${a['code']} - ${a['name']}", style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 11)),
                                    );
                                  }).toList(),
                                  onChanged: (v) => setModalState(() => line['account_id'] = v),
                                ),
                              ),
                              if (lines.length > 2)
                                IconButton(
                                  icon: Icon(Icons.delete_outline, color: AppColors.statusRed, size: 18),
                                  onPressed: () => setModalState(() => lines.removeAt(idx)),
                                ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Expanded(
                                child: TextFormField(
                                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                  style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 12),
                                  decoration: const InputDecoration(labelText: 'Debit Amount', isDense: true),
                                  onChanged: (v) {
                                    final val = double.tryParse(v) ?? 0.0;
                                    setModalState(() {
                                      line['debit'] = val;
                                      if (val > 0) line['credit'] = 0.0;
                                    });
                                  },
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: TextFormField(
                                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                  style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 12),
                                  decoration: const InputDecoration(labelText: 'Credit Amount', isDense: true),
                                  onChanged: (v) {
                                    final val = double.tryParse(v) ?? 0.0;
                                    setModalState(() {
                                      line['credit'] = val;
                                      if (val > 0) line['debit'] = 0.0;
                                    });
                                  },
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    );
                  }),

                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text("Debits: ${_fmt(totalDeb)}", style: GoogleFonts.poppins(color: AppColors.statusGreen, fontSize: 12, fontWeight: FontWeight.bold)),
                      Text("Credits: ${_fmt(totalCred)}", style: GoogleFonts.poppins(color: AppColors.statusRed, fontSize: 12, fontWeight: FontWeight.bold)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  if (!balanced)
                    Text("Warning: Debits and Credits must balance!", style: GoogleFonts.poppins(color: AppColors.statusRed, fontSize: 11, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 16),

                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: (!balanced || descCtrl.text.trim().isEmpty) ? null : () async {
                        final payload = {
                          'date': "${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}",
                          'reference': refCtrl.text.trim(),
                          'description': descCtrl.text.trim(),
                          'lines': lines,
                        };

                        final success = await provider.createJournalEntry(payload);
                        if (success && mounted) {
                          Navigator.pop(ctx);
                          showTopSnackBar(context, SnackBar(content: Text('Journal Entry created successfully'), backgroundColor: AppColors.statusGreen));
                        } else if (mounted) {
                          showTopSnackBar(context, SnackBar(content: Text(provider.error ?? 'Failed to log journal entry'), backgroundColor: AppColors.statusRed));
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.accentAmber,
                        foregroundColor: AppColors.textOnAmber,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      child: Text('Post Journal Entry', style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

// ─── 8. SUPPLIER BILLS SCREEN ───
class SupplierBillsScreen extends StatefulWidget {
  const SupplierBillsScreen({super.key});

  @override
  State<SupplierBillsScreen> createState() => _SupplierBillsScreenState();
}

class _SupplierBillsScreenState extends State<SupplierBillsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<FinanceProvider>().fetchSupplierBills();
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<FinanceProvider>();
    final bills = provider.supplierBills;

    return Scaffold(
      backgroundColor: AppColors.darkBg,
      appBar: AppBar(
        backgroundColor: AppColors.darkSurface,
        title: Text('Supplier Bills', style: GoogleFonts.poppins(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 16)),
      ),
      body: provider.isLoading
          ? Center(child: CircularProgressIndicator(color: AppColors.accentAmber))
          : bills.isEmpty
              ? _buildEmptyState(
                  icon: Icons.receipt_long_rounded,
                  title: 'No bills recorded yet',
                  subtitle: 'Tap the button below to log your first supplier bill.',
                )
              : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: bills.length,
              itemBuilder: (ctx, idx) {
                final b = bills[idx];
                final id = JsonUtils.parseInt(b['id']);
                final billNum = b['bill_number'] ?? '';
                final supplierName = b['supplier']?['name'] ?? 'Supplier';
                final total = JsonUtils.parseDouble(b['total_amount']);
                final paid = JsonUtils.parseDouble(b['paid_amount']);
                final status = b['status'] ?? 'unpaid';
                final dueDate = b['due_date'] ?? '';

                Color statusColor = AppColors.statusRed;
                if (status == 'paid') statusColor = AppColors.statusGreen;
                if (status == 'partial') statusColor = AppColors.accentAmber;

                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.darkCard,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.darkBorder),
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(supplierName, style: GoogleFonts.poppins(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 14)),
                              Text("Bill #: $billNum | Due: $dueDate", style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 11)),
                            ],
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(color: statusColor.withOpacity(0.12), borderRadius: BorderRadius.circular(20), border: Border.all(color: statusColor.withOpacity(0.3))),
                            child: Text(status.toUpperCase(), style: GoogleFonts.poppins(color: statusColor, fontSize: 9, fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                      Divider(color: AppColors.darkBorder),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text("Total: ${_fmt(total)}", style: GoogleFonts.poppins(color: AppColors.textSecondary, fontSize: 12)),
                          Text("Paid: ${_fmt(paid)}", style: GoogleFonts.poppins(color: AppColors.textSecondary, fontSize: 12)),
                        ],
                      ),
                      if (status != 'paid') ...[
                        const SizedBox(height: 12),
                        SizedBox(
                          width: double.infinity,
                          height: 40,
                          child: ElevatedButton.icon(
                            icon: const Icon(Icons.payment_rounded, size: 16),
                            label: Text('Record Payment', style: GoogleFonts.poppins(fontSize: 13, fontWeight: FontWeight.bold)),
                            onPressed: () => _showRecordPaymentSheet(id, total - paid),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.accentAmber.withOpacity(0.12),
                              foregroundColor: AppColors.accentAmber,
                              elevation: 0,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                );
              },
            ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showAddBillSheet(),
        backgroundColor: AppColors.accentAmber,
        foregroundColor: Colors.white,
        shape: const StadiumBorder(),
        icon: const Icon(Icons.add_rounded),
        label: Text('Log Bill', style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
      ),
    );
  }

  void _showAddBillSheet() {
    final provider = context.read<FinanceProvider>();
    final formKey = GlobalKey<FormState>();
    final billNumCtrl = TextEditingController();
    final totalCtrl = TextEditingController();
    DateTime billDate = DateTime.now();
    DateTime dueDate = DateTime.now().add(const Duration(days: 15));
    int? selectedSupplierId;
    int? selectedCategoryId;

    void showAddSupplierDialog(BuildContext context, StateSetter setModalState) {
      final ctrl = TextEditingController();
      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          backgroundColor: AppColors.darkSurface,
          title: Text('Add Supplier',
              style: GoogleFonts.poppins(
                  color: AppColors.textPrimary, fontWeight: FontWeight.bold)),
          content: TextField(
            controller: ctrl,
            style: GoogleFonts.poppins(color: AppColors.textPrimary),
            decoration: InputDecoration(
              hintText: 'Supplier Name',
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
                  final success = await context.read<FinanceProvider>().createSupplier(name);
                  if (!context.mounted) return;
                  if (success) {
                    final updatedSuppliers = context.read<FinanceProvider>().suppliers;
                    dynamic newlyCreated;
                    for (var s in updatedSuppliers) {
                      if (s['name'].toString().toLowerCase() == name.toLowerCase()) {
                        newlyCreated = s;
                        break;
                      }
                    }
                    if (newlyCreated != null) {
                      setModalState(() {
                        selectedSupplierId = JsonUtils.parseInt(newlyCreated['id']);
                      });
                    }
                    showTopSnackBar(context, SnackBar(
                      content: Text('Supplier created successfully!',
                          style: GoogleFonts.poppins(color: Colors.white)),
                      backgroundColor: AppColors.statusGreen,
                    ));
                  } else {
                    showTopSnackBar(context, SnackBar(
                      content: Text('Failed to create supplier',
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

    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.darkCard,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Padding(
          padding: EdgeInsets.only(left: 24, right: 24, top: 24, bottom: MediaQuery.of(ctx).viewInsets.bottom + 24),
          child: Form(
            key: formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Log Supplier Bill', style: GoogleFonts.poppins(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 16),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Expanded(
                      child: DropdownButtonFormField<int>(
                        value: selectedSupplierId,
                        dropdownColor: AppColors.darkCard,
                        decoration: const InputDecoration(labelText: 'Supplier'),
                        style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13),
                        items: provider.suppliers.map((s) {
                          return DropdownMenuItem<int>(value: JsonUtils.parseInt(s['id']), child: Text(s['name'] ?? '', style: GoogleFonts.poppins(color: AppColors.textPrimary)));
                        }).toList(),
                        onChanged: (v) => setModalState(() => selectedSupplierId = v),
                        validator: (v) => v == null ? 'Supplier is required' : null,
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
                      tooltip: 'Add Supplier',
                      onPressed: () => showAddSupplierDialog(context, setModalState),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: billNumCtrl,
                  style: GoogleFonts.poppins(color: AppColors.textPrimary),
                  decoration: const InputDecoration(labelText: 'Bill / Invoice Number'),
                  validator: (v) => (v == null || v.trim().isEmpty) ? 'Bill / Invoice Number is required' : null,
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: InkWell(
                        onTap: () async {
                          final picked = await showDatePicker(context: context, initialDate: billDate, firstDate: DateTime(2025), lastDate: DateTime(2028));
                          if (picked != null) setModalState(() => billDate = picked);
                        },
                        child: InputDecorator(
                          decoration: const InputDecoration(labelText: 'Bill Date'),
                          child: Text("${billDate.day}/${billDate.month}/${billDate.year}", style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 12)),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: InkWell(
                        onTap: () async {
                          final picked = await showDatePicker(context: context, initialDate: dueDate, firstDate: DateTime(2025), lastDate: DateTime(2028));
                          if (picked != null) setModalState(() => dueDate = picked);
                        },
                        child: InputDecorator(
                          decoration: const InputDecoration(labelText: 'Due Date'),
                          child: Text("${dueDate.day}/${dueDate.month}/${dueDate.year}", style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 12)),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<int>(
                  value: selectedCategoryId,
                  dropdownColor: AppColors.darkCard,
                  decoration: const InputDecoration(labelText: 'Expense Category'),
                  style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13),
                  items: provider.expenseCategories.map((c) {
                    return DropdownMenuItem<int>(value: JsonUtils.parseInt(c['id']), child: Text(c['name'] ?? '', style: GoogleFonts.poppins(color: AppColors.textPrimary)));
                  }).toList(),
                  onChanged: (v) => setModalState(() => selectedCategoryId = v),
                  validator: (v) => v == null ? 'Expense category is required' : null,
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: totalCtrl,
                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  style: GoogleFonts.poppins(color: AppColors.textPrimary),
                  decoration: const InputDecoration(labelText: 'Total Bill Amount'),
                  validator: (v) {
                    if (v == null || v.trim().isEmpty) return 'Total Bill Amount is required';
                    final val = double.tryParse(v);
                    if (val == null || val <= 0) return 'Please enter a valid amount';
                    return null;
                  },
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: () async {
                      if (!formKey.currentState!.validate()) {
                        showTopSnackBar(context, SnackBar(content: Text('Please fill all required fields'), backgroundColor: AppColors.statusRed));
                        return;
                      }

                      final amt = double.parse(totalCtrl.text);
                      final success = await provider.createSupplierBill({
                        'supplier_id': selectedSupplierId,
                        'bill_number': billNumCtrl.text.trim(),
                        'bill_date': "${billDate.year}-${billDate.month.toString().padLeft(2, '0')}-${billDate.day.toString().padLeft(2, '0')}",
                        'due_date': "${dueDate.year}-${dueDate.month.toString().padLeft(2, '0')}-${dueDate.day.toString().padLeft(2, '0')}",
                        'expense_category_id': selectedCategoryId,
                        'total_amount': amt,
                      });

                      if (success && mounted) {
                        Navigator.pop(ctx);
                        showTopSnackBar(context, SnackBar(content: Text('Bill logged successfully'), backgroundColor: AppColors.statusGreen));
                      } else if (mounted) {
                        showTopSnackBar(context, SnackBar(content: Text(provider.error ?? 'Failed to log bill'), backgroundColor: AppColors.statusRed));
                      }
                    },
                    style: ElevatedButton.styleFrom(backgroundColor: AppColors.accentAmber, foregroundColor: AppColors.textOnAmber, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
                    child: Text('Complete Log', style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showRecordPaymentSheet(int billId, double remainingAmount) {
    final provider = context.read<FinanceProvider>();
    final amountCtrl = TextEditingController(text: remainingAmount.toStringAsFixed(2));
    final notesCtrl = TextEditingController();
    int? selectedCashAccountId = provider.cashAccounts.isNotEmpty ? JsonUtils.parseInt(provider.cashAccounts.first['id']) : null;

    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.darkCard,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Padding(
          padding: EdgeInsets.only(left: 24, right: 24, top: 24, bottom: MediaQuery.of(ctx).viewInsets.bottom + 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Record Bill Payment', style: GoogleFonts.poppins(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 16)),
              const SizedBox(height: 16),
              DropdownButtonFormField<int>(
                value: selectedCashAccountId,
                dropdownColor: AppColors.darkCard,
                decoration: const InputDecoration(labelText: 'Paid From (Cash/Bank Account)'),
                style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13),
                items: provider.cashAccounts.map((a) {
                  return DropdownMenuItem<int>(value: JsonUtils.parseInt(a['id']), child: Text("${a['code']} - ${a['name']}", style: GoogleFonts.poppins(color: AppColors.textPrimary)));
                }).toList(),
                onChanged: (v) => setModalState(() => selectedCashAccountId = v),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: amountCtrl,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                style: GoogleFonts.poppins(color: AppColors.textPrimary),
                decoration: const InputDecoration(labelText: 'Payment Amount'),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: notesCtrl,
                style: GoogleFonts.poppins(color: AppColors.textPrimary),
                decoration: const InputDecoration(labelText: 'Notes / Reference'),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: () async {
                    final amt = double.tryParse(amountCtrl.text) ?? 0.0;
                    if (selectedCashAccountId == null || amt <= 0 || amt > remainingAmount) {
                      showTopSnackBar(context, SnackBar(content: Text('Invalid payment amount or account selection'), backgroundColor: AppColors.statusRed));
                      return;
                    }

                    final success = await provider.paySupplierBill(billId, amt, selectedCashAccountId!, notesCtrl.text.trim());
                    if (success && mounted) {
                      Navigator.pop(ctx);
                      showTopSnackBar(context, SnackBar(content: Text('Payment recorded successfully'), backgroundColor: AppColors.statusGreen));
                    } else if (mounted) {
                      showTopSnackBar(context, SnackBar(content: Text(provider.error ?? 'Failed to record payment'), backgroundColor: AppColors.statusRed));
                    }
                  },
                  style: ElevatedButton.styleFrom(backgroundColor: AppColors.accentAmber, foregroundColor: AppColors.textOnAmber, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
                  child: Text('Post Payment', style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── 9. BUDGETS SCREEN ───
class BudgetsScreen extends StatefulWidget {
  const BudgetsScreen({super.key});

  @override
  State<BudgetsScreen> createState() => _BudgetsScreenState();
}

class _BudgetsScreenState extends State<BudgetsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<FinanceProvider>().fetchBudgets();
    });
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<FinanceProvider>();
    final budgets = provider.budgets;

    return Scaffold(
      backgroundColor: AppColors.darkBg,
      appBar: AppBar(
        backgroundColor: AppColors.darkSurface,
        title: Text('Budgets', style: GoogleFonts.poppins(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 16)),
      ),
      body: provider.isLoading
          ? Center(child: CircularProgressIndicator(color: AppColors.accentAmber))
          : budgets.isEmpty
              ? _buildEmptyState(
                  icon: Icons.pie_chart_outline_rounded,
                  title: 'No budgets recorded yet',
                  subtitle: 'Tap the button below to define your first budget.',
                )
              : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: budgets.length,
              itemBuilder: (ctx, idx) {
                final b = budgets[idx];
                final name = b['name'] ?? '';
                final start = b['start_date'] ?? '';
                final end = b['end_date'] ?? '';
                final budgetAmt = JsonUtils.parseDouble(b['total_budget']);
                final actualAmt = JsonUtils.parseDouble(b['total_actual']);
                final varianceAmt = JsonUtils.parseDouble(b['total_variance']);
                final items = b['items'] as List? ?? [];

                return Container(
                  margin: const EdgeInsets.only(bottom: 16),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.darkCard,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.darkBorder),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(name, style: GoogleFonts.poppins(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 14)),
                      Text("Period: $start to $end", style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 11)),
                      Divider(color: AppColors.darkBorder),
                      Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text("Budget", style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 10)),
                                const SizedBox(height: 2),
                                Text(_fmt(budgetAmt), style: GoogleFonts.poppins(color: AppColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w600)),
                              ],
                            ),
                          ),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.center,
                              children: [
                                Text("Actual", style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 10)),
                                const SizedBox(height: 2),
                                Text(_fmt(actualAmt), style: GoogleFonts.poppins(color: AppColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w600)),
                              ],
                            ),
                          ),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text("Variance", style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 10)),
                                const SizedBox(height: 2),
                                Text(
                                  _fmt(varianceAmt),
                                  style: GoogleFonts.poppins(
                                      color: varianceAmt >= 0 ? AppColors.statusGreen : AppColors.statusRed,
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      ...items.map((it) {
                        final actName = it['account']?['name'] ?? 'Account';
                        final itBud = JsonUtils.parseDouble(it['amount']);
                        final itAct = JsonUtils.parseDouble(it['actual']);
                        final itRatio = itBud > 0 ? (itAct / itBud) : 0.0;

                        return Padding(
                          padding: const EdgeInsets.symmetric(vertical: 4),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(actName, style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 11)),
                                  Text("${_fmt(itAct)} / ${_fmt(itBud)}", style: GoogleFonts.poppins(color: AppColors.textSecondary, fontSize: 11)),
                                ],
                              ),
                              const SizedBox(height: 4),
                              ClipRRect(
                                borderRadius: BorderRadius.circular(4),
                                child: LinearProgressIndicator(
                                  value: itRatio.clamp(0.0, 1.0),
                                  backgroundColor: AppColors.darkBorder,
                                  valueColor: AlwaysStoppedAnimation<Color>(itRatio > 1.0 ? AppColors.statusRed : AppColors.statusGreen),
                                  minHeight: 6,
                                ),
                              ),
                            ],
                          ),
                        );
                      }),
                    ],
                  ),
                );
              },
            ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showAddBudgetSheet(),
        backgroundColor: AppColors.accentAmber,
        foregroundColor: Colors.white,
        shape: const StadiumBorder(),
        icon: const Icon(Icons.add_rounded),
        label: Text('Create Budget', style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
      ),
    );
  }

  void _showAddBudgetSheet() {
    final provider = context.read<FinanceProvider>();
    final nameCtrl = TextEditingController();
    final descCtrl = TextEditingController();
    DateTime start = DateTime.now();
    DateTime end = DateTime.now().add(const Duration(days: 30));

    List<Map<String, dynamic>> items = [
      {'account_id': null, 'amount': 0.0},
    ];

    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.darkCard,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Padding(
          padding: EdgeInsets.only(left: 24, right: 24, top: 24, bottom: MediaQuery.of(ctx).viewInsets.bottom + 24),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Create New Budget', style: GoogleFonts.poppins(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 16),
                TextField(
                  controller: nameCtrl,
                  style: GoogleFonts.poppins(color: AppColors.textPrimary),
                  decoration: const InputDecoration(labelText: 'Budget Name'),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: InkWell(
                        onTap: () async {
                          final picked = await showDatePicker(context: context, initialDate: start, firstDate: DateTime(2025), lastDate: DateTime(2028));
                          if (picked != null) setModalState(() => start = picked);
                        },
                        child: InputDecorator(
                          decoration: const InputDecoration(labelText: 'Start Date'),
                          child: Text("${start.day}/${start.month}/${start.year}", style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 12)),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: InkWell(
                        onTap: () async {
                          final picked = await showDatePicker(context: context, initialDate: end, firstDate: DateTime(2025), lastDate: DateTime(2028));
                          if (picked != null) setModalState(() => end = picked);
                        },
                        child: InputDecorator(
                          decoration: const InputDecoration(labelText: 'End Date'),
                          child: Text("${end.day}/${end.month}/${end.year}", style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 12)),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: descCtrl,
                  style: GoogleFonts.poppins(color: AppColors.textPrimary),
                  decoration: const InputDecoration(labelText: 'Notes / Description'),
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Budget items', style: GoogleFonts.poppins(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 14)),
                    TextButton.icon(
                      icon: Icon(Icons.add_circle_outline, size: 16, color: AppColors.accentAmber),
                      label: Text('Add Item', style: GoogleFonts.poppins(color: AppColors.accentAmber, fontSize: 12)),
                      onPressed: () => setModalState(() => items.add({'account_id': null, 'amount': 0.0})),
                    ),
                  ],
                ),
                const SizedBox(height: 8),

                ...List.generate(items.length, (idx) {
                  final it = items[idx];
                  return Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(color: AppColors.darkSurface, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.darkBorder)),
                    child: Column(
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: DropdownButtonFormField<int>(
                                value: it['account_id'],
                                dropdownColor: AppColors.darkCard,
                                decoration: const InputDecoration(labelText: 'Account', isDense: true),
                                style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 12),
                                items: provider.accounts.map((a) {
                                  return DropdownMenuItem<int>(value: JsonUtils.parseInt(a['id']), child: Text("${a['type'].toString().toUpperCase()} - ${a['name']}", style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 11)));
                                }).toList(),
                                onChanged: (v) => setModalState(() => it['account_id'] = v),
                              ),
                            ),
                            if (items.length > 1)
                              IconButton(
                                icon: Icon(Icons.delete_outline, color: AppColors.statusRed, size: 18),
                                onPressed: () => setModalState(() => items.removeAt(idx)),
                              ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        TextFormField(
                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                          style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 12),
                          decoration: const InputDecoration(labelText: 'Budget Limit Amount', isDense: true),
                          onChanged: (v) {
                            final val = double.tryParse(v) ?? 0.0;
                            setModalState(() => it['amount'] = val);
                          },
                        ),
                      ],
                    ),
                  );
                }),

                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: () async {
                      if (nameCtrl.text.trim().isEmpty || items.any((it) => it['account_id'] == null || it['amount'] <= 0)) {
                        showTopSnackBar(context, SnackBar(content: Text('Please select valid accounts and limits'), backgroundColor: AppColors.statusRed));
                        return;
                      }

                      final success = await provider.createBudget({
                        'name': nameCtrl.text.trim(),
                        'start_date': "${start.year}-${start.month.toString().padLeft(2, '0')}-${start.day.toString().padLeft(2, '0')}",
                        'end_date': "${end.year}-${end.month.toString().padLeft(2, '0')}-${end.day.toString().padLeft(2, '0')}",
                        'description': descCtrl.text.trim(),
                        'items': items,
                      });

                      if (success && mounted) {
                        Navigator.pop(ctx);
                        showTopSnackBar(context, SnackBar(content: Text('Budget created successfully'), backgroundColor: AppColors.statusGreen));
                      } else if (mounted) {
                        showTopSnackBar(context, SnackBar(content: Text(provider.error ?? 'Failed to create budget'), backgroundColor: AppColors.statusRed));
                      }
                    },
                    style: ElevatedButton.styleFrom(backgroundColor: AppColors.accentAmber, foregroundColor: AppColors.textOnAmber, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
                    child: Text('Complete Budget', style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

Widget _buildEmptyState({required IconData icon, required String title, required String subtitle}) {
  return Center(
    child: Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.darkCard,
              shape: BoxShape.circle,
              border: Border.all(color: AppColors.darkBorder),
            ),
            child: Icon(icon, size: 40, color: AppColors.textMuted),
          ),
          const SizedBox(height: 16),
          Text(
            title,
            style: GoogleFonts.poppins(
              color: AppColors.textSecondary,
              fontSize: 15,
              fontWeight: FontWeight.w600,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 6),
          Text(
            subtitle,
            style: GoogleFonts.poppins(
              color: AppColors.textMuted,
              fontSize: 12,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    ),
  );
}
