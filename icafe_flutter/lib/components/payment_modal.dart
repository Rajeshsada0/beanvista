import 'package:icafe_app/core/utils/snackbar_helper.dart';
import 'package:icafe_app/core/constants/app_constants.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../providers/orders_provider.dart';
import '../providers/finance_provider.dart';
import '../core/services/api_service.dart';
import '../core/theme/app_theme.dart';

class PaymentModal extends StatefulWidget {
  final double grandTotal;
  final Map<String, dynamic>? selectedCustomer;
  final List<Map<String, dynamic>>? customers;
  final Function(String method, {int? bankAccountId, Map<String, dynamic>? selectedCustomer}) onConfirm;

  const PaymentModal({
    Key? key,
    required this.grandTotal,
    required this.selectedCustomer,
    this.customers,
    required this.onConfirm,
  }) : super(key: key);

  @override
  State<PaymentModal> createState() => _PaymentModalState();
}

class _PaymentModalState extends State<PaymentModal>
    with SingleTickerProviderStateMixin {
  late TabController _tabCtrl;
  final _cashCtrl = TextEditingController();
  final _cardRefCtrl = TextEditingController();
  final _custSearchCtrl = TextEditingController();
  int? _selectedBankAccountId;
  Map<String, dynamic>? _modalSelectedCustomer;
  List<Map<String, dynamic>> _modalCustomers = [];

  double get _tendered =>
      double.tryParse(_cashCtrl.text.replaceAll(',', '')) ?? 0.0;
  double get _change => _tendered >= widget.grandTotal
      ? _tendered - widget.grandTotal
      : 0.0;

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 3, vsync: this);
    _modalSelectedCustomer = widget.selectedCustomer;
    _modalCustomers = widget.customers != null ? List<Map<String, dynamic>>.from(widget.customers!) : [];
    
    final formattedTotal = widget.grandTotal % 1 == 0
        ? widget.grandTotal.toInt().toString()
        : widget.grandTotal.toStringAsFixed(2);
    _cashCtrl.text = formattedTotal;

    _cashCtrl.addListener(() => setState(() {}));

    // Auto-fetch fresh customers
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _fetchCustomers();
    });
  }

  Future<void> _fetchCustomers() async {
    try {
      final api = context.read<ApiService>();
      final res = await api.get('/customers');
      if (res != null && res['data'] is List) {
        if (mounted) {
          setState(() {
            _modalCustomers = (res['data'] as List)
                .map((e) => Map<String, dynamic>.from(e as Map))
                .toList();
          });
        }
      }
    } catch (_) {}
  }

  @override
  void dispose() {
    _tabCtrl.dispose();
    _cashCtrl.dispose();
    _cardRefCtrl.dispose();
    _custSearchCtrl.dispose();
    super.dispose();
  }

  void _confirm() {
    const methods = ['Cash', 'Card', 'Credit'];
    final method = methods[_tabCtrl.index];
    if (method == 'Credit' && _modalSelectedCustomer == null) {
      showTopSnackBar(context, SnackBar(
        content: Text(
          'Please select or add a customer for credit payment.',
          style: GoogleFonts.poppins(color: AppColors.textPrimary),
        ),
        backgroundColor: AppColors.statusRedBg,
      ));
      return;
    }
    if (method == 'Cash' && _tendered < widget.grandTotal) {
      showTopSnackBar(context, SnackBar(
        content: Text(
          'Amount tendered is less than total.',
          style: GoogleFonts.poppins(color: AppColors.textPrimary),
        ),
        backgroundColor: AppColors.statusRedBg,
      ));
      return;
    }
    if (method == 'Card') {
      widget.onConfirm(method, bankAccountId: _selectedBankAccountId, selectedCustomer: _modalSelectedCustomer);
    } else {
      widget.onConfirm(method, selectedCustomer: _modalSelectedCustomer);
    }
  }

  void _showQuickAddCustomerSheet() {
    final nameCtrl = TextEditingController();
    final phoneCtrl = TextEditingController();
    final emailCtrl = TextEditingController();

    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.darkCard,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx2, setStateSheet) => Padding(
          padding: EdgeInsets.only(
              left: 24,
              right: 24,
              top: 24,
              bottom: MediaQuery.of(ctx2).viewInsets.bottom + 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Quick Add Customer',
                      style: GoogleFonts.poppins(
                          color: AppColors.textPrimary,
                          fontWeight: FontWeight.bold,
                          fontSize: 16)),
                  IconButton(
                    icon: Icon(Icons.close_rounded, color: AppColors.textMuted, size: 20),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              TextField(
                controller: nameCtrl,
                style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13),
                decoration: InputDecoration(
                  labelText: 'Customer Name *',
                  labelStyle: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 12),
                  prefixIcon: Icon(Icons.person_outline_rounded, color: AppColors.textMuted, size: 18),
                  filled: true,
                  fillColor: AppColors.darkSurface,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: phoneCtrl,
                keyboardType: TextInputType.phone,
                style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13),
                decoration: InputDecoration(
                  labelText: 'Phone Number',
                  labelStyle: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 12),
                  prefixIcon: Icon(Icons.phone_outlined, color: AppColors.textMuted, size: 18),
                  filled: true,
                  fillColor: AppColors.darkSurface,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: emailCtrl,
                keyboardType: TextInputType.emailAddress,
                style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13),
                decoration: InputDecoration(
                  labelText: 'Email Address (optional)',
                  labelStyle: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 12),
                  prefixIcon: Icon(Icons.email_outlined, color: AppColors.textMuted, size: 18),
                  filled: true,
                  fillColor: AppColors.darkSurface,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: () async {
                    final name = nameCtrl.text.trim();
                    if (name.isEmpty) {
                      showTopSnackBar(
                          context,
                          SnackBar(
                              content: const Text('Customer name is required'),
                              backgroundColor: AppColors.statusRed));
                      return;
                    }

                    final api = context.read<ApiService>();
                    final res = await api.post('/customers', {
                      'name': name,
                      'phone': phoneCtrl.text.trim(),
                      'email': emailCtrl.text.trim(),
                    });

                    if (res != null && (res['success'] == true || res['id'] != null || res['data'] != null)) {
                      final Map<String, dynamic> newCust = res['data'] != null
                          ? Map<String, dynamic>.from(res['data'] as Map)
                          : {'id': res['id'] ?? DateTime.now().millisecondsSinceEpoch, 'name': name, 'phone': phoneCtrl.text.trim()};

                      setState(() {
                        _modalSelectedCustomer = newCust;
                        if (!_modalCustomers.any((c) => c['name'] == newCust['name'])) {
                          _modalCustomers.insert(0, newCust);
                        }
                      });

                      if (ctx.mounted) {
                        Navigator.pop(ctx);
                        showTopSnackBar(
                            context,
                            SnackBar(
                                content: Text('Customer "$name" added & selected!'),
                                backgroundColor: AppColors.statusGreen));
                      }
                    } else {
                      final fallbackCust = {
                        'id': DateTime.now().millisecondsSinceEpoch,
                        'name': name,
                        'phone': phoneCtrl.text.trim(),
                      };
                      setState(() {
                        _modalSelectedCustomer = fallbackCust;
                        _modalCustomers.insert(0, fallbackCust);
                      });
                      if (ctx.mounted) {
                        Navigator.pop(ctx);
                        showTopSnackBar(
                            context,
                            SnackBar(
                                content: Text('Customer "$name" selected for credit!'),
                                backgroundColor: AppColors.statusGreen));
                      }
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.accentAmber,
                    foregroundColor: AppColors.textOnAmber,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: Text('Save & Select Customer',
                      style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final bankAccounts = Provider.of<OrdersProvider>(context, listen: true).bankAccounts;
    if (_selectedBankAccountId == null && bankAccounts.isNotEmpty) {
      _selectedBankAccountId = bankAccounts.first.id;
    }
    return Container(
      decoration: BoxDecoration(
        color: AppColors.darkCard,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        border: Border(
          top: BorderSide(color: AppColors.darkBorder),
          left: BorderSide(color: AppColors.darkBorder),
          right: BorderSide(color: AppColors.darkBorder),
        ),
      ),
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Container(
          width: 40,
          height: 4,
          margin: const EdgeInsets.only(top: 14, bottom: 4),
          decoration: BoxDecoration(
            color: AppColors.darkBorder,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        Padding(
          padding: const EdgeInsets.all(20),
          child: Row(children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                gradient: AppColors.primaryGradient,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(Icons.payment_rounded,
                  color: AppColors.textOnAmber, size: 20),
            ),
            const SizedBox(width: 12),
            Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Payment', style: GoogleFonts.poppins(
                  color: AppColors.textPrimary,
                  fontWeight: FontWeight.w700, fontSize: 18)),
              Text('Total: Rs. ${widget.grandTotal.toStringAsFixed(2)}',
                  style: GoogleFonts.poppins(
                      color: AppColors.accentAmber,
                      fontWeight: FontWeight.w600, fontSize: 13)),
            ]),
          ]),
        ),
        Container(
          margin: const EdgeInsets.symmetric(horizontal: 20),
          decoration: BoxDecoration(
            color: AppColors.darkSurface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.darkBorder),
          ),
          child: TabBar(
            controller: _tabCtrl,
            onTap: (_) => setState(() {}),
            indicator: BoxDecoration(
              gradient: AppColors.primaryGradient,
              borderRadius: BorderRadius.circular(10),
            ),
            indicatorSize: TabBarIndicatorSize.tab,
            dividerColor: Colors.transparent,
            labelColor: AppColors.textOnAmber,
            unselectedLabelColor: AppColors.textMuted,
            labelStyle: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 13),
            tabs: const [
              Tab(text: '💵  Cash'),
              Tab(text: '💳  Card'),
              Tab(text: '📋  Credit'),
            ],
          ),
        ),
        const SizedBox(height: 4),
        SizedBox(
          height: _tabCtrl.index == 1 ? 380 : 220,
          child: TabBarView(
            controller: _tabCtrl,
            children: [_buildCashTab(), _buildCardTab(), _buildCreditTab()],
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 20),
          child: SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: _confirm,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.accentAmber,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                elevation: 0,
              ),
              child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                Icon(Icons.check_circle_outline, color: AppColors.textOnAmber, size: 20),
                const SizedBox(width: 10),
                Text('Confirm Order', style: GoogleFonts.poppins(
                  color: AppColors.textOnAmber,
                  fontWeight: FontWeight.w700, fontSize: 15,
                )),
              ]),
            ),
          ),
        ),
      ]),
    );
  }

  Widget _buildCashTab() {
    final rounded = ((widget.grandTotal / 100).ceil() * 100).toDouble();
    final quickAmts = {widget.grandTotal, rounded, 500.0, 1000.0}.toList()
      ..sort();
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
      child: Column(children: [
        TextField(
          controller: _cashCtrl,
          keyboardType: const TextInputType.numberWithOptions(decimal: true),
          style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 20),
          textAlign: TextAlign.center,
          decoration: InputDecoration(
            hintText: '0.00',
            hintStyle: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 20),
            prefixText: '${AppConstants.currencySymbol} ',
            prefixStyle: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 20),
            filled: true, fillColor: AppColors.darkSurface,
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: AppColors.accentAmber, width: 2),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: AppColors.darkBorder),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: AppColors.accentAmber, width: 2),
            ),
            label: Text('Amount Tendered',
                style: GoogleFonts.poppins(color: AppColors.textSecondary, fontSize: 12)),
          ),
        ),
        const SizedBox(height: 10),
        Row(children: [
          Expanded(child: _PosInfoChip(
              label: 'Tendered',
              value: '${AppConstants.currencySymbol} ${_tendered.toStringAsFixed(2)}',
              color: AppColors.statusBlue)),
          const SizedBox(width: 10),
          Expanded(child: _PosInfoChip(
              label: 'Change',
              value: '${AppConstants.currencySymbol} ${_change.toStringAsFixed(2)}',
              color: _change >= 0 ? AppColors.statusGreen : AppColors.statusRed)),
        ]),
        const SizedBox(height: 10),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: quickAmts.map((amt) => Padding(
              padding: const EdgeInsets.only(right: 6),
              child: GestureDetector(
                onTap: () { _cashCtrl.text = amt.toStringAsFixed(0); setState(() {}); },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: AppColors.darkSurface,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppColors.darkBorder),
                  ),
                  child: Text('${AppConstants.currencySymbol} ${amt.toStringAsFixed(0)}',
                      style: GoogleFonts.poppins(
                        color: AppColors.accentAmber,
                        fontSize: 11, fontWeight: FontWeight.w600,
                      )),
                ),
              ),
            )).toList(),
          ),
        ),
      ]),
    );
  }

  void _showQuickAddBankAccountSheet() {
    final nameCtrl = TextEditingController();
    final numberCtrl = TextEditingController();
    final bankCtrl = TextEditingController();
    final balanceCtrl = TextEditingController(text: '0');
    String type = 'checking';
    XFile? pickedQrFile;

    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.darkCard,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx2, setStateSheet) => Padding(
          padding: EdgeInsets.only(left: 24, right: 24, top: 24, bottom: MediaQuery.of(ctx2).viewInsets.bottom + 24),
          child: SingleChildScrollView(
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
                  borderRadius: BorderRadius.circular(12),
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
                    if (v != null) {
                      setStateSheet(() {
                        type = v;
                      });
                    }
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
                const SizedBox(height: 12),
                GestureDetector(
                  onTap: () async {
                    final picker = ImagePicker();
                    final picked = await picker.pickImage(source: ImageSource.gallery);
                    if (picked != null) {
                      setStateSheet(() => pickedQrFile = picked);
                    }
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    decoration: BoxDecoration(
                      color: AppColors.darkSurface,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: pickedQrFile != null ? AppColors.accentAmber : AppColors.darkBorder,
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          pickedQrFile != null ? Icons.check_circle : Icons.qr_code_2,
                          color: pickedQrFile != null ? AppColors.accentAmber : AppColors.textMuted,
                          size: 22,
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            pickedQrFile != null ? 'QR Code: ${pickedQrFile!.name}' : 'Upload Payment QR Code (Optional)',
                            style: GoogleFonts.poppins(
                              color: pickedQrFile != null ? AppColors.textPrimary : AppColors.textMuted,
                              fontSize: 12,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (pickedQrFile != null)
                          GestureDetector(
                            onTap: () => setStateSheet(() => pickedQrFile = null),
                            child: Icon(Icons.close, size: 18, color: AppColors.textMuted),
                          ),
                      ],
                    ),
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
                        showTopSnackBar(context, SnackBar(content: const Text('Please fill all required fields'), backgroundColor: AppColors.statusRed));
                        return;
                      }

                      final financeProvider = Provider.of<FinanceProvider>(context, listen: false);
                      final ordersProvider = Provider.of<OrdersProvider>(context, listen: false);

                      final success = await financeProvider.createBankAccount({
                        'account_name': nameCtrl.text.trim(),
                        'account_number': numberCtrl.text.trim(),
                        'bank_name': bankCtrl.text.trim(),
                        'account_type': type,
                        'balance': bal,
                      }, qrImage: pickedQrFile);

                      if (success) {
                        await ordersProvider.fetchBankAccounts();
                        // Auto-select the newly created account
                        final newAcc = ordersProvider.bankAccounts.firstWhere(
                          (acc) => acc.name == nameCtrl.text.trim() && acc.number == numberCtrl.text.trim(),
                          orElse: () => ordersProvider.bankAccounts.isNotEmpty
                              ? ordersProvider.bankAccounts.last
                              : BankAccountItem(id: 0, name: '', number: '', bankName: '', type: '', balance: 0.0),
                        );
                        if (newAcc.id != 0) {
                          setState(() {
                            _selectedBankAccountId = newAcc.id;
                          });
                        }
                        if (ctx.mounted) {
                          Navigator.pop(ctx);
                          showTopSnackBar(context, SnackBar(content: const Text('Bank Account registered successfully'), backgroundColor: AppColors.statusGreen));
                        }
                      } else {
                      showTopSnackBar(context, SnackBar(content: Text(financeProvider.error ?? 'Failed to register account'), backgroundColor: AppColors.statusRed));
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.accentAmber,
                    foregroundColor: AppColors.textOnAmber,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: Text('Complete Registration', style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ),
      ),
    ),
  );
}

  void _showFullQrDialog(BankAccountItem account) {
    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Scan to Pay',
                    style: GoogleFonts.poppins(
                      fontWeight: FontWeight.bold,
                      fontSize: 18,
                      color: const Color(0xFF0F172A),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.grey),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: Image.network(
                  account.fullQrCodeUrl!,
                  width: 260,
                  height: 260,
                  fit: BoxFit.contain,
                  errorBuilder: (c, e, s) => Container(
                    width: 260,
                    height: 260,
                    color: Colors.grey.shade100,
                    child: const Icon(Icons.broken_image, size: 48, color: Colors.grey),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Rs. ${widget.grandTotal.toStringAsFixed(2)}',
                style: GoogleFonts.poppins(
                  fontWeight: FontWeight.w800,
                  fontSize: 22,
                  color: const Color(0xFF0F172A),
                ),
              ),
              Text(
                '${account.name} • ${account.bankName}',
                style: GoogleFonts.poppins(
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                  color: const Color(0xFF64748B),
                ),
              ),
              if (account.number.isNotEmpty)
                Text(
                  'A/C: ${account.number}',
                  style: GoogleFonts.poppins(
                    fontSize: 12,
                    color: const Color(0xFF94A3B8),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCardTab() {
    final bankAccounts = Provider.of<OrdersProvider>(context, listen: true).bankAccounts;
    if (_selectedBankAccountId == null && bankAccounts.isNotEmpty) {
      final preferred = bankAccounts.where((acc) => acc.type == 'online').firstOrNull;
      _selectedBankAccountId = preferred?.id ?? bankAccounts.first.id;
    }
    final selectedAcc = bankAccounts.where((acc) => acc.id == _selectedBankAccountId).firstOrNull;

    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.fromLTRB(20, 10, 20, 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Select Bank Account', style: GoogleFonts.poppins(
                  color: AppColors.textSecondary, fontSize: 11, fontWeight: FontWeight.w600)),
              GestureDetector(
                onTap: _showQuickAddBankAccountSheet,
                child: Text('+ Add Bank Account', style: GoogleFonts.poppins(
                    color: AppColors.accentAmber, fontSize: 11, fontWeight: FontWeight.bold)),
              ),
            ],
          ),
          const SizedBox(height: 6),
          DropdownButtonFormField<int>(
            value: bankAccounts.any((acc) => acc.id == _selectedBankAccountId) ? _selectedBankAccountId : null,
            dropdownColor: AppColors.darkCard,
            borderRadius: BorderRadius.circular(12),
            style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13),
            decoration: InputDecoration(
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              hintText: 'Choose Account',
              hintStyle: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 13),
            ),
            items: bankAccounts.map((acc) => DropdownMenuItem<int>(
              value: acc.id,
              child: Text('${acc.bankName} - ${acc.name} (${acc.number})', overflow: TextOverflow.ellipsis),
            )).toList(),
            onChanged: (val) => setState(() => _selectedBankAccountId = val),
          ),
          if (selectedAcc != null) ...[
            const SizedBox(height: 12),
            if (selectedAcc.fullQrCodeUrl != null)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.08),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.qr_code_2, size: 20, color: Color(0xFF1E293B)),
                        const SizedBox(width: 6),
                        Text(
                          'Scan to Pay',
                          style: GoogleFonts.poppins(
                            color: const Color(0xFF1E293B),
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    GestureDetector(
                      onTap: () => _showFullQrDialog(selectedAcc),
                      child: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.grey.shade300, width: 1.5),
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: Image.network(
                            selectedAcc.fullQrCodeUrl!,
                            width: 170,
                            height: 170,
                            fit: BoxFit.contain,
                            errorBuilder: (ctx, _, __) => Container(
                              width: 170,
                              height: 170,
                              color: Colors.grey.shade100,
                              child: const Icon(Icons.broken_image, color: Colors.grey, size: 40),
                            ),
                            loadingBuilder: (ctx, child, progress) {
                              if (progress == null) return child;
                              return Container(
                                width: 170,
                                height: 170,
                                alignment: Alignment.center,
                                child: const CircularProgressIndicator(strokeWidth: 2),
                              );
                            },
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Rs. ${widget.grandTotal.toStringAsFixed(2)}',
                      style: GoogleFonts.poppins(
                        color: const Color(0xFF0F172A),
                        fontWeight: FontWeight.w800,
                        fontSize: 16,
                      ),
                    ),
                    Text(
                      '${selectedAcc.name} (${selectedAcc.bankName})',
                      style: GoogleFonts.poppins(
                        color: const Color(0xFF64748B),
                        fontWeight: FontWeight.w500,
                        fontSize: 11,
                      ),
                    ),
                    if (selectedAcc.number.isNotEmpty)
                      Text(
                        'A/C: ${selectedAcc.number}',
                        style: GoogleFonts.poppins(
                          color: const Color(0xFF94A3B8),
                          fontWeight: FontWeight.w500,
                          fontSize: 10,
                        ),
                      ),
                    const SizedBox(height: 4),
                    Text(
                      'Tap QR code to zoom in',
                      style: GoogleFonts.poppins(
                        color: const Color(0xFF94A3B8),
                        fontStyle: FontStyle.italic,
                        fontSize: 9,
                      ),
                    ),
                  ],
                ),
              )
            else
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: AppColors.accentAmber.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppColors.accentAmber.withOpacity(0.3)),
                ),
                child: Row(
                  children: [
                    Icon(Icons.info_outline, size: 16, color: AppColors.accentAmber),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'No payment QR code configured for this account',
                        style: GoogleFonts.poppins(color: AppColors.accentAmber, fontSize: 11),
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ],
      ),
    );
  }

  double _getOldDue(Map<String, dynamic>? c) {
    if (c == null) return 0.0;
    final raw = c['due_amount'] ?? c['due'] ?? c['total_due'] ?? c['outstanding'];
    return double.tryParse(raw?.toString() ?? '0') ?? 0.0;
  }

  Widget _buildCreditTab() {
    final customer = _modalSelectedCustomer;
    final query = _custSearchCtrl.text.trim().toLowerCase();

    final filteredCustomers = _modalCustomers.where((c) {
      final name = (c['name'] as String? ?? '').toLowerCase();
      final phone = (c['phone'] as String? ?? '').toLowerCase();
      return name.contains(query) || phone.contains(query);
    }).toList();

    final oldDue = _getOldDue(customer);
    final newTotalDue = oldDue + widget.grandTotal;

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 10, 20, 0),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Select Customer for Credit',
                  style: GoogleFonts.poppins(
                    color: AppColors.textSecondary,
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                GestureDetector(
                  onTap: _showQuickAddCustomerSheet,
                  child: Text(
                    '+ Add Customer',
                    style: GoogleFonts.poppins(
                      color: AppColors.accentAmber,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),

            // Search input field
            TextField(
              controller: _custSearchCtrl,
              onChanged: (val) => setState(() {}),
              style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 12),
              decoration: InputDecoration(
                hintText: 'Search customer by name or phone...',
                hintStyle: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 12),
                prefixIcon: Icon(Icons.search_rounded, color: AppColors.accentAmber, size: 18),
                suffixIcon: _custSearchCtrl.text.isNotEmpty
                    ? IconButton(
                        icon: Icon(Icons.clear_rounded, color: AppColors.textMuted, size: 16),
                        onPressed: () {
                          _custSearchCtrl.clear();
                          setState(() {});
                        },
                      )
                    : null,
                isDense: true,
                contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                filled: true,
                fillColor: AppColors.darkSurface,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: BorderSide(color: AppColors.darkBorder),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: BorderSide(color: AppColors.darkBorder),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(10),
                  borderSide: BorderSide(color: AppColors.accentAmber),
                ),
              ),
            ),
            const SizedBox(height: 6),

            // Searchable Customer List (shows when searching or when no customer is selected)
            if (customer == null || query.isNotEmpty) ...[
              Container(
                constraints: const BoxConstraints(maxHeight: 115),
                decoration: BoxDecoration(
                  color: AppColors.darkSurface,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppColors.darkBorder),
                ),
                child: filteredCustomers.isEmpty
                    ? Padding(
                        padding: const EdgeInsets.all(12),
                        child: Center(
                          child: Text(
                            'No matching customer found. Tap "+ Add Customer"',
                            style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 11),
                          ),
                        ),
                      )
                    : ListView.separated(
                        shrinkWrap: true,
                        padding: EdgeInsets.zero,
                        itemCount: filteredCustomers.length,
                        separatorBuilder: (_, __) => Divider(color: AppColors.darkBorder, height: 1),
                        itemBuilder: (ctx, idx) {
                          final c = filteredCustomers[idx];
                          final cName = c['name'] as String? ?? 'Customer';
                          final cPhone = c['phone'] as String? ?? '';
                          final cDue = _getOldDue(c);
                          final isSel = customer != null && customer['name'] == cName;

                          return ListTile(
                            dense: true,
                            visualDensity: VisualDensity.compact,
                            title: Text(
                              cPhone.isNotEmpty ? '$cName ($cPhone)' : cName,
                              style: GoogleFonts.poppins(
                                color: isSel ? AppColors.accentAmber : AppColors.textPrimary,
                                fontWeight: isSel ? FontWeight.bold : FontWeight.normal,
                                fontSize: 12,
                              ),
                            ),
                            trailing: cDue > 0
                                ? Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: AppColors.statusRedBg,
                                      borderRadius: BorderRadius.circular(4),
                                    ),
                                    child: Text(
                                      'Due: Rs. ${cDue.toStringAsFixed(0)}',
                                      style: GoogleFonts.poppins(
                                        color: AppColors.statusRed,
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  )
                                : null,
                            onTap: () {
                              setState(() {
                                _modalSelectedCustomer = c;
                                _custSearchCtrl.clear();
                              });
                            },
                          );
                        },
                      ),
              ),
              const SizedBox(height: 6),
            ],

            // Customer Details & Credit Balance Breakdown Card
            if (customer != null) ...[
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.statusPurpleBg,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.statusPurple.withOpacity(0.3)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 36,
                          height: 36,
                          decoration: BoxDecoration(
                            color: AppColors.statusPurple.withOpacity(0.2),
                            shape: BoxShape.circle,
                          ),
                          child: Center(
                            child: Text(
                              (customer['name'] as String? ?? 'C')[0].toUpperCase(),
                              style: GoogleFonts.poppins(
                                color: AppColors.statusPurple,
                                fontWeight: FontWeight.w700,
                                fontSize: 15,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                customer['name'] as String? ?? 'Selected Customer',
                                style: GoogleFonts.poppins(
                                  color: AppColors.textPrimary,
                                  fontWeight: FontWeight.w600,
                                  fontSize: 13,
                                ),
                              ),
                              if (customer['phone'] != null)
                                Text(
                                  customer['phone'] as String,
                                  style: GoogleFonts.poppins(
                                    color: AppColors.textMuted,
                                    fontSize: 11,
                                  ),
                                ),
                            ],
                          ),
                        ),
                        GestureDetector(
                          onTap: () => setState(() {
                            _modalSelectedCustomer = null;
                            _custSearchCtrl.clear();
                          }),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppColors.statusRedBg,
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              'Clear',
                              style: GoogleFonts.poppins(
                                color: AppColors.statusRed,
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),

                    // Old Due Breakdown Box
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AppColors.darkSurface,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: AppColors.darkBorder),
                      ),
                      child: Column(
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('Previous Credit Due:',
                                  style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 11)),
                              Text(
                                'Rs. ${oldDue.toStringAsFixed(2)}',
                                style: GoogleFonts.poppins(
                                  color: oldDue > 0 ? AppColors.statusRed : AppColors.textPrimary,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 11,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 2),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('Current Order Credit:',
                                  style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 11)),
                              Text(
                                'Rs. ${widget.grandTotal.toStringAsFixed(2)}',
                                style: GoogleFonts.poppins(
                                  color: AppColors.accentAmber,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 11,
                                ),
                              ),
                            ],
                          ),
                          Divider(height: 8, color: AppColors.darkBorder),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('New Total Credit Balance:',
                                  style: GoogleFonts.poppins(
                                    color: AppColors.textPrimary,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 11,
                                  )),
                              Text(
                                'Rs. ${newTotalDue.toStringAsFixed(2)}',
                                style: GoogleFonts.poppins(
                                  color: AppColors.accentAmber,
                                  fontWeight: FontWeight.w800,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ] else ...[
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.darkSurface,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: AppColors.darkBorder),
                ),
                child: Row(
                  children: [
                    Icon(Icons.info_outline_rounded, color: AppColors.textMuted, size: 14),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Type in search bar to pick customer or tap "+ Add Customer".',
                        style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 11),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _PosInfoChip extends StatelessWidget {
  final String label;
  final String value;
  final Color color;

  const _PosInfoChip({
    Key? key,
    required this.label,
    required this.value,
    required this.color,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withOpacity(0.4)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: GoogleFonts.poppins(fontSize: 11, color: color, fontWeight: FontWeight.w700)),
          Text(value, style: GoogleFonts.poppins(fontSize: 11, color: color, fontWeight: FontWeight.w700)),
        ],
      ),
    );
  }
}
