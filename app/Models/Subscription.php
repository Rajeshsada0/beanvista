<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Subscription extends Model
{
    protected $fillable = [
        'tenant_id',
        'plan_id',
        'status',
        'billing_cycle',
        'amount_paid',
        'start_date',
        'trial_ends_at',
        'ends_at',
    ];

    protected $casts = [
        'start_date' => 'date',
        'trial_ends_at' => 'date',
        'ends_at' => 'date',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function plan()
    {
        return $this->belongsTo(Plan::class);
    }
    
    public function getIsExpiredAttribute()
    {
        if ($this->status === 'expired') return true;
        if ($this->ends_at && $this->ends_at->isPast()) return true;
        return false;
    }
}
