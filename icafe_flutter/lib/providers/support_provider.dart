import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/services/api_service.dart';
import '../core/utils/json_utils.dart';

class SupportTicket {
  final int id;
  final String subject;
  final String status;
  final String priority;
  final String createdAt;
  final String userName;
  final TicketMessage? latestMessage;

  SupportTicket({
    required this.id,
    required this.subject,
    required this.status,
    required this.priority,
    required this.createdAt,
    required this.userName,
    this.latestMessage,
  });

  factory SupportTicket.fromJson(Map<String, dynamic> json) {
    final userJson = json['user'] ?? {};
    final latestMsgJson = json['latest_message'];
    return SupportTicket(
      id: JsonUtils.parseInt(json['id']),
      subject: json['subject'] ?? '',
      status: json['status'] ?? 'open',
      priority: json['priority'] ?? 'low',
      createdAt: json['created_at'] ?? '',
      userName: userJson['name'] ?? 'Staff',
      latestMessage: latestMsgJson != null ? TicketMessage.fromJson(latestMsgJson as Map<String, dynamic>) : null,
    );
  }
}

class TicketMessage {
  final int id;
  final String message;
  final bool isSuperadminReply;
  final String createdAt;
  final String userName;

  TicketMessage({
    required this.id,
    required this.message,
    required this.isSuperadminReply,
    required this.createdAt,
    required this.userName,
  });

  factory TicketMessage.fromJson(Map<String, dynamic> json) {
    final userJson = json['user'] ?? {};
    return TicketMessage(
      id: JsonUtils.parseInt(json['id']),
      message: json['message'] ?? '',
      isSuperadminReply: json['is_superadmin_reply'] == true || json['is_superadmin_reply'] == 1 || json['is_superadmin_reply'] == '1',
      createdAt: json['created_at'] ?? '',
      userName: userJson['name'] ?? 'Staff',
    );
  }
}

class SupportProvider extends ChangeNotifier {
  final ApiService _apiService;

  List<SupportTicket> _tickets = [];
  SupportTicket? _selectedTicket;
  List<TicketMessage> _messages = [];
  bool _isLoading = false;
  String? _error;
  final Map<int, int> _lastSeenMessageIds = {};

  SupportProvider({required ApiService apiService}) : _apiService = apiService;

  List<SupportTicket> get tickets => _tickets;
  SupportTicket? get selectedTicket => _selectedTicket;
  List<TicketMessage> get messages => _messages;
  bool get isLoading => _isLoading;
  String? get error => _error;
  Map<int, int> get lastSeenMessageIds => _lastSeenMessageIds;

  Future<void> loadSeenStatuses() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _lastSeenMessageIds.clear();
      for (var t in _tickets) {
        final val = prefs.getInt('seen_msg_id_${t.id}');
        if (val != null) {
          _lastSeenMessageIds[t.id] = val;
        }
      }
    } catch (_) {}
  }

  Future<void> markAsRead(int ticketId, int latestMessageId) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setInt('seen_msg_id_$ticketId', latestMessageId);
      _lastSeenMessageIds[ticketId] = latestMessageId;
      notifyListeners();
    } catch (_) {}
  }

  bool hasUnreadMessage(SupportTicket ticket) {
    if (ticket.latestMessage == null) return false;
    if (!ticket.latestMessage!.isSuperadminReply) return false;
    final lastSeenId = _lastSeenMessageIds[ticket.id] ?? 0;
    return ticket.latestMessage!.id > lastSeenId;
  }

  int get totalUnreadTickets {
    int count = 0;
    for (var t in _tickets) {
      if (hasUnreadMessage(t)) {
        count++;
      }
    }
    return count;
  }

  Future<void> fetchTickets() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await _apiService.get('/support/tickets');
      if (res != null && res['success'] == true) {
        final List<dynamic> list = res['tickets'] ?? [];
        _tickets = list.map((json) => SupportTicket.fromJson(json as Map<String, dynamic>)).toList();
        await loadSeenStatuses();
      } else {
        _error = res?['message'] ?? 'Failed to load tickets';
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchTicketDetail(int id) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await _apiService.get('/support/tickets/$id');
      if (res != null && res['success'] == true && res['ticket'] != null) {
        final ticketData = res['ticket'] as Map<String, dynamic>;
        _selectedTicket = SupportTicket.fromJson(ticketData);

        final List<dynamic> msgList = ticketData['messages'] ?? [];
        _messages = msgList.map((json) => TicketMessage.fromJson(json as Map<String, dynamic>)).toList();

        if (_messages.isNotEmpty) {
          final lastMsg = _messages.last;
          await markAsRead(_selectedTicket!.id, lastMsg.id);
        }
      } else {
        _error = res?['message'] ?? 'Failed to load ticket details';
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> createTicket(String subject, String priority, String message) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await _apiService.post('/support/tickets', {
        'subject': subject,
        'priority': priority,
        'message': message,
      });

      if (res != null && res['success'] == true) {
        await fetchTickets();
        return true;
      }
      _error = res?['message'] ?? 'Failed to open support ticket';
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
    return false;
  }

  Future<bool> sendReply(int ticketId, String message) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await _apiService.post('/support/tickets/$ticketId/reply', {
        'message': message,
      });

      if (res != null && res['success'] == true && res['reply'] != null) {
        final replyJson = res['reply'] as Map<String, dynamic>;
        _messages.add(TicketMessage.fromJson(replyJson));
        notifyListeners();
        return true;
      }
      _error = res?['message'] ?? 'Failed to send reply';
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
    return false;
  }

  Future<bool> updateStatus(int ticketId, String status) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await _apiService.put('/support/tickets/$ticketId/status', {
        'status': status,
      });

      if (res != null && res['success'] == true) {
        if (_selectedTicket != null && _selectedTicket!.id == ticketId) {
          await fetchTicketDetail(ticketId);
        }
        await fetchTickets();
        return true;
      }
      _error = res?['message'] ?? 'Failed to update ticket status';
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
    return false;
  }
}
