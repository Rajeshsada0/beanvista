import 'package:icafe_app/core/utils/snackbar_helper.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/branches_provider.dart';
import '../../providers/app_provider.dart';
import '../../providers/subscriptions_provider.dart';
import '../../providers/menu_provider.dart';
import '../../providers/tables_provider.dart';

class BranchesScreen extends StatefulWidget {
  const BranchesScreen({super.key});

  @override
  State<BranchesScreen> createState() => _BranchesScreenState();
}

class _BranchesScreenState extends State<BranchesScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final appProv = context.read<AppProvider>();
      context.read<BranchesProvider>().fetchBranches(appProv);
      context.read<SubscriptionsProvider>().fetchSubscriptionDetails();
    });
  }

  void _showBranchForm({BranchItem? branch}) {
    final nameCtrl = TextEditingController(text: branch?.name ?? '');
    final codeCtrl = TextEditingController(text: branch?.code ?? '');
    final addressCtrl = TextEditingController(text: branch?.address ?? '');
    final phoneCtrl = TextEditingController(text: branch?.phone ?? '');
    bool isActive = branch?.isActive ?? true;
    final formKey = GlobalKey<FormState>();

    showDialog(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              backgroundColor: AppColors.darkSurface,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              title: Text(
                branch == null ? 'Add Branch' : 'Edit Branch',
                style: GoogleFonts.poppins(color: AppColors.textPrimary, fontWeight: FontWeight.bold),
              ),
              content: SizedBox(
                width: double.maxFinite,
                child: Form(
                  key: formKey,
                  child: ListView(
                    shrinkWrap: true,
                    children: [
                      TextFormField(
                        controller: nameCtrl,
                        style: GoogleFonts.poppins(color: AppColors.textPrimary),
                        decoration: InputDecoration(
                          labelText: 'Branch Name',
                          labelStyle: GoogleFonts.poppins(color: AppColors.textMuted),
                          enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: AppColors.darkBorder)),
                          focusedBorder: UnderlineInputBorder(borderSide: BorderSide(color: AppColors.accentAmber)),
                        ),
                        validator: (v) => v == null || v.trim().isEmpty ? 'Name is required' : null,
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: codeCtrl,
                        style: GoogleFonts.poppins(color: AppColors.textPrimary),
                        decoration: InputDecoration(
                          labelText: 'Branch Code (Optional)',
                          labelStyle: GoogleFonts.poppins(color: AppColors.textMuted),
                          hintText: 'e.g. BR-KTM',
                          hintStyle: GoogleFonts.poppins(color: AppColors.textMuted),
                          enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: AppColors.darkBorder)),
                          focusedBorder: UnderlineInputBorder(borderSide: BorderSide(color: AppColors.accentAmber)),
                        ),
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: addressCtrl,
                        style: GoogleFonts.poppins(color: AppColors.textPrimary),
                        decoration: InputDecoration(
                          labelText: 'Address (Optional)',
                          labelStyle: GoogleFonts.poppins(color: AppColors.textMuted),
                          enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: AppColors.darkBorder)),
                          focusedBorder: UnderlineInputBorder(borderSide: BorderSide(color: AppColors.accentAmber)),
                        ),
                      ),
                      const SizedBox(height: 16),
                      TextFormField(
                        controller: phoneCtrl,
                        style: GoogleFonts.poppins(color: AppColors.textPrimary),
                        decoration: InputDecoration(
                          labelText: 'Phone Number (Optional)',
                          labelStyle: GoogleFonts.poppins(color: AppColors.textMuted),
                          enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: AppColors.darkBorder)),
                          focusedBorder: UnderlineInputBorder(borderSide: BorderSide(color: AppColors.accentAmber)),
                        ),
                      ),
                      const SizedBox(height: 20),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Status (Active)',
                            style: GoogleFonts.poppins(color: AppColors.textSecondary, fontSize: 14),
                          ),
                          Transform.scale(
                            scale: 0.8,
                            child: Switch(
                              value: isActive,
                              activeColor: AppColors.accentAmber,
                              inactiveThumbColor: AppColors.textSecondary,
                              onChanged: (val) {
                                setDialogState(() {
                                  isActive = val;
                                });
                              },
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
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
                    if (!formKey.currentState!.validate()) return;
                    
                    final appProv = context.read<AppProvider>();
                    final provider = context.read<BranchesProvider>();
                    final messenger = ScaffoldMessenger.of(context);
                    
                    Navigator.pop(ctx);
                    
                    bool success;
                    if (branch == null) {
                      success = await provider.createBranch(
                        name: nameCtrl.text.trim(),
                        code: codeCtrl.text.trim().isNotEmpty ? codeCtrl.text.trim() : null,
                        address: addressCtrl.text.trim().isNotEmpty ? addressCtrl.text.trim() : null,
                        phone: phoneCtrl.text.trim().isNotEmpty ? phoneCtrl.text.trim() : null,
                        isActive: isActive,
                        appProv: appProv,
                      );
                    } else {
                      success = await provider.updateBranch(
                        id: branch.id,
                        name: nameCtrl.text.trim(),
                        code: codeCtrl.text.trim().isNotEmpty ? codeCtrl.text.trim() : null,
                        address: addressCtrl.text.trim().isNotEmpty ? addressCtrl.text.trim() : null,
                        phone: phoneCtrl.text.trim().isNotEmpty ? phoneCtrl.text.trim() : null,
                        isActive: isActive,
                        appProv: appProv,
                      );
                    }

                    showTopSnackBarWithMessenger(messenger, context, 
                      SnackBar(
                        backgroundColor: success ? AppColors.statusGreenBg : AppColors.statusRedBg,
                        content: Text(
                          success
                              ? (branch == null ? 'Branch created successfully' : 'Branch updated successfully')
                              : (provider.error ?? 'An error occurred'),
                          style: GoogleFonts.poppins(color: AppColors.textPrimary),
                        ),
                      ),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.accentAmber,
                    foregroundColor: AppColors.textOnAmber,
                    elevation: 0,
                    padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 10),
                    minimumSize: const Size(95, 40),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  child: Text(
                    branch == null ? 'Create' : 'Save',
                    style: GoogleFonts.poppins(fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            );
          },
        );
      },
    );
  }

  void _deleteBranch(BranchItem branch) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.darkSurface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text('Delete Branch', style: GoogleFonts.poppins(color: AppColors.textPrimary, fontWeight: FontWeight.bold)),
        content: Text(
          'Are you sure you want to delete ${branch.name}? This will remove tables associated with it. This action cannot be undone.',
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
              final appProv = context.read<AppProvider>();
              final provider = context.read<BranchesProvider>();
              final messenger = ScaffoldMessenger.of(context);

              Navigator.pop(ctx);
              
              final success = await provider.deleteBranch(branch.id, appProv);

              showTopSnackBarWithMessenger(messenger, context, 
                SnackBar(
                  backgroundColor: success ? AppColors.statusGreenBg : AppColors.statusRedBg,
                  content: Text(
                    success ? 'Branch deleted successfully' : (provider.error ?? 'Failed to delete branch'),
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

  void _handleSwitchBranch(BranchItem branch, AppProvider appProv, BranchesProvider provider) async {
    final messenger = ScaffoldMessenger.of(context);
    final success = await provider.switchBranch(branch.id, branch.name, appProv);
    
    if (success) {
      showTopSnackBarWithMessenger(messenger, context, 
        SnackBar(
          backgroundColor: AppColors.statusGreenBg,
          content: Text('Switched branch context to ${branch.name}.', style: GoogleFonts.poppins(color: AppColors.textPrimary)),
        ),
      );
      
      // Reload current menus & tables dynamically for the new branch
      if (mounted) {
        context.read<MenuProvider>().fetchMenus();
        context.read<TablesProvider>().fetchTables();
      }
    } else {
      showTopSnackBarWithMessenger(messenger, context, 
        SnackBar(
          backgroundColor: AppColors.statusRedBg,
          content: Text(provider.error ?? 'Failed to switch branch context', style: GoogleFonts.poppins(color: AppColors.textPrimary)),
        ),
      );
    }
  }

  Widget _buildSummaryCard(int activeCount, int limit) {
    String limitText = limit <= 0 ? 'Unlimited' : limit.toString();
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.darkCard,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: AppColors.darkBorder),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('ACTIVE BRANCHES', style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 10, fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              Text(
                '$activeCount Active',
                style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 18, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text('SUBSCRIPTION LIMIT', style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 10, fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              Text(
                limitText,
                style: GoogleFonts.poppins(color: AppColors.accentAmber, fontSize: 18, fontWeight: FontWeight.bold),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBranchCard(BranchItem branch, bool isPrimary, AppProvider appProv, BranchesProvider provider) {
    final isActive = branch.isActive;
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppColors.darkCard,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isPrimary
              ? AppColors.accentAmber.withOpacity(0.3)
              : AppColors.darkBorder,
          width: 1.5,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            // Circular badge with status/primary icon
            Container(
              width: 52,
              height: 52,
              decoration: BoxDecoration(
                gradient: isPrimary ? LinearGradient(
                  colors: [AppColors.accentAmberLight, AppColors.accentAmber],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ) : null,
                color: isPrimary ? null : AppColors.darkSurface,
                shape: BoxShape.circle,
                border: Border.all(
                  color: isPrimary ? Colors.transparent : AppColors.darkBorder,
                  width: 1,
                ),
              ),
              child: Center(
                child: Icon(
                  isPrimary ? Icons.star_rounded : Icons.store_rounded,
                  color: isPrimary ? AppColors.textOnAmber : AppColors.textMuted,
                  size: 24,
                ),
              ),
            ),
            const SizedBox(width: 16),

            // Details
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          branch.name,
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
                      if (isPrimary)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.statusGreenBg,
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: AppColors.statusGreen.withOpacity(0.3)),
                          ),
                          child: Text(
                            'PRIMARY',
                            style: GoogleFonts.poppins(
                              color: AppColors.statusGreen,
                              fontWeight: FontWeight.w800,
                              fontSize: 8,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ),
                      if (!isPrimary && !isActive)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.darkSurface,
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: AppColors.darkBorder),
                          ),
                          child: Text(
                            'INACTIVE',
                            style: GoogleFonts.poppins(
                              color: AppColors.textMuted,
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
                    branch.address ?? 'No address configured',
                    style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 11),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (branch.phone != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      branch.phone!,
                      style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 10),
                    ),
                  ],
                ],
              ),
            ),

            // Actions menu
            PopupMenuButton<String>(
              icon: Icon(Icons.more_vert_rounded, color: AppColors.textSecondary),
              color: AppColors.darkSurface,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              onSelected: (val) {
                if (val == 'switch') {
                  _handleSwitchBranch(branch, appProv, provider);
                } else if (val == 'edit') {
                  _showBranchForm(branch: branch);
                } else if (val == 'delete') {
                  _deleteBranch(branch);
                }
              },
              itemBuilder: (context) => [
                if (!isPrimary && isActive)
                  PopupMenuItem(
                    value: 'switch',
                    child: Row(
                      children: [
                        Icon(Icons.swap_horiz_rounded, color: AppColors.accentGold, size: 18),
                        const SizedBox(width: 10),
                        Text('Switch Primary', style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13)),
                      ],
                    ),
                  ),
                PopupMenuItem(
                  value: 'edit',
                  child: Row(
                    children: [
                      Icon(Icons.edit_rounded, color: AppColors.textSecondary, size: 18),
                      const SizedBox(width: 10),
                      Text('Edit Details', style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13)),
                    ],
                  ),
                ),
                if (!isPrimary)
                  PopupMenuItem(
                    value: 'delete',
                    child: Row(
                      children: [
                        Icon(Icons.delete_outline_rounded, color: AppColors.statusRed, size: 18),
                        const SizedBox(width: 10),
                        Text('Delete Branch', style: GoogleFonts.poppins(color: AppColors.statusRed, fontSize: 13)),
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
    final appProv = context.watch<AppProvider>();
    final provider = context.watch<BranchesProvider>();
    final subProv = context.watch<SubscriptionsProvider>();

    int branchLimit = 1;
    if (subProv.currentSubscription != null) {
      final activePlan = subProv.plans.firstWhere((p) => p.id == subProv.currentSubscription!.planId, orElse: () => subProv.plans.first);
      branchLimit = activePlan.maxBranches;
    } else if (subProv.trialInfo != null && !subProv.trialInfo!.isExpired) {
      branchLimit = 2; // trial limit
    }

    final activeCount = provider.branches.where((b) => b.isActive).length;

    return Scaffold(
      backgroundColor: AppColors.darkBg,
      appBar: AppBar(
        title: Text(
          'Manage Branches',
          style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 18, fontWeight: FontWeight.bold),
        ),
        backgroundColor: AppColors.darkSurface,
        surfaceTintColor: Colors.transparent,
        actions: [
          IconButton(
            onPressed: () => _showBranchForm(),
            icon: Icon(Icons.add_rounded, color: AppColors.accentAmber),
            tooltip: 'Add Branch',
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          context.read<BranchesProvider>().fetchBranches(appProv);
          context.read<SubscriptionsProvider>().fetchSubscriptionDetails();
        },
        color: AppColors.accentAmber,
        backgroundColor: AppColors.darkSurface,
        child: provider.isLoading && provider.branches.isEmpty
            ? Center(
                child: CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation<Color>(AppColors.accentAmber),
                ),
              )
            : provider.error != null && provider.branches.isEmpty
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
                            onPressed: () => provider.fetchBranches(appProv),
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
                      // Active summary card
                      _buildSummaryCard(activeCount, branchLimit),
                      const SizedBox(height: 20),

                      // Listing header
                      Row(
                        children: [
                          Icon(Icons.domain_rounded, color: AppColors.textSecondary, size: 18),
                          const SizedBox(width: 8),
                          Text(
                            'REGISTERED BRANCHES',
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

                      if (provider.branches.isEmpty)
                        Center(
                          child: Padding(
                            padding: const EdgeInsets.symmetric(vertical: 60),
                            child: Text('No branches registered yet.', style: GoogleFonts.poppins(color: AppColors.textSecondary)),
                          ),
                        )
                      else
                        ListView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: provider.branches.length,
                          itemBuilder: (context, index) {
                            final branch = provider.branches[index];
                            final isPrimary = branch.id == provider.activeBranchId;
                            return _buildBranchCard(branch, isPrimary, appProv, provider);
                          },
                        ),
                    ],
                  ),
      ),
    );
  }
}
