<?php

namespace App\Models;

use App\Traits\BelongsToTenant;

use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use BelongsToTenant, \App\Traits\BelongsToBranch;

    protected $fillable = [
        'branch_id', 
        'tenant_id',
        'name',
        'phone',
        'email',
        'loyalty_points',
        'lifetime_points',
        'total_spent',
        'birthday',
        'credit_limit',
        'due_amount',
    ];

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function creditTransactions()
    {
        return $this->hasMany(CreditTransaction::class)->latest('id');
    }
}
