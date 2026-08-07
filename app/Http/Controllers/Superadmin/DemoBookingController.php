<?php

namespace App\Http\Controllers\Superadmin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\DemoBooking;
use Inertia\Inertia;

class DemoBookingController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $status = $request->input('status');

        $query = DemoBooking::query();

        if ($search) {
            $query->where(function($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                  ->orWhere('last_name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('cafe_name', 'like', "%{$search}%");
            });
        }

        if ($status && in_array($status, ['pending', 'completed', 'cancelled'])) {
            $query->where('status', $status);
        }

        $bookings = $query->latest()->paginate(10)->withQueryString();

        return Inertia::render('Superadmin/DemoBookings/Index', [
            'bookings' => $bookings,
            'filters' => [
                'search' => $search,
                'status' => $status,
            ],
        ]);
    }

    public function update(Request $request, DemoBooking $booking)
    {
        $validated = $request->validate([
            'status' => 'required|string|in:pending,completed,cancelled',
        ]);

        $booking->update($validated);

        return redirect()->back()->with('success', 'Demo booking status updated successfully!');
    }

    public function destroy(DemoBooking $booking)
    {
        $booking->delete();

        return redirect()->back()->with('success', 'Demo booking deleted successfully!');
    }
}
