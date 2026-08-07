import 'package:icafe_app/core/utils/snackbar_helper.dart';
import 'package:icafe_app/core/constants/app_constants.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/staff_performance_provider.dart';
import '../../core/utils/json_utils.dart';
import '../../providers/auth_provider.dart';

Color get _bg => AppColors.darkBg;
Color get _surface => AppColors.darkSurface;
Color get _card => AppColors.darkCard;
Color get _amber => AppColors.accentAmber;
Color get _textPrimary => AppColors.textPrimary;
Color get _textSecondary => AppColors.textSecondary;
Color get _divider => AppColors.darkBorder;

class StaffScreen extends StatefulWidget {
  const StaffScreen({super.key});

  @override
  State<StaffScreen> createState() => _StaffScreenState();
}

class _StaffScreenState extends State<StaffScreen> {
  final _searchCtrl = TextEditingController();
  String _selectedRoleFilter = 'all';

  @override
  void initState() {
    super.initState();
    _searchCtrl.addListener(() => setState(() {}));
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<StaffPerformanceProvider>().fetchPerformance();
    });
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  // Helper to generate color based on role
  Color _getRoleColor(String role) {
    switch (role.toLowerCase()) {
      case 'admin':
        return Colors.purpleAccent;
      case 'cashier':
        return Colors.tealAccent;
      case 'waiter':
        return Colors.orangeAccent;
      case 'kitchen':
        return Colors.blueAccent;
      default:
        return AppColors.accentAmber;
    }
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<StaffPerformanceProvider>();
    final q = _searchCtrl.text.trim().toLowerCase();

    final filteredList = provider.staffList.where((item) {
      final matchesSearch = item.name.toLowerCase().contains(q) || item.email.toLowerCase().contains(q);
      final matchesRole = _selectedRoleFilter == 'all' || item.role.toLowerCase() == _selectedRoleFilter;
      return matchesSearch && matchesRole;
    }).toList();

    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        backgroundColor: _surface,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: _textPrimary),
          onPressed: () => Navigator.of(context).pop(),
        ),
        title: Text(
          'Staff Management',
          style: GoogleFonts.poppins(color: _textPrimary, fontWeight: FontWeight.bold, fontSize: 18),
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.refresh_rounded, color: _textPrimary),
            onPressed: () => provider.fetchPerformance(),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: _amber,
        foregroundColor: AppColors.textOnAmber,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        onPressed: () => _showAddEditStaffModal(context, provider),
        child: const Icon(Icons.add_rounded, size: 28),
      ),
      body: Column(
        children: [
          // Search & Filter Bar
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              children: [
                TextField(
                  controller: _searchCtrl,
                  style: TextStyle(color: _textPrimary),
                  decoration: InputDecoration(
                    hintText: 'Search staff by name or email...',
                    hintStyle: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 13),
                    prefixIcon: Icon(Icons.search, color: AppColors.textMuted),
                    suffixIcon: _searchCtrl.text.isNotEmpty
                        ? GestureDetector(
                            onTap: () => _searchCtrl.clear(),
                            child: Icon(Icons.clear, color: AppColors.textMuted),
                          )
                        : null,
                    filled: true,
                    fillColor: _surface,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: BorderSide(color: _divider),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: BorderSide(color: _divider),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: BorderSide(color: _amber, width: 1.5),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                // Role filter tabs
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: ['all', 'admin', 'cashier', 'waiter', 'kitchen', 'staff'].map((role) {
                      final isSelected = _selectedRoleFilter == role;
                      return Padding(
                        padding: const EdgeInsets.only(right: 8.0),
                        child: ChoiceChip(
                          label: Text(
                            role.toUpperCase(),
                            style: GoogleFonts.poppins(
                              color: isSelected ? Colors.white : _textSecondary,
                              fontWeight: FontWeight.bold,
                              fontSize: 10,
                            ),
                          ),
                          selected: isSelected,
                          selectedColor: role == 'all' ? _amber : _getRoleColor(role).withOpacity(0.8),
                          backgroundColor: _surface,
                          side: BorderSide(color: isSelected ? Colors.transparent : _divider),
                          onSelected: (val) {
                            if (val) {
                              setState(() => _selectedRoleFilter = role);
                            }
                          },
                        ),
                      );
                    }).toList(),
                  ),
                ),
              ],
            ),
          ),

          // List or Loader
          Expanded(
            child: provider.isLoading
                ? Center(child: CircularProgressIndicator(color: AppColors.accentAmber))
                : filteredList.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.people_outline_rounded, color: AppColors.textMuted, size: 48),
                            const SizedBox(height: 12),
                            Text(
                              'No staff profiles found',
                              style: GoogleFonts.poppins(color: _textSecondary, fontWeight: FontWeight.bold),
                            ),
                          ],
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: filteredList.length,
                        itemBuilder: (context, idx) {
                          final staff = filteredList[idx];
                          final initials = staff.name.trim().split(' ').map((p) => p.isNotEmpty ? p[0] : '').take(2).join().toUpperCase();
                          final roleColor = _getRoleColor(staff.role);

                          return Card(
                            color: _card,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                              side: BorderSide(color: _divider),
                            ),
                            margin: const EdgeInsets.only(bottom: 12),
                            child: ExpansionTile(
                              collapsedIconColor: _textSecondary,
                              iconColor: _amber,
                              title: Row(
                                children: [
                                  CircleAvatar(
                                    backgroundColor: roleColor.withOpacity(0.1),
                                    child: Text(
                                      initials.isNotEmpty ? initials : '?',
                                      style: GoogleFonts.poppins(color: roleColor, fontWeight: FontWeight.bold),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          staff.name,
                                          style: GoogleFonts.poppins(color: _textPrimary, fontWeight: FontWeight.bold, fontSize: 14),
                                        ),
                                        Text(
                                          staff.email,
                                          style: GoogleFonts.poppins(color: _textSecondary, fontSize: 12),
                                        ),
                                      ],
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: roleColor.withOpacity(0.12),
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(color: roleColor.withOpacity(0.3)),
                                    ),
                                    child: Text(
                                      staff.role.toUpperCase(),
                                      style: GoogleFonts.poppins(color: roleColor, fontWeight: FontWeight.bold, fontSize: 9),
                                    ),
                                  ),
                                ],
                              ),
                              children: [
                                Divider(color: AppColors.darkBorder, height: 1),
                                Padding(
                                  padding: const EdgeInsets.all(16.0),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'Performance Metrics',
                                        style: GoogleFonts.poppins(color: _amber, fontWeight: FontWeight.bold, fontSize: 12, letterSpacing: 0.5),
                                      ),
                                      const SizedBox(height: 12),
                                      GridView(
                                        shrinkWrap: true,
                                        physics: const NeverScrollableScrollPhysics(),
                                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                                          crossAxisCount: 2,
                                          crossAxisSpacing: 12,
                                          mainAxisSpacing: 10,
                                          childAspectRatio: 2.8,
                                        ),
                                        children: [
                                          _buildMetricTile('Shifts Count', '${staff.shiftsCount}', Icons.schedule_rounded),
                                          _buildMetricTile('Hours Worked', '${staff.totalHours.toStringAsFixed(1)}h', Icons.timer_rounded),
                                          _buildMetricTile('Orders Taken', '${staff.totalOrders}', Icons.shopping_basket_rounded),
                                          _buildMetricTile('Total Sales', 'Rs. ${staff.totalSales.toStringAsFixed(0)}', Icons.payments_rounded),
                                          _buildMetricTile('Tips Collected', 'Rs. ${staff.totalTips.toStringAsFixed(0)}', Icons.volunteer_activism_rounded),
                                          _buildMetricTile('Avg Duration', '${staff.avgOrderDuration.toStringAsFixed(0)} mins', Icons.speed_rounded),
                                        ],
                                      ),
                                      const SizedBox(height: 16),
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.end,
                                        children: [
                                          TextButton.icon(
                                            icon: Icon(Icons.edit_rounded, color: _textSecondary, size: 18),
                                            label: Text('Edit Profile', style: GoogleFonts.poppins(color: _textSecondary, fontWeight: FontWeight.w600, fontSize: 13)),
                                            onPressed: () => _showAddEditStaffModal(context, provider, staff: staff),
                                          ),
                                          const SizedBox(width: 12),
                                          TextButton.icon(
                                            icon: Icon(Icons.delete_forever_rounded, color: AppColors.statusRed, size: 18),
                                            label: Text('Remove Staff', style: GoogleFonts.poppins(color: AppColors.statusRed, fontWeight: FontWeight.w600, fontSize: 13)),
                                            onPressed: () => _showDeleteConfirm(context, provider, staff),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
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

  Widget _buildMetricTile(String label, String value, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: _surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: _divider),
      ),
      child: Row(
        children: [
          Icon(icon, color: _textSecondary, size: 16),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  label,
                  style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 9, fontWeight: FontWeight.w500),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  value,
                  style: GoogleFonts.poppins(color: _textPrimary, fontSize: 12, fontWeight: FontWeight.bold),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _showDeleteConfirm(BuildContext context, StaffPerformanceProvider provider, StaffPerformanceItem staff) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: _card,
        title: Text('Remove Staff Member', style: GoogleFonts.poppins(color: _textPrimary, fontWeight: FontWeight.bold)),
        content: Text(
          'Are you sure you want to remove ${staff.name} from the staff records? This will delete their credential access.',
          style: GoogleFonts.poppins(color: _textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: Text('Cancel', style: GoogleFonts.poppins(color: AppColors.textMuted)),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              final success = await provider.deleteStaff(staff.id);
              if (success && context.mounted) {
                showTopSnackBar(context, SnackBar(content: Text('${staff.name} removed successfully', style: GoogleFonts.poppins(color: _textPrimary)), backgroundColor: AppColors.statusGreen));
              } else if (context.mounted) {
                showTopSnackBar(context, SnackBar(content: Text(provider.error ?? 'Failed to remove staff', style: GoogleFonts.poppins(color: _textPrimary)), backgroundColor: AppColors.statusRed));
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.statusRed),
            child: Text('Remove', style: GoogleFonts.poppins(color: Colors.white, fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  void _showAddEditStaffModal(BuildContext context, StaffPerformanceProvider provider, {StaffPerformanceItem? staff}) {
    final isEdit = staff != null;
    final nameCtrl = TextEditingController(text: staff?.name ?? '');
    final emailCtrl = TextEditingController(text: staff?.email ?? '');
    final passCtrl = TextEditingController();
    String selectedRole = staff?.role ?? 'staff';

    showModalBottomSheet(
      context: context,
      backgroundColor: _card,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) => StatefulBuilder(
        builder: (c, setModalState) => Padding(
          padding: EdgeInsets.only(left: 24, right: 24, top: 24, bottom: MediaQuery.of(c).viewInsets.bottom + 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                isEdit ? 'Update Staff Member' : 'Add New Staff Member',
                style: GoogleFonts.poppins(color: _textPrimary, fontWeight: FontWeight.bold, fontSize: 16),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: nameCtrl,
                style: TextStyle(color: _textPrimary),
                decoration: InputDecoration(
                  labelText: 'Name',
                  labelStyle: GoogleFonts.poppins(color: _textSecondary),
                  enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: _divider)),
                  focusedBorder: UnderlineInputBorder(borderSide: BorderSide(color: _amber)),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: emailCtrl,
                style: TextStyle(color: _textPrimary),
                keyboardType: TextInputType.emailAddress,
                decoration: InputDecoration(
                  labelText: 'Email Address',
                  labelStyle: GoogleFonts.poppins(color: _textSecondary),
                  enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: _divider)),
                  focusedBorder: UnderlineInputBorder(borderSide: BorderSide(color: _amber)),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: passCtrl,
                style: TextStyle(color: _textPrimary),
                obscureText: true,
                decoration: InputDecoration(
                  labelText: isEdit ? 'Change Password (optional)' : 'Password',
                  labelStyle: GoogleFonts.poppins(color: _textSecondary),
                  enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: _divider)),
                  focusedBorder: UnderlineInputBorder(borderSide: BorderSide(color: _amber)),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Authorization Role',
                style: GoogleFonts.poppins(color: _textSecondary, fontSize: 11, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              DropdownButtonFormField<String>(
                value: selectedRole,
                dropdownColor: _surface,
                style: GoogleFonts.poppins(color: _textPrimary, fontSize: 14),
                decoration: InputDecoration(
                  enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: _divider)),
                  focusedBorder: UnderlineInputBorder(borderSide: BorderSide(color: _amber)),
                ),
                items: ['admin', 'staff', 'cashier', 'waiter', 'kitchen'].map((role) {
                  return DropdownMenuItem(
                    value: role,
                    child: Text(role.toUpperCase()),
                  );
                }).toList(),
                onChanged: (val) {
                  if (val != null) {
                    setModalState(() => selectedRole = val);
                  }
                },
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: () async {
                    final name = nameCtrl.text.trim();
                    final email = emailCtrl.text.trim();
                    final password = passCtrl.text;

                    if (name.isEmpty || email.isEmpty) {
                      showTopSnackBar(context, SnackBar(content: Text('Name and email are required', style: GoogleFonts.poppins(color: _textPrimary)), backgroundColor: AppColors.statusRed));
                      return;
                    }

                    if (!isEdit && password.isEmpty) {
                      showTopSnackBar(context, SnackBar(content: Text('Password is required', style: GoogleFonts.poppins(color: _textPrimary)), backgroundColor: AppColors.statusRed));
                      return;
                    }

                    final bool success;
                    if (isEdit) {
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

                    if (success && ctx.mounted) {
                      Navigator.pop(ctx);
                      showTopSnackBar(context, SnackBar(
                        content: Text(isEdit ? 'Staff member updated successfully' : 'Staff member created successfully', style: GoogleFonts.poppins(color: _textPrimary)),
                        backgroundColor: AppColors.statusGreen,
                      ));
                    } else if (ctx.mounted) {
                      showTopSnackBar(context, SnackBar(
                        content: Text(provider.error ?? 'Failed to save staff member', style: GoogleFonts.poppins(color: _textPrimary)),
                        backgroundColor: AppColors.statusRed,
                      ));
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _amber,
                    foregroundColor: AppColors.textOnAmber,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: Text(
                    isEdit ? 'Save Changes' : 'Create Staff Member',
                    style: GoogleFonts.poppins(fontWeight: FontWeight.bold),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
