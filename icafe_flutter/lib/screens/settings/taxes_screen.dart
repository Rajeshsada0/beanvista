import 'package:icafe_app/core/utils/snackbar_helper.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/taxes_provider.dart';

class TaxesScreen extends StatefulWidget {
  const TaxesScreen({super.key});

  @override
  State<TaxesScreen> createState() => _TaxesScreenState();
}

class _TaxesScreenState extends State<TaxesScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<TaxesProvider>().fetchTaxes();
    });
  }

  Widget _buildSummaryCard(double activeRate, List<TaxItem> activeTaxes) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            AppColors.accentAmber,
            AppColors.accentGold.withOpacity(0.85),
          ],
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: AppColors.accentAmber.withOpacity(0.25),
            blurRadius: 20,
            spreadRadius: 2,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'COMBINED TAX RATE',
                style: GoogleFonts.poppins(
                  color: AppColors.textOnAmber.withOpacity(0.75),
                  fontSize: 10,
                  fontWeight: FontWeight.w800,
                  letterSpacing: 1.5,
                ),
              ),
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: AppColors.textOnAmber.withOpacity(0.15),
                  shape: BoxShape.circle,
                ),
                child: Icon(Icons.percent_rounded, color: AppColors.textOnAmber, size: 18),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            '${(activeRate * 100).toStringAsFixed(1)}%',
            style: GoogleFonts.poppins(
              color: AppColors.textOnAmber,
              fontSize: 38,
              fontWeight: FontWeight.w400,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 10),
          Text(
            activeTaxes.isEmpty
                ? 'No active tax rates applied to orders.'
                : 'Combined from: ${activeTaxes.map((t) => t.name).join(', ')}',
            style: GoogleFonts.poppins(
              color: AppColors.textOnAmber.withOpacity(0.9),
              fontSize: 12,
              fontWeight: FontWeight.w500,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  void _showTaxForm({TaxItem? tax}) {
    final nameCtrl = TextEditingController(text: tax?.name ?? '');
    final rateCtrl = TextEditingController(text: tax != null ? tax.rate.toString() : '');
    bool status = tax?.status ?? true;
    final formKey = GlobalKey<FormState>();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            final isDark = AppColors.isDark;
            final bgCard = isDark ? AppColors.darkCard : Colors.white;
            final borderCol = isDark ? AppColors.darkBorder : const Color(0xFFE5E7EB);
            final innerBg = isDark ? AppColors.darkSurface : const Color(0xFFFAFAFB);
            
            return Padding(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(ctx).viewInsets.bottom,
              ),
              child: Container(
                decoration: BoxDecoration(
                  color: bgCard,
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.15),
                      blurRadius: 25,
                      offset: const Offset(0, -5),
                    ),
                  ],
                ),
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
                child: SafeArea(
                  top: false,
                  child: Form(
                    key: formKey,
                    child: SingleChildScrollView(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Top Drag Handle Bar
                          Center(
                            child: Container(
                              width: 36,
                              height: 4,
                              margin: const EdgeInsets.only(bottom: 20),
                              decoration: BoxDecoration(
                                color: isDark ? Colors.white24 : const Color(0xFFD1D5DB),
                                borderRadius: BorderRadius.circular(2),
                              ),
                            ),
                          ),

                          // Header Row (Icon Badge + Title/Subtitle + Close Button)
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.center,
                            children: [
                              Container(
                                width: 44,
                                height: 44,
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF3E8FF),
                                  borderRadius: BorderRadius.circular(14),
                                ),
                                child: const Icon(
                                  Icons.percent_rounded,
                                  color: Color(0xFF8B5CF6),
                                  size: 22,
                                ),
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      tax == null ? 'Add Tax Rate' : 'Edit Tax Rate',
                                      style: GoogleFonts.poppins(
                                        color: AppColors.textPrimary,
                                        fontSize: 18,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      tax == null ? 'Create a new tax rate' : 'Update tax details',
                                      style: GoogleFonts.poppins(
                                        color: AppColors.textMuted,
                                        fontSize: 13,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              InkWell(
                                onTap: () => Navigator.pop(ctx),
                                borderRadius: BorderRadius.circular(20),
                                child: Container(
                                  width: 36,
                                  height: 36,
                                  decoration: BoxDecoration(
                                    color: isDark ? Colors.white10 : const Color(0xFFF3F4F6),
                                    shape: BoxShape.circle,
                                  ),
                                  child: Icon(
                                    Icons.close_rounded,
                                    color: AppColors.textSecondary,
                                    size: 20,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 24),

                          // Card 1: Tax Name Field Card
                          Container(
                            decoration: BoxDecoration(
                              color: innerBg,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: borderCol, width: 1.2),
                            ),
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                            child: Row(
                              children: [
                                Container(
                                  width: 38,
                                  height: 38,
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF3E8FF),
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: const Icon(
                                    Icons.local_offer_outlined,
                                    color: Color(0xFF8B5CF6),
                                    size: 18,
                                  ),
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'Tax Name',
                                        style: GoogleFonts.poppins(
                                          color: AppColors.textPrimary,
                                          fontSize: 13,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                      TextFormField(
                                        controller: nameCtrl,
                                        style: GoogleFonts.poppins(
                                          color: AppColors.textPrimary,
                                          fontSize: 14,
                                        ),
                                        decoration: InputDecoration(
                                          isDense: true,
                                          contentPadding: const EdgeInsets.only(top: 4, bottom: 2),
                                          border: InputBorder.none,
                                          enabledBorder: InputBorder.none,
                                          focusedBorder: InputBorder.none,
                                          errorBorder: InputBorder.none,
                                          hintText: 'e.g. VAT, GST, Sales Tax',
                                          hintStyle: GoogleFonts.poppins(
                                            color: AppColors.textMuted,
                                            fontSize: 13,
                                          ),
                                        ),
                                        validator: (v) => v == null || v.trim().isEmpty ? 'Tax name cannot be empty' : null,
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 14),

                          // Card 2: Rate (%) Field Card
                          Container(
                            decoration: BoxDecoration(
                              color: innerBg,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: borderCol, width: 1.2),
                            ),
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                            child: Row(
                              children: [
                                Container(
                                  width: 38,
                                  height: 38,
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF3E8FF),
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: const Icon(
                                    Icons.percent_rounded,
                                    color: Color(0xFF8B5CF6),
                                    size: 18,
                                  ),
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'Rate (%)',
                                        style: GoogleFonts.poppins(
                                          color: AppColors.textPrimary,
                                          fontSize: 13,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                      TextFormField(
                                        controller: rateCtrl,
                                        keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                        style: GoogleFonts.poppins(
                                          color: AppColors.textPrimary,
                                          fontSize: 14,
                                        ),
                                        decoration: InputDecoration(
                                          isDense: true,
                                          contentPadding: const EdgeInsets.only(top: 4, bottom: 2),
                                          border: InputBorder.none,
                                          enabledBorder: InputBorder.none,
                                          focusedBorder: InputBorder.none,
                                          errorBorder: InputBorder.none,
                                          hintText: 'e.g. 13.00',
                                          hintStyle: GoogleFonts.poppins(
                                            color: AppColors.textMuted,
                                            fontSize: 13,
                                          ),
                                        ),
                                        validator: (v) {
                                          if (v == null || v.trim().isEmpty) return 'Rate cannot be empty';
                                          final rate = double.tryParse(v.trim());
                                          if (rate == null) return 'Must be a valid decimal number';
                                          if (rate < 0 || rate > 100) return 'Must be between 0 and 100';
                                          return null;
                                        },
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 14),

                          // Card 3: Status Section Card
                          Container(
                            decoration: BoxDecoration(
                              color: innerBg,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: borderCol, width: 1.2),
                            ),
                            padding: const EdgeInsets.all(14),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Text(
                                      'Status',
                                      style: GoogleFonts.poppins(
                                        color: AppColors.textPrimary,
                                        fontSize: 13,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                    const SizedBox(width: 6),
                                    Icon(
                                      Icons.info_outline_rounded,
                                      size: 16,
                                      color: AppColors.textMuted,
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 10),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                  decoration: BoxDecoration(
                                    color: bgCard,
                                    borderRadius: BorderRadius.circular(12),
                                    border: Border.all(
                                      color: isDark ? AppColors.darkBorder : const Color(0xFFF3F4F6),
                                    ),
                                  ),
                                  child: Row(
                                    children: [
                                      Container(
                                        width: 32,
                                        height: 32,
                                        decoration: BoxDecoration(
                                          color: status ? const Color(0xFFD1FAE5) : Colors.grey.shade200,
                                          shape: BoxShape.circle,
                                        ),
                                        child: Icon(
                                          status ? Icons.check_circle_rounded : Icons.pause_circle_outline_rounded,
                                          color: status ? const Color(0xFF10B981) : Colors.grey.shade500,
                                          size: 18,
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              status ? 'Active' : 'Inactive',
                                              style: GoogleFonts.poppins(
                                                color: AppColors.textPrimary,
                                                fontSize: 13,
                                                fontWeight: FontWeight.w600,
                                              ),
                                            ),
                                            Text(
                                              status ? 'This tax rate will be active' : 'This tax rate will be disabled',
                                              style: GoogleFonts.poppins(
                                                color: AppColors.textMuted,
                                                fontSize: 11,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                      Switch.adaptive(
                                        value: status,
                                        activeColor: const Color(0xFF8B5CF6),
                                        activeTrackColor: const Color(0xFFDDD6FE),
                                        onChanged: (val) {
                                          setDialogState(() {
                                            status = val;
                                          });
                                        },
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 24),

                          // Bottom Action Buttons
                          Row(
                            children: [
                              Expanded(
                                child: SizedBox(
                                  height: 52,
                                  child: OutlinedButton(
                                    onPressed: () => Navigator.pop(ctx),
                                    style: OutlinedButton.styleFrom(
                                      foregroundColor: AppColors.textPrimary,
                                      backgroundColor: bgCard,
                                      side: BorderSide(
                                        color: borderCol,
                                        width: 1.2,
                                      ),
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(16),
                                      ),
                                    ),
                                    child: Text(
                                      'Cancel',
                                      style: GoogleFonts.poppins(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w600,
                                        color: AppColors.textPrimary,
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: SizedBox(
                                  height: 52,
                                  child: Container(
                                    decoration: BoxDecoration(
                                      gradient: const LinearGradient(
                                        colors: [Color(0xFF8B5CF6), Color(0xFF6D28D9)],
                                        begin: Alignment.topLeft,
                                        end: Alignment.bottomRight,
                                      ),
                                      borderRadius: BorderRadius.circular(16),
                                      boxShadow: [
                                        BoxShadow(
                                          color: const Color(0xFF8B5CF6).withOpacity(0.35),
                                          blurRadius: 12,
                                          offset: const Offset(0, 4),
                                        ),
                                      ],
                                    ),
                                    child: ElevatedButton(
                                      onPressed: () async {
                                        if (!formKey.currentState!.validate()) return;
                                        final name = nameCtrl.text.trim();
                                        final rate = double.parse(rateCtrl.text.trim());

                                        final provider = context.read<TaxesProvider>();
                                        final messenger = ScaffoldMessenger.of(context);

                                        Navigator.pop(ctx);
                                        
                                        bool success = false;
                                        if (tax == null) {
                                          success = await provider.storeTax(name, rate, status);
                                        } else {
                                          success = await provider.updateTax(tax.id, name, rate, status);
                                        }

                                        if (!mounted) return;
                                        showTopSnackBarWithMessenger(messenger, context, 
                                          SnackBar(
                                            backgroundColor: success ? AppColors.statusGreenBg : AppColors.statusRedBg,
                                            content: Text(
                                              success
                                                  ? (tax == null ? 'Tax created successfully' : 'Tax updated successfully')
                                                  : (provider.error ?? 'An error occurred'),
                                              style: GoogleFonts.poppins(color: AppColors.textPrimary),
                                            ),
                                          ),
                                        );
                                      },
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: Colors.transparent,
                                        shadowColor: Colors.transparent,
                                        shape: RoundedRectangleBorder(
                                          borderRadius: BorderRadius.circular(16),
                                        ),
                                      ),
                                      child: Text(
                                        tax == null ? 'Create Tax Rate' : 'Save Changes',
                                        style: GoogleFonts.poppins(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w700,
                                          color: Colors.white,
                                        ),
                                      ),
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
                ),
              ),
            );
          },
        );
      },
    );
  }

  void _deleteTax(TaxItem tax) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.darkSurface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text('Delete Tax Rate', style: GoogleFonts.poppins(color: AppColors.textPrimary, fontWeight: FontWeight.bold)),
        content: Text(
          'Are you sure you want to delete ${tax.name} (${tax.rate}%)? This action cannot be undone.',
          style: GoogleFonts.poppins(color: AppColors.textSecondary),
        ),
        actionsPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(
              'Cancel',
              style: GoogleFonts.poppins(
                color: AppColors.textMuted,
                fontWeight: FontWeight.w600,
                fontSize: 14,
              ),
            ),
          ),
          ElevatedButton(
            onPressed: () async {
              final provider = context.read<TaxesProvider>();
              final messenger = ScaffoldMessenger.of(context);

              Navigator.pop(ctx);
              
              final success = await provider.deleteTax(tax.id);

              showTopSnackBarWithMessenger(messenger, context, 
                SnackBar(
                  backgroundColor: success ? AppColors.statusGreenBg : AppColors.statusRedBg,
                  content: Text(
                    success ? 'Tax rate deleted successfully' : (provider.error ?? 'Failed to delete tax'),
                    style: GoogleFonts.poppins(color: AppColors.textPrimary),
                  ),
                ),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.statusRed,
              foregroundColor: Colors.white,
              elevation: 0,
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
              minimumSize: const Size(95, 40),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: Text('Delete', style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Widget _buildTaxCard(TaxItem tax, TaxesProvider provider) {
    final isActive = tax.status;
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppColors.darkCard,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isActive 
              ? AppColors.accentAmber.withOpacity(0.3) 
              : AppColors.darkBorder,
          width: 1.5,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            // Circular Rate Badge with Dynamic Gradient
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                gradient: isActive ? LinearGradient(
                  colors: [AppColors.accentAmberLight, AppColors.accentAmber],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ) : null,
                color: isActive ? null : AppColors.darkSurface,
                shape: BoxShape.circle,
                border: Border.all(
                  color: isActive ? Colors.transparent : AppColors.darkBorder,
                  width: 1,
                ),
              ),
              child: Center(
                child: Text(
                  '${tax.rate.toStringAsFixed(0)}%',
                  style: GoogleFonts.poppins(
                    color: isActive ? AppColors.textOnAmber : AppColors.textMuted,
                    fontWeight: FontWeight.w800,
                    fontSize: 14,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 16),
            // Tax Details & Status capsule
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          tax.name,
                          style: GoogleFonts.poppins(
                            color: AppColors.textPrimary,
                            fontWeight: FontWeight.w700,
                            fontSize: 15,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: isActive 
                              ? AppColors.statusGreenBg 
                              : AppColors.darkSurface,
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(
                            color: isActive 
                                ? AppColors.statusGreen.withOpacity(0.3) 
                                : AppColors.darkBorder,
                          ),
                        ),
                        child: Text(
                          isActive ? 'ACTIVE' : 'INACTIVE',
                          style: GoogleFonts.poppins(
                            color: isActive ? AppColors.statusGreen : AppColors.textMuted,
                            fontWeight: FontWeight.w800,
                            fontSize: 8,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Global Tax Configuration',
                    style: GoogleFonts.poppins(
                      color: AppColors.textMuted,
                      fontSize: 11,
                    ),
                  ),
                ],
              ),
            ),
            // Switch Status Toggle
            Transform.scale(
              scale: 0.8,
              child: Switch(
                value: tax.status,
                activeColor: AppColors.accentAmber,
                inactiveThumbColor: AppColors.textSecondary,
                onChanged: (val) async {
                  final messenger = ScaffoldMessenger.of(context);
                  final success = await provider.updateTax(tax.id, tax.name, tax.rate, val);
                  if (!success) {
                    showTopSnackBarWithMessenger(messenger, context, 
                      SnackBar(
                        backgroundColor: AppColors.statusRedBg,
                        content: Text(
                          provider.error ?? 'Failed to update tax status',
                          style: GoogleFonts.poppins(color: AppColors.textPrimary),
                        ),
                      ),
                    );
                  }
                },
              ),
            ),
            // Actions PopupMenu
            PopupMenuButton<String>(
              icon: Icon(Icons.more_vert_rounded, color: AppColors.textSecondary),
              color: AppColors.darkSurface,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              onSelected: (val) {
                if (val == 'edit') {
                  _showTaxForm(tax: tax);
                } else if (val == 'delete') {
                  _deleteTax(tax);
                }
              },
              itemBuilder: (context) => [
                PopupMenuItem(
                  value: 'edit',
                  child: Row(
                    children: [
                      Icon(Icons.edit_rounded, color: AppColors.textSecondary, size: 18),
                      const SizedBox(width: 10),
                      Text('Edit', style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13)),
                    ],
                  ),
                ),
                PopupMenuItem(
                  value: 'delete',
                  child: Row(
                    children: [
                      Icon(Icons.delete_outline_rounded, color: AppColors.statusRed, size: 18),
                      const SizedBox(width: 10),
                      Text('Delete', style: GoogleFonts.poppins(color: AppColors.statusRed, fontSize: 13)),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<TaxesProvider>();
    final activeRate = provider.activeTaxRate;
    final activeTaxes = provider.taxes.where((t) => t.status).toList();

    return Scaffold(
      backgroundColor: AppColors.darkBg,
      appBar: AppBar(
        title: Text(
          'Tax Settings',
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
            onPressed: () => _showTaxForm(),
            icon: Icon(Icons.add_rounded, color: AppColors.accentAmber),
            tooltip: 'Add Tax',
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: provider.fetchTaxes,
        color: AppColors.accentAmber,
        backgroundColor: AppColors.darkSurface,
        child: provider.isLoading && provider.taxes.isEmpty
            ? Center(
                child: CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation<Color>(AppColors.accentAmber),
                ),
              )
            : provider.error != null && provider.taxes.isEmpty
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.error_outline, color: AppColors.statusRed, size: 48),
                          const SizedBox(height: 16),
                          Text(
                            provider.error!,
                            textAlign: TextAlign.center,
                            style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 14),
                          ),
                          const SizedBox(height: 16),
                          ElevatedButton(
                            onPressed: provider.fetchTaxes,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.accentAmber,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                            ),
                            child: Text('Retry', style: GoogleFonts.poppins(color: AppColors.textOnAmber)),
                          ),
                        ],
                      ),
                    ),
                  )
                : ListView(
                    padding: const EdgeInsets.all(16),
                    children: [
                      // Active Tax Combined Summary Card
                      if (provider.taxes.isNotEmpty) ...[
                        _buildSummaryCard(activeRate, activeTaxes),
                        const SizedBox(height: 24),
                        Row(
                          children: [
                            Icon(Icons.list_alt_rounded, color: AppColors.textSecondary, size: 18),
                            const SizedBox(width: 8),
                            Text(
                              'TAX SYSTEM CONFIGURATIONS',
                              style: GoogleFonts.poppins(
                                color: AppColors.textSecondary,
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 1.0,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                      ],
                      
                      // Taxes List
                      if (provider.taxes.isEmpty)
                        Center(
                          child: Padding(
                            padding: const EdgeInsets.symmetric(vertical: 60),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Stack(
                                  alignment: Alignment.center,
                                  children: [
                                    Container(
                                      width: 96,
                                      height: 96,
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFF3E8FF).withOpacity(0.5),
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                    Container(
                                      width: 76,
                                      height: 76,
                                      decoration: BoxDecoration(
                                        color: AppColors.isDark ? AppColors.darkCard : const Color(0xFFF5F3FF),
                                        shape: BoxShape.circle,
                                        boxShadow: [
                                          BoxShadow(
                                            color: Colors.black.withOpacity(0.06),
                                            blurRadius: 15,
                                            offset: const Offset(0, 4),
                                          ),
                                        ],
                                      ),
                                      child: const Icon(
                                        Icons.percent_rounded,
                                        color: Color(0xFF8B5CF6),
                                        size: 36,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 20),
                                Text(
                                  'No Tax Rates Yet',
                                  style: GoogleFonts.poppins(
                                    color: AppColors.textPrimary,
                                    fontSize: 16,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  'Create your first tax rate to get started.',
                                  style: GoogleFonts.poppins(
                                    color: AppColors.textMuted,
                                    fontSize: 13,
                                  ),
                                  textAlign: TextAlign.center,
                                ),
                              ],
                            ),
                          ),
                        )
                      else
                        ListView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: provider.taxes.length,
                          itemBuilder: (context, index) {
                            return _buildTaxCard(provider.taxes[index], provider);
                          },
                        ),
                    ],
                  ),
      ),
    );
  }
}
