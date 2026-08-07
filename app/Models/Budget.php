<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use App\Traits\BelongsToTenant;

class Budget extends Model
{
    use BelongsToTenant, \App\Traits\BelongsToBranch;

    protected $fillable = [
        'branch_id', 
        'name',
        'start_date',
        'end_date',
        'description',
        'tenant_id',
    ];

    public function items()
    {
        return $this->hasMany(BudgetItem::class);
    }
}
