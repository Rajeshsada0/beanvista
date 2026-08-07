<?php

namespace App\Http\Controllers\Superadmin;

use App\Http\Controllers\Controller;
use App\Models\Ticket;
use App\Models\TicketMessage;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Mail;

class SupportTicketController extends Controller
{
    public function index(Request $request)
    {
        // Bypass TenantScope to see all tickets
        $tickets = Ticket::withoutGlobalScope(\App\Models\Scopes\TenantScope::class)
            ->with(['latestMessage', 'tenant', 'user'])
            ->latest()
            ->get();
            
        return Inertia::render('Superadmin/Support/Index', [
            'tickets' => $tickets
        ]);
    }

    public function show($id)
    {
        $ticket = Ticket::withoutGlobalScope(\App\Models\Scopes\TenantScope::class)
            ->with(['messages.user', 'tenant', 'user'])
            ->findOrFail($id);
            
        return Inertia::render('Superadmin/Support/Show', [
            'ticket' => $ticket
        ]);
    }

    public function reply(Request $request, $id)
    {
        $ticket = Ticket::withoutGlobalScope(\App\Models\Scopes\TenantScope::class)->findOrFail($id);

        if ($ticket->status === 'closed') {
            return back()->with('error', 'Cannot reply to a closed ticket.');
        }

        $request->validate([
            'message' => 'required|string'
        ]);

        $ticket->messages()->create([
            'user_id' => auth()->id(),
            'message' => $request->message,
            'is_superadmin_reply' => true
        ]);
        
        if ($ticket->status === 'open') {
            $ticket->update(['status' => 'in_progress']);
        }

        // Send email notification using Laravel Mail
        // Fetch Mail configuration from the specific tenant's settings, or use global
        try {
            $adminEmail = $ticket->user->email;
            Mail::raw("Your support ticket '{$ticket->subject}' has a new reply:\n\n{$request->message}\n\nLog in to your dashboard to view the full conversation.", function ($message) use ($adminEmail, $ticket) {
                $message->to($adminEmail)
                        ->subject('New Reply on Support Ticket: ' . $ticket->subject);
            });
        } catch (\Exception $e) {
            \Log::error('Failed to send support ticket email: ' . $e->getMessage());
        }

        return back()->with('success', 'Reply sent successfully.');
    }

    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:open,in_progress,resolved,closed'
        ]);

        $ticket = Ticket::withoutGlobalScope(\App\Models\Scopes\TenantScope::class)->findOrFail($id);
        $ticket->update(['status' => $request->status]);

        return back()->with('success', 'Ticket status updated to ' . ucfirst($request->status));
    }
}
