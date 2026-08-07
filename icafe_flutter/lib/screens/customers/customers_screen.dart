import 'package:icafe_app/core/utils/snackbar_helper.dart';
import 'package:icafe_app/core/constants/app_constants.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../core/services/api_service.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/json_utils.dart';

// ---------------------------------------------------------------------------
// Theme constants (Dynamic getters resolving AppColors according to active theme)
// ---------------------------------------------------------------------------
Color get _bg => AppColors.darkBg;
Color get _surface => AppColors.darkSurface;
Color get _card => AppColors.darkCard;
Color get _amber => AppColors.accentAmber;
Color get _amberDark => AppColors.accentGold;
Color get _red => AppColors.statusRed;
Color get _green => AppColors.statusGreen;
Color get _textPrimary => AppColors.textPrimary;
Color get _textSecondary => AppColors.textSecondary;
Color get _divider => AppColors.darkBorder;

// ---------------------------------------------------------------------------
// Model
// ---------------------------------------------------------------------------
class _Customer {
  final int id;
  String name;
  String phone;
  String? email;
  int points;
  int orders;
  double spent;
  double due;

  _Customer({
    required this.id,
    required this.name,
    required this.phone,
    this.email,
    required this.points,
    required this.orders,
    required this.spent,
    required this.due,
  });

  String get initials {
    final parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return name.isNotEmpty ? name[0].toUpperCase() : '?';
  }

  double get avgOrder => orders == 0 ? 0 : spent / orders;
}

// Customers Screen uses dynamic database storage. Mock data has been removed.

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
class CustomersScreen extends StatefulWidget {
  final bool showAdd;
  const CustomersScreen({super.key, this.showAdd = false});

  @override
  State<CustomersScreen> createState() => _CustomersScreenState();
}

class _CustomersScreenState extends State<CustomersScreen> {
  List<_Customer> _customers = [];
  List<_Customer> _filtered = [];
  final _searchCtrl = TextEditingController();
  bool _isLoading = false;
  String _sortBy = 'name_asc';
  String _filterBy = 'all';

  @override
  void initState() {
    super.initState();
    _searchCtrl.addListener(_onSearch);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _fetchCustomers();
      if (widget.showAdd) {
        _showAddEdit();
      }
    });
  }

  Future<void> _fetchCustomers() async {
    if (!mounted) return;
    setState(() => _isLoading = true);
    try {
      final api = context.read<ApiService>();
      final res = await api.get('/customers');
      if (res != null && res['data'] != null) {
        final List<_Customer> loaded = [];
        final list = res['data'] as List;
        for (final item in list) {
          loaded.add(_Customer(
            id: JsonUtils.parseInt(item['id']),
            name: item['name'] ?? '',
            phone: item['phone'] ?? '',
            email: item['email'],
            points: JsonUtils.parseInt(item['points']),
            orders: JsonUtils.parseInt(item['orders']),
            spent: JsonUtils.parseDouble(item['spent']),
            due: JsonUtils.parseDouble(item['due']),
          ));
        }
        if (mounted) {
          setState(() {
            _customers = loaded;
          });
          _applyFilterAndSort();
        }
      }
    } catch (e) {
      debugPrint('Error loading customers: $e');
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  void _onSearch() {
    _applyFilterAndSort();
  }

  void _applyFilterAndSort() {
    final q = _searchCtrl.text.toLowerCase();
    
    // 1. Filter
    List<_Customer> temp = _customers.where((c) {
      final matchesSearch = c.name.toLowerCase().contains(q) ||
          c.phone.contains(q) ||
          (c.email?.toLowerCase().contains(q) ?? false);
      
      if (!matchesSearch) return false;
      
      if (_filterBy == 'due') {
        return c.due > 0;
      }
      return true;
    }).toList();

    // 2. Sort
    if (_sortBy == 'name_asc') {
      temp.sort((a, b) => a.name.toLowerCase().compareTo(b.name.toLowerCase()));
    } else if (_sortBy == 'name_desc') {
      temp.sort((a, b) => b.name.toLowerCase().compareTo(a.name.toLowerCase()));
    } else if (_sortBy == 'due_desc') {
      temp.sort((a, b) => b.due.compareTo(a.due));
    } else if (_sortBy == 'points_desc') {
      temp.sort((a, b) => b.points.compareTo(a.points));
    }

    setState(() {
      _filtered = temp;
    });
  }

  void _showFilterSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: _surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Filter & Sort Customers',
                style: GoogleFonts.poppins(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                  color: _textPrimary,
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'FILTER BY',
                style: GoogleFonts.poppins(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: _textSecondary,
                  letterSpacing: 0.5,
                ),
              ),
              Row(
                children: [
                  Expanded(
                    child: RadioListTile<String>(
                      title: Text('All', style: GoogleFonts.poppins(fontSize: 13, color: _textPrimary)),
                      value: 'all',
                      groupValue: _filterBy,
                      activeColor: AppColors.statusRed,
                      contentPadding: EdgeInsets.zero,
                      onChanged: (val) {
                        setSheetState(() => _filterBy = val!);
                        setState(() => _filterBy = val!);
                      },
                    ),
                  ),
                  Expanded(
                    child: RadioListTile<String>(
                      title: Text('Due Balance', style: GoogleFonts.poppins(fontSize: 13, color: _textPrimary)),
                      value: 'due',
                      groupValue: _filterBy,
                      activeColor: AppColors.statusRed,
                      contentPadding: EdgeInsets.zero,
                      onChanged: (val) {
                        setSheetState(() => _filterBy = val!);
                        setState(() => _filterBy = val!);
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                'SORT BY',
                style: GoogleFonts.poppins(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: _textSecondary,
                  letterSpacing: 0.5,
                ),
              ),
              RadioListTile<String>(
                title: Text('Name (A - Z)', style: GoogleFonts.poppins(fontSize: 13, color: _textPrimary)),
                value: 'name_asc',
                groupValue: _sortBy,
                activeColor: AppColors.statusRed,
                contentPadding: EdgeInsets.zero,
                onChanged: (val) {
                  setSheetState(() => _sortBy = val!);
                  setState(() => _sortBy = val!);
                },
              ),
              RadioListTile<String>(
                title: Text('Name (Z - A)', style: GoogleFonts.poppins(fontSize: 13, color: _textPrimary)),
                value: 'name_desc',
                groupValue: _sortBy,
                activeColor: AppColors.statusRed,
                contentPadding: EdgeInsets.zero,
                onChanged: (val) {
                  setSheetState(() => _sortBy = val!);
                  setState(() => _sortBy = val!);
                },
              ),
              RadioListTile<String>(
                title: Text('Due Amount (Highest first)', style: GoogleFonts.poppins(fontSize: 13, color: _textPrimary)),
                value: 'due_desc',
                groupValue: _sortBy,
                activeColor: AppColors.statusRed,
                contentPadding: EdgeInsets.zero,
                onChanged: (val) {
                  setSheetState(() => _sortBy = val!);
                  setState(() => _sortBy = val!);
                },
              ),
              RadioListTile<String>(
                title: Text('Loyalty Points (Highest first)', style: GoogleFonts.poppins(fontSize: 13, color: _textPrimary)),
                value: 'points_desc',
                groupValue: _sortBy,
                activeColor: AppColors.statusRed,
                contentPadding: EdgeInsets.zero,
                onChanged: (val) {
                  setSheetState(() => _sortBy = val!);
                  setState(() => _sortBy = val!);
                },
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: () {
                    _applyFilterAndSort();
                    Navigator.pop(ctx);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.statusRed,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: Text(
                    'Apply Filters',
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

  void _showDetail(_Customer customer) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _CustomerDetailSheet(
        customer: customer,
        onEdit: () {
          Navigator.pop(context);
          _showAddEdit(customer: customer);
        },
      ),
    );
  }

  void _showAddEdit({_Customer? customer}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _AddEditCustomerSheet(
        customer: customer,
        onSave: (c) async {
          final api = context.read<ApiService>();
          final cleanPhone = c.phone.replaceAll(RegExp(r'\D'), '');
          
          try {
            bool success = false;
            String message = '';
            
            if (customer == null) {
              final res = await api.post('/customers', {
                'name': c.name,
                'phone': cleanPhone,
                'email': c.email,
              });
              if (res != null && res['success'] == true) {
                success = true;
                message = 'Customer created successfully!';
                _fetchCustomers();
              } else {
                message = 'Failed to create customer. Phone number must be unique.';
              }
            } else {
              final res = await api.put('/customers/${customer.id}', {
                'name': c.name,
                'phone': cleanPhone,
                'email': c.email,
              });
              if (res != null && res['success'] == true) {
                success = true;
                message = 'Customer updated successfully!';
                _fetchCustomers();
              } else {
                message = 'Failed to update customer. Phone number must be unique.';
              }
            }
            
            if (mounted) {
              showTopSnackBar(context, SnackBar(
                content: Text(message, style: GoogleFonts.poppins(color: Colors.white)),
                backgroundColor: success ? AppColors.statusGreen : AppColors.statusRed,
                behavior: SnackBarBehavior.floating,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ));
            }
          } catch (e) {
            debugPrint('Failed to save customer: $e');
            if (mounted) {
              showTopSnackBar(context, SnackBar(
                content: Text('Error: $e', style: GoogleFonts.poppins(color: Colors.white)),
                backgroundColor: AppColors.statusRed,
                behavior: SnackBarBehavior.floating,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ));
            }
          }
          if (mounted) Navigator.pop(context);
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      appBar: _buildAppBar(),
      floatingActionButton: _buildFab(),
      body: Column(
        children: [
          _buildStatsSection(),
          _buildSearchBar(),
          Expanded(
            child: _isLoading
                ? Center(child: CircularProgressIndicator(color: _amber))
                : RefreshIndicator(
                    onRefresh: _fetchCustomers,
                    color: _amber,
                    backgroundColor: _surface,
                    child: _filtered.isEmpty
                        ? _buildEmpty()
                        : ListView.builder(
                            padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
                            physics: const AlwaysScrollableScrollPhysics(),
                            itemCount: _filtered.length,
                            itemBuilder: (_, i) => _CustomerCard(
                              customer: _filtered[i],
                              onTap: () => _showDetail(_filtered[i]),
                            ),
                          ),
                  ),
          ),
        ],
      ),
    );
  }

  AppBar _buildAppBar() {
    return AppBar(
      backgroundColor: _surface,
      elevation: 0,
      title: Row(
        children: [
          Text(
            'Customers',
            style: GoogleFonts.poppins(
                color: _textPrimary, fontWeight: FontWeight.w600, fontSize: 20),
          ),
          const SizedBox(width: 10),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
            decoration:
                BoxDecoration(color: _amber, borderRadius: BorderRadius.circular(20)),
            child: Text(
              '${_customers.length}',
              style: GoogleFonts.poppins(
                  color: Colors.black, fontWeight: FontWeight.w700, fontSize: 13),
            ),
          ),
        ],
      ),
      actions: [
        IconButton(
          icon: Icon(Icons.filter_list_rounded, color: _textSecondary),
          onPressed: _showFilterSheet,
        ),
      ],
    );
  }

  Widget _buildStatsSection() {
    int totalMembers = _customers.length;
    int totalPoints = _customers.fold(0, (sum, c) => sum + c.points);
    double totalDueAmount = _customers.fold(0.0, (sum, c) => sum + c.due);
    
    String topMemberName = 'None';
    if (_customers.isNotEmpty) {
      final top = _customers.reduce((curr, next) => curr.points > next.points ? curr : next);
      if (top.points > 0) {
        topMemberName = top.name;
      }
    }

    return Container(
      height: 102,
      margin: const EdgeInsets.only(top: 12, bottom: 4),
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        physics: const BouncingScrollPhysics(),
        children: [
          _buildStatCard('Total Members', '$totalMembers', Icons.people_outline_rounded, _amber),
          _buildStatCard('Loyalty Points', '$totalPoints', Icons.star_outline_rounded, _amber),
          _buildStatCard('Total Due', '${AppConstants.currencySymbol} ${totalDueAmount.toStringAsFixed(0)}', Icons.menu_book_outlined, _red),
          _buildStatCard('Top Member', topMemberName, Icons.emoji_events_outlined, _green),
        ],
      ),
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Container(
      width: 150,
      margin: const EdgeInsets.only(right: 12),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: _surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: _divider),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
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
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, size: 16, color: color),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: GoogleFonts.poppins(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: _textPrimary,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              Text(
                title,
                style: GoogleFonts.poppins(
                  fontSize: 10,
                  fontWeight: FontWeight.w500,
                  color: _textSecondary,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSearchBar() {
    return Container(
      margin: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: _card,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: _divider),
      ),
      child: TextField(
        controller: _searchCtrl,
        style: GoogleFonts.poppins(color: _textPrimary, fontSize: 14),
        decoration: InputDecoration(
          hintText: 'Search customers…',
          hintStyle: GoogleFonts.poppins(color: _textSecondary, fontSize: 14),
          prefixIcon: Icon(Icons.search_rounded, color: _textSecondary),
          suffixIcon: _searchCtrl.text.isNotEmpty
              ? IconButton(
                  icon: Icon(Icons.clear_rounded, color: _textSecondary, size: 18),
                  onPressed: () {
                    _searchCtrl.clear();
                    _onSearch();
                  },
                )
              : null,
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(vertical: 14),
        ),
      ),
    );
  }

  Widget _buildFab() {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.statusRed,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: AppColors.statusRed.withOpacity(0.4),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: () => _showAddEdit(),
          borderRadius: BorderRadius.circular(18),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.person_add_alt_1_rounded, color: Colors.white, size: 20),
                const SizedBox(width: 8),
                Text(
                  'Add Customer',
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.people_outline_rounded,
              size: 64, color: _textSecondary.withOpacity(0.4)),
          const SizedBox(height: 12),
          Text('No customers found',
              style: GoogleFonts.poppins(color: _textSecondary, fontSize: 16)),
        ],
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Customer Card
// ---------------------------------------------------------------------------
class _CustomerCard extends StatelessWidget {
  final _Customer customer;
  final VoidCallback onTap;

  const _CustomerCard({required this.customer, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: _card,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
              color: customer.due > 0 ? _red.withOpacity(0.3) : _divider),
        ),
        child: Row(
          children: [
            _Avatar(initials: customer.initials, size: 52),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          customer.name,
                          style: GoogleFonts.poppins(
                              color: _textPrimary,
                              fontWeight: FontWeight.w600,
                              fontSize: 15),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      _PointsBadge(points: customer.points),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(Icons.phone_rounded,
                          size: 12, color: _textSecondary),
                      const SizedBox(width: 4),
                      Text(customer.phone,
                          style: GoogleFonts.poppins(
                              color: _textSecondary, fontSize: 12)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 6,
                    children: [
                      _StatChip(
                        icon: Icons.receipt_long_rounded,
                        label: '${customer.orders} orders',
                        color: _textSecondary,
                      ),
                      if (customer.due > 0)
                        _StatChip(
                          icon: Icons.warning_amber_rounded,
                          label:
                              'Due: Rs.${customer.due.toStringAsFixed(0)}',
                          color: _red,
                          bgColor: _red.withOpacity(0.12),
                        ),
                    ],
                  ),
                ],
              ),
            ),
            Icon(Icons.chevron_right_rounded, color: _textSecondary),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Customer Detail Bottom Sheet
// ---------------------------------------------------------------------------
class _CustomerDetailSheet extends StatefulWidget {
  final _Customer customer;
  final VoidCallback onEdit;

  const _CustomerDetailSheet({required this.customer, required this.onEdit});

  @override
  State<_CustomerDetailSheet> createState() => _CustomerDetailSheetState();
}

class _CustomerDetailSheetState extends State<_CustomerDetailSheet> {
  bool _loading = true;
  Map<String, dynamic>? _detailData;
  int _selectedTab = 0;

  @override
  void initState() {
    super.initState();
    _loadCustomerDetails();
  }

  Future<void> _loadCustomerDetails() async {
    try {
      final api = context.read<ApiService>();
      final res = await api.get('/customers/${widget.customer.id}');
      if (res != null && res['success'] == true && res['data'] != null) {
        if (mounted) {
          setState(() {
            _detailData = res['data'] as Map<String, dynamic>;
            _loading = false;
          });
        }
      } else {
        if (mounted) setState(() => _loading = false);
      }
    } catch (e) {
      debugPrint('Failed to load customer details: $e');
      if (mounted) setState(() => _loading = false);
    }
  }

  Widget _statGridCard(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: _card,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: _divider),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.poppins(
                    fontSize: 9,
                    fontWeight: FontWeight.w600,
                    color: _textSecondary,
                    letterSpacing: 0.5,
                  ),
                ),
              ),
              const SizedBox(width: 4),
              Icon(icon, size: 14, color: color),
            ],
          ),
          Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.poppins(
              fontSize: 14,
              fontWeight: FontWeight.w700,
              color: _textPrimary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _tabPill(int index, String label, IconData icon) {
    final active = _selectedTab == index;
    return GestureDetector(
      onTap: () => setState(() => _selectedTab = index),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: active ? _amber.withOpacity(0.15) : _card,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: active ? _amber.withOpacity(0.3) : _divider,
            width: 1,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 14, color: active ? _amber : _textSecondary),
            const SizedBox(width: 6),
            Text(
              label,
              style: GoogleFonts.poppins(
                fontSize: 12,
                fontWeight: active ? FontWeight.w600 : FontWeight.w500,
                color: active ? _amber : _textSecondary,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMinStatusChip(String status) {
    Color c;
    switch (status.toLowerCase()) {
      case 'completed':
        c = _green;
        break;
      case 'preparing':
        c = _amber;
        break;
      case 'served':
        c = const Color(0xFF60A5FA);
        break;
      case 'cancelled':
        c = _red;
        break;
      default:
        c = _textSecondary;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: c.withOpacity(0.12),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        status.toUpperCase(),
        style: GoogleFonts.poppins(
          fontSize: 8,
          fontWeight: FontWeight.bold,
          color: c,
        ),
      ),
    );
  }

  Widget _buildTabEmpty(IconData icon, String message) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 40),
      child: Center(
        child: Column(
          children: [
            Icon(icon, size: 40, color: _textSecondary.withOpacity(0.3)),
            const SizedBox(height: 10),
            Text(
              message,
              style: GoogleFonts.poppins(color: _textSecondary, fontSize: 12),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOverviewTab(_Customer c, Map<String, dynamic>? statData) {
    final reward = 2500;
    final progress = (c.points % reward) / reward;
    final pointsToNext = reward - (c.points % reward);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Contact Information Card
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: _card,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: _divider),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'CONTACT INFORMATION',
                style: GoogleFonts.poppins(
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  color: _textSecondary,
                  letterSpacing: 0.5,
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: _amber.withOpacity(0.1),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(Icons.phone_rounded, size: 16, color: _amber),
                  ),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('PHONE', style: GoogleFonts.poppins(color: _textSecondary, fontSize: 9, fontWeight: FontWeight.w500)),
                      Text(c.phone, style: GoogleFonts.poppins(color: _textPrimary, fontSize: 13, fontWeight: FontWeight.w600)),
                    ],
                  ),
                ],
              ),
              if (c.email != null) ...[
                const SizedBox(height: 12),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: _green.withOpacity(0.1),
                        shape: BoxShape.circle,
                      ),
                      child: Icon(Icons.email_rounded, size: 16, color: _green),
                    ),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('EMAIL', style: GoogleFonts.poppins(color: _textSecondary, fontSize: 9, fontWeight: FontWeight.w500)),
                        Text(c.email!, style: GoogleFonts.poppins(color: _textPrimary, fontSize: 13, fontWeight: FontWeight.w600)),
                      ],
                    ),
                  ],
                ),
              ],
              const SizedBox(height: 12),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: const Color(0xFF60A5FA).withOpacity(0.1),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(Icons.stars_rounded, size: 16, color: const Color(0xFF60A5FA)),
                  ),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('LIFETIME POINTS', style: GoogleFonts.poppins(color: _textSecondary, fontSize: 9, fontWeight: FontWeight.w500)),
                      Text('${statData != null ? statData['customer']['lifetime_points'] : c.points} pts', style: GoogleFonts.poppins(color: _textPrimary, fontSize: 13, fontWeight: FontWeight.w600)),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        
        // Loyalty Reward Progress
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: _card,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: _divider),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Loyalty Progress',
                    style: GoogleFonts.poppins(
                        color: _textPrimary,
                        fontWeight: FontWeight.w600,
                        fontSize: 14),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 3),
                    decoration: BoxDecoration(
                        color: _amber.withOpacity(0.12),
                        borderRadius: BorderRadius.circular(12)),
                    child: Text(
                      '${c.points} pts',
                      style: GoogleFonts.poppins(
                          color: _amber,
                          fontWeight: FontWeight.w700,
                          fontSize: 12),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              ClipRRect(
                borderRadius: BorderRadius.circular(6),
                child: LinearProgressIndicator(
                  value: progress,
                  minHeight: 8,
                  backgroundColor: _divider,
                  valueColor: AlwaysStoppedAnimation<Color>(_amber),
                ),
              ),
              const SizedBox(height: 8),
              Text(
                '$pointsToNext pts to next reward (Rs.250 discount)',
                style: GoogleFonts.poppins(
                    color: _textSecondary, fontSize: 11),
              ),
            ],
          ),
        ),
        
        if (c.due > 0) ...[
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: _red.withOpacity(0.08),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: _red.withOpacity(0.25)),
            ),
            child: Row(
              children: [
                Icon(Icons.warning_amber_rounded, color: _red, size: 20),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Outstanding Due',
                        style: GoogleFonts.poppins(
                            color: _red, fontWeight: FontWeight.w600, fontSize: 13),
                      ),
                      Text(
                        '${AppConstants.currencySymbol} ${c.due.toStringAsFixed(2)} pending payment',
                        style: GoogleFonts.poppins(
                            color: _red.withOpacity(0.7), fontSize: 11),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                ElevatedButton(
                  onPressed: () => _showRecordPaymentSheet(context, c),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _red,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    elevation: 0,
                  ),
                  child: Text(
                    'Record Payment',
                    style: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
          ),
        ],

        const SizedBox(height: 24),
        Text(
          'Quick Actions',
          style: GoogleFonts.poppins(
              color: _textSecondary,
              fontSize: 11,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.5),
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: _ActionButton(
                icon: Icons.call_rounded,
                label: 'Call',
                color: _green,
                onTap: () {},
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _ActionButton(
                icon: Icons.edit_rounded,
                label: 'Edit',
                color: _amber,
                onTap: widget.onEdit,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildOrdersTab(List<dynamic> orders) {
    if (orders.isEmpty) {
      return _buildTabEmpty(Icons.shopping_bag_outlined, 'No orders placed yet');
    }
    return Column(
      children: orders.map((o) {
        final number = o['number'] ?? 'N/A';
        final total = o['total'] ?? 0.0;
        final status = o['status'] ?? 'pending';
        final time = o['time'] ?? '';
        final count = o['items_count'] ?? 0;
        
        return Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: _card,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: _divider),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(number, style: GoogleFonts.poppins(fontWeight: FontWeight.bold, color: _textPrimary, fontSize: 13)),
                  const SizedBox(height: 2),
                  Text('$count items • $time', style: GoogleFonts.poppins(color: _textSecondary, fontSize: 11)),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text('${AppConstants.currencySymbol} ${total.toStringAsFixed(2)}', style: GoogleFonts.poppins(fontWeight: FontWeight.w600, color: _amber, fontSize: 13)),
                  const SizedBox(height: 4),
                  _buildMinStatusChip(status),
                ],
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  Widget _buildPointsTab(List<dynamic> pointHistory) {
    if (pointHistory.isEmpty) {
      return _buildTabEmpty(Icons.star_outline_rounded, 'No points activities yet');
    }
    return Column(
      children: pointHistory.map((log) {
        final action = log['action'] ?? 'earned';
        final points = log['points'] ?? 0;
        final desc = log['description'] ?? '';
        final time = log['time'] ?? '';
        final isEarned = action == 'earned';
        
        return Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: _card,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: _divider),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: (isEarned ? _green : _red).withOpacity(0.12),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  isEarned ? Icons.add_circle_outline_rounded : Icons.remove_circle_outline_rounded,
                  color: isEarned ? _green : _red,
                  size: 16,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(desc, style: GoogleFonts.poppins(color: _textPrimary, fontSize: 12, fontWeight: FontWeight.w500)),
                    const SizedBox(height: 2),
                    Text(time, style: GoogleFonts.poppins(color: _textSecondary, fontSize: 10)),
                  ],
                ),
              ),
              Text(
                '${isEarned ? '+' : '-'}$points pts',
                style: GoogleFonts.poppins(
                  fontWeight: FontWeight.bold,
                  color: isEarned ? _green : _red,
                  fontSize: 13,
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  Widget _buildCreditTab(List<dynamic> creditTx) {
    if (creditTx.isEmpty) {
      return _buildTabEmpty(Icons.menu_book_outlined, 'No credit transactions yet');
    }
    return Column(
      children: creditTx.map((tx) {
        final type = tx['type'] ?? 'charge';
        final amount = tx['amount'] ?? 0.0;
        final note = tx['note'] ?? '';
        final time = tx['time'] ?? '';
        final orderNumber = tx['order_number'];
        final isPayment = type == 'payment';
        
        return Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: _card,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: _divider),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: (isPayment ? _green : _red).withOpacity(0.12),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  isPayment ? Icons.check_circle_outline_rounded : Icons.warning_amber_rounded,
                  color: isPayment ? _green : _red,
                  size: 16,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(note, style: GoogleFonts.poppins(color: _textPrimary, fontSize: 12, fontWeight: FontWeight.w500)),
                    const SizedBox(height: 2),
                    if (orderNumber != null)
                      Text('Order: $orderNumber • $time', style: GoogleFonts.poppins(color: _textSecondary, fontSize: 10))
                    else
                      Text(time, style: GoogleFonts.poppins(color: _textSecondary, fontSize: 10)),
                  ],
                ),
              ),
              Text(
                '${isPayment ? '-' : '+'}Rs. ${amount.toStringAsFixed(0)}',
                style: GoogleFonts.poppins(
                  fontWeight: FontWeight.bold,
                  color: isPayment ? _green : _red,
                  fontSize: 13,
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final c = widget.customer;

    return DraggableScrollableSheet(
      initialChildSize: 0.88,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (_, ctrl) => Container(
        decoration: BoxDecoration(
          color: _surface,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: ListView(
          controller: ctrl,
          padding: const EdgeInsets.fromLTRB(24, 0, 24, 40),
          children: [
            // Handle
            Center(
              child: Container(
                margin: const EdgeInsets.symmetric(vertical: 12),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                    color: _divider,
                    borderRadius: BorderRadius.circular(2)),
              ),
            ),
            
            // Avatar + Name Header
            Center(child: _Avatar(initials: c.initials, size: 70)),
            const SizedBox(height: 12),
            Center(
              child: Text(
                c.name,
                style: GoogleFonts.poppins(
                    color: _textPrimary,
                    fontWeight: FontWeight.w700,
                    fontSize: 20),
              ),
            ),
            const SizedBox(height: 2),
            Center(
              child: Text(
                c.phone,
                style: GoogleFonts.poppins(
                    color: _textSecondary, fontSize: 12),
              ),
            ),
            
            const SizedBox(height: 24),
            
            // Loading state or Stat Card Grid
            if (_loading)
              const Center(
                child: Padding(
                  padding: EdgeInsets.symmetric(vertical: 40),
                  child: CircularProgressIndicator(),
                ),
              )
            else ...[
              // Stats Grid
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                crossAxisSpacing: 10,
                mainAxisSpacing: 10,
                childAspectRatio: 2.2,
                children: [
                  _statGridCard('TOTAL ORDERS', '${_detailData?['stats']['total_orders'] ?? c.orders}', Icons.shopping_bag_outlined, _amber),
                  _statGridCard('TOTAL SPENT', '${AppConstants.currencySymbol} ${((_detailData?['stats']['total_spent'] ?? c.spent) as num).toStringAsFixed(0)}', Icons.trending_up_rounded, _green),
                  _statGridCard('LOYALTY POINTS', '${_detailData?['customer']['loyalty_points'] ?? c.points}', Icons.star_outline_rounded, _amber),
                  _statGridCard('CREDIT DUE', '${AppConstants.currencySymbol} ${((_detailData?['customer']['due_amount'] ?? c.due) as num).toStringAsFixed(0)}', Icons.menu_book_outlined, _red),
                ],
              ),
              
              const SizedBox(height: 24),
              
              // Custom Tab pills row
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                physics: const BouncingScrollPhysics(),
                child: Row(
                  children: [
                    _tabPill(0, 'Overview', Icons.info_outline_rounded),
                    const SizedBox(width: 8),
                    _tabPill(1, 'Orders (${(_detailData?['orders'] as List?)?.length ?? 0})', Icons.receipt_long_outlined),
                    const SizedBox(width: 8),
                    _tabPill(2, 'Points (${(_detailData?['point_history'] as List?)?.length ?? 0})', Icons.star_outline_rounded),
                    const SizedBox(width: 8),
                    _tabPill(3, 'Credit Ledger (${(_detailData?['credit_transactions'] as List?)?.length ?? 0})', Icons.menu_book_outlined),
                  ],
                ),
              ),
              
              const SizedBox(height: 20),
              
              // Tab contents
              if (_selectedTab == 0) _buildOverviewTab(c, _detailData),
              if (_selectedTab == 1) _buildOrdersTab(_detailData?['orders'] ?? []),
              if (_selectedTab == 2) _buildPointsTab(_detailData?['point_history'] ?? []),
              if (_selectedTab == 3) _buildCreditTab(_detailData?['credit_transactions'] ?? []),
            ],
          ],
        ),
      ),
    );
  }

  void _showRecordPaymentSheet(BuildContext context, _Customer c) {
    final amountCtrl = TextEditingController(text: c.due.toStringAsFixed(0));
    final noteCtrl = TextEditingController();
    bool isSubmitting = false;

    showModalBottomSheet(
      context: context,
      backgroundColor: _card,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) => Padding(
          padding: EdgeInsets.only(
            left: 24,
            right: 24,
            top: 24,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Record Payment',
                    style: GoogleFonts.poppins(
                      color: _textPrimary,
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                  IconButton(
                    icon: Icon(Icons.close_rounded, color: _textSecondary),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                'Outstanding: ${AppConstants.currencySymbol} ${c.due.toStringAsFixed(2)}',
                style: GoogleFonts.poppins(
                  color: _red,
                  fontWeight: FontWeight.w600,
                  fontSize: 12,
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: amountCtrl,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                style: GoogleFonts.poppins(color: _textPrimary, fontSize: 13),
                decoration: InputDecoration(
                  labelText: 'Payment Amount (Rs.)',
                  labelStyle: GoogleFonts.poppins(color: _textSecondary, fontSize: 12),
                  filled: true,
                  fillColor: _bg,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: noteCtrl,
                style: GoogleFonts.poppins(color: _textPrimary, fontSize: 13),
                decoration: InputDecoration(
                  labelText: 'Note (optional)',
                  labelStyle: GoogleFonts.poppins(color: _textSecondary, fontSize: 12),
                  hintText: 'e.g. Cash payment, Bank transfer...',
                  hintStyle: GoogleFonts.poppins(color: _textSecondary.withOpacity(0.5), fontSize: 12),
                  filled: true,
                  fillColor: _bg,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 16),
              
              // Percent Quick Select buttons
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _quickPercentButton(0.25, '25%', c.due, amountCtrl, setSheetState),
                  _quickPercentButton(0.50, '50%', c.due, amountCtrl, setSheetState),
                  _quickPercentButton(1.0, '100%', c.due, amountCtrl, setSheetState),
                  _quickPercentButton(1.0, 'FULL', c.due, amountCtrl, setSheetState, isFull: true),
                ],
              ),
              
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: isSubmitting
                      ? null
                      : () async {
                          final enteredAmt = double.tryParse(amountCtrl.text) ?? 0.0;
                          if (enteredAmt <= 0) {
                            showTopSnackBar(context, SnackBar(
                              content: Text('Please enter a valid payment amount', style: GoogleFonts.poppins(color: Colors.white)),
                              backgroundColor: _red,
                            ));
                            return;
                          }
                          
                          setSheetState(() => isSubmitting = true);
                          
                          try {
                            final api = context.read<ApiService>();
                            final res = await api.post('/customers/${c.id}/payment', {
                              'amount': enteredAmt,
                              'note': noteCtrl.text.trim().isEmpty ? 'Payment received' : noteCtrl.text.trim(),
                            });
                            
                            if (res != null && res['success'] == true) {
                              // Success! Refresh customer detail data on state and parent
                              setState(() {
                                c.due = (res['data']['due_amount'] as num).toDouble();
                              });
                              _loadCustomerDetails();
                              
                              if (ctx.mounted) {
                                Navigator.pop(ctx);
                                showTopSnackBar(context, SnackBar(
                                  content: Text('Payment of Rs. $enteredAmt recorded successfully!', style: GoogleFonts.poppins(color: Colors.white)),
                                  backgroundColor: _green,
                                ));
                              }
                            } else {
                              setSheetState(() => isSubmitting = false);
                              showTopSnackBar(context, SnackBar(
                                content: Text(res?['message'] ?? 'Failed to record payment', style: GoogleFonts.poppins(color: Colors.white)),
                                backgroundColor: _red,
                              ));
                            }
                          } catch (e) {
                            setSheetState(() => isSubmitting = false);
                            showTopSnackBar(context, SnackBar(
                              content: Text('Error: $e', style: GoogleFonts.poppins(color: Colors.white)),
                              backgroundColor: _red,
                            ));
                          }
                        },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _red,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                  child: isSubmitting
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                        )
                      : Text(
                          'Confirm Payment',
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

  Widget _quickPercentButton(double pct, String label, double total, TextEditingController ctrl, StateSetter setSheetState, {bool isFull = false}) {
    return Expanded(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 4),
        child: OutlinedButton(
          onPressed: () {
            setSheetState(() {
              ctrl.text = (total * pct).toStringAsFixed(0);
            });
          },
          style: OutlinedButton.styleFrom(
            side: BorderSide(color: isFull ? _red : _divider),
            backgroundColor: isFull ? _red.withOpacity(0.12) : Colors.transparent,
            padding: const EdgeInsets.symmetric(vertical: 10),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          ),
          child: Text(
            label,
            style: GoogleFonts.poppins(
              color: isFull ? _red : _textSecondary,
              fontSize: 11,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Add / Edit Bottom Sheet
// ---------------------------------------------------------------------------
class _AddEditCustomerSheet extends StatefulWidget {
  final _Customer? customer;
  final void Function(_Customer) onSave;

  const _AddEditCustomerSheet({this.customer, required this.onSave});

  @override
  State<_AddEditCustomerSheet> createState() =>
      _AddEditCustomerSheetState();
}

class _AddEditCustomerSheetState extends State<_AddEditCustomerSheet> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameCtrl;
  late TextEditingController _phoneCtrl;
  late TextEditingController _emailCtrl;
  late TextEditingController _pointsCtrl;

  @override
  void initState() {
    super.initState();
    final c = widget.customer;
    _nameCtrl = TextEditingController(text: c?.name ?? '');
    _phoneCtrl = TextEditingController(text: c?.phone ?? '');
    _emailCtrl = TextEditingController(text: c?.email ?? '');
    _pointsCtrl =
        TextEditingController(text: c?.points.toString() ?? '0');
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _phoneCtrl.dispose();
    _emailCtrl.dispose();
    _pointsCtrl.dispose();
    super.dispose();
  }

  void _save() {
    if (!_formKey.currentState!.validate()) return;
    final existing = widget.customer;
    final c = _Customer(
      id: existing?.id ?? DateTime.now().millisecondsSinceEpoch,
      name: _nameCtrl.text.trim(),
      phone: _phoneCtrl.text.trim(),
      email: _emailCtrl.text.trim().isEmpty
          ? null
          : _emailCtrl.text.trim(),
      points: int.tryParse(_pointsCtrl.text) ?? 0,
      orders: existing?.orders ?? 0,
      spent: existing?.spent ?? 0,
      due: existing?.due ?? 0,
    );
    widget.onSave(c);
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.customer != null;
    return Padding(
      padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Container(
        decoration: BoxDecoration(
          color: _surface,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: const EdgeInsets.fromLTRB(24, 0, 24, 32),
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  margin: const EdgeInsets.symmetric(vertical: 12),
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                      color: _divider,
                      borderRadius: BorderRadius.circular(2)),
                ),
              ),
              Text(
                isEdit ? 'Edit Customer' : 'New Customer',
                style: GoogleFonts.poppins(
                    color: _textPrimary,
                    fontWeight: FontWeight.w700,
                    fontSize: 20),
              ),
              const SizedBox(height: 20),
              _FormField(
                controller: _nameCtrl,
                label: 'Full Name',
                icon: Icons.person_outline_rounded,
                validator: (v) =>
                    (v == null || v.isEmpty) ? 'Name required' : null,
              ),
              const SizedBox(height: 14),
              _FormField(
                controller: _phoneCtrl,
                label: 'Phone Number',
                icon: Icons.phone_outlined,
                keyboardType: TextInputType.phone,
                validator: (v) {
                  if (v == null || v.isEmpty) return 'Phone required';
                  final clean = v.replaceAll(RegExp(r'\D'), '');
                  if (clean.length != 10) return 'Must be exactly 10 digits';
                  return null;
                },
              ),
              const SizedBox(height: 14),
              _FormField(
                controller: _emailCtrl,
                label: 'Email (optional)',
                icon: Icons.email_outlined,
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 14),
              _FormField(
                controller: _pointsCtrl,
                label: 'Loyalty Points',
                icon: Icons.star_outline_rounded,
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _save,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: _amber,
                    foregroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14)),
                  ),
                  child: Text(
                    isEdit ? 'Save Changes' : 'Add Customer',
                    style: GoogleFonts.poppins(
                        fontWeight: FontWeight.w600, fontSize: 16),
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

// ---------------------------------------------------------------------------
// Reusable small widgets
// ---------------------------------------------------------------------------
class _Avatar extends StatelessWidget {
  final String initials;
  final double size;

  const _Avatar({required this.initials, required this.size});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [AppColors.statusRed, AppColors.statusRed.withOpacity(0.85)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        shape: BoxShape.circle,
      ),
      child: Center(
        child: Text(
          initials,
          style: GoogleFonts.poppins(
              color: Colors.white,
              fontWeight: FontWeight.w700,
              fontSize: size * 0.35),
        ),
      ),
    );
  }
}

class _PointsBadge extends StatelessWidget {
  final int points;
  const _PointsBadge({required this.points});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
          color: _amber.withOpacity(0.15),
          borderRadius: BorderRadius.circular(20)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.star_rounded, color: _amber, size: 12),
          const SizedBox(width: 3),
          Text(
            '$points',
            style: GoogleFonts.poppins(
                color: _amber, fontWeight: FontWeight.w700, fontSize: 11),
          ),
        ],
      ),
    );
  }
}

class _StatChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final Color? bgColor;

  const _StatChip(
      {required this.icon,
      required this.label,
      required this.color,
      this.bgColor});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor ?? _divider,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: color),
          const SizedBox(width: 4),
          Text(label,
              style: GoogleFonts.poppins(
                  color: color, fontSize: 11, fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }
}

class _StatsGrid extends StatelessWidget {
  final _Customer customer;
  const _StatsGrid({required this.customer});

  @override
  Widget build(BuildContext context) {
    final stats = [
      ('Total Orders', '${customer.orders}', Icons.receipt_long_rounded,
          _amber),
      (
        'Total Spent',
        'Rs.${(customer.spent / 1000).toStringAsFixed(1)}k',
        Icons.payments_rounded,
        _green
      ),
      (
        'Avg Order',
        'Rs.${customer.avgOrder.toStringAsFixed(0)}',
        Icons.bar_chart_rounded,
        const Color(0xFF60A5FA)
      ),
      ('Last Order', '2 days ago', Icons.schedule_rounded, _textSecondary),
    ];

    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 10,
      mainAxisSpacing: 10,
      childAspectRatio: 2.2,
      children: stats
          .map((s) => Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                    color: _card,
                    borderRadius: BorderRadius.circular(14)),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                          color: s.$4.withOpacity(0.12),
                          borderRadius: BorderRadius.circular(8)),
                      child: Icon(s.$3, color: s.$4, size: 18),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            s.$2,
                            style: GoogleFonts.poppins(
                                color: _textPrimary,
                                fontWeight: FontWeight.w700,
                                fontSize: 14),
                            overflow: TextOverflow.ellipsis,
                          ),
                          Text(
                            s.$1,
                            style: GoogleFonts.poppins(
                                color: _textSecondary, fontSize: 10),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ))
          .toList(),
    );
  }
}

class _ActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _ActionButton({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: color.withOpacity(0.2)),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 22),
            const SizedBox(height: 4),
            Text(label,
                style: GoogleFonts.poppins(
                    color: color,
                    fontSize: 12,
                    fontWeight: FontWeight.w500)),
          ],
        ),
      ),
    );
  }
}

class _FormField extends StatelessWidget {
  final TextEditingController controller;
  final String label;
  final IconData icon;
  final TextInputType? keyboardType;
  final String? Function(String?)? validator;

  const _FormField({
    required this.controller,
    required this.label,
    required this.icon,
    this.keyboardType,
    this.validator,
  });

  @override
  Widget build(BuildContext context) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      validator: validator,
      style: GoogleFonts.poppins(color: _textPrimary, fontSize: 14),
      decoration: InputDecoration(
        labelText: label,
        labelStyle:
            GoogleFonts.poppins(color: _textSecondary, fontSize: 13),
        prefixIcon: Icon(icon, color: _textSecondary, size: 20),
        filled: true,
        fillColor: _card,
        border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide.none),
        enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: _divider)),
        focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: _amber)),
        errorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: _red)),
        focusedErrorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: BorderSide(color: _red)),
      ),
    );
  }
}
