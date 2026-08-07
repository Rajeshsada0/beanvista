import 'package:icafe_app/core/utils/snackbar_helper.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/json_utils.dart';
import '../../providers/reservations_provider.dart';

class ReservationsScreen extends StatefulWidget {
  const ReservationsScreen({super.key});

  @override
  State<ReservationsScreen> createState() => _ReservationsScreenState();
}

class _ReservationsScreenState extends State<ReservationsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String _selectedDate = 'All';

  bool _isSameDay(DateTime d1, DateTime d2) {
    return d1.year == d2.year && d1.month == d2.month && d1.day == d2.day;
  }

  List<String> get _dateOptions {
    final now = DateTime.now();
    final fmt = (DateTime d) {
      if (d.day == now.day && d.month == now.month && d.year == now.year) return 'Today';
      if (d.day == now.add(const Duration(days: 1)).day && d.month == now.month && d.year == now.year) return 'Tomorrow';
      final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return "${months[d.month - 1]} ${d.day}";
    };
    return ['All', ...List.generate(5, (i) => fmt(now.add(Duration(days: i))))];
  }

  List<Map<String, dynamic>> get _filtered {
    final provider = context.watch<ReservationsProvider>();
    final list = provider.reservations;
    final now = DateTime.now();

    // First filter by tab status/time
    final tabFiltered = list.where((r) {
      final status = r['status'] ?? 'active';
      final bookingTime = DateTime.parse(r['booking_time']);
      final tabIndex = _tabController.index;
      
      if (tabIndex == 1) return status == 'active';
      if (tabIndex == 2) {
        return status == 'active' && _isSameDay(bookingTime, now);
      }
      if (tabIndex == 3) {
        // Upcoming = active, after today
        return status == 'active' && bookingTime.isAfter(now) && !_isSameDay(bookingTime, now);
      }
      return true; // Tab 0 = All
    }).toList();

    // Then filter by selectedDate chip
    return tabFiltered.where((r) {
      if (_selectedDate == 'All') return true;

      final bookingTime = DateTime.parse(r['booking_time']);
      if (_selectedDate == 'Today') {
        return _isSameDay(bookingTime, now);
      }
      if (_selectedDate == 'Tomorrow') {
        return _isSameDay(bookingTime, now.add(const Duration(days: 1)));
      }
      final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      final chipStr = "${months[bookingTime.month - 1]} ${bookingTime.day}";
      return _selectedDate == chipStr;
    }).toList();
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'active': return AppColors.statusGreen;
      case 'cancelled': return AppColors.statusRed;
      case 'completed': return AppColors.statusBlue;
      default: return AppColors.textMuted;
    }
  }

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _tabController.addListener(() => setState(() {}));
    
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ReservationsProvider>().fetchReservations();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<ReservationsProvider>();
    final now = DateTime.now();
    final todayCount = provider.reservations
        .where((r) => (r['status'] ?? 'active') == 'active' && _isSameDay(DateTime.parse(r['booking_time']), now))
        .length;

    return Scaffold(
      backgroundColor: AppColors.darkBg,
      appBar: AppBar(
        backgroundColor: AppColors.darkSurface,
        elevation: 0,
        title: Row(
          children: [
            Text('Reservations',
                style: GoogleFonts.poppins(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: AppColors.textPrimary)),
            if (todayCount > 0) ...[
              const SizedBox(width: 10),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: AppColors.accentAmber.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text('$todayCount today',
                    style: GoogleFonts.poppins(
                        fontSize: 11,
                        color: AppColors.accentAmber,
                        fontWeight: FontWeight.w600)),
              ),
            ],
          ],
        ),
        actions: [
          IconButton(
            icon: Icon(Icons.refresh_rounded, color: AppColors.textSecondary),
            onPressed: () => provider.fetchReservations(),
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.accentAmber,
          labelColor: AppColors.accentAmber,
          unselectedLabelColor: AppColors.textMuted,
          labelStyle: GoogleFonts.poppins(fontSize: 11, fontWeight: FontWeight.w600),
          unselectedLabelStyle: GoogleFonts.poppins(fontSize: 11),
          tabs: const [
            Tab(text: 'All'),
            Tab(text: 'Active'),
            Tab(text: 'Today'),
            Tab(text: 'Upcoming'),
          ],
        ),
      ),
      body: provider.isLoading
          ? Center(child: CircularProgressIndicator(color: AppColors.accentAmber))
          : Column(
              children: [
                // Date selector chips
                Container(
                  color: AppColors.darkSurface,
                  padding: const EdgeInsets.fromLTRB(12, 10, 12, 14),
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: _dateOptions.map((date) {
                        final selected = _selectedDate == date;
                        return GestureDetector(
                          onTap: () => setState(() => _selectedDate = date),
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 200),
                            margin: const EdgeInsets.only(right: 8),
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                            decoration: BoxDecoration(
                              color: selected ? AppColors.accentAmber : AppColors.darkCard,
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(
                                color: selected ? AppColors.accentAmber : AppColors.darkBorder,
                              ),
                            ),
                            child: Text(
                              date,
                              style: GoogleFonts.poppins(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: selected ? AppColors.textOnAmber : AppColors.textSecondary,
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ),
                Divider(color: AppColors.darkBorder, height: 1),

                // List
                Expanded(
                  child: _filtered.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.event_busy_outlined,
                                  size: 64,
                                  color: AppColors.textMuted.withOpacity(0.4)),
                              const SizedBox(height: 16),
                              Text('No reservations',
                                  style: GoogleFonts.poppins(
                                      fontSize: 16,
                                      color: AppColors.textMuted,
                                      fontWeight: FontWeight.w500)),
                            ],
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.fromLTRB(12, 12, 12, 100),
                          itemCount: _filtered.length,
                          itemBuilder: (ctx, i) => _buildReservationCard(_filtered[i]),
                        ),
                ),
              ],
            ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showAddSheet(),
        backgroundColor: AppColors.accentAmber,
        foregroundColor: Colors.white,
        shape: const StadiumBorder(),
        icon: const Icon(Icons.add_rounded),
        label: Text('New Reservation', style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
      ),
    );
  }

  Widget _buildReservationCard(Map<String, dynamic> r) {
    final statusColor = _statusColor(r['status'] ?? 'active');
    final bookingTime = DateTime.parse(r['booking_time']);

    final hour = bookingTime.hour > 12 
        ? bookingTime.hour - 12 
        : (bookingTime.hour == 0 ? 12 : bookingTime.hour);
    final minute = bookingTime.minute.toString().padLeft(2, '0');
    final period = bookingTime.hour >= 12 ? 'PM' : 'AM';
    final timeStr = "$hour:$minute";

    final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    final dateStr = "${months[bookingTime.month - 1]} ${bookingTime.day}";

    return GestureDetector(
      onTap: () => _showDetail(r),
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.darkCard,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.darkBorder),
        ),
        child: Row(
          children: [
            // Time badge
            Container(
              width: 58,
              padding: const EdgeInsets.symmetric(vertical: 8),
              decoration: BoxDecoration(
                color: AppColors.accentAmber.withOpacity(0.12),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppColors.accentAmber.withOpacity(0.3)),
              ),
              child: Column(
                children: [
                  Text(
                    timeStr,
                    style: GoogleFonts.poppins(
                        fontSize: 13,
                        fontWeight: FontWeight.w800,
                        color: AppColors.accentAmber),
                  ),
                  Text(
                    period,
                    style: GoogleFonts.poppins(
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                        color: AppColors.accentAmber.withOpacity(0.7)),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),

            // Details
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    r['customer_name'] ?? '',
                    style: GoogleFonts.poppins(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: AppColors.textPrimary),
                  ),
                  const SizedBox(height: 3),
                  Row(
                    children: [
                      Icon(Icons.table_restaurant_outlined, size: 13, color: AppColors.textMuted),
                      const SizedBox(width: 4),
                      Text("Table ${r['table_number'] ?? 'N/A'}",
                          style: GoogleFonts.poppins(fontSize: 11, color: AppColors.textMuted)),
                      const SizedBox(width: 10),
                      Icon(Icons.people_outline_rounded, size: 13, color: AppColors.textMuted),
                      const SizedBox(width: 4),
                      Text('${r['guests_count'] ?? 1} guests',
                          style: GoogleFonts.poppins(fontSize: 11, color: AppColors.textMuted)),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(width: 8),

            // Right side
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: statusColor.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: statusColor.withOpacity(0.3)),
                  ),
                  child: Text(
                    (r['status'] ?? 'active').toString().toUpperCase(),
                    style: GoogleFonts.poppins(
                        fontSize: 9,
                        color: statusColor,
                        fontWeight: FontWeight.w700),
                  ),
                ),
                const SizedBox(height: 6),
                Text(dateStr, style: GoogleFonts.poppins(fontSize: 10, color: AppColors.textMuted)),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showDetail(Map<String, dynamic> r) {
    final bookingTime = DateTime.parse(r['booking_time']);
    final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    final dateStr = "${months[bookingTime.month - 1]} ${bookingTime.day}, ${bookingTime.year}";
    
    final hour = bookingTime.hour > 12 
        ? bookingTime.hour - 12 
        : (bookingTime.hour == 0 ? 12 : bookingTime.hour);
    final minute = bookingTime.minute.toString().padLeft(2, '0');
    final period = bookingTime.hour >= 12 ? 'PM' : 'AM';
    final timeStr = "$hour:$minute $period";

    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.darkCard,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.darkBorder,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 20),
            Row(
              children: [
                Expanded(
                  child: Text(r['customer_name'] ?? '',
                      style: GoogleFonts.poppins(
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                          color: AppColors.textPrimary)),
                ),
                IconButton(
                  icon: Icon(Icons.edit_rounded, color: AppColors.accentAmber),
                  onPressed: () {
                    Navigator.pop(ctx);
                    _showAddSheet(r);
                  },
                ),
                IconButton(
                  icon: Icon(Icons.delete_rounded, color: AppColors.statusRed),
                  onPressed: () {
                    Navigator.pop(ctx);
                    _confirmDelete(r);
                  },
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(r['phone'] ?? '', style: GoogleFonts.poppins(fontSize: 13, color: AppColors.textMuted)),
            const SizedBox(height: 16),
            _detailRow('Date', '$dateStr at $timeStr'),
            _detailRow('Table', "Table ${r['table_number'] ?? 'N/A'}"),
            _detailRow('Guests', '${r['guests_count'] ?? 1} people'),
            _detailRow('Status', (r['status'] ?? 'active').toString().toUpperCase()),
            const SizedBox(height: 20),
            
            // Status update controls
            if ((r['status'] ?? 'active') == 'active') ...[
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      onPressed: () async {
                        final success = await context.read<ReservationsProvider>().updateReservationStatus(r['id'], 'cancelled');
                        if (success && mounted) {
                          Navigator.pop(ctx);
                          showTopSnackBar(context, 
                            SnackBar(content: const Text('Reservation cancelled'), backgroundColor: AppColors.statusRed),
                          );
                        }
                      },
                      icon: const Icon(Icons.cancel_outlined, size: 16),
                      label: const Text('Cancel Booking'),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.statusRed,
                        side: BorderSide(color: AppColors.statusRed),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: ElevatedButton.icon(
                      onPressed: () async {
                        final success = await context.read<ReservationsProvider>().updateReservationStatus(r['id'], 'completed');
                        if (success && mounted) {
                          Navigator.pop(ctx);
                          showTopSnackBar(context, 
                            SnackBar(content: const Text('Checked In successfully'), backgroundColor: AppColors.statusGreen),
                          );
                        }
                      },
                      icon: const Icon(Icons.check_rounded, size: 16),
                      label: const Text('Check In'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.accentAmber,
                        foregroundColor: AppColors.textOnAmber,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                    ),
                  ),
                ],
              ),
            ] else ...[
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () => Navigator.pop(ctx),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.textSecondary,
                    side: BorderSide(color: AppColors.darkBorder),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  ),
                  child: const Text('Close'),
                ),
              )
            ],
          ],
        ),
      ),
    );
  }

  void _confirmDelete(Map<String, dynamic> r) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.darkCard,
        title: Text('Delete Reservation?', style: GoogleFonts.poppins(color: AppColors.textPrimary, fontWeight: FontWeight.bold)),
        content: Text('Are you sure you want to delete reservation for "${r['customer_name']}"?', style: GoogleFonts.poppins(color: AppColors.textSecondary)),
        actions: [
          TextButton(
            child: Text('Cancel', style: GoogleFonts.poppins(color: AppColors.textMuted)),
            onPressed: () => Navigator.pop(ctx),
          ),
          const SizedBox(width: 8),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.statusRed,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            ),
            child: Text('Delete', style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
            onPressed: () async {
              Navigator.pop(ctx);
              final success = await context.read<ReservationsProvider>().deleteReservation(r['id']);
              if (success && mounted) {
                showTopSnackBar(context, 
                  SnackBar(content: const Text('Reservation deleted'), backgroundColor: AppColors.statusGreen),
                );
              }
            },
          ),
        ],
      ),
    );
  }

  Widget _detailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        children: [
          Text(label, style: GoogleFonts.poppins(fontSize: 13, color: AppColors.textMuted)),
          const Spacer(),
          Text(value,
              style: GoogleFonts.poppins(
                fontSize: 13,
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w500,
              )),
        ],
      ),
    );
  }

  void _showAddSheet([Map<String, dynamic>? itemToEdit]) {
    final provider = context.read<ReservationsProvider>();
    final nameCtrl = TextEditingController(text: itemToEdit != null ? itemToEdit['customer_name'] : '');
    final phoneCtrl = TextEditingController(text: itemToEdit != null ? itemToEdit['phone'] : '');
    int? selectedTableId = itemToEdit != null 
        ? JsonUtils.parseInt(itemToEdit['table_id']) 
        : (provider.tables.isNotEmpty ? JsonUtils.parseInt(provider.tables.first['id']) : null);
    int guests = itemToEdit != null ? JsonUtils.parseInt(itemToEdit['guests_count']) : 2;
    DateTime bookingTime = itemToEdit != null ? DateTime.parse(itemToEdit['booking_time']) : DateTime.now().add(const Duration(hours: 1));

    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.darkCard,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setModalState) => Padding(
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
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppColors.darkBorder,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Text(itemToEdit != null ? 'Edit Reservation' : 'New Reservation',
                  style: GoogleFonts.poppins(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: AppColors.textPrimary)),
              const SizedBox(height: 20),
              TextField(
                controller: nameCtrl,
                style: GoogleFonts.poppins(color: AppColors.textPrimary),
                decoration: InputDecoration(
                  labelText: 'Customer Name',
                  prefixIcon: const Icon(Icons.person_outline_rounded),
                  filled: true,
                  fillColor: AppColors.darkSurface,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppColors.darkBorder)),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppColors.darkBorder)),
                  focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppColors.accentAmber, width: 2)),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: phoneCtrl,
                keyboardType: TextInputType.phone,
                style: GoogleFonts.poppins(color: AppColors.textPrimary),
                decoration: InputDecoration(
                  labelText: 'Phone Number',
                  prefixIcon: const Icon(Icons.phone_outlined),
                  filled: true,
                  fillColor: AppColors.darkSurface,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppColors.darkBorder)),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppColors.darkBorder)),
                  focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppColors.accentAmber, width: 2)),
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: DropdownButtonFormField<int>(
                      value: selectedTableId,
                      style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 14),
                      dropdownColor: AppColors.darkCard,
                      decoration: InputDecoration(
                        labelText: 'Table',
                        filled: true,
                        fillColor: AppColors.darkSurface,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppColors.darkBorder)),
                        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppColors.darkBorder)),
                      ),
                      items: provider.tables.map((t) {
                        return DropdownMenuItem<int>(
                          value: JsonUtils.parseInt(t['id']),
                          child: Text(
                            "${t['number']} (Cap: ${t['capacity']})",
                            style: GoogleFonts.poppins(color: AppColors.textPrimary),
                          ),
                        );
                      }).toList(),
                      onChanged: (v) {
                        if (v != null) {
                          setModalState(() => selectedTableId = v);
                        }
                      },
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Guests', style: GoogleFonts.poppins(fontSize: 12, color: AppColors.textSecondary)),
                        const SizedBox(height: 4),
                        Container(
                          decoration: BoxDecoration(
                            color: AppColors.darkSurface,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppColors.darkBorder),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              IconButton(
                                icon: Icon(Icons.remove_rounded, color: AppColors.textSecondary, size: 18),
                                onPressed: () {
                                  if (guests > 1) setModalState(() => guests--);
                                },
                              ),
                              Text('$guests',
                                  style: GoogleFonts.poppins(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w700,
                                      color: AppColors.textPrimary)),
                              IconButton(
                                icon: Icon(Icons.add_rounded, color: AppColors.accentAmber, size: 18),
                                onPressed: () => setModalState(() => guests++),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              
              // Booking Date & Time picker
              Row(
                children: [
                  Expanded(
                    child: InkWell(
                      onTap: () async {
                        final picked = await showDatePicker(
                          context: context,
                          initialDate: bookingTime,
                          firstDate: DateTime.now().subtract(const Duration(days: 1)),
                          lastDate: DateTime.now().add(const Duration(days: 30)),
                        );
                        if (picked != null) {
                          setModalState(() {
                            bookingTime = DateTime(
                              picked.year,
                              picked.month,
                              picked.day,
                              bookingTime.hour,
                              bookingTime.minute,
                            );
                          });
                        }
                      },
                      child: InputDecorator(
                        decoration: InputDecoration(
                          labelText: 'Booking Date',
                          filled: true,
                          fillColor: AppColors.darkSurface,
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppColors.darkBorder)),
                          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppColors.darkBorder)),
                        ),
                        child: Text(
                          "${bookingTime.day}/${bookingTime.month}/${bookingTime.year}",
                          style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: InkWell(
                      onTap: () async {
                        final picked = await showTimePicker(
                          context: context,
                          initialTime: TimeOfDay.fromDateTime(bookingTime),
                        );
                        if (picked != null) {
                          setModalState(() {
                            bookingTime = DateTime(
                              bookingTime.year,
                              bookingTime.month,
                              bookingTime.day,
                              picked.hour,
                              picked.minute,
                            );
                          });
                        }
                      },
                      child: InputDecorator(
                        decoration: InputDecoration(
                          labelText: 'Booking Time',
                          filled: true,
                          fillColor: AppColors.darkSurface,
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppColors.darkBorder)),
                          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppColors.darkBorder)),
                        ),
                        child: Text(
                          TimeOfDay.fromDateTime(bookingTime).format(context),
                          style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: () async {
                    if (nameCtrl.text.trim().isEmpty || phoneCtrl.text.trim().isEmpty || selectedTableId == null) {
                      showTopSnackBar(context, 
                        SnackBar(content: const Text('Please fill all fields'), backgroundColor: AppColors.statusRed),
                      );
                      return;
                    }
                    
                    bool success = false;
                    if (itemToEdit != null) {
                      success = await provider.updateReservation(
                        itemToEdit['id'],
                        tableId: selectedTableId!,
                        name: nameCtrl.text.trim(),
                        phone: phoneCtrl.text.trim(),
                        bookingTime: bookingTime,
                        guestsCount: guests,
                      );
                    } else {
                      success = await provider.createReservation(
                        tableId: selectedTableId!,
                        name: nameCtrl.text.trim(),
                        phone: phoneCtrl.text.trim(),
                        bookingTime: bookingTime,
                        guestsCount: guests,
                      );
                    }

                    if (success && mounted) {
                      Navigator.pop(ctx);
                      showTopSnackBar(context, 
                        SnackBar(
                          content: Text(itemToEdit != null ? 'Reservation updated successfully' : 'Reservation created successfully'),
                          backgroundColor: AppColors.statusGreen,
                        ),
                      );
                    } else if (mounted) {
                      showTopSnackBar(context, 
                        SnackBar(content: Text(provider.error ?? 'An error occurred'), backgroundColor: AppColors.statusRed),
                      );
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.accentAmber,
                    foregroundColor: AppColors.textOnAmber,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: Text(itemToEdit != null ? 'Save Changes' : 'Create Reservation',
                      style: GoogleFonts.poppins(fontSize: 15, fontWeight: FontWeight.w600)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
