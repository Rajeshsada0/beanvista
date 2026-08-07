<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use App\Models\TicketMessage;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SupportTicketController extends Controller
{
    public function index()
    {
        $tickets = Ticket::with(['latestMessage', 'user'])->latest()->get();
        return Inertia::render('Admin/Support/Index', [
            'tickets' => $tickets
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'subject' => 'required|string|max:255',
            'priority' => 'required|in:low,medium,high',
            'message' => 'required|string'
        ]);

        $ticket = Ticket::create([
            'tenant_id' => auth()->user()->tenant_id,
            'user_id' => auth()->id(),
            'subject' => $request->subject,
            'priority' => $request->priority,
            'status' => 'open'
        ]);

        $ticket->messages()->create([
            'user_id' => auth()->id(),
            'message' => $request->message,
            'is_superadmin_reply' => false
        ]);

        return redirect()->route('support.show', $ticket)->with('success', 'Support ticket opened successfully.');
    }

    public function show(Ticket $ticket)
    {
        // Ensure tenant isolation (TenantScope handles this automatically)
        $ticket->load(['messages.user', 'user']);
        
        return Inertia::render('Admin/Support/Show', [
            'ticket' => $ticket
        ]);
    }

    public function reply(Request $request, Ticket $ticket)
    {
        if ($ticket->status === 'closed') {
            return back()->with('error', 'Cannot reply to a closed ticket.');
        }

        $request->validate([
            'message' => 'required|string'
        ]);

        $ticket->messages()->create([
            'user_id' => auth()->id(),
            'message' => $request->message,
            'is_superadmin_reply' => false
        ]);

        // Re-open ticket if it was resolved
        if ($ticket->status === 'resolved') {
            $ticket->update(['status' => 'open']);
        }

        return back()->with('success', 'Reply sent successfully.');
    }

    public function updateStatus(Request $request, Ticket $ticket)
    {
        $request->validate([
            'status' => 'required|in:open,in_progress,resolved,closed'
        ]);

        $ticket->update(['status' => $request->status]);

        return back()->with('success', 'Ticket status updated to ' . ucfirst($request->status));
    }
}
