import 'package:flutter/foundation.dart';
import 'package:image_picker/image_picker.dart';
import '../core/services/api_service.dart';

class MediaItem {
  final String name;
  final String path;
  final String url;
  final int size;
  final int lastModified;

  MediaItem({
    required this.name,
    required this.path,
    required this.url,
    required this.size,
    required this.lastModified,
  });

  factory MediaItem.fromJson(Map<String, dynamic> json) {
    return MediaItem(
      name: json['name'] ?? '',
      path: json['path'] ?? '',
      url: json['url'] ?? '',
      size: json['size'] ?? 0,
      lastModified: json['last_modified'] ?? 0,
    );
  }
}

class MediaProvider extends ChangeNotifier {
  final ApiService _apiService;

  List<MediaItem> _mediaList = [];
  bool _isLoading = false;
  String? _error;

  MediaProvider({required ApiService apiService}) : _apiService = apiService;

  List<MediaItem> get mediaList => _mediaList;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchMedia(String type) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await _apiService.get('/media?type=$type');

      if (res == null) {
        _error = 'No response from server';
        _mediaList = [];
      } else if (res['error'] == true) {
        _error = res['message'] ?? 'Failed to load media';
        _mediaList = [];
      } else {
        // Handle both response shapes:
        //   - Plain array wrapped by ApiService: {"data": [...]}
        //   - Direct map with a list field
        List<dynamic>? list;
        if (res['data'] is List) {
          list = res['data'] as List<dynamic>;
        } else {
          // The API returns a plain JSON array which ApiService wraps as {"data": [...]}
          // Fallback: treat entire response values as list if there's nothing else
          list = [];
        }
        _mediaList = list.map((json) => MediaItem.fromJson(json as Map<String, dynamic>)).toList();
      }
    } catch (e) {
      _error = e.toString();
      _mediaList = [];
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<MediaItem?> uploadMedia(XFile file, String type) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await _apiService.postMultipart(
        '/media/upload',
        {'type': type},
        file,
        fileFieldKey: 'file',
      );

      if (res != null && res['success'] == true) {
        final newItem = MediaItem.fromJson(res['media'] as Map<String, dynamic>);
        _mediaList.insert(0, newItem);
        notifyListeners();
        return newItem;
      } else {
        _error = res?['message'] ?? 'Failed to upload file';
        return null;
      }
    } catch (e) {
      _error = e.toString();
      return null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> renameMedia(String path, String newName) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await _apiService.post('/media/rename', {
        'path': path,
        'new_name': newName,
      });

      if (res != null && res['success'] == true) {
        final updatedItem = MediaItem.fromJson(res['media'] as Map<String, dynamic>);
        _mediaList = _mediaList.map((item) => item.path == path ? updatedItem : item).toList();
        notifyListeners();
        return true;
      } else {
        _error = res?['message'] ?? 'Failed to rename asset';
        return false;
      }
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> deleteMedia(String path) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await _apiService.post('/media/delete', {
        'path': path,
      });

      if (res != null && res['success'] == true) {
        _mediaList = _mediaList.where((item) => item.path != path).toList();
        notifyListeners();
        return true;
      } else {
        _error = res?['message'] ?? 'Failed to delete asset';
        return false;
      }
    } catch (e) {
      _error = e.toString();
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
