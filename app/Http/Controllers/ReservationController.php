<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\ActivityLog;

class ReservationController extends Controller
{
    public function index()
    {
        return \Inertia\Inertia::render('Reservations/Index', [
            'reservations' => \App\Models\Reservation::with('table')->orderBy('booking_time', 'asc')->get(),
            'tables' => \App\Models\Table::all(),
        ]);
    }

    public function store(Request $request, $tenantSlug = null)
    {
        $validated = $request->validate([
            'table_id' => 'required|exists:tables,id',
            'customer_name' => 'required|string',
            'phone' => 'required|string',
            'booking_time' => 'required|date',
            'guests_count' => 'required|integer|min:1',
        ]);

        $validated['status'] = 'active';

        $tenant_id = null;
        if ($tenantSlug) {
            $tenant = \App\Models\Tenant::where('slug', $tenantSlug)->firstOrFail();
            $tenant_id = $tenant->id;
            $validated['tenant_id'] = $tenant_id;
        }

        $tableQuery = \App\Models\Table::query();
        if ($tenant_id) {
            $tableQuery->withoutGlobalScope(\App\Models\Scopes\TenantScope::class)->where('tenant_id', $tenant_id);
        }
        $table = $tableQuery->findOrFail($validated['table_id']);

        if ($table->status === 'occupied') {
            return back()->withErrors(['table_id' => 'Table is currently occupied.']);
        }

        if ($tenant_id) {
            $reservation = \App\Models\Reservation::withoutGlobalScope(\App\Models\Scopes\TenantScope::class)->create($validated);
        } else {
            $reservation = \App\Models\Reservation::create($validated);
        }
        
        ActivityLog::record('created', "New reservation for {$reservation->customer_name} at Table {$table->table_number}", $reservation);
        
        return back()->with('success', 'Reservation created successfully.');
    }

    public function update(Request $request, \App\Models\Reservation $reservation)
    {
        // Full edit — all fields provided
        if ($request->has('customer_name')) {
            $validated = $request->validate([
                'table_id'      => 'required|exists:tables,id',
                'customer_name' => 'required|string',
                'phone'         => 'required|string',
                'booking_time'  => 'required|date',
                'guests_count'  => 'required|integer|min:1',
            ]);

            // If table changed, release old and reserve new
            if ($reservation->table_id != $validated['table_id']) {
                $newTable = \App\Models\Table::findOrFail($validated['table_id']);
                if ($newTable->status === 'occupied') {
                    return back()->withErrors(['table_id' => 'Table is currently occupied.']);
                }
            }

            $reservation->update($validated);
            ActivityLog::record('updated', "Reservation for {$reservation->customer_name} was edited", $reservation);
            return back()->with('success', 'Reservation updated successfully.');
        }

        // Status-only update
        $validated = $request->validate([
            'status' => 'required|in:active,completed,cancelled',
        ]);

        $reservation->update($validated);

        ActivityLog::record('updated', "Reservation for {$reservation->customer_name} marked as {$validated['status']} at Table {$reservation->table->table_number}", $reservation);

        return back()->with('success', 'Reservation updated successfully.');
    }

    public function destroy(\App\Models\Reservation $reservation)
    {
        $name = $reservation->customer_name;
        $reservation->delete();
        ActivityLog::record('deleted', "Reservation for {$name} was removed");
        return back()->with('success', 'Reservation deleted.');
    }
}
