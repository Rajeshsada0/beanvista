import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'package:icafe_app/core/constants/app_constants.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/loyalty_provider.dart';
import '../../providers/menu_provider.dart';
import '../../models/loyalty_reward_model.dart';

// ─── Type Helpers ─────────────────────────────────────────────────────────────

Color _typeColor(String type) {
  switch (type) {
    case 'gift':
    case 'free_item':
      return const Color(0xFF10B981); // Emerald
    case 'discount':
      return const Color(0xFF8B5CF6); // Violet
    case 'voucher':
      return const Color(0xFFF59E0B); // Amber
    default:
      return const Color(0xFF3B82F6); // Blue
  }
}

IconData _typeIcon(String type) {
  switch (type) {
    case 'gift':
    case 'free_item':
      return Icons.card_giftcard_rounded;
    case 'discount':
      return Icons.local_offer_rounded;
    case 'voucher':
      return Icons.confirmation_num_rounded;
    default:
      return Icons.star_rounded;
  }
}

String _typeLabel(String type) {
  switch (type) {
    case 'gift':
    case 'free_item':
      return 'Free Item';
    case 'discount':
      return 'Discount';
    case 'voucher':
      return 'Voucher';
    default:
      return 'Reward';
  }
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

class LoyaltyScreen extends StatefulWidget {
  const LoyaltyScreen({super.key});

  @override
  State<LoyaltyScreen> createState() => _LoyaltyScreenState();
}

class _LoyaltyScreenState extends State<LoyaltyScreen> {
  final TextEditingController _searchCtrl = TextEditingController();
  String _statusFilter = 'all'; // all, active, inactive
  String _pointsFilter = 'all'; // all, k200, 200_500, g500

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<LoyaltyProvider>().fetchRewards();
      context.read<MenuProvider>().fetchMenus();
    });
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  void _deleteReward(int id) {
    context.read<LoyaltyProvider>().deleteReward(id);
  }

  void _toggleStatus(int id) {
    context.read<LoyaltyProvider>().toggleStatus(id);
  }

  void _showAddSheet({LoyaltyRewardModel? reward}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _RewardFormSheet(
        reward: reward,
        onSave: (result) async {
          final fields = result['fields'] as Map<String, String>;
          final image = result['image'] as XFile?;
          if (reward != null) {
            await context.read<LoyaltyProvider>().updateReward(reward.id, fields, imageFile: image);
          } else {
            await context.read<LoyaltyProvider>().createReward(fields, imageFile: image);
          }
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isMobile = MediaQuery.of(context).size.width < 720;

    final searchBar = TextField(
      controller: _searchCtrl,
      style: TextStyle(color: AppColors.textPrimary),
      onChanged: (_) => setState(() {}),
      decoration: InputDecoration(
        hintText: 'Search rewards...',
        prefixIcon: const Icon(Icons.search_rounded),
        suffixIcon: _searchCtrl.text.isNotEmpty
            ? IconButton(
                icon: const Icon(Icons.clear_rounded),
                onPressed: () {
                  _searchCtrl.clear();
                  setState(() {});
                },
              )
            : null,
      ),
    );

    final statusFilterDropdown = Container(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: AppColors.darkSurface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.darkBorder),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: _statusFilter,
          dropdownColor: AppColors.darkSurface,
          style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13),
          items: const [
            DropdownMenuItem(value: 'all', child: Text('All Status')),
            DropdownMenuItem(value: 'active', child: Text('Active Only')),
            DropdownMenuItem(value: 'inactive', child: Text('Inactive Only')),
          ],
          onChanged: (val) {
            if (val != null) setState(() => _statusFilter = val);
          },
        ),
      ),
    );

    final pointsFilterDropdown = Container(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: AppColors.darkSurface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.darkBorder),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: _pointsFilter,
          dropdownColor: AppColors.darkSurface,
          style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13),
          items: const [
            DropdownMenuItem(value: 'all', child: Text('All Points')),
            DropdownMenuItem(value: 'k200', child: Text('< 200 pts')),
            DropdownMenuItem(value: '200_500', child: Text('200 - 500 pts')),
            DropdownMenuItem(value: 'g500', child: Text('> 500 pts')),
          ],
          onChanged: (val) {
            if (val != null) setState(() => _pointsFilter = val);
          },
        ),
      ),
    );

    return Scaffold(
      backgroundColor: AppColors.darkBg,
      appBar: AppBar(
        backgroundColor: AppColors.darkSurface,
        surfaceTintColor: Colors.transparent,
        title: Text(
          'Loyalty Rewards Store',
          style: GoogleFonts.poppins(
            color: AppColors.textPrimary,
            fontSize: 20,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showAddSheet(),
        backgroundColor: AppColors.primary,
        child: const Icon(Icons.add_rounded, color: Colors.white),
      ),
      body: Column(
        children: [
          // Filter Controls Row
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 16, 24, 8),
            child: isMobile
                ? Column(
                    children: [
                      searchBar,
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(child: statusFilterDropdown),
                          const SizedBox(width: 12),
                          Expanded(child: pointsFilterDropdown),
                        ],
                      ),
                    ],
                  )
                : Row(
                    children: [
                      Expanded(child: searchBar),
                      const SizedBox(width: 16),
                      statusFilterDropdown,
                      const SizedBox(width: 16),
                      pointsFilterDropdown,
                    ],
                  ),
          ),
          Expanded(
            child: Consumer<LoyaltyProvider>(
              builder: (context, provider, child) {
                if (provider.isLoading) {
                  return const Center(child: CircularProgressIndicator());
                }
                if (provider.error != null) {
                  return Center(child: Text(provider.error!, style: const TextStyle(color: Colors.red)));
                }

                // Filter logic
                final rewardsList = provider.rewards.where((reward) {
                  final query = _searchCtrl.text.toLowerCase();
                  if (query.isNotEmpty && !reward.name.toLowerCase().contains(query)) {
                    return false;
                  }
                  if (_statusFilter == 'active' && !reward.status) return false;
                  if (_statusFilter == 'inactive' && reward.status) return false;

                  if (_pointsFilter == 'k200' && reward.pointsRequired >= 200) return false;
                  if (_pointsFilter == '200_500' && (reward.pointsRequired < 200 || reward.pointsRequired > 500)) return false;
                  if (_pointsFilter == 'g500' && reward.pointsRequired <= 500) return false;

                  return true;
                }).toList();

                if (rewardsList.isEmpty) {
                  return Center(
                    child: Text('No rewards found', style: GoogleFonts.poppins(color: AppColors.textMuted)),
                  );
                }

                return ListView.builder(
                  padding: const EdgeInsets.all(24),
                  itemCount: rewardsList.length,
                  itemBuilder: (context, index) {
                    final reward = rewardsList[index];
                    return Container(
                      margin: const EdgeInsets.only(bottom: 16),
                      decoration: BoxDecoration(
                        color: AppColors.darkCard,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: AppColors.darkBorder,
                        ),
                      ),
                      child: Material(
                        color: Colors.transparent,
                        borderRadius: BorderRadius.circular(20),
                        clipBehavior: Clip.antiAlias,
                        child: InkWell(
                          onTap: () {},
                          child: Padding(
                            padding: const EdgeInsets.all(16),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Prominent Leading Icon or Image Based on Type
                                Container(
                                  width: 56,
                                  height: 56,
                                  margin: const EdgeInsets.only(top: 4),
                                  decoration: BoxDecoration(
                                    color: _typeColor(reward.type).withOpacity(0.15),
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                  child: reward.imagePath != null && reward.imagePath!.isNotEmpty
                                      ? ClipRRect(
                                          borderRadius: BorderRadius.circular(16),
                                          child: Image.network(
                                            AppConstants.formatImageUrl(reward.imagePath),
                                            fit: BoxFit.cover,
                                            errorBuilder: (context, error, stackTrace) {
                                              return Icon(
                                                _typeIcon(reward.type),
                                                color: _typeColor(reward.type),
                                                size: 28,
                                              );
                                            },
                                          ),
                                        )
                                      : Icon(
                                          _typeIcon(reward.type),
                                          color: _typeColor(reward.type),
                                          size: 28,
                                        ),
                                ),
                                const SizedBox(width: 16),
                                // Details Column
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        reward.name,
                                        style: GoogleFonts.poppins(
                                          color: AppColors.textPrimary,
                                          fontSize: 16,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                      if (reward.description != null && reward.description!.isNotEmpty) ...[
                                        const SizedBox(height: 4),
                                        Text(
                                          reward.description!,
                                          maxLines: 2,
                                          overflow: TextOverflow.ellipsis,
                                          style: GoogleFonts.poppins(
                                            color: AppColors.textSecondary,
                                            fontSize: 13,
                                          ),
                                        ),
                                      ],
                                      const SizedBox(height: 12),
                                      Wrap(
                                        spacing: 8,
                                        runSpacing: 8,
                                        children: [
                                          _TypeBadge(type: reward.type, isActive: reward.status),
                                          if (reward.type != 'voucher')
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                              decoration: BoxDecoration(
                                                color: AppColors.darkSurface,
                                                borderRadius: BorderRadius.circular(10),
                                              ),
                                              child: Row(
                                                mainAxisSize: MainAxisSize.min,
                                                children: [
                                                  Icon(Icons.star_rounded, size: 14, color: AppColors.accentAmber),
                                                  const SizedBox(width: 4),
                                                  Text(
                                                    '${reward.pointsRequired} pts',
                                                    style: GoogleFonts.poppins(
                                                      color: AppColors.textPrimary,
                                                      fontSize: 12,
                                                      fontWeight: FontWeight.w600,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                          if (reward.discountValue != null && reward.discountValue! > 0)
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                              decoration: BoxDecoration(
                                                color: AppColors.statusGreen.withOpacity(0.15),
                                                borderRadius: BorderRadius.circular(10),
                                              ),
                                              child: Text(
                                                reward.discountType == 'percentage'
                                                    ? '${reward.discountValue!.toInt()}% OFF'
                                                    : '-Rs. ${reward.discountValue!.toInt()}',
                                                style: GoogleFonts.poppins(
                                                  color: AppColors.statusGreen,
                                                  fontSize: 12,
                                                  fontWeight: FontWeight.w600,
                                                ),
                                              ),
                                            ),
                                          if (reward.type == 'voucher' && reward.code != null && reward.code!.isNotEmpty)
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                              decoration: BoxDecoration(
                                                color: AppColors.accentAmber.withOpacity(0.15),
                                                borderRadius: BorderRadius.circular(10),
                                              ),
                                              child: Row(
                                                mainAxisSize: MainAxisSize.min,
                                                children: [
                                                  Icon(Icons.confirmation_number_rounded, size: 14, color: AppColors.accentAmber),
                                                  const SizedBox(width: 4),
                                                  Text(
                                                    reward.code!,
                                                    style: GoogleFonts.poppins(
                                                      color: AppColors.accentAmber,
                                                      fontSize: 12,
                                                      fontWeight: FontWeight.w600,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                                // Switch for Status Toggle
                                Transform.scale(
                                  scale: 0.7,
                                  alignment: Alignment.centerRight,
                                  child: Switch(
                                    value: reward.status,
                                    activeColor: AppColors.statusGreen,
                                    materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                    onChanged: (val) {
                                      _toggleStatus(reward.id);
                                    },
                                  ),
                                ),
                                // More Options
                                PopupMenuButton<String>(
                                  icon: Icon(Icons.more_vert_rounded, color: AppColors.textMuted),
                                  color: AppColors.darkSurface,
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  onSelected: (val) {
                                    if (val == 'edit') _showAddSheet(reward: reward);
                                    if (val == 'status') _toggleStatus(reward.id);
                                    if (val == 'delete') _deleteReward(reward.id);
                                  },
                                  itemBuilder: (context) => [
                                    PopupMenuItem(
                                      value: 'edit',
                                      child: Row(children: [
                                        Icon(Icons.edit_rounded, size: 18, color: AppColors.textPrimary),
                                        const SizedBox(width: 8),
                                        Text('Edit', style: TextStyle(color: AppColors.textPrimary)),
                                      ]),
                                    ),
                                    PopupMenuItem(
                                      value: 'status',
                                      child: Row(children: [
                                        Icon(reward.status ? Icons.cancel_rounded : Icons.check_circle_rounded, 
                                          size: 18, color: reward.status ? AppColors.textMuted : AppColors.statusGreen),
                                        const SizedBox(width: 8),
                                        Text(reward.status ? 'Deactivate' : 'Activate', 
                                          style: TextStyle(color: AppColors.textPrimary)),
                                      ]),
                                    ),
                                    PopupMenuItem(
                                      value: 'delete',
                                      child: Row(children: [
                                        Icon(Icons.delete_outline_rounded, size: 18, color: AppColors.statusRed),
                                        const SizedBox(width: 8),
                                        Text('Delete', style: TextStyle(color: AppColors.statusRed)),
                                      ]),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    );
                  },
                );
              }
            ),
          ),
        ],
      ),
    );
  }
}

// ─── Type Badge ──────────────────────────────────────────────────────────────

class _TypeBadge extends StatelessWidget {
  final String type;
  final bool isActive;

  const _TypeBadge({required this.type, required this.isActive});

  @override
  Widget build(BuildContext context) {
    final color = isActive ? _typeColor(type) : AppColors.textMuted;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withOpacity(0.15),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        _typeLabel(type),
        style: GoogleFonts.poppins(color: color, fontSize: 10, fontWeight: FontWeight.w600),
      ),
    );
  }
}

// ─── Reward Form Sheet ────────────────────────────────────────────────────────

class _RewardFormSheet extends StatefulWidget {
  final LoyaltyRewardModel? reward;
  final Function(Map<String, dynamic>) onSave;

  const _RewardFormSheet({this.reward, required this.onSave});

  @override
  State<_RewardFormSheet> createState() => _RewardFormSheetState();
}

class _RewardFormSheetState extends State<_RewardFormSheet> {
  late final TextEditingController _nameCtrl;
  late final TextEditingController _descCtrl;
  late final TextEditingController _pointsCtrl;
  late final TextEditingController _discountValueCtrl;
  late final TextEditingController _codeCtrl;
  late String _type;
  late bool _isActive;
  int? _menuItemId;
  String? _discountType;
  XFile? _imageFile;
  final ImagePicker _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    final r = widget.reward;
    _nameCtrl = TextEditingController(text: r?.name ?? '');
    _descCtrl = TextEditingController(text: r?.description ?? '');
    _pointsCtrl = TextEditingController(text: r?.pointsRequired.toString() ?? '');
    _discountValueCtrl = TextEditingController(text: r?.discountValue?.toString() ?? '');
    _codeCtrl = TextEditingController(text: r?.code ?? '');
    _type = r?.type ?? 'gift';
    _isActive = r?.status ?? true;
    _menuItemId = r?.menuItemId;
    _discountType = r?.discountType ?? 'percentage';
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _descCtrl.dispose();
    _pointsCtrl.dispose();
    _discountValueCtrl.dispose();
    _codeCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final XFile? image = await _picker.pickImage(source: ImageSource.gallery);
    if (image != null) {
      setState(() {
        _imageFile = image;
      });
    }
  }

  void _save() {
    final name = _nameCtrl.text.trim();
    if (name.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a reward name')),
      );
      return;
    }

    final pts = int.tryParse(_pointsCtrl.text) ?? 0;
    final desc = _descCtrl.text.trim();
    final discountVal = double.tryParse(_discountValueCtrl.text);
    final code = _codeCtrl.text.trim();

    if (_type == 'voucher' && code.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a voucher code')),
      );
      return;
    }

    final Map<String, String> fields = {
      'name': name,
      'type': _type,
      'points_required': _type == 'voucher' ? '0' : pts.toString(),
      'description': desc,
      'status': _isActive ? '1' : '0',
    };

    if (_type == 'gift' && _menuItemId != null) {
      fields['menu_item_id'] = _menuItemId!.toString();
    }
    if (_type == 'discount' || _type == 'voucher') {
      if (_discountType != null) {
        fields['discount_type'] = _discountType!;
      }
      if (discountVal != null) {
        fields['discount_value'] = discountVal.toString();
      }
    }
    if (_type == 'voucher') {
      fields['code'] = code;
    }

    widget.onSave({
      'fields': fields,
      'image': _imageFile,
    });
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    final isEdit = widget.reward != null;
    final menus = Provider.of<MenuProvider>(context).menus;

    final Widget imagePickerWidget = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Reward Image',
          style: GoogleFonts.poppins(
              color: AppColors.textSecondary, fontSize: 13, fontWeight: FontWeight.w500),
        ),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: _pickImage,
          child: Container(
            height: 100,
            decoration: BoxDecoration(
              color: AppColors.darkSurface,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.darkBorder),
            ),
            child: _imageFile != null
                ? ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: kIsWeb
                        ? Image.network(
                            _imageFile!.path,
                            fit: BoxFit.cover,
                            width: double.infinity,
                            height: double.infinity,
                          )
                        : Image.file(
                            File(_imageFile!.path),
                            fit: BoxFit.cover,
                            width: double.infinity,
                            height: double.infinity,
                          ),
                  )
                : isEdit && widget.reward?.imagePath != null
                    ? ClipRRect(
                        borderRadius: BorderRadius.circular(16),
                        child: Image.network(
                          AppConstants.formatImageUrl(widget.reward!.imagePath),
                          fit: BoxFit.cover,
                          width: double.infinity,
                          height: double.infinity,
                        ),
                      )
                    : Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.photo_outlined, color: AppColors.textMuted),
                          const SizedBox(height: 4),
                          Text(
                            'Choose Image',
                            style: GoogleFonts.poppins(
                                color: AppColors.textMuted, fontSize: 11),
                          ),
                        ],
                      ),
          ),
        ),
        const SizedBox(height: 8),
        SizedBox(
          width: double.infinity,
          child: TextButton.icon(
            onPressed: _pickImage,
            style: TextButton.styleFrom(
              padding: EdgeInsets.zero,
              foregroundColor: AppColors.accentAmber,
            ),
            icon: const Icon(Icons.add_rounded, size: 14),
            label: Text(
              'Upload New',
              style: GoogleFonts.poppins(fontSize: 12, fontWeight: FontWeight.w600),
            ),
          ),
        ),
      ],
    );

    final Widget statusSelector = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Status',
          style: GoogleFonts.poppins(
              color: AppColors.textSecondary, fontSize: 13, fontWeight: FontWeight.w500),
        ),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: () => setState(() => _isActive = true),
          child: Container(
            width: double.infinity,
            height: 40,
            decoration: BoxDecoration(
              color: _isActive ? const Color(0xFF10B981) : Colors.transparent,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(
                color: _isActive ? const Color(0xFF10B981) : AppColors.darkBorder,
              ),
            ),
            alignment: Alignment.center,
            child: Text(
              'Active',
              style: GoogleFonts.poppins(
                color: _isActive ? Colors.white : AppColors.textSecondary,
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: () => setState(() => _isActive = false),
          child: Container(
            width: double.infinity,
            height: 40,
            decoration: BoxDecoration(
              color: !_isActive ? AppColors.statusRed : Colors.transparent,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(
                color: !_isActive ? AppColors.statusRed : AppColors.darkBorder,
              ),
            ),
            alignment: Alignment.center,
            child: Text(
              'Inactive',
              style: GoogleFonts.poppins(
                color: !_isActive ? Colors.white : AppColors.textSecondary,
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ),
      ],
    );

    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.darkCard,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  margin: const EdgeInsets.only(top: 12, bottom: 8),
                  width: 36,
                  height: 4,
                  decoration: BoxDecoration(
                    color: AppColors.darkBorder,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(isEdit ? 'Edit Reward' : 'Create Reward',
                            style: GoogleFonts.poppins(
                                color: AppColors.textPrimary, fontSize: 18, fontWeight: FontWeight.w700)),
                        IconButton(
                          icon: Icon(Icons.close, color: AppColors.textMuted),
                          onPressed: () => Navigator.pop(context),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    // Name & Points
                    if (_type == 'voucher')
                      TextField(
                        controller: _nameCtrl,
                        style: TextStyle(color: AppColors.textPrimary),
                        decoration: const InputDecoration(
                          labelText: 'Reward Name',
                          hintText: 'e.g. Special Promo VOUCHER',
                          prefixIcon: Icon(Icons.card_giftcard_outlined),
                        ),
                      )
                    else
                      Row(
                        children: [
                          Expanded(
                            flex: 3,
                            child: TextField(
                              controller: _nameCtrl,
                              style: TextStyle(color: AppColors.textPrimary),
                              decoration: const InputDecoration(
                                labelText: 'Reward Name',
                                hintText: 'e.g. Free Coffee',
                                prefixIcon: Icon(Icons.card_giftcard_outlined),
                              ),
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            flex: 2,
                            child: TextField(
                              controller: _pointsCtrl,
                              keyboardType: TextInputType.number,
                              style: TextStyle(color: AppColors.textPrimary),
                              decoration: const InputDecoration(
                                labelText: 'Points Required',
                                hintText: '500',
                                prefixIcon: Icon(Icons.star_outline_rounded),
                              ),
                            ),
                          ),
                        ],
                      ),
                    const SizedBox(height: 16),
                    // Reward Type Dropdown
                    DropdownButtonFormField<String>(
                      value: _type,
                      style: TextStyle(color: AppColors.textPrimary),
                      dropdownColor: AppColors.darkSurface,
                      decoration: const InputDecoration(
                        labelText: 'Reward Type',
                        prefixIcon: Icon(Icons.category_outlined),
                      ),
                      items: const [
                        DropdownMenuItem(value: 'gift', child: Text('Free Menu Item (Gift)')),
                        DropdownMenuItem(value: 'discount', child: Text('Discount')),
                        DropdownMenuItem(value: 'voucher', child: Text('Voucher / Coupon Code')),
                      ],
                      onChanged: (val) {
                        if (val != null) {
                          setState(() {
                            _type = val;
                          });
                        }
                      },
                    ),
                    if (_type == 'gift') ...[
                      const SizedBox(height: 16),
                      // Menu Item selection (dropdown from MenuProvider)
                      DropdownButtonFormField<int>(
                        value: _menuItemId,
                        style: TextStyle(color: AppColors.textPrimary),
                        dropdownColor: AppColors.darkSurface,
                        decoration: const InputDecoration(
                          labelText: 'Menu Item',
                          prefixIcon: Icon(Icons.restaurant_menu_outlined),
                        ),
                        items: menus.map((m) {
                          return DropdownMenuItem<int>(
                            value: m.id,
                            child: Text(m.name),
                          );
                        }).toList(),
                        onChanged: (val) {
                          setState(() => _menuItemId = val);
                        },
                      ),
                    ],
                    if (_type == 'discount' || _type == 'voucher') ...[
                      const SizedBox(height: 16),
                      // Discount details (Type and Value)
                      Row(
                        children: [
                          Expanded(
                            flex: 1,
                            child: DropdownButtonFormField<String>(
                              value: _discountType,
                              style: TextStyle(color: AppColors.textPrimary),
                              dropdownColor: AppColors.darkSurface,
                              decoration: const InputDecoration(
                                labelText: 'Discount Type',
                                prefixIcon: Icon(Icons.local_offer_outlined),
                              ),
                              items: const [
                                DropdownMenuItem(value: 'percentage', child: Text('Percentage (%)')),
                                DropdownMenuItem(value: 'fixed', child: Text('Fixed Amount (Rs.)')),
                              ],
                              onChanged: (val) {
                                setState(() => _discountType = val);
                              },
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            flex: 1,
                            child: TextField(
                              controller: _discountValueCtrl,
                              keyboardType: TextInputType.number,
                              style: TextStyle(color: AppColors.textPrimary),
                              decoration: const InputDecoration(
                                labelText: 'Discount Value',
                                prefixIcon: Icon(Icons.money_off_rounded),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                    if (_type == 'voucher') ...[
                      const SizedBox(height: 16),
                      // Voucher / Coupon Code text field
                      TextField(
                        controller: _codeCtrl,
                        style: TextStyle(color: AppColors.textPrimary),
                        decoration: const InputDecoration(
                          labelText: 'Voucher / Coupon Code',
                          hintText: 'e.g. SAVE10',
                          prefixIcon: Icon(Icons.confirmation_number_outlined),
                        ),
                      ),
                    ],
                    const SizedBox(height: 16),
                    TextField(
                      controller: _descCtrl,
                      style: TextStyle(color: AppColors.textPrimary),
                      maxLines: 2,
                      decoration: const InputDecoration(
                        labelText: 'Description',
                        prefixIcon: Icon(Icons.description_outlined),
                        alignLabelWithHint: true,
                      ),
                    ),
                    const SizedBox(height: 20),
                    // Image picker & Status selection
                    if (_type == 'voucher')
                      statusSelector
                    else
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            flex: 1,
                            child: imagePickerWidget,
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            flex: 1,
                            child: statusSelector,
                          ),
                        ],
                      ),
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: _save,
                        icon: Icon(isEdit ? Icons.save_rounded : Icons.add_rounded),
                        label: Text(isEdit ? 'Save Changes' : 'Create Reward'),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

