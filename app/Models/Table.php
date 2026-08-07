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

        // A table is occupied if it has any orders that:
        // 1. Are active (status not in completed, cancelled)
        // OR
        // 2. Are completed (paid) but have items that are not fully delivered yet.
        
        $hasActiveOrders = \App\Models\Order::withoutGlobalScopes()
            ->where('table_id', $tableId)
            ->whereNotIn('status', ['completed', 'cancelled'])
            ->exists();

        if ($hasActiveOrders) {
            self::withoutGlobalScopes()->where('id', $tableId)->update(['status' => 'occupied']);
            return;
        }

        $hasCompletedButNotDeliveredOrders = \App\Models\Order::withoutGlobalScopes()
            ->where('table_id', $tableId)
            ->where('status', 'completed')
            ->where('created_at', '>=', now()->subHours(24))
            ->whereHas('items', function ($query) {
                $query->where(function ($q) {
                    $q->whereNull('kds_status')
                      ->orWhereNotIn('kds_status', ['delivered']);
                });
            })
            ->exists();

        if ($hasCompletedButNotDeliveredOrders) {
            self::withoutGlobalScopes()->where('id', $tableId)->update(['status' => 'occupied']);
        } else {
            self::withoutGlobalScopes()->where('id', $tableId)->update(['status' => 'available']);
        }
    }
}
