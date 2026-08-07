import 'package:icafe_app/core/utils/snackbar_helper.dart';
import 'package:icafe_app/core/constants/app_constants.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/staff_performance_provider.dart';
import '../../providers/auth_provider.dart';

class _HighlightCardData {
  final String title;
  final IconData icon;
  final Color color;
  final String name;
  final String value;

  _HighlightCardData({
    required this.title,
    required this.icon,
    required this.color,
    required this.name,
    required this.value,
  });
}

class StaffPerformanceScreen extends StatefulWidget {
  const StaffPerformanceScreen({super.key});

  @override
  State<StaffPerformanceScreen> createState() => _StaffPerformanceScreenState();
}

class _StaffPerformanceScreenState extends State<StaffPerformanceScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<StaffPerformanceProvider>().fetchPerformance();
    });
  }

  String _formatDuration(double mins) {
    if (mins <= 0) return 'N/A';
    final int m = mins.round();
    if (m < 60) return '${m}m';
    final int h = m ~/ 60;
    final int remM = m % 60;
    return remM > 0 ? '${h}h ${remM}m' : '${h}h';
  }

  Widget _buildHighlightCards(List<StaffPerformanceItem> staffList) {
    if (staffList.isEmpty) return const SizedBox.shrink();

    StaffPerformanceItem? topSalesStaff;
    StaffPerformanceItem? mostOrdersStaff;
    StaffPerformanceItem? highestAvgStaff;
    StaffPerformanceItem? fastestStaff;

    for (var s in staffList) {
      if (topSalesStaff == null || s.totalSales > topSalesStaff.totalSales) {
        topSalesStaff = s;
      }
      if (mostOrdersStaff == null || s.totalOrders > mostOrdersStaff.totalOrders) {
        mostOrdersStaff = s;
      }
      final avg = s.totalOrders > 0 ? s.totalSales / s.totalOrders : 0.0;
      final topAvg = (highestAvgStaff != null && highestAvgStaff.totalOrders > 0)
          ? highestAvgStaff.totalSales / highestAvgStaff.totalOrders
          : 0.0;
      if (highestAvgStaff == null || avg > topAvg) {
        highestAvgStaff = s;
      }
      if (s.totalOrders > 0 && (fastestStaff == null || s.avgOrderDuration < fastestStaff.avgOrderDuration)) {
        fastestStaff = s;
      }
    }

    final cards = [
      _HighlightCardData(
        title: 'Top Sales',
        icon: Icons.workspace_premium_rounded,
        color: const Color(0xFF2563EB),
        name: (topSalesStaff != null && topSalesStaff.totalSales > 0) ? topSalesStaff.name : 'N/A',
        value: (topSalesStaff != null && topSalesStaff.totalSales > 0)
            ? '${AppConstants.currencySymbol} ${topSalesStaff.totalSales.toStringAsFixed(0)}'
            : '${AppConstants.currencySymbol} 0',
      ),
      _HighlightCardData(
        title: 'Most Orders',
        icon: Icons.shopping_bag_rounded,
        color: const Color(0xFF059669),
        name: (mostOrdersStaff != null && mostOrdersStaff.totalOrders > 0) ? mostOrdersStaff.name : 'N/A',
        value: (mostOrdersStaff != null && mostOrdersStaff.totalOrders > 0)
            ? '${mostOrdersStaff.totalOrders} Orders'
            : '0 Orders',
      ),
      _HighlightCardData(
        title: 'Highest Sales',
        icon: Icons.star_rounded,
        color: const Color(0xFFD97706),
        name: (highestAvgStaff != null && highestAvgStaff.totalSales > 0) ? highestAvgStaff.name : 'N/A',
        value: (highestAvgStaff != null && highestAvgStaff.totalSales > 0)
            ? '${AppConstants.currencySymbol} ${highestAvgStaff.totalSales.toStringAsFixed(0)}'
            : '${AppConstants.currencySymbol} 0',
      ),
      _HighlightCardData(
        title: 'Fastest Server',
        icon: Icons.bolt_rounded,
        color: const Color(0xFF9333EA),
        name: fastestStaff != null ? fastestStaff.name : 'N/A',
        value: fastestStaff != null ? _formatDuration(fastestStaff.avgOrderDuration) : 'N/A',
      ),
    ];

    return SizedBox(
      height: 102,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: cards.length,
        separatorBuilder: (_, __) => const SizedBox(width: 12),
        itemBuilder: (context, index) {
          final item = cards[index];
          return Container(
            width: 150,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: item.color,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: item.color.withOpacity(0.25),
                  blurRadius: 8,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Icon(item.icon, color: Colors.white.withOpacity(0.9), size: 14),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        item.title,
                        style: GoogleFonts.poppins(
                          color: Colors.white.withOpacity(0.9),
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.name,
                      style: GoogleFonts.poppins(
                        color: Colors.white,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      item.value,
                      style: GoogleFonts.poppins(
                        color: Colors.white.withOpacity(0.95),
                        fontSize: 13,
                        fontWeight: FontWeight.w800,
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
      ),
    );
  }

  Widget _buildCleanMetricItem({
    required String label,
    required String value,
    required IconData icon,
    Color? valueColor,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 10, color: AppColors.textMuted),
            const SizedBox(width: 3),
            Text(
              label,
              style: GoogleFonts.poppins(
                color: AppColors.textMuted,
                fontSize: 8.5,
                fontWeight: FontWeight.w600,
                letterSpacing: 0.3,
              ),
            ),
          ],
        ),
        const SizedBox(height: 3),
        Text(
          value,
          style: GoogleFonts.poppins(
            color: valueColor ?? AppColors.textPrimary,
            fontSize: 11.5,
            fontWeight: FontWeight.bold,
          ),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
      ],
    );
  }

  Widget _buildStaffCard(StaffPerformanceItem staff, bool isAdmin, int? currentUserId) {
    final initials = staff.name.isNotEmpty
        ? staff.name.split(' ').map((e) => e[0]).take(2).join().toUpperCase()
        : 'S';

    Color roleColor;
    Color roleBg;
    if (staff.role == 'admin' || staff.role == 'super_admin') {
      roleColor = AppColors.statusPurple;
      roleBg = AppColors.statusPurple.withOpacity(0.12);
    } else if (staff.role == 'kitchen') {
      roleColor = AppColors.statusBlue;
      roleBg = AppColors.statusBlue.withOpacity(0.12);
    } else {
      roleColor = AppColors.accentGold;
      roleBg = AppColors.accentGold.withOpacity(0.12);
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: AppColors.darkCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.darkBorder),
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          children: [
            // Avatar, Name, and Role Capsule
            Row(
              children: [
                CircleAvatar(
                  radius: 18,
                  backgroundColor: roleBg,
                  child: Text(
                    initials,
                    style: GoogleFonts.poppins(color: roleColor, fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        staff.name,
                        style: GoogleFonts.poppins(
                          color: AppColors.textPrimary,
                          fontWeight: FontWeight.bold,
                          fontSize: 13.5,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      Text(
                        staff.email,
                        style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 10.5),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: roleBg,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    staff.role.toUpperCase(),
                    style: GoogleFonts.poppins(
                      color: roleColor,
                      fontWeight: FontWeight.w800,
                      fontSize: 8.5,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
                if (isAdmin) ...[
                  const SizedBox(width: 4),
                  PopupMenuButton<String>(
                    icon: Icon(Icons.more_vert_rounded, color: AppColors.textMuted, size: 18),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(minWidth: 100),
                    color: AppColors.darkCard,
                    elevation: 4,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    onSelected: (val) {
                      if (val == 'edit') {
                        _showStaffFormSheet(staff: staff);
                      } else if (val == 'delete') {
                        _showDeleteConfirmDialog(staff);
                      }
                    },
                    itemBuilder: (ctx) => [
                      PopupMenuItem(
                        value: 'edit',
                        child: Row(
                          children: [
                            Icon(Icons.edit_rounded, color: AppColors.textSecondary, size: 15),
                            const SizedBox(width: 8),
                            Text('Edit', style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 12)),
                          ],
                        ),
                      ),
                      if (currentUserId != staff.id)
                        PopupMenuItem(
                          value: 'delete',
                          child: Row(
                            children: [
                              Icon(Icons.delete_outline_rounded, color: AppColors.statusRed, size: 15),
                              const SizedBox(width: 8),
                              Text('Delete', style: GoogleFonts.poppins(color: AppColors.statusRed, fontSize: 12)),
                            ],
                          ),
                        ),
                    ],
                  ),
                ],
              ],
            ),
            const SizedBox(height: 12),
            Divider(color: AppColors.darkBorder, height: 1),
            const SizedBox(height: 12),

            // Performance Metrics Line Row
            Row(
              children: [
                Expanded(
                  child: _buildCleanMetricItem(
                    label: 'HOURS',
                    value: '${staff.totalHours.toStringAsFixed(1)}h',
                    icon: Icons.access_time_rounded,
                  ),
                ),
                Expanded(
                  child: _buildCleanMetricItem(
                    label: 'ORDERS',
                    value: '${staff.totalOrders}',
                    icon: Icons.receipt_long_rounded,
                  ),
                ),
                Expanded(
                  child: _buildCleanMetricItem(
                    label: 'SALES',
                    value: '${AppConstants.currencySymbol} ${staff.totalSales.toStringAsFixed(0)}',
                    valueColor: AppColors.statusGreen,
                    icon: Icons.payments_rounded,
                  ),
                ),
                Expanded(
                  child: _buildCleanMetricItem(
                    label: 'AVG SPEED',
                    value: _formatDuration(staff.avgOrderDuration),
                    icon: Icons.speed_rounded,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showStaffFormSheet({StaffPerformanceItem? staff}) {
    final isEditing = staff != null;
    final nameCtrl = TextEditingController(text: staff?.name);
    final emailCtrl = TextEditingController(text: staff?.email);
    final passCtrl = TextEditingController();
    String selectedRole = staff?.role ?? 'staff';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Container(
          decoration: BoxDecoration(
            color: AppColors.darkCard,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
          ),
          padding: EdgeInsets.only(
            left: 24,
            right: 24,
            top: 24,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
          ),
          child: SafeArea(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    margin: const EdgeInsets.only(bottom: 20),
                    decoration: BoxDecoration(
                      color: AppColors.darkBorder,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                Text(
                  isEditing ? 'Edit Staff Member' : 'Add Staff Member',
                  style: GoogleFonts.poppins(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 20),
                Text(
                  'Name',
                  style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 12),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: nameCtrl,
                  style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 14),
                  decoration: InputDecoration(
                    hintText: 'John Doe',
                    hintStyle: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 14),
                    filled: true,
                    fillColor: AppColors.darkSurface,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppColors.darkBorder)),
                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppColors.darkBorder)),
                    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppColors.accentGold, width: 1.5)),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'Email Address',
                  style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 12),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: emailCtrl,
                  keyboardType: TextInputType.emailAddress,
                  style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 14),
                  decoration: InputDecoration(
                    hintText: 'john@example.com',
                    hintStyle: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 14),
                    filled: true,
                    fillColor: AppColors.darkSurface,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppColors.darkBorder)),
                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppColors.darkBorder)),
                    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppColors.accentGold, width: 1.5)),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  isEditing ? 'New Password (Optional)' : 'Password',
                  style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 12),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: passCtrl,
                  obscureText: true,
                  style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 14),
                  decoration: InputDecoration(
                    hintText: isEditing ? 'Leave blank to keep current' : 'Min. 8 characters',
                    hintStyle: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 14),
                    filled: true,
                    fillColor: AppColors.darkSurface,
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppColors.darkBorder)),
                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppColors.darkBorder)),
                    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppColors.accentGold, width: 1.5)),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'Role',
                  style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 12),
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  decoration: BoxDecoration(
                    color: AppColors.darkSurface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.darkBorder),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      isExpanded: true,
                      dropdownColor: AppColors.darkCard,
                      value: selectedRole,
                      items: [
                        DropdownMenuItem(
                          value: 'admin',
                          child: Text('Admin', style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 14)),
                        ),
                        DropdownMenuItem(
                          value: 'staff',
                          child: Text('Staff', style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 14)),
                        ),
                        DropdownMenuItem(
                          value: 'kitchen',
                          child: Text('Kitchen', style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 14)),
                        ),
                      ],
                      onChanged: (val) {
                        if (val != null) {
                          setModalState(() {
                            selectedRole = val;
                          });
                        }
                      },
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: ElevatedButton(
                    onPressed: () async {
                      final name = nameCtrl.text.trim();
                      final email = emailCtrl.text.trim();
                      final password = passCtrl.text.trim();

                      if (name.isEmpty || email.isEmpty) {
                        showTopSnackBar(context, SnackBar(
                          content: Text('Please fill all required fields.', style: GoogleFonts.poppins()),
                          backgroundColor: AppColors.statusRedBg,
                        ));
                        return;
                      }

                      if (!isEditing && password.length < 8) {
                        showTopSnackBar(context, SnackBar(
                          content: Text('Password must be at least 8 characters.', style: GoogleFonts.poppins()),
                          backgroundColor: AppColors.statusRedBg,
                        ));
                        return;
                      }

                      Navigator.pop(ctx);

                      final provider = context.read<StaffPerformanceProvider>();
                      bool success;
                      if (isEditing) {
                        success = await provider.updateStaff(
                          id: staff.id,
                          name: name,
                          email: email,
                          password: password.isNotEmpty ? password : null,
                          role: selectedRole,
                        );
                      } else {
                        success = await provider.addStaff(
                          name: name,
                          email: email,
                          password: password,
                          role: selectedRole,
                        );
                      }

                      if (!mounted) return;
                      if (success) {
                        showTopSnackBar(context, SnackBar(
                          content: Row(children: [
                            Icon(Icons.check_circle, color: AppColors.statusGreen, size: 18),
                            const SizedBox(width: 8),
                            Text(isEditing ? 'Staff updated successfully!' : 'Staff member added successfully!',
                                style: GoogleFonts.poppins(color: AppColors.textPrimary)),
                          ]),
                        ));
                      } else {
                        showTopSnackBar(context, SnackBar(
                          content: Text(provider.error ?? 'An error occurred.', style: GoogleFonts.poppins(color: AppColors.textPrimary)),
                          backgroundColor: AppColors.statusRedBg,
                        ));
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.accentGold,
                      foregroundColor: AppColors.textOnAmber,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      elevation: 0,
                    ),
                    child: Text(
                      isEditing ? 'Save Changes' : 'Add Staff',
                      style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w600),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showDeleteConfirmDialog(StaffPerformanceItem staff) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.darkCard,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text(
          'Remove Staff',
          style: GoogleFonts.poppins(color: AppColors.textPrimary, fontWeight: FontWeight.bold),
        ),
        content: Text(
          'Are you sure you want to remove ${staff.name} (${staff.role})? This action cannot be undone.',
          style: GoogleFonts.poppins(color: AppColors.textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text('Cancel', style: GoogleFonts.poppins(color: AppColors.textMuted)),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              final provider = context.read<StaffPerformanceProvider>();
              final success = await provider.deleteStaff(staff.id);
              if (!mounted) return;
              if (success) {
                showTopSnackBar(context, SnackBar(
                  content: Row(children: [
                    Icon(Icons.check_circle, color: AppColors.statusGreen, size: 18),
                    const SizedBox(width: 8),
                    Text('Staff member removed successfully!', style: GoogleFonts.poppins(color: AppColors.textPrimary)),
                  ]),
                ));
              } else {
                showTopSnackBar(context, SnackBar(
                  content: Text(provider.error ?? 'Failed to remove staff.', style: GoogleFonts.poppins(color: AppColors.textPrimary)),
                  backgroundColor: AppColors.statusRedBg,
                ));
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.statusRed,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: Text('Remove', style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<StaffPerformanceProvider>();
    final auth = context.watch<AuthProvider>();
    final isAdmin = auth.user?.role == 'admin' || auth.user?.role == 'super_admin';
    final currentUserId = auth.user?.id;

    return Scaffold(
      backgroundColor: AppColors.darkBg,
      appBar: AppBar(
        title: Text(
          'Staff Performance',
          style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 18, fontWeight: FontWeight.bold),
        ),
        backgroundColor: AppColors.darkSurface,
        surfaceTintColor: Colors.transparent,
      ),
      floatingActionButton: isAdmin
          ? FloatingActionButton(
              onPressed: () => _showStaffFormSheet(),
              backgroundColor: AppColors.accentGold,
              foregroundColor: AppColors.textOnAmber,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              child: const Icon(Icons.add_rounded, size: 28),
            )
          : null,
      body: RefreshIndicator(
        onRefresh: provider.fetchPerformance,
        color: AppColors.accentAmber,
        backgroundColor: AppColors.darkSurface,
        child: provider.isLoading && provider.staffList.isEmpty
            ? Center(
                child: CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation<Color>(AppColors.accentAmber),
                ),
              )
            : provider.error != null && provider.staffList.isEmpty
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
                            onPressed: provider.fetchPerformance,
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
                      _buildHighlightCards(provider.staffList),
                      const SizedBox(height: 20),
                      Row(
                        children: [
                          Icon(Icons.people_alt_rounded, color: AppColors.textSecondary, size: 18),
                          const SizedBox(width: 8),
                          Text(
                            'STAFF METRICS (${provider.staffList.length})',
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
                      if (provider.staffList.isEmpty)
                        Center(
                          child: Padding(
                            padding: const EdgeInsets.symmetric(vertical: 60),
                            child: Text('No staff members registered.', style: GoogleFonts.poppins(color: AppColors.textSecondary)),
                          ),
                        )
                      else
                        ListView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: provider.staffList.length,
                          itemBuilder: (context, index) {
                            return _buildStaffCard(provider.staffList[index], isAdmin, currentUserId);
                          },
                        ),
                    ],
                  ),
      ),
    );
  }
}
