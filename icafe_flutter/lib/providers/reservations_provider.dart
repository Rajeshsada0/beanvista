import 'package:flutter/foundation.dart';
import '../core/services/api_service.dart';

class ReservationsProvider extends ChangeNotifier {
  final ApiService _apiService;

  List<Map<String, dynamic>> _reservations = [];
  List<Map<String, dynamic>> _tables = [];
  bool _isLoading = false;
  String? _error;

  ReservationsProvider({required ApiService apiService}) : _apiService = apiService;

  List<Map<String, dynamic>> get reservations => _reservations;
  List<Map<String, dynamic>> get tables => _tables;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchReservations() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.get('/reservations');
      if (response != null && response['success'] == true) {
        if (response['reservations'] != null) {
          _reservations = List<Map<String, dynamic>>.from(response['reservations']);
        }
        if (response['tables'] != null) {
          _tables = List<Map<String, dynamic>>.from(response['tables']);
        }
      } else {
        _error = response?['message'] ?? 'Failed to load reservations';
      }
    } catch (e) {
      _error = 'Error fetching reservations: $e';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> createReservation({
    required int tableId,
    required String name,
    required String phone,
    required DateTime bookingTime,
    required int guestsCount,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.post('/reservations', {
        'table_id': tableId,
        'customer_name': name,
        'phone': phone,
        'booking_time': bookingTime.toIso8601String(),
        'guests_count': guestsCount,
      });

      if (response != null && response['success'] == true) {
        await fetchReservations();
        return true;
      } else {
        _error = response?['message'] ?? 'Failed to create reservation';
        return false;
      }
    } catch (e) {
      _error = 'Error creating reservation: $e';
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> updateReservation(
    int id, {
    required int tableId,
    required String name,
    required String phone,
    required DateTime bookingTime,
    required int guestsCount,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.put('/reservations/$id', {
        'table_id': tableId,
        'customer_name': name,
        'phone': phone,
        'booking_time': bookingTime.toIso8601String(),
        'guests_count': guestsCount,
      });

      if (response != null && response['success'] == true) {
        await fetchReservations();
        return true;
      } else {
        _error = response?['message'] ?? 'Failed to update reservation';
        return false;
      }
    } catch (e) {
      _error = 'Error updating reservation: $e';
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> updateReservationStatus(int id, String status) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.put('/reservations/$id', {
        'status': status,
      });

      if (response != null && response['success'] == true) {
        await fetchReservations();
        return true;
      } else {
        _error = response?['message'] ?? 'Failed to update status';
        return false;
      }
    } catch (e) {
      _error = 'Error updating status: $e';
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> deleteReservation(int id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final success = await _apiService.delete('/reservations/$id');
      if (success) {
        await fetchReservations();
        return true;
      } else {
        _error = 'Failed to delete reservation';
        return false;
      }
    } catch (e) {
      _error = 'Error deleting reservation: $e';
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
