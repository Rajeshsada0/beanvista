import 'package:icafe_app/core/utils/snackbar_helper.dart';
import 'package:icafe_app/core/constants/app_constants.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/subscriptions_provider.dart';

class CheckoutScreen extends StatefulWidget {
  final SubscriptionPlan plan;

  const CheckoutScreen({super.key, required this.plan});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final _formKey = GlobalKey<FormState>();
  final _refController = TextEditingController();
  final _notesController = TextEditingController();
  
  String _selectedCycle = 'yearly';
  int _activeTab = 0; // 0: UPI/QR, 1: Bank Transfer, 2: eSewa
  XFile? _receiptFile;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _selectedCycle = 'yearly';
  }

  @override
  void dispose() {
    _refController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  // Pick receipt image
  Future<void> _pickReceipt() async {
    try {
      final picker = ImagePicker();
      final file = await picker.pickImage(source: ImageSource.gallery, imageQuality: 85);
      if (file != null) {
        setState(() {
          _receiptFile = file;
        });
      }
    } catch (e) {
      debugPrint('Error picking image: $e');
    }
  }

  double _getCalculatedAmount() {
    switch (_selectedCycle) {
      case 'monthly':
        return widget.plan.priceMonthly;
      case '3_months':
        return widget.plan.price3Months > 0 ? widget.plan.price3Months : widget.plan.priceMonthly * 3;
      case '6_months':
        return widget.plan.price6Months > 0 ? widget.plan.price6Months : widget.plan.priceMonthly * 6;
      case 'yearly':
        return widget.plan.priceYearly > 0 ? widget.plan.priceYearly : widget.plan.priceMonthly * 12;
      default:
        return widget.plan.priceMonthly;
    }
  }

  String _getCycleLabel() {
    switch (_selectedCycle) {
      case 'monthly':
        return 'Monthly Access';
      case '3_months':
        return '3 Months Access';
      case '6_months':
        return '6 Months Access';
      case 'yearly':
        return 'Yearly Access';
      default:
        return 'Subscription Access';
    }
  }

  PaymentMethodInfo? _getPaymentMethodForTab(List<PaymentMethodInfo> methods, int tabIndex) {
    String typeFilter = 'upi_qr';
    if (tabIndex == 1) typeFilter = 'bank_transfer';
    if (tabIndex == 2) typeFilter = 'esewa';

    for (var m in methods) {
      if (m.type == typeFilter && m.isActive) {
        return m;
      }
    }
    return null;
  }

  Future<void> _submitVerification() async {
    if (!_formKey.currentState!.validate()) return;
    
    if (_receiptFile == null) {
      showTopSnackBar(context, 
        SnackBar(
          backgroundColor: AppColors.statusRedBg,
          content: Text(
            'Uploading proof of receipt image is required.',
            style: GoogleFonts.poppins(color: AppColors.textPrimary),
          ),
        ),
      );
      return;
    }

    final provider = context.read<SubscriptionsProvider>();
    final matchedMethod = _getPaymentMethodForTab(provider.paymentMethods, _activeTab);
    
    if (matchedMethod == null) {
      showTopSnackBar(context, 
        SnackBar(
          backgroundColor: AppColors.statusRedBg,
          content: Text(
            'No active payment method configured for this tab. Please choose another tab.',
            style: GoogleFonts.poppins(color: AppColors.textPrimary),
          ),
        ),
      );
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    final success = await provider.checkout(
      planId: widget.plan.id,
      billingCycle: _selectedCycle,
      amount: _getCalculatedAmount(),
      paymentMethodId: matchedMethod.id,
      referenceNumber: _refController.text.trim(),
      receiptFile: _receiptFile!,
      notes: _notesController.text.trim().isNotEmpty ? _notesController.text.trim() : null,
    );

    if (!mounted) return;

    setState(() {
      _isSubmitting = false;
    });

    if (success) {
      showTopSnackBar(context, 
        SnackBar(
          backgroundColor: AppColors.statusGreenBg,
          content: Text(
            'Checkout payment verification submitted successfully!',
            style: GoogleFonts.poppins(color: AppColors.textPrimary),
          ),
        ),
      );
      Navigator.pop(context);
    } else {
      showTopSnackBar(context, 
        SnackBar(
          backgroundColor: AppColors.statusRedBg,
          content: Text(
            provider.error ?? 'Failed to submit payment verification',
            style: GoogleFonts.poppins(color: AppColors.textPrimary),
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<SubscriptionsProvider>();
    final calculatedAmount = _getCalculatedAmount();
    final paymentMethods = provider.paymentMethods;
    final activeMethod = _getPaymentMethodForTab(paymentMethods, _activeTab);

    return Scaffold(
      backgroundColor: AppColors.darkSurface,
      appBar: AppBar(
        backgroundColor: AppColors.darkSurface,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_rounded, color: AppColors.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'CHECKOUT PAYMENT',
              style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.textPrimary),
            ),
            Text(
              'SECURE PAYMENT & VERIFICATION PANEL',
              style: GoogleFonts.poppins(fontSize: 10, color: AppColors.textMuted, letterSpacing: 0.5),
            ),
          ],
        ),
      ),
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            final isWide = constraints.maxWidth > 850;
            
            final leftColumn = Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Tabs selection
                Text(
                  'CHOOSE PAYMENT METHOD',
                  style: GoogleFonts.poppins(color: AppColors.textSecondary, fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                ),
                const SizedBox(height: 12),
                
                // Tabs header
                Container(
                  decoration: BoxDecoration(
                    color: AppColors.darkCard,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.darkBorder),
                  ),
                  child: Row(
                    children: [
                      _buildTabButton(0, 'UPI / QR'),
                      _buildTabButton(1, 'Bank Transfer'),
                      _buildTabButton(2, 'eSewa Wallet'),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Method description body
                AnimatedSwitcher(
                  duration: const Duration(milliseconds: 200),
                  child: activeMethod == null
                      ? Container(
                          key: ValueKey('empty_$_activeTab'),
                          width: double.infinity,
                          padding: const EdgeInsets.all(24),
                          decoration: BoxDecoration(
                            color: AppColors.statusRedBg,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: AppColors.statusRed.withValues(alpha: 0.2)),
                          ),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.warning_amber_rounded, color: AppColors.statusRed, size: 36),
                              const SizedBox(height: 12),
                              Text(
                                'No active payment method configured for this type by Admin.',
                                style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13),
                                textAlign: TextAlign.center,
                              ),
                            ],
                          ),
                        )
                      : Container(
                          key: ValueKey(activeMethod.id),
                          width: double.infinity,
                          padding: const EdgeInsets.all(18),
                          decoration: BoxDecoration(
                            color: AppColors.darkCard,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: AppColors.darkBorder),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                activeMethod.title,
                                style: GoogleFonts.poppins(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 15),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                activeMethod.details,
                                style: GoogleFonts.poppins(color: AppColors.textSecondary, fontSize: 13, height: 1.5),
                              ),
                              if (activeMethod.qrCodeUrl != null && activeMethod.qrCodeUrl!.isNotEmpty) ...[
                                const SizedBox(height: 16),
                                Center(
                                  child: Column(
                                    children: [
                                      Builder(builder: (context) {
                                        final qrUrl = activeMethod.qrCodeUrl!;
                                        final token = context.read<SubscriptionsProvider>().token;
                                        debugPrint('[CheckoutScreen] Loading QR from: $qrUrl');
                                        return ClipRRect(
                                          borderRadius: BorderRadius.circular(12),
                                          child: Container(
                                            color: Colors.white,
                                            padding: const EdgeInsets.all(8),
                                            child: Image.network(
                                              qrUrl,
                                              headers: {
                                                if (token != null) 'Authorization': 'Bearer $token',
                                              },
                                              height: 150,
                                              width: 150,
                                              fit: BoxFit.contain,
                                              loadingBuilder: (_, child, progress) {
                                                if (progress == null) return child;
                                                return SizedBox(
                                                  height: 150,
                                                  width: 150,
                                                  child: Center(
                                                    child: CircularProgressIndicator(
                                                      value: progress.expectedTotalBytes != null
                                                          ? progress.cumulativeBytesLoaded / progress.expectedTotalBytes!
                                                          : null,
                                                    ),
                                                  ),
                                                );
                                              },
                                              errorBuilder: (_, error, __) {
                                                debugPrint('[CheckoutScreen] QR load error: $error');
                                                return SizedBox(
                                                  height: 150,
                                                  width: 150,
                                                  child: Column(
                                                    mainAxisAlignment: MainAxisAlignment.center,
                                                    children: [
                                                      Icon(Icons.broken_image_rounded, color: AppColors.textMuted, size: 48),
                                                      const SizedBox(height: 8),
                                                      Text(
                                                        'QR not available',
                                                        style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 11),
                                                        textAlign: TextAlign.center,
                                                      ),
                                                    ],
                                                  ),
                                                );
                                              },
                                            ),
                                          ),
                                        );
                                      }),
                                      const SizedBox(height: 8),
                                      Text(
                                        'Scan QR Code to Pay',
                                        style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 11),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                ),
              ],
            );

            final rightColumn = Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Order Summary card
                  Text(
                    'ORDER SUMMARY',
                    style: GoogleFonts.poppins(color: AppColors.textSecondary, fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                  ),
                  const SizedBox(height: 12),
                  Container(
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
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  widget.plan.name,
                                  style: GoogleFonts.poppins(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 16),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  _getCycleLabel(),
                                  style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 12),
                                ),
                              ],
                            ),
                            Text(
                              '${AppConstants.currencySymbol} ${calculatedAmount.toStringAsFixed(0)}',
                              style: GoogleFonts.poppins(color: AppColors.accentAmber, fontWeight: FontWeight.bold, fontSize: 20),
                            ),
                          ],
                        ),
                        const Divider(height: 24, color: Colors.white10),
                        
                        // Select cycle selection
                        Text(
                          'Billing Cycle Selection:',
                          style: GoogleFonts.poppins(color: AppColors.textSecondary, fontSize: 11, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          decoration: BoxDecoration(
                            color: AppColors.darkSurface,
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: AppColors.darkBorder),
                          ),
                          child: DropdownButtonHideUnderline(
                            child: DropdownButton<String>(
                              value: _selectedCycle,
                              dropdownColor: AppColors.darkSurface,
                              icon: Icon(Icons.keyboard_arrow_down_rounded, color: AppColors.textSecondary),
                              isExpanded: true,
                              onChanged: (val) {
                                if (val != null) {
                                  setState(() {
                                    _selectedCycle = val;
                                  });
                                }
                              },
                              items: [
                                DropdownMenuItem(
                                  value: 'monthly',
                                  child: Text('Monthly - Rs. ${widget.plan.priceMonthly.toStringAsFixed(0)}', style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13)),
                                ),
                                if (widget.plan.price3Months > 0)
                                  DropdownMenuItem(
                                    value: '3_months',
                                    child: Text('3 Months - Rs. ${widget.plan.price3Months.toStringAsFixed(0)}', style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13)),
                                  ),
                                if (widget.plan.price6Months > 0)
                                  DropdownMenuItem(
                                    value: '6_months',
                                    child: Text('6 Months - Rs. ${widget.plan.price6Months.toStringAsFixed(0)}', style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13)),
                                  ),
                                DropdownMenuItem(
                                  value: 'yearly',
                                  child: Text('Yearly - Rs. ${widget.plan.priceYearly.toStringAsFixed(0)}', style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13)),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Upload Proof form
                  Text(
                    'UPLOAD PROOF OF PAYMENT',
                    style: GoogleFonts.poppins(color: AppColors.textSecondary, fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.darkCard,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.darkBorder),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Receipt Upload Selector
                        Text(
                          'RECEIPT SCREENSHOT*',
                          style: GoogleFonts.poppins(color: AppColors.textSecondary, fontSize: 10, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 8),
                        InkWell(
                          onTap: _pickReceipt,
                          borderRadius: BorderRadius.circular(12),
                          child: Container(
                            width: double.infinity,
                            padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
                            decoration: BoxDecoration(
                              color: AppColors.darkSurface,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: _receiptFile != null ? AppColors.accentAmber.withValues(alpha: 0.5) : AppColors.darkBorder,
                                style: BorderStyle.solid,
                              ),
                            ),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(
                                  _receiptFile != null ? Icons.check_circle_rounded : Icons.cloud_upload_rounded,
                                  color: _receiptFile != null ? AppColors.statusGreen : AppColors.textSecondary,
                                  size: 32,
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  _receiptFile != null ? 'Screenshot Uploaded' : 'Click to upload screenshot',
                                  style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13, fontWeight: FontWeight.bold),
                                  textAlign: TextAlign.center,
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  _receiptFile != null ? _receiptFile!.name : 'PNG, JPG or JPEG up to 5MB',
                                  style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 11),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  textAlign: TextAlign.center,
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),

                        // Transaction Code Input
                        Text(
                          'TRANSACTION REFERENCE CODE*',
                          style: GoogleFonts.poppins(color: AppColors.textSecondary, fontSize: 10, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 6),
                        TextFormField(
                          controller: _refController,
                          style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13),
                          decoration: InputDecoration(
                            hintText: 'Enter bank transfer reference number or Txn ID',
                            hintStyle: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 12),
                            filled: true,
                            fillColor: AppColors.darkSurface,
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: AppColors.darkBorder)),
                            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: AppColors.accentAmber)),
                            errorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: AppColors.statusRed)),
                            focusedErrorBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: AppColors.statusRed)),
                          ),
                          validator: (v) => v == null || v.trim().isEmpty ? 'Transaction reference code is required' : null,
                        ),
                        const SizedBox(height: 16),

                        // Notes Input
                        Text(
                          'NOTES (OPTIONAL)',
                          style: GoogleFonts.poppins(color: AppColors.textSecondary, fontSize: 10, fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 6),
                        TextFormField(
                          controller: _notesController,
                          maxLines: 3,
                          style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13),
                          decoration: InputDecoration(
                            hintText: 'Add transaction details or payment remarks...',
                            hintStyle: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 12),
                            filled: true,
                            fillColor: AppColors.darkSurface,
                            contentPadding: const EdgeInsets.all(12),
                            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: AppColors.darkBorder)),
                            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: AppColors.accentAmber)),
                          ),
                        ),
                        const SizedBox(height: 20),

                        // Submit Button
                        ElevatedButton.icon(
                          onPressed: _isSubmitting ? null : _submitVerification,
                          icon: _isSubmitting
                              ? const SizedBox(height: 18, width: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                              : const Icon(Icons.check_circle_outline_rounded, size: 18),
                          label: Text(
                            _isSubmitting ? 'SUBMITTING VERIFICATION...' : 'SUBMIT PAYMENT VERIFICATION',
                            style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 12),
                          ),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.statusRed,
                            foregroundColor: Colors.white,
                            disabledBackgroundColor: AppColors.statusRed.withValues(alpha: 0.5),
                            disabledForegroundColor: Colors.white70,
                            elevation: 0,
                            minimumSize: const Size(double.infinity, 48),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );

            // Responsive Layout builder
            return SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: isWide
                  ? Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(flex: 3, child: leftColumn),
                        const SizedBox(width: 20),
                        Expanded(flex: 2, child: rightColumn),
                      ],
                    )
                  : Column(
                      children: [
                        leftColumn,
                        const SizedBox(height: 24),
                        rightColumn,
                      ],
                    ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildTabButton(int index, String title) {
    final isActive = _activeTab == index;
    return Expanded(
      child: GestureDetector(
        onTap: () {
          setState(() {
            _activeTab = index;
          });
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          decoration: BoxDecoration(
            color: isActive ? AppColors.darkSurface : Colors.transparent,
            borderRadius: BorderRadius.circular(12),
          ),
          alignment: Alignment.center,
          child: Text(
            title,
            style: GoogleFonts.poppins(
              color: isActive ? AppColors.textPrimary : AppColors.textMuted,
              fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
              fontSize: 12,
            ),
          ),
        ),
      ),
    );
  }
}
