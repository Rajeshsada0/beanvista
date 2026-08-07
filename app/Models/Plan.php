<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Plan extends Model
{
    protected $fillable = [
        'name',
        'description',
        'price_monthly',
        'price_3_months',
        'price_6_months',
        'price_yearly',
        'trial_days',
        'max_branches',
        'max_tables',
        'max_accounts',
        'max_users',
        'max_orders_per_month',
        'features',
        'is_active',
    ];

    protected $casts = [
        'features' => 'array',
        'is_active' => 'boolean',
        'max_branches' => 'integer',
        'max_tables' => 'integer',
        'max_accounts' => 'integer',
        'max_users' => 'integer',
        'max_orders_per_month' => 'integer',
    ];

    public function subscriptions()
    {
        return $this->hasMany(Subscription::class);
    }
}
