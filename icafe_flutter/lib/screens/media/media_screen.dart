import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/theme/app_theme.dart';
import '../../providers/media_provider.dart';

class MediaScreen extends StatefulWidget {
  final bool isSelector;
  final String initialType; // 'images' or 'icons'

  const MediaScreen({
    Key? key,
    this.isSelector = false,
    this.initialType = 'images',
  }) : super(key: key);

  @override
  State<MediaScreen> createState() => _MediaScreenState();
}

class _MediaScreenState extends State<MediaScreen> {
  late String _currentType;
  final TextEditingController _searchCtrl = TextEditingController();
  MediaItem? _selectedItem;
  bool _isUploading = false;
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _currentType = widget.initialType;
    _searchCtrl.addListener(() {
      setState(() {
        _searchQuery = _searchCtrl.text.toLowerCase();
      });
    });

    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<MediaProvider>().fetchMedia(_currentType);
    });
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  void _switchType(String type) {
    if (_currentType == type) return;
    setState(() {
      _currentType = type;
      _selectedItem = null;
    });
    context.read<MediaProvider>().fetchMedia(type);
  }

  Future<void> _pickAndUpload() async {
    final picker = ImagePicker();
    final imgFile = await picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 85,
    );

    if (imgFile == null) return;

    setState(() => _isUploading = true);
    
    if (mounted) {
      final provider = context.read<MediaProvider>();
      final result = await provider.uploadMedia(imgFile, _currentType);
      
      setState(() => _isUploading = false);

      if (mounted) {
        if (result != null) {
          setState(() {
            _selectedItem = result;
          });
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Successfully uploaded ${result.name}'),
              backgroundColor: AppColors.statusGreen,
            ),
          );
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(provider.error ?? 'Upload failed'),
              backgroundColor: AppColors.statusRed,
            ),
          );
        }
      }
    }
  }

  void _showRenameDialog(MediaItem item) {
    final ctrl = TextEditingController(text: item.name.split('.').first);
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: AppColors.darkSurface,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20), side: BorderSide(color: AppColors.darkBorder)),
          title: Text(
            'Rename Asset',
            style: GoogleFonts.poppins(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 16),
          ),
          content: TextField(
            controller: ctrl,
            style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 14),
            decoration: InputDecoration(
              hintText: 'Enter new name',
              hintStyle: GoogleFonts.poppins(color: AppColors.textMuted),
              fillColor: AppColors.darkBg,
              filled: true,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppColors.darkBorder)),
              focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: AppColors.accentAmber)),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text('Cancel', style: GoogleFonts.poppins(color: AppColors.textMuted, fontWeight: FontWeight.w600)),
            ),
            ElevatedButton(
              onPressed: () async {
                final newName = ctrl.text.trim();
                if (newName.isEmpty) return;
                Navigator.pop(context);
                
                final provider = context.read<MediaProvider>();
                final success = await provider.renameMedia(item.path, newName);
                if (mounted) {
                  if (success) {
                    setState(() {
                      _selectedItem = null;
                    });
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: const Text('Asset renamed successfully'), backgroundColor: AppColors.statusGreen),
                    );
                  } else {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text(provider.error ?? 'Failed to rename'), backgroundColor: AppColors.statusRed),
                    );
                  }
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.accentAmber,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              child: Text('Rename', style: GoogleFonts.poppins(color: AppColors.textOnAmber, fontWeight: FontWeight.bold)),
            ),
          ],
        );
      },
    );
  }

  void _showDeleteConfirm(MediaItem item) {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: AppColors.darkSurface,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20), side: BorderSide(color: AppColors.darkBorder)),
          title: Text(
            'Delete Asset',
            style: GoogleFonts.poppins(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 16),
          ),
          content: Text(
            'Are you sure you want to permanently delete ${item.name}? This will remove it from all products referencing it.',
            style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 13),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text('Cancel', style: GoogleFonts.poppins(color: AppColors.textMuted, fontWeight: FontWeight.w600)),
            ),
            ElevatedButton(
              onPressed: () async {
                Navigator.pop(context);
                
                final provider = context.read<MediaProvider>();
                final success = await provider.deleteMedia(item.path);
                if (mounted) {
                  if (success) {
                    setState(() {
                      _selectedItem = null;
                    });
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: const Text('Asset deleted successfully'), backgroundColor: AppColors.statusGreen),
                    );
                  } else {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text(provider.error ?? 'Failed to delete'), backgroundColor: AppColors.statusRed),
                    );
                  }
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.statusRed,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              child: Text('Delete', style: GoogleFonts.poppins(color: Colors.white, fontWeight: FontWeight.bold)),
            ),
          ],
        );
      },
    );
  }

  void _showDetailsSheet(MediaItem item) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.darkSurface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (context) {
        final double sizeKB = item.size / 1024;
        final sizeStr = sizeKB > 1024 
            ? '${(sizeKB / 1024).toStringAsFixed(2)} MB' 
            : '${sizeKB.toStringAsFixed(1)} KB';

        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Center(
                  child: Container(
                    width: 48,
                    height: 5,
                    decoration: BoxDecoration(color: AppColors.darkBorder, borderRadius: BorderRadius.circular(10)),
                  ),
                ),
                const SizedBox(height: 20),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: Container(
                        width: 80,
                        height: 80,
                        color: AppColors.darkBg,
                        child: Image.network(
                          item.url,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => const Icon(Icons.image, color: Colors.grey),
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            item.name,
                            style: GoogleFonts.poppins(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 14),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Size: $sizeStr',
                            style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 12),
                          ),
                          Text(
                            'Path: ${item.path}',
                            style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 10),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () {
                          Navigator.pop(context);
                          _showRenameDialog(item);
                        },
                        icon: Icon(Icons.edit_outlined, size: 18, color: AppColors.textPrimary),
                        label: Text('Rename', style: GoogleFonts.poppins(color: AppColors.textPrimary, fontWeight: FontWeight.w600)),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.textPrimary,
                          side: BorderSide(color: AppColors.darkBorder),
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () {
                          Navigator.pop(context);
                          _showDeleteConfirm(item);
                        },
                        icon: const Icon(Icons.delete_outline_rounded, size: 18),
                        label: const Text('Delete'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.statusRed.withOpacity(0.1),
                          foregroundColor: AppColors.statusRed,
                          elevation: 0,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                            side: BorderSide(color: AppColors.statusRed.withOpacity(0.3)),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                if (widget.isSelector) ...[
                  const SizedBox(height: 12),
                  ElevatedButton(
                    onPressed: () {
                      Navigator.pop(context);
                      Navigator.pop(context, {
                        'path': item.path,
                        'url': item.url,
                      });
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.accentAmber,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    child: Text(
                      'Use This Asset',
                      style: GoogleFonts.poppins(color: AppColors.textOnAmber, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<MediaProvider>();
    final filtered = provider.mediaList.where((item) {
      return item.name.toLowerCase().contains(_searchQuery);
    }).toList();

    return Scaffold(
      backgroundColor: AppColors.darkBg,
      appBar: AppBar(
        backgroundColor: AppColors.darkSurface,
        elevation: 0,
        iconTheme: IconThemeData(color: AppColors.textPrimary),
        leading: widget.isSelector
            ? IconButton(
                icon: Icon(Icons.close_rounded, color: AppColors.textPrimary),
                onPressed: () => Navigator.pop(context),
              )
            : null,
        title: Text(
          widget.isSelector ? 'Select Media Asset' : 'Media Library',
          style: GoogleFonts.poppins(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 18),
        ),
        actions: [
          if (_isUploading)
            Center(
              child: Padding(
                padding: const EdgeInsets.only(right: 16.0),
                child: SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(color: AppColors.accentAmber, strokeWidth: 2),
                ),
              ),
            ),
        ],
      ),

      // ── Selected-item panel lives here so FAB auto-lifts above it ──────────
      bottomNavigationBar: _selectedItem == null
          ? null
          : Container(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
              decoration: BoxDecoration(
                color: AppColors.darkSurface,
                border: Border(top: BorderSide(color: AppColors.darkBorder)),
              ),
              child: Row(
                children: [
                  // Thumbnail
                  ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: SizedBox(
                      width: 40,
                      height: 40,
                      child: Image.network(
                        _selectedItem!.url,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) =>
                            Icon(Icons.image, color: AppColors.textMuted),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  // Name + label
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          _selectedItem!.name,
                          style: GoogleFonts.poppins(
                              color: AppColors.textPrimary,
                              fontWeight: FontWeight.bold,
                              fontSize: 12),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          'Selected Asset',
                          style: GoogleFonts.poppins(
                              color: AppColors.textMuted, fontSize: 10),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  // Clear
                  TextButton(
                    onPressed: () => setState(() => _selectedItem = null),
                    child: Text('Clear',
                        style: GoogleFonts.poppins(
                            color: AppColors.textMuted,
                            fontWeight: FontWeight.w600,
                            fontSize: 12)),
                  ),
                  const SizedBox(width: 4),
                  // Use Asset / Manage
                  ElevatedButton(
                    onPressed: () {
                      if (widget.isSelector) {
                        Navigator.pop(context, {
                          'path': _selectedItem!.path,
                          'url': _selectedItem!.url,
                        });
                      } else {
                        _showDetailsSheet(_selectedItem!);
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.accentAmber,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10)),
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 10),
                    ),
                    child: Text(
                      widget.isSelector ? 'Use Asset' : 'Manage',
                      style: GoogleFonts.poppins(
                          color: AppColors.textOnAmber,
                          fontWeight: FontWeight.bold,
                          fontSize: 12),
                    ),
                  ),
                ],
              ),
            ),

      body: Column(
        children: [
          // Filter Tabs & Search
          Container(
            padding: const EdgeInsets.all(16),
            color: AppColors.darkSurface,
            child: Column(
              children: [
                // Search Input
                TextField(
                  controller: _searchCtrl,
                  style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13),
                  decoration: InputDecoration(
                    hintText: 'Search assets...',
                    hintStyle: GoogleFonts.poppins(color: AppColors.textMuted),
                    prefixIcon:
                        Icon(Icons.search_rounded, color: AppColors.textMuted, size: 20),
                    suffixIcon: _searchQuery.isNotEmpty
                        ? IconButton(
                            icon: Icon(Icons.close_rounded,
                                color: AppColors.textMuted, size: 18),
                            onPressed: () => _searchCtrl.clear(),
                          )
                        : null,
                    filled: true,
                    fillColor: AppColors.darkBg,
                    border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: BorderSide.none),
                    contentPadding: const EdgeInsets.symmetric(vertical: 0),
                  ),
                ),
                const SizedBox(height: 12),

                // Toggle Type Tabs
                Row(
                  children: [
                    Expanded(
                      child: GestureDetector(
                        onTap: () => _switchType('images'),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          decoration: BoxDecoration(
                            color: _currentType == 'images'
                                ? AppColors.accentAmber
                                : Colors.transparent,
                            borderRadius: BorderRadius.circular(10),
                            border: _currentType == 'images'
                                ? null
                                : Border.all(color: AppColors.darkBorder),
                          ),
                          child: Text(
                            'BACKGROUNDS',
                            textAlign: TextAlign.center,
                            style: GoogleFonts.poppins(
                              color: _currentType == 'images'
                                  ? AppColors.textOnAmber
                                  : AppColors.textMuted,
                              fontWeight: FontWeight.bold,
                              fontSize: 10,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: GestureDetector(
                        onTap: () => _switchType('icons'),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          decoration: BoxDecoration(
                            color: _currentType == 'icons'
                                ? AppColors.accentAmber
                                : Colors.transparent,
                            borderRadius: BorderRadius.circular(10),
                            border: _currentType == 'icons'
                                ? null
                                : Border.all(color: AppColors.darkBorder),
                          ),
                          child: Text(
                            'ICONS',
                            textAlign: TextAlign.center,
                            style: GoogleFonts.poppins(
                              color: _currentType == 'icons'
                                  ? AppColors.textOnAmber
                                  : AppColors.textMuted,
                              fontWeight: FontWeight.bold,
                              fontSize: 10,
                              letterSpacing: 0.5,
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

          // Grid View
          Expanded(
            child: provider.isLoading && provider.mediaList.isEmpty
                ? Center(
                    child: CircularProgressIndicator(color: AppColors.accentAmber))
                : filtered.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.photo_library_outlined,
                                color: AppColors.textMuted, size: 48),
                            const SizedBox(height: 12),
                            Text(
                              'No assets found in this folder',
                              style: GoogleFonts.poppins(
                                  color: AppColors.textMuted,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13),
                            ),
                          ],
                        ),
                      )
                    : GridView.builder(
                        padding: const EdgeInsets.all(16),
                        gridDelegate:
                            const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 3,
                          crossAxisSpacing: 12,
                          mainAxisSpacing: 12,
                          childAspectRatio: 1.0,
                        ),
                        itemCount: filtered.length,
                        itemBuilder: (context, idx) {
                          final item = filtered[idx];
                          final isSelected = _selectedItem?.path == item.path;

                          return GestureDetector(
                            onTap: () {
                              setState(() => _selectedItem = item);
                            },
                            onLongPress: () => _showDetailsSheet(item),
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 150),
                              decoration: BoxDecoration(
                                color: AppColors.darkSurface,
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                  color: isSelected
                                      ? AppColors.accentAmber
                                      : AppColors.darkBorder,
                                  width: isSelected ? 2 : 1,
                                ),
                              ),
                              child: Stack(
                                children: [
                                  // Image
                                  Positioned.fill(
                                    child: ClipRRect(
                                      borderRadius: BorderRadius.circular(14),
                                      child: Image.network(
                                        item.url,
                                        fit: BoxFit.cover,
                                        errorBuilder: (_, __, ___) => Center(
                                          child: Icon(
                                              Icons.broken_image_outlined,
                                              color: AppColors.textMuted),
                                        ),
                                      ),
                                    ),
                                  ),

                                  // Selected Overlay
                                  if (isSelected)
                                    Positioned.fill(
                                      child: Container(
                                        decoration: BoxDecoration(
                                          color: AppColors.accentAmber
                                              .withOpacity(0.15),
                                          borderRadius:
                                              BorderRadius.circular(14),
                                        ),
                                        child: Center(
                                          child: Container(
                                            padding: const EdgeInsets.all(6),
                                            decoration: BoxDecoration(
                                                color: AppColors.accentAmber,
                                                shape: BoxShape.circle),
                                            child: Icon(Icons.check_rounded,
                                                color: AppColors.textOnAmber,
                                                size: 16),
                                          ),
                                        ),
                                      ),
                                    ),

                                  // File name
                                  Positioned(
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 6, vertical: 4),
                                      decoration: BoxDecoration(
                                        color: Colors.black.withOpacity(0.6),
                                        borderRadius:
                                            const BorderRadius.vertical(
                                                bottom: Radius.circular(14)),
                                      ),
                                      child: Text(
                                        item.name,
                                        style: GoogleFonts.poppins(
                                            color: Colors.white,
                                            fontSize: 8,
                                            fontWeight: FontWeight.w600),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  ),

                                  // Info button
                                  Positioned(
                                    top: 4,
                                    right: 4,
                                    child: GestureDetector(
                                      onTap: () => _showDetailsSheet(item),
                                      child: Container(
                                        padding: const EdgeInsets.all(4),
                                        decoration: BoxDecoration(
                                          color: Colors.black.withOpacity(0.5),
                                          shape: BoxShape.circle,
                                        ),
                                        child: const Icon(Icons.info_outline,
                                            color: Colors.white, size: 12),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),

      floatingActionButton: FloatingActionButton(
        onPressed: _pickAndUpload,
        backgroundColor: AppColors.accentAmber,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: Icon(Icons.add_photo_alternate_rounded,
            color: AppColors.textOnAmber),
      ),
    );
  }
}
