<?php

namespace App\Models;

use App\Traits\BelongsToTenant;

use Illuminate\Database\Eloquent\Model;

class CreditTransaction extends Model
{
    use BelongsToTenant, \App\Traits\BelongsToBranch;

    protected $fillable = [
        'branch_id', 
        'customer_id',
        'order_id',
        'type',
        'amount',
        'note',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }
}
