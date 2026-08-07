import 'dart:convert';
import 'dart:developer';
import 'package:http/http.dart' as http;
import '../constants/app_constants.dart';
import 'package:image_picker/image_picker.dart';

class ApiService {
  String? _token;
  Function()? onUnauthorized;

  void setToken(String? token) {
    _token = token;
  }

  String? get token => _token;

  Future<Map<String, dynamic>?> postMultipart(String endpoint, Map<String, String> fields, XFile? imageFile, {String method = 'POST', String fileFieldKey = 'image'}) async {
    try {
      final request = http.MultipartRequest(method, _uri(endpoint));
      request.headers.addAll({
        'Accept': 'application/json',
        if (_token != null) 'Authorization': 'Bearer $_token',
      });
      request.fields.addAll(fields);

      if (imageFile != null) {
        final bytes = await imageFile.readAsBytes();
        final multipartFile = http.MultipartFile.fromBytes(
          fileFieldKey,
          bytes,
          filename: imageFile.name,
        );
        request.files.add(multipartFile);
      }

      final streamedResponse = await request.send().timeout(const Duration(milliseconds: AppConstants.receiveTimeout));
      final response = await http.Response.fromStream(streamedResponse);
      return _handleResponse(response);
    } catch (e) {
      log('ApiService Multipart $method error: $e');
      return null;
    }
  }

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        if (_token != null) 'Authorization': 'Bearer $_token',
      };

  Uri _uri(String endpoint) {
    return Uri.parse('${AppConstants.apiBaseUrl}$endpoint');
  }

  Future<Map<String, dynamic>?> get(String endpoint) async {
    try {
      final response = await http.get(_uri(endpoint), headers: _headers)
          .timeout(const Duration(milliseconds: AppConstants.receiveTimeout));
      return _handleResponse(response);
    } catch (e) {
      log('ApiService GET error: $e');
      return {'error': true, 'message': _friendlyErrorMessage(e)};
    }
  }

  Future<Map<String, dynamic>?> post(String endpoint, Map<String, dynamic> body) async {
    try {
      final url = _uri(endpoint);
      log('ApiService POST -> $url');
      final response = await http.post(
        url,
        headers: _headers,
        body: jsonEncode(body),
      ).timeout(const Duration(milliseconds: AppConstants.receiveTimeout));
      return _handleResponse(response);
    } catch (e) {
      log('ApiService POST error: $e');
      return {'error': true, 'message': _friendlyErrorMessage(e)};
    }
  }

  Future<Map<String, dynamic>?> patch(String endpoint, Map<String, dynamic> body) async {
    try {
      final response = await http.patch(
        _uri(endpoint),
        headers: _headers,
        body: jsonEncode(body),
      ).timeout(const Duration(milliseconds: AppConstants.receiveTimeout));
      return _handleResponse(response);
    } catch (e) {
      log('ApiService PATCH error: $e');
      return {'error': true, 'message': _friendlyErrorMessage(e)};
    }
  }

  Future<Map<String, dynamic>?> put(String endpoint, Map<String, dynamic> body) async {
    try {
      final response = await http.put(
        _uri(endpoint),
        headers: _headers,
        body: jsonEncode(body),
      ).timeout(const Duration(milliseconds: AppConstants.receiveTimeout));
      return _handleResponse(response);
    } catch (e) {
      log('ApiService PUT error: $e');
      return {'error': true, 'message': _friendlyErrorMessage(e)};
    }
  }

  Future<bool> delete(String endpoint) async {
    try {
      final response = await http.delete(_uri(endpoint), headers: _headers)
          .timeout(const Duration(milliseconds: AppConstants.receiveTimeout));
      if (response.statusCode == 401 || response.statusCode == 403) {
        onUnauthorized?.call();
      }
      return response.statusCode >= 200 && response.statusCode < 300;
    } catch (e) {
      log('ApiService DELETE error: $e');
      return false;
    }
  }

  Future<void> logActivity(String title, String description, {String type = 'system'}) async {
    try {
      final payload = {
        'title': title,
        'description': description,
        'action': title,
        'desc': description,
        'type': type,
      };
      await post('/activity-logs', payload);
      await post('/activities', payload);
    } catch (e) {
      log('logActivity error: $e');
    }
  }

  String _friendlyErrorMessage(Object e) {
    final msg = e.toString();
    if (msg.contains('SocketException') || msg.contains('Connection refused')) {
      return 'Cannot connect to server. Check your internet or server URL.';
    }
    if (msg.contains('HandshakeException') || msg.contains('CERTIFICATE')) {
      return 'SSL certificate error. The server may have an invalid certificate.';
    }
    if (msg.contains('TimeoutException')) {
      return 'Connection timed out. Server may be down or unreachable.';
    }
    if (msg.contains('FormatException')) {
      return 'Server returned an invalid response (not JSON). Check the server URL.';
    }
    return 'Network error: $msg';
  }

  Map<String, dynamic>? _handleResponse(http.Response response) {
    if (response.statusCode == 401 || response.statusCode == 403) {
      onUnauthorized?.call();
      return {
        'error': true,
        'message': response.statusCode == 403
            ? 'Your cafe account has been disabled or deleted.'
            : 'Unauthorized: Session expired.'
      };
    }
    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (response.body.isEmpty) return {};
      try {
        final decoded = jsonDecode(response.body);
        if (decoded is Map<String, dynamic>) return decoded;
        return {'data': decoded};
      } catch (e) {
        log('ApiService parse error: $e');
        return {'error': true, 'message': 'Server returned invalid response (not JSON). Check the URL is correct.'};
      }
    }
    log('ApiService HTTP ${response.statusCode}: ${response.body}');

    // Try to extract error message from server response
    String errorMessage = 'Server error (${response.statusCode})';
    try {
      final decoded = jsonDecode(response.body);
      if (decoded is Map<String, dynamic>) {
        errorMessage = decoded['message'] ?? errorMessage;
        // If it's a generic Server Error, append the raw body for debugging
        if (response.statusCode >= 500 && (errorMessage == 'Server Error' || errorMessage == 'Server error (500)')) {
            return {'error': true, 'message': 'Backend 500 Error: \${response.body}'};
        }
        return {'error': true, 'message': errorMessage};
      }
    } catch (_) {
      // Response is not JSON (e.g. HTML error page)
      if (response.body.contains('<html')) {
        errorMessage = 'Server returned HTML (status \${response.statusCode}). Raw: \${response.body.substring(0, response.body.length > 200 ? 200 : response.body.length)}...';
      } else {
        errorMessage = 'Server error (\${response.statusCode}): \${response.body}';
      }
    }
    return {'error': true, 'message': errorMessage};
  }
  // Customers
  Future<List<dynamic>?> getCustomers() async {
    final res = await get('/customers');
    if (res != null && res['data'] is List) return res['data'] as List<dynamic>;
    return null;
  }

  // Loyalty Rewards
  Future<Map<String, dynamic>?> getLoyaltyRewards() async {
    return await get('/loyalty-rewards');
  }

  Future<Map<String, dynamic>?> redeemLoyaltyReward(int customerId, int rewardId) async {
    return await post('/loyalty-rewards/redeem', {
      'customer_id': customerId,
      'reward_id': rewardId,
    });
  }

  Future<Map<String, dynamic>?> createLoyaltyReward(Map<String, dynamic> data) async {
    return await post('/loyalty-rewards', data);
  }

  Future<Map<String, dynamic>?> updateLoyaltyReward(int id, Map<String, dynamic> data) async {
    return await put('/loyalty-rewards/$id', data);
  }

  Future<Map<String, dynamic>?> deleteLoyaltyReward(int id) async {
    final success = await delete('/loyalty-rewards/$id');
    return {'success': success};
  }

  Future<Map<String, dynamic>?> toggleLoyaltyRewardStatus(int id) async {
    return await patch('/loyalty-rewards/$id/status', {});
  }

  // Account Registration
  Future<Map<String, dynamic>?> register(Map<String, dynamic> data) async {
    return await post('/auth/register', data);
  }
}
