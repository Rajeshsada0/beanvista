import 'package:icafe_app/core/utils/snackbar_helper.dart';
import 'package:icafe_app/core/constants/app_constants.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/subscriptions_provider.dart';
import 'checkout_screen.dart';

class MyPlanScreen extends StatefulWidget {
  const MyPlanScreen({super.key});

  @override
  State<MyPlanScreen> createState() => _MyPlanScreenState();
}

class _MyPlanScreenState extends State<MyPlanScreen> with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  late Animation<double> _fadeAnim;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _fadeAnim = CurvedAnimation(parent: _animController, curve: Curves.easeOut);
    _animController.forward();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<SubscriptionsProvider>().fetchSubscriptionDetails();
    });
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  void _showCancelRequestDialog(PaymentRequestInfo request) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.darkSurface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text(
          'Cancel Request',
          style: GoogleFonts.plusJakartaSans(color: AppColors.textPrimary, fontWeight: FontWeight.bold),
        ),
        content: Text(
          'Are you sure you want to cancel this pending verification request? This will remove the uploaded receipt.',
          style: GoogleFonts.plusJakartaSans(color: AppColors.textSecondary, fontSize: 13),
        ),
        actionsPadding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text(
              'Cancel',
              style: GoogleFonts.plusJakartaSans(
                color: AppColors.textMuted,
                fontWeight: FontWeight.w600,
                fontSize: 14,
              ),
            ),
          ),
          ElevatedButton(
            onPressed: () async {
              final provider = context.read<SubscriptionsProvider>();
              final messenger = ScaffoldMessenger.of(context);

              Navigator.pop(ctx);
              
              final success = await provider.cancelPendingRequest(request.id);

              if (!mounted) return;
              showTopSnackBarWithMessenger(messenger, context, 
                SnackBar(
                  backgroundColor: success ? AppColors.statusGreenBg : AppColors.statusRedBg,
                  content: Text(
                    success ? 'Verification request cancelled.' : (provider.error ?? 'Failed to cancel request'),
                    style: GoogleFonts.plusJakartaSans(color: AppColors.textPrimary),
                  ),
                ),
              );

              if (success) {
                provider.fetchSubscriptionDetails();
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.statusRed,
              foregroundColor: Colors.white,
              elevation: 0,
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
              minimumSize: const Size(95, 40),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: Text('Remove', style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryCard(SubscriptionInfo? sub, TrialInfo? trial) {
    final String rawPlanName = sub?.planName ?? 'Trial Plan';
    final String planName = rawPlanName.toUpperCase();
    final String status = sub?.status.toUpperCase() ?? (trial != null ? 'TRIAL' : 'EXPIRED');
    final bool isTrialActive = trial != null && !trial.isExpired;
    final bool isSubActive = sub != null && !sub.isExpired;
    final bool isActive = isSubActive || isTrialActive;

    final Color statusColor = isActive ? AppColors.statusGreen : AppColors.statusRed;
    final Color statusBg = isActive ? AppColors.statusGreenBg : AppColors.statusRedBg;

    int daysRemaining = 0;
    if (sub != null && !sub.isExpired && sub.endsAt != null) {
      final diff = DateTime.parse(sub.endsAt!).difference(DateTime.now()).inDays;
      daysRemaining = diff < 0 ? 0 : diff;
    } else if (trial != null && !trial.isExpired) {
      daysRemaining = trial.daysRemaining;
    }

    final String dateString = (sub != null && !sub.isExpired)
        ? (sub.endsAt ?? 'N/A')
        : (trial != null && !trial.isExpired ? trial.endsAt.split('T')[0] : 'N/A');

    return Container(
      decoration: BoxDecoration(
        color: AppColors.darkCard,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(
          color: isActive
              ? AppColors.darkBorder
              : AppColors.statusRed.withValues(alpha: 0.4),
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.isDark
                ? Colors.black.withValues(alpha: 0.3)
                : const Color(0xFF94A3B8).withValues(alpha: 0.15),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Row
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      planName,
                      style: GoogleFonts.plusJakartaSans(
                        color: AppColors.textPrimary,
                        fontSize: 18,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.5,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: statusBg,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: statusColor.withValues(alpha: 0.3)),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Container(
                            width: 6,
                            height: 6,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: statusColor,
                            ),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            status,
                            style: GoogleFonts.plusJakartaSans(
                              color: statusColor,
                              fontWeight: FontWeight.w800,
                              fontSize: 11,
                              letterSpacing: 0.8,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Divider(color: AppColors.darkBorder.withValues(alpha: 0.6), height: 1),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Validity Remaining',
                          style: GoogleFonts.plusJakartaSans(
                            color: AppColors.textMuted,
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          isActive ? '$daysRemaining Days' : 'Expired',
                          style: GoogleFonts.plusJakartaSans(
                            color: isActive ? AppColors.textPrimary : AppColors.statusRed,
                            fontWeight: FontWeight.w800,
                            fontSize: 18,
                          ),
                        ),
                      ],
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text(
                          'Renewal Date',
                          style: GoogleFonts.plusJakartaSans(
                            color: AppColors.textMuted,
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          dateString,
                          style: GoogleFonts.plusJakartaSans(
                            color: AppColors.textPrimary,
                            fontWeight: FontWeight.w800,
                            fontSize: 16,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPendingCard(PaymentRequestInfo req) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.darkCard,
        borderRadius: BorderRadius.circular(22),
        border: Border.all(color: const Color(0xFFF59E0B).withValues(alpha: 0.5), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFF59E0B).withValues(alpha: 0.1),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: const Color(0xFFF59E0B).withValues(alpha: 0.15),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.hourglass_top_rounded, color: Color(0xFFF59E0B), size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Verification Pending',
                      style: GoogleFonts.plusJakartaSans(
                        color: const Color(0xFFF59E0B),
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      'Payment receipt submitted for verification',
                      style: GoogleFonts.plusJakartaSans(
                        color: AppColors.textMuted,
                        fontSize: 11,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            'We are verifying your payment request for the ${req.planName} plan (${req.billingCycle.replaceAll('_', ' ')}). Please allow time for admin confirmation.',
            style: GoogleFonts.plusJakartaSans(color: AppColors.textSecondary, fontSize: 12, height: 1.4),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.darkSurface,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('TXN Reference', style: GoogleFonts.plusJakartaSans(color: AppColors.textMuted, fontSize: 10, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 2),
                    Text(req.referenceNumber, style: GoogleFonts.plusJakartaSans(color: AppColors.textPrimary, fontSize: 13, fontWeight: FontWeight.bold)),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text('Amount', style: GoogleFonts.plusJakartaSans(color: AppColors.textMuted, fontSize: 10, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 2),
                    Text('${AppConstants.currencySymbol} ${req.amount.toStringAsFixed(2)}', style: GoogleFonts.plusJakartaSans(color: const Color(0xFFF59E0B), fontSize: 14, fontWeight: FontWeight.w800)),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          OutlinedButton.icon(
            onPressed: () => _showCancelRequestDialog(req),
            icon: Icon(Icons.cancel_outlined, size: 16, color: AppColors.statusRed),
            label: Text('Cancel Request', style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.bold, fontSize: 12)),
            style: OutlinedButton.styleFrom(
              foregroundColor: AppColors.statusRed,
              side: BorderSide(color: AppColors.statusRed.withValues(alpha: 0.5)),
              minimumSize: const Size(double.infinity, 40),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPlanCard(SubscriptionPlan plan, bool isActive, {bool isPopular = false}) {
    final Color cardBorderColor = isActive
        ? AppColors.statusRed
        : (isPopular ? const Color(0xFFF59E0B) : AppColors.darkBorder);

    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      decoration: BoxDecoration(
        color: AppColors.darkCard,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: cardBorderColor,
          width: isActive || isPopular ? 2 : 1,
        ),
        boxShadow: [
          BoxShadow(
            color: isPopular
                ? const Color(0xFFF59E0B).withValues(alpha: 0.08)
                : (AppColors.isDark ? Colors.black.withValues(alpha: 0.2) : const Color(0xFF94A3B8).withValues(alpha: 0.12)),
            blurRadius: 20,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Banner for Popular / Active
          if (isPopular || isActive)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 6),
              decoration: BoxDecoration(
                color: isActive ? AppColors.statusRed : const Color(0xFFF59E0B),
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(22),
                  topRight: Radius.circular(22),
                ),
              ),
              child: Center(
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      isActive ? Icons.check_circle_rounded : Icons.star_rounded,
                      color: Colors.white,
                      size: 13,
                    ),
                    const SizedBox(width: 5),
                    Text(
                      isActive ? 'CURRENT ACTIVE PLAN' : 'MOST POPULAR',
                      style: GoogleFonts.plusJakartaSans(
                        color: Colors.white,
                        fontWeight: FontWeight.w800,
                        fontSize: 10,
                        letterSpacing: 1.0,
                      ),
                    ),
                  ],
                ),
              ),
            ),

          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Title and Price Header
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            plan.name,
                            style: GoogleFonts.plusJakartaSans(
                              color: AppColors.textPrimary,
                              fontWeight: FontWeight.w800,
                              fontSize: 20,
                            ),
                          ),
                          if (plan.description.isNotEmpty) ...[
                            const SizedBox(height: 4),
                            Text(
                              plan.description,
                              style: GoogleFonts.plusJakartaSans(
                                color: AppColors.textSecondary,
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        RichText(
                          text: TextSpan(
                            children: [
                              TextSpan(
                                text: '${AppConstants.currencySymbol} ',
                                style: GoogleFonts.plusJakartaSans(
                                  color: AppColors.statusRed,
                                  fontWeight: FontWeight.w700,
                                  fontSize: 14,
                                ),
                              ),
                              TextSpan(
                                text: plan.priceMonthly.toStringAsFixed(0),
                                style: GoogleFonts.plusJakartaSans(
                                  color: AppColors.statusRed,
                                  fontWeight: FontWeight.w900,
                                  fontSize: 22,
                                ),
                              ),
                              TextSpan(
                                text: '/mo',
                                style: GoogleFonts.plusJakartaSans(
                                  color: AppColors.textMuted,
                                  fontWeight: FontWeight.w600,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),

                const SizedBox(height: 18),

                // Resource Limit Badges Row
                Row(
                  children: [
                    Expanded(
                      child: _buildLimitChip(
                        'Branches',
                        plan.maxBranches <= 0 ? 'Unlimited' : plan.maxBranches.toString(),
                        Icons.storefront_rounded,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _buildLimitChip(
                        'Tables',
                        plan.maxTables <= 0 ? 'Unlimited' : plan.maxTables.toString(),
                        Icons.table_restaurant_rounded,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _buildLimitChip(
                        'Users',
                        plan.maxUsers <= 0 ? 'Unlimited' : plan.maxUsers.toString(),
                        Icons.people_alt_rounded,
                      ),
                    ),
                  ],
                ),

                const SizedBox(height: 20),
                Divider(color: AppColors.darkBorder.withValues(alpha: 0.6), height: 1),
                const SizedBox(height: 18),

                // Features list
                if (plan.features.isNotEmpty) ...[
                  ...plan.features.map(
                    (f) => Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            margin: const EdgeInsets.only(top: 2),
                            padding: const EdgeInsets.all(3),
                            decoration: BoxDecoration(
                              color: AppColors.statusRed.withValues(alpha: 0.12),
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              Icons.check_rounded,
                              color: AppColors.statusRed,
                              size: 12,
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              f,
                              style: GoogleFonts.plusJakartaSans(
                                color: AppColors.textPrimary,
                                fontSize: 13,
                                height: 1.3,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 20),
                ],

                // Action CTA Button
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    onPressed: isActive
                        ? null
                        : () async {
                            await Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => CheckoutScreen(plan: plan),
                              ),
                            );
                            if (mounted) {
                              context.read<SubscriptionsProvider>().fetchSubscriptionDetails();
                            }
                          },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: isActive
                          ? AppColors.darkSurface
                          : AppColors.statusRed,
                      foregroundColor: isActive
                          ? AppColors.textMuted
                          : Colors.white,
                      elevation: isActive ? 0 : 4,
                      shadowColor: AppColors.statusRed.withValues(alpha: 0.4),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    child: Text(
                      isActive ? 'CURRENT ACTIVE PLAN' : 'CHOOSE ${plan.name.toUpperCase()}',
                      style: GoogleFonts.plusJakartaSans(
                        fontWeight: FontWeight.w800,
                        fontSize: 14,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLimitChip(String label, String value, IconData icon) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
      decoration: BoxDecoration(
        color: AppColors.darkSurface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.darkBorder.withValues(alpha: 0.7)),
      ),
      child: Column(
        children: [
          Text(
            label,
            style: GoogleFonts.plusJakartaSans(
              color: AppColors.textMuted,
              fontSize: 10,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            textAlign: TextAlign.center,
            style: GoogleFonts.plusJakartaSans(
              color: AppColors.textPrimary,
              fontSize: 13,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<SubscriptionsProvider>();

    return Scaffold(
      backgroundColor: AppColors.darkBg,
      appBar: AppBar(
        title: Text(
          'My Subscription Plan',
          style: GoogleFonts.plusJakartaSans(
            color: AppColors.textPrimary,
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        backgroundColor: AppColors.darkSurface,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
      ),
      body: RefreshIndicator(
        onRefresh: provider.fetchSubscriptionDetails,
        color: AppColors.accentAmber,
        backgroundColor: AppColors.darkSurface,
        child: FadeTransition(
          opacity: _fadeAnim,
          child: provider.isLoading && provider.plans.isEmpty
              ? Center(
                  child: CircularProgressIndicator(
                    valueColor: AlwaysStoppedAnimation<Color>(AppColors.accentAmber),
                  ),
                )
              : provider.error != null && provider.plans.isEmpty
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
                              style: GoogleFonts.plusJakartaSans(color: AppColors.textPrimary, fontSize: 14),
                            ),
                            const SizedBox(height: 16),
                            ElevatedButton(
                              onPressed: provider.fetchSubscriptionDetails,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.accentAmber,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                              child: Text('Retry', style: GoogleFonts.plusJakartaSans(color: AppColors.textOnAmber, fontWeight: FontWeight.bold)),
                            ),
                          ],
                        ),
                      ),
                    )
                  : ListView(
                      padding: const EdgeInsets.all(18),
                      children: [
                        // Active Subscription Summary Card
                        _buildSummaryCard(provider.currentSubscription, provider.trialInfo),
                        const SizedBox(height: 22),

                        // Verification Request Card (if pending)
                        if (provider.pendingRequest != null) ...[
                          _buildPendingCard(provider.pendingRequest!),
                          const SizedBox(height: 24),
                        ],

                        // Available Plans Section Header
                        Row(
                          children: [
                            Icon(Icons.layers_rounded, color: AppColors.textSecondary, size: 18),
                            const SizedBox(width: 8),
                            Text(
                              'UPGRADE AVAILABLE PLANS',
                              style: GoogleFonts.plusJakartaSans(
                                color: AppColors.textSecondary,
                                fontSize: 12,
                                fontWeight: FontWeight.w800,
                                letterSpacing: 1.2,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 14),

                        if (provider.plans.isEmpty)
                          Center(
                            child: Padding(
                              padding: const EdgeInsets.symmetric(vertical: 40),
                              child: Text(
                                'No plans configured on the server.',
                                style: GoogleFonts.plusJakartaSans(color: AppColors.textSecondary),
                              ),
                            ),
                          )
                        else
                          ListView.builder(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: provider.plans.length,
                            itemBuilder: (context, index) {
                              final plan = provider.plans[index];
                              final isActive = provider.currentSubscription != null &&
                                  provider.currentSubscription!.status == 'active' &&
                                  !provider.currentSubscription!.isExpired &&
                                  provider.currentSubscription!.planId == plan.id;
                              final isPopular = plan.name.toLowerCase().contains('pro') || index == 0;
                              return _buildPlanCard(plan, isActive, isPopular: isPopular);
                            },
                          ),
                      ],
                    ),
        ),
      ),
    );
  }
}
