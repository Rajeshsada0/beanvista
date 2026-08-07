<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\DemoBooking;

class DemoBookingController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'cafe_name' => 'required|string|max:255',
        ]);

        DemoBooking::create($validated);

        return redirect()->back()->with('success', 'Demo booked successfully! We will contact you soon.');
    }

    public function updateStatus(Request $request, DemoBooking $booking)
    {
        $validated = $request->validate([
            'status' => 'required|string|in:pending,completed,cancelled',
        ]);

        $booking->update($validated);

        return redirect()->back()->with('success', 'Demo booking status updated successfully!');
    }
}
