import 'package:icafe_app/core/utils/snackbar_helper.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/support_provider.dart';

class TicketDetailScreen extends StatefulWidget {
  final int ticketId;

  const TicketDetailScreen({super.key, required this.ticketId});

  @override
  State<TicketDetailScreen> createState() => _TicketDetailScreenState();
}

class _TicketDetailScreenState extends State<TicketDetailScreen> {
  final TextEditingController _msgCtrl = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<SupportProvider>().fetchTicketDetail(widget.ticketId);
    });
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      _scrollController.animateTo(
        _scrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOut,
      );
    }
  }

  void _handleSendReply() async {
    final text = _msgCtrl.text.trim();
    if (text.isEmpty) return;

    final provider = context.read<SupportProvider>();
    final messenger = ScaffoldMessenger.of(context);

    _msgCtrl.clear();
    
    final success = await provider.sendReply(widget.ticketId, text);
    if (success) {
      WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToBottom());
    } else {
      showTopSnackBarWithMessenger(messenger, context, 
        SnackBar(
          backgroundColor: AppColors.statusRedBg,
          content: Text(provider.error ?? 'Failed to send reply', style: GoogleFonts.poppins(color: AppColors.textPrimary)),
        ),
      );
    }
  }

  void _handleUpdateStatus(String status) async {
    final provider = context.read<SupportProvider>();
    final messenger = ScaffoldMessenger.of(context);

    final success = await provider.updateStatus(widget.ticketId, status);
    
    showTopSnackBarWithMessenger(messenger, context, 
      SnackBar(
        backgroundColor: success ? AppColors.statusGreenBg : AppColors.statusRedBg,
        content: Text(
          success ? 'Ticket status updated to ${status.replaceAll('_', ' ').toUpperCase()}' : (provider.error ?? 'Failed to update status'),
          style: GoogleFonts.poppins(color: AppColors.textPrimary),
        ),
      ),
    );
  }

  Widget _buildMessageBubble(TicketMessage msg) {
    final isMe = !msg.isSuperadminReply;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Column(
        crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
        children: [
          // User Name & Date Label
          Padding(
            padding: const EdgeInsets.only(left: 6.0, right: 6.0, bottom: 4.0),
            child: Text(
              msg.isSuperadminReply ? 'Support Agent' : msg.userName,
              style: GoogleFonts.poppins(
                color: AppColors.textMuted,
                fontSize: 10,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          
          // Bubble Container
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
            decoration: BoxDecoration(
              color: isMe ? AppColors.darkCard : AppColors.accentGold.withOpacity(0.12),
              borderRadius: BorderRadius.only(
                topLeft: const Radius.circular(16),
                topRight: const Radius.circular(16),
                bottomLeft: Radius.circular(isMe ? 16 : 0),
                bottomRight: Radius.circular(isMe ? 0 : 16),
              ),
              border: Border.all(
                color: isMe ? AppColors.darkBorder : AppColors.accentGold.withOpacity(0.2),
              ),
            ),
            child: Text(
              msg.message,
              style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<SupportProvider>();
    final ticket = provider.selectedTicket;

    WidgetsBinding.instance.addPostFrameCallback((_) => _scrollToBottom());

    return Scaffold(
      backgroundColor: AppColors.darkBg,
      appBar: AppBar(
        title: Text(
          ticket?.subject ?? 'Ticket Detail',
          style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.bold),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        backgroundColor: AppColors.darkSurface,
        surfaceTintColor: Colors.transparent,
        actions: [
          if (ticket != null && ticket.status != 'closed') ...[
            if (ticket.status != 'resolved')
              IconButton(
                onPressed: () => _handleUpdateStatus('resolved'),
                icon: const Icon(Icons.check_circle_outline_rounded, color: Colors.green),
                tooltip: 'Mark Resolved',
              ),
            IconButton(
              onPressed: () => _handleUpdateStatus('closed'),
              icon: Icon(Icons.cancel_outlined, color: AppColors.statusRed),
              tooltip: 'Close Ticket',
            ),
            const SizedBox(width: 4),
          ],
        ],
      ),
      body: provider.isLoading && ticket == null
          ? Center(
              child: CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation<Color>(AppColors.accentAmber),
              ),
            )
          : Column(
              children: [
                // Top status bar
                if (ticket != null)
                  Container(
                    width: double.infinity,
                    color: AppColors.darkSurface,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Text(
                              'Status: ',
                              style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 12),
                            ),
                            Text(
                              ticket.status.toUpperCase(),
                              style: GoogleFonts.poppins(
                                color: ticket.status == 'closed' || ticket.status == 'resolved'
                                    ? Colors.green
                                    : AppColors.accentAmber,
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                        Row(
                          children: [
                            Text(
                              'Priority: ',
                              style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 12),
                            ),
                            Text(
                              ticket.priority.toUpperCase(),
                              style: GoogleFonts.poppins(
                                color: ticket.priority == 'high' ? AppColors.statusRed : AppColors.textSecondary,
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),

                // Conversation thread
                Expanded(
                  child: provider.messages.isEmpty
                      ? Center(
                          child: Text('No messages in this thread.', style: GoogleFonts.poppins(color: AppColors.textSecondary)),
                        )
                      : ListView.builder(
                          controller: _scrollController,
                          padding: const EdgeInsets.all(16),
                          itemCount: provider.messages.length,
                          itemBuilder: (context, index) {
                            return _buildMessageBubble(provider.messages[index]);
                          },
                        ),
                ),

                // Closed ticket banner or Text input bar
                if (ticket != null)
                  ticket.status == 'closed'
                      ? Container(
                          width: double.infinity,
                          color: AppColors.darkSurface,
                          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
                          child: Text(
                            'This ticket is closed and cannot receive replies.',
                            style: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 12, fontWeight: FontWeight.w600),
                            textAlign: TextAlign.center,
                          ),
                        )
                      : Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                          decoration: BoxDecoration(
                            color: AppColors.darkSurface,
                            border: Border(top: BorderSide(color: AppColors.darkBorder)),
                          ),
                          child: SafeArea(
                            child: Row(
                              children: [
                                Expanded(
                                  child: Container(
                                    decoration: BoxDecoration(
                                      color: AppColors.darkBg,
                                      borderRadius: BorderRadius.circular(20),
                                    ),
                                    child: TextField(
                                      controller: _msgCtrl,
                                      style: GoogleFonts.poppins(color: AppColors.textPrimary, fontSize: 13),
                                      decoration: InputDecoration(
                                        hintText: 'Type your message...',
                                        hintStyle: GoogleFonts.poppins(color: AppColors.textMuted, fontSize: 13),
                                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                        border: InputBorder.none,
                                      ),
                                      onSubmitted: (_) => _handleSendReply(),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 8),
                                IconButton(
                                  onPressed: _handleSendReply,
                                  icon: Icon(Icons.send_rounded, color: AppColors.accentAmber),
                                ),
                              ],
                            ),
                          ),
                        ),
              ],
            ),
    );
  }
}
