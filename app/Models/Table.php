<?php

namespace App\Models;

use App\Traits\BelongsToTenant;

use Illuminate\Database\Eloquent\Model;

class Table extends Model
{
    use BelongsToTenant, \App\Traits\BelongsToBranch;

    protected $fillable = ['table_number', 'capacity', 'status'];

    public function reservations()
    {
        return $this->hasMany(Reservation::class);
    }

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function activeOrders()
    {
        return $this->hasMany(Order::class)->whereNotIn('status', ['completed', 'cancelled']);
    }

    public static function syncStatus($tableId)
    {
        if (!$tableId) {
            return;
        }

        // A table is occupied if it has any active orders (status not completed or cancelled)
        $hasActiveOrders = \App\Models\Order::withoutGlobalScopes()
            ->where('table_id', $tableId)
            ->whereNotIn('status', ['completed', 'cancelled'])
            ->exists();

        if ($hasActiveOrders) {
            self::withoutGlobalScopes()->where('id', $tableId)->update(['status' => 'occupied']);
            return;
        }

        // If no active orders, check for any active reservation around current time
        $hasActiveReservation = \App\Models\Reservation::withoutGlobalScopes()
            ->where('table_id', $tableId)
            ->where('status', 'active')
            ->where('booking_time', '>=', now()->subHours(1))
            ->where('booking_time', '<=', now()->addHours(2))
            ->exists();

        if ($hasActiveReservation) {
            self::withoutGlobalScopes()->where('id', $tableId)->update(['status' => 'reserved']);
        } else {
            self::withoutGlobalScopes()->where('id', $tableId)->update(['status' => 'available']);
        }
    }
}
