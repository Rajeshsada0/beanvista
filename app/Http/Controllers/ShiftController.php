<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Shift;
use App\Models\Order;
use App\Models\User;
use App\Models\ActivityLog;

class ShiftController extends Controller
{
    public function clockIn(Request $request)
    {
        if ($request->user()->currentShift()) {
            return back()->with('error', 'You are already clocked in.');
        }

        $shift = Shift::create([
            'user_id' => $request->user()->id,
            'clock_in_at' => now(),
        ]);

        ActivityLog::record('clock_in', "{$request->user()->name} clocked in for their shift", $shift);

        return back()->with('success', 'Clocked in successfully.');
    }

    public function clockOut(Request $request)
    {
        $shift = $request->user()->currentShift();

        if (!$shift) {
            return back()->with('error', 'You are not clocked in.');
        }

        $shift->update([
            'clock_out_at' => now(),
        ]);

        ActivityLog::record('clock_out', "{$request->user()->name} clocked out from their shift", $shift);

        return back()->with('success', 'Clocked out successfully.');
    }

    public function performance()
    {
        // Access allowed for current testing
        /* if (auth()->user()->role !== 'admin') {
            abort(403);
        } */

        // MongoDB-compatible approach - fetch and calculate in PHP
        $staff = User::with(['shifts' => function($q) {
                $q->whereNotNull('clock_out_at');
            }])
            ->get()
            ->map(function($user) {
                $totalMinutes = $user->shifts->reduce(function($carry, $shift) {
                    return $carry + \Carbon\Carbon::parse($shift->clock_in_at)->diffInMinutes($shift->clock_out_at);
                }, 0);

                $orders = Order::where('waiter_id', $user->id)->where('status', 'completed')->get();

                // Calculate average order duration in PHP instead of SQL
                $avgOrderMins = 0;
                if ($orders->count() > 0) {
                    $avgOrderMins = $orders->avg(function($order) {
                        $created = \Carbon\Carbon::parse($order->created_at);
                        $updated = \Carbon\Carbon::parse($order->updated_at);
                        return $created->diffInMinutes($updated);
                    });
                }
                
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'shifts_count' => $user->shifts->count(),
                    'total_hours' => round($totalMinutes / 60, 2),
                    'total_orders' => $orders->count(),
                    'total_sales' => $orders->sum('grand_total'),
                    'total_tips' => $orders->sum('tip_amount'),
                    'avg_order_duration' => (float)round($avgOrderMins),
                ];
            });

        return inertia('Staff/Performance', [
            'staff' => $staff
        ]);
    }
}
